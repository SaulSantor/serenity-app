import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { 
    scheduleLocalNotification, 
    scheduleReminderNotification,
    cancelAllNotifications 
} from '../../services/notificationService';

export default function NotificationsTestScreen({ navigation }) {
    const [title, setTitle] = useState('Notificación de prueba');
    const [body, setBody] = useState('Este es un mensaje de prueba');
    const [seconds, setSeconds] = useState('5');

    const sendLocalNotification = async () => {
        try {
            await scheduleLocalNotification({
                title,
                body,
                seconds: parseInt(seconds) || 0
            });
            Toast.show({
                type: 'success',
                text1: 'Notificación programada',
                text2: `Se mostrará en ${seconds} segundos`
            });
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.message
            });
        }
    };

    const enableDailyReminders = async () => {
        try {
            await scheduleReminderNotification();
            Toast.show({
                type: 'success',
                text1: 'Recordatorio activado',
                text2: 'Recibirás notificaciones diarias a las 8 PM'
            });
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.message
            });
        }
    };

    const cancelNotifications = async () => {
        try {
            await cancelAllNotifications();
            Toast.show({
                type: 'success',
                text1: 'Notificaciones canceladas',
                text2: 'Todas las notificaciones programadas fueron eliminadas'
            });
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.message
            });
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Prueba de Notificaciones</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>📱 Notificación Local</Text>
                <Text style={styles.description}>
                    Envía una notificación programada sin necesidad del servidor
                </Text>

                <TextInput
                    style={styles.input}
                    placeholder="Título"
                    value={title}
                    onChangeText={setTitle}
                />

                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Mensaje"
                    value={body}
                    onChangeText={setBody}
                    multiline
                    numberOfLines={3}
                />

                <TextInput
                    style={styles.input}
                    placeholder="Segundos hasta mostrar"
                    value={seconds}
                    onChangeText={setSeconds}
                    keyboardType="numeric"
                />

                <TouchableOpacity 
                    style={styles.primaryButton}
                    onPress={sendLocalNotification}
                >
                    <Ionicons name="notifications" size={20} color="white" />
                    <Text style={styles.buttonText}>Enviar Notificación</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>🔔 Recordatorios Diarios</Text>
                <Text style={styles.description}>
                    Recibe un recordatorio todos los días a las 8 PM para practicar
                </Text>

                <TouchableOpacity 
                    style={styles.secondaryButton}
                    onPress={enableDailyReminders}
                >
                    <Ionicons name="time" size={20} color="#6366F1" />
                    <Text style={styles.secondaryButtonText}>Activar Recordatorios</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>🚫 Cancelar Todo</Text>
                <Text style={styles.description}>
                    Cancela todas las notificaciones programadas
                </Text>

                <TouchableOpacity 
                    style={styles.dangerButton}
                    onPress={cancelNotifications}
                >
                    <Ionicons name="close-circle" size={20} color="#EF4444" />
                    <Text style={styles.dangerButtonText}>Cancelar Notificaciones</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.info}>
                <Ionicons name="information-circle" size={24} color="#6366F1" />
                <Text style={styles.infoText}>
                    Las notificaciones push desde el servidor requieren que el backend
                    esté configurado con Expo Push Notification Service.
                </Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
    },
    section: {
        backgroundColor: 'white',
        margin: 16,
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 8,
    },
    description: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 16,
        lineHeight: 20,
    },
    input: {
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    primaryButton: {
        backgroundColor: '#6366F1',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        borderRadius: 8,
        gap: 8,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    secondaryButton: {
        backgroundColor: '#EEF2FF',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        borderRadius: 8,
        gap: 8,
    },
    secondaryButtonText: {
        color: '#6366F1',
        fontSize: 16,
        fontWeight: '600',
    },
    dangerButton: {
        backgroundColor: '#FEE2E2',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        borderRadius: 8,
        gap: 8,
    },
    dangerButtonText: {
        color: '#EF4444',
        fontSize: 16,
        fontWeight: '600',
    },
    info: {
        flexDirection: 'row',
        margin: 16,
        padding: 16,
        backgroundColor: '#EEF2FF',
        borderRadius: 12,
        gap: 12,
    },
    infoText: {
        flex: 1,
        fontSize: 14,
        color: '#4338CA',
        lineHeight: 20,
    },
});
