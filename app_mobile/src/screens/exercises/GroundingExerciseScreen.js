import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import API from '../../api/backend';
import { scheduleLocalNotification } from '../../services/notificationService';

const groundingSteps = [
    { id: 1, sense: 'Vista', icon: 'eye', prompt: '5 cosas que puedes VER', count: 5 },
    { id: 2, sense: 'Tacto', icon: 'hand-left', prompt: '4 cosas que puedes TOCAR', count: 4 },
    { id: 3, sense: 'Oído', icon: 'ear', prompt: '3 cosas que puedes OÍR', count: 3 },
    { id: 4, sense: 'Olfato', icon: 'nose', prompt: '2 cosas que puedes OLER', count: 2 },
    { id: 5, sense: 'Gusto', icon: 'nutrition', prompt: '1 cosa que puedes SABOREAR', count: 1 },
];

export default function GroundingExerciseScreen({ route, navigation }) {
    const { technique } = route.params;
    const [currentStep, setCurrentStep] = useState(0);
    const [items, setItems] = useState([]);

    const addItem = (item) => {
        setItems([...items, item]);
        if (items.length + 1 >= groundingSteps[currentStep].count) {
            if (currentStep < groundingSteps.length - 1) {
                setTimeout(() => {
                    setCurrentStep(currentStep + 1);
                    setItems([]);
                }, 500);
            } else {
                completeExercise();
            }
        }
    };

    const completeExercise = async () => {
        try {
            await API.post('/progress/log-practice', {
                techniqueId: technique.id || technique._id,
                duration: Math.ceil((technique.duration || 5) * 60 / 60),
                completed: true,
            });
            
            Toast.show({
                type: 'success',
                text1: '🌟 ¡Bien hecho!',
                text2: 'Completaste el ejercicio de Grounding 5-4-3-2-1',
                visibilityTime: 3000
            });
            
            await scheduleLocalNotification({
                title: '🎯 Práctica completada',
                body: 'Grounding 5-4-3-2-1 - Conectado con el presente',
                seconds: 2
            });
            
            setTimeout(() => navigation.goBack(), 2000);
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'No se pudo guardar la práctica'
            });
        }
    };

    const step = groundingSteps[currentStep];
    const progress = ((currentStep + 1) / groundingSteps.length) * 100;

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="close" size={28} color="#333" />
                </TouchableOpacity>
                <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${progress}%` }]} />
                </View>
            </View>

            <ScrollView style={styles.content}>
                {/* Icon */}
                <View style={styles.iconContainer}>
                    <View style={styles.iconCircle}>
                        <Ionicons name={step.icon} size={64} color="#7BB6E8" />
                    </View>
                </View>

                {/* Step Title */}
                <Text style={styles.stepNumber}>Paso {currentStep + 1} de 5</Text>
                <Text style={styles.title}>{step.prompt}</Text>
                <Text style={styles.subtitle}>
                    Identifica {step.count} {step.count === 1 ? 'elemento' : 'elementos'} que puedas {step.sense.toLowerCase()}
                </Text>

                {/* Items Grid */}
                <View style={styles.itemsGrid}>
                    {Array.from({ length: step.count }).map((_, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.itemBox,
                                index < items.length && styles.itemBoxFilled,
                            ]}
                            onPress={() => index === items.length && addItem(`Item ${index + 1}`)}
                            disabled={index !== items.length}
                        >
                            {index < items.length ? (
                                <Ionicons name="checkmark" size={32} color="#fff" />
                            ) : (
                                <Text style={styles.itemNumber}>{index + 1}</Text>
                            )}
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Instructions */}
                <View style={styles.instructionsBox}>
                    <Ionicons name="information-circle" size={24} color="#7BB6E8" />
                    <Text style={styles.instructionsText}>
                        Toca cada círculo después de identificar algo que puedas {step.sense.toLowerCase()}
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F6F8',
    },
    header: {
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 20,
        backgroundColor: '#fff',
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F3F6F8',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    progressBar: {
        width: '100%',
        height: 6,
        backgroundColor: '#C9D1D9',
        borderRadius: 3,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#7BB6E8',
        borderRadius: 3,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    iconContainer: {
        alignItems: 'center',
        marginTop: 40,
        marginBottom: 24,
    },
    iconCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#F3F6F8',
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepNumber: {
        fontSize: 16,
        color: '#7BB6E8',
        textAlign: 'center',
        marginBottom: 8,
        fontWeight: '600',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 40,
    },
    itemsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        marginBottom: 40,
    },
    itemBox: {
        width: 80,
        height: 80,
        borderRadius: 16,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        margin: 8,
        borderWidth: 2,
        borderColor: '#C9D1D9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    itemBoxFilled: {
        backgroundColor: '#7BB6E8',
        borderColor: '#7BB6E8',
    },
    itemNumber: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#CCC',
    },
    instructionsBox: {
        flexDirection: 'row',
        backgroundColor: '#F3F6F8',
        padding: 16,
        borderRadius: 12,
        marginBottom: 40,
    },
    instructionsText: {
        flex: 1,
        fontSize: 14,
        color: '#666',
        marginLeft: 12,
        lineHeight: 20,
    },
});
