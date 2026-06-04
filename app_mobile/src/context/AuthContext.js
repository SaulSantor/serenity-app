import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API from "../api/backend";
import { scheduleReminderNotification } from "../services/notificationService";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const login = async (email, password) => {
        try {
            const res = await API.post("/auth/login", { email: email.trim(), password });
            
            if (res.data.success && res.data.token) {
                await AsyncStorage.setItem("token", res.data.token);
                setUser(res.data.user);
                
                // Programar recordatorio diario al hacer login
                try {
                    await scheduleReminderNotification();
                } catch (notifError) {
                    // Error silencioso en notificaciones
                }
            } else {
                throw new Error(res.data.error || 'Error desconocido');
            }
        } catch (error) {
            const errorMsg = error.response?.data?.error || error.response?.data?.details || error.message || 'Error de autenticación';
            throw new Error(errorMsg);
        }
    };

    const register = async (data) => {
        return API.post("/auth/register", data);
    };

    const logout = async () => {
        await AsyncStorage.removeItem("token");
        setUser(null);
    };

    const loadUser = async () => {
        const token = await AsyncStorage.getItem("token");
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            const res = await API.get("/users/me");
            setUser(res.data.user);
        } catch (error) {
            await AsyncStorage.removeItem("token");
        }

        setLoading(false);
    };

    useEffect(() => {
        loadUser();
    }, []);

    return (
        <AuthContext.Provider value={{ user, setUser, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};