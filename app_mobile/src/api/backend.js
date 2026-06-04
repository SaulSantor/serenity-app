import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Network from 'expo-network';

// Variable para almacenar la URL del servidor (mutable)
let _serverURL = "http://192.168.100.69:5000"; // Fallback actualizado

// Getter para SERVER_URL que siempre devuelve la URL actual
export const getServerURL = () => _serverURL;

// Función para obtener la IP del servidor automáticamente
const detectServerIP = async () => {
    try {
        // Obtener la IP local del dispositivo
        const ip = await Network.getIpAddressAsync();
        
        if (ip && ip !== '127.0.0.1') {
            // Extraer los primeros 3 octetos (ej: 192.168.100.x o 10.100.1.x)
            const segments = ip.split('.');
            if (segments.length === 4) {
                const baseIP = `${segments[0]}.${segments[1]}.${segments[2]}`;
                
                // IPs comunes del servidor en la misma red
                const possibleIPs = [
                    `${baseIP}.69`,  // IP actual del servidor
                    `${baseIP}.42`,  // IP típica anterior
                    `${baseIP}.3`,
                    `${baseIP}.1`,
                    `${baseIP}.2`,
                ];
                
                // Probar cada IP con timeout corto
                for (const testIP of possibleIPs) {
                    try {
                        const response = await axios.get(`http://${testIP}:5000/api/health`, { 
                            timeout: 800 
                        });
                        if (response.status === 200 && response.data?.status === 'ok') {
                            _serverURL = `http://${testIP}:5000`;
                            API.defaults.baseURL = `${_serverURL}/api`;
                            console.log(`✅ Servidor detectado en: ${testIP}`);
                            await AsyncStorage.setItem('server_url', _serverURL);
                            return _serverURL;
                        }
                    } catch (error) {
                        // Continuar con la siguiente IP
                    }
                }
            }
        }
    } catch (error) {
        // Error silencioso en detección
    }
    
    // Si no se detectó, intentar cargar desde AsyncStorage
    try {
        const savedURL = await AsyncStorage.getItem('server_url');
        if (savedURL) {
            _serverURL = savedURL;
            API.defaults.baseURL = `${_serverURL}/api`;
            return _serverURL;
        }
    } catch (error) {
        // Ignorar error de lectura
    }
    
    return _serverURL;
};

// Detectar IP automáticamente al iniciar (no bloqueante)
detectServerIP().catch(() => {});

// Exportar función para re-detectar manualmente si es necesario
export const refreshServerIP = detectServerIP;

const API = axios.create({
    baseURL: `${_serverURL}/api`,
});

// Adjuntar JWT automáticamente
API.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default API;