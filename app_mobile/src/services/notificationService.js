import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import API from '../api/backend';

// Configurar cómo se muestran las notificaciones cuando la app está abierta
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

/**
 * Registrar dispositivo para recibir push notifications
 * @returns {Promise<string|null>} Token de Expo Push o null si falla
 */
export async function registerForPushNotifications() {
    // Verificar permisos existentes
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Solicitar permisos si no están otorgados
    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        console.log('No se otorgaron permisos para notificaciones');
        return null;
    }

    // Configuración para Android (notificaciones locales)
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#6366F1',
        });
    }

    // Para push notifications remotas, necesitas configurar projectId en app.json
    // Por ahora, solo usamos notificaciones locales
    let token = null;
    
    if (Device.isDevice) {
        try {
            token = (await Notifications.getExpoPushTokenAsync()).data;
            console.log('Push Token:', token);
        } catch (error) {
            console.log('Push notifications no configuradas, usando solo locales');
            // No es crítico, las notificaciones locales seguirán funcionando
        }
    }

    return token;
}

/**
 * Enviar token al backend para almacenarlo
 * @param {string} token - Token de Expo Push
 */
export async function sendPushTokenToBackend(token) {
    try {
        await API.post('/users/push-token', { pushToken: token });
        console.log('Token enviado al backend');
    } catch (error) {
        console.error('Error enviando token al backend:', error);
    }
}

/**
 * Programar notificación local (sin backend)
 * @param {Object} options - Opciones de la notificación
 * @param {string} options.title - Título
 * @param {string} options.body - Cuerpo del mensaje
 * @param {number} options.seconds - Segundos hasta mostrar (default: inmediato)
 */
export async function scheduleLocalNotification({ title, body, seconds = 0 }) {
    await Notifications.scheduleNotificationAsync({
        content: {
            title,
            body,
            sound: true,
            priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: seconds > 0 ? { seconds } : null,
    });
}

/**
 * Notificación local de recordatorio de práctica
 */
export async function scheduleReminderNotification() {
    await Notifications.scheduleNotificationAsync({
        content: {
            title: '🧘 Hora de meditar',
            body: 'Tómate unos minutos para tu práctica diaria',
            sound: true,
            data: { screen: 'Techniques' },
        },
        trigger: {
            hour: 20, // 8 PM
            minute: 0,
            repeats: true,
        },
    });
}

/**
 * Cancelar todas las notificaciones programadas
 */
export async function cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Configurar listeners para cuando el usuario toca una notificación
 * @param {Function} onNotificationTap - Callback cuando se toca notificación
 */
export function setupNotificationListeners(onNotificationTap) {
    // Cuando la app está abierta y se recibe notificación
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
        console.log('Notificación recibida:', notification);
    });

    // Cuando el usuario toca la notificación
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
        const data = response.notification.request.content.data;
        if (onNotificationTap) {
            onNotificationTap(data);
        }
    });

    return () => {
        Notifications.removeNotificationSubscription(notificationListener);
        Notifications.removeNotificationSubscription(responseListener);
    };
}
