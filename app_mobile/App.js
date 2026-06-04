import React, { useEffect, useRef } from "react";
import { AuthProvider } from "./src/context/AuthContext";
import AppNavigator from "./src/navigation/AppNavigator";
import Toast from 'react-native-toast-message';
import { 
    registerForPushNotifications, 
    sendPushTokenToBackend,
    setupNotificationListeners 
} from './src/services/notificationService';

export default function App() {
    const notificationListener = useRef();

    useEffect(() => {
        // Registrar para notificaciones push
        registerForPushNotifications().then(token => {
            if (token) {
                sendPushTokenToBackend(token);
            }
        });

        // Configurar listeners
        const cleanup = setupNotificationListeners((data) => {
            // Manejar tap en notificación (navegar a pantalla específica)
            console.log('Usuario tocó notificación:', data);
        });

        return cleanup;
    }, []);

    return (
        <AuthProvider>
            <AppNavigator />
            <Toast />
        </AuthProvider>
    );
}