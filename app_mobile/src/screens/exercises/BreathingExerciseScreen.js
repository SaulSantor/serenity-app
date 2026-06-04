import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import API from '../../api/backend';
import { scheduleLocalNotification } from '../../services/notificationService';

export default function BreathingExerciseScreen({ route, navigation }) {
    const { technique } = route.params;
    const [isActive, setIsActive] = useState(false);
    const [phase, setPhase] = useState('Toca Iniciar');
    const [timer, setTimer] = useState(0);
    const [cycles, setCycles] = useState(0);
    
    // Determinar patrón según la técnica
    const techniqueName = technique.name.toLowerCase();
    const isBox = techniqueName.includes('box');
    const is478 = techniqueName.includes('4-7-8');
    
    const pattern = isBox
        ? { inhale: 4, hold: 4, exhale: 4, pause: 4 }
        : is478
        ? { inhale: 4, hold: 7, exhale: 8, pause: 0 }
        : { inhale: 4, hold: 7, exhale: 8, pause: 0 }; // Por defecto 4-7-8
    
    const cycleTime = pattern.inhale + pattern.hold + pattern.exhale + pattern.pause;
    const targetCycles = Math.ceil((technique.duration * 60) / cycleTime);
    
    // Usar useRef para mantener las animaciones entre renders
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const opacityAnim = useRef(new Animated.Value(0.5)).current;

    useEffect(() => {
        if (isActive && cycles < targetCycles) {
            startBreathingCycle();
        } else if (cycles >= targetCycles && isActive) {
            completeExercise();
        }
    }, [isActive, cycles]);

    const startBreathingCycle = () => {
        if (!isActive || cycles >= targetCycles) {
            return;
        }

        // Resetear animaciones al inicio de cada ciclo (círculo pequeño)
        scaleAnim.setValue(0.8);
        opacityAnim.setValue(0.5);

        // Fase 1: Inhala (expandir)
        setPhase(`Inhala (${pattern.inhale}s)`);
        Animated.parallel([
            Animated.timing(scaleAnim, {
                toValue: 1.5,
                duration: pattern.inhale * 1000,
                useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
                toValue: 1,
                duration: pattern.inhale * 1000,
                useNativeDriver: true,
            }),
        ]).start(({ finished }) => {
            if (!finished || !isActive) return;
            
            // Fase 2: Sostén (mantener expandido)
            if (pattern.hold > 0) {
                setPhase(`Sostén (${pattern.hold}s)`);
                setTimeout(() => {
                    if (!isActive) return;
                    continueToExhale();
                }, pattern.hold * 1000);
            } else {
                continueToExhale();
            }
        });
    };

    const continueToExhale = () => {
        // Fase 3: Exhala (contraer)
        setPhase(`Exhala (${pattern.exhale}s)`);
        Animated.parallel([
            Animated.timing(scaleAnim, {
                toValue: 0.8,
                duration: pattern.exhale * 1000,
                useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
                toValue: 0.5,
                duration: pattern.exhale * 1000,
                useNativeDriver: true,
            }),
        ]).start(({ finished }) => {
            if (!finished || !isActive) return;
            
            if (pattern.pause > 0) {
                // Fase 4: Pausa (mantener contraído)
                setPhase(`Pausa (${pattern.pause}s)`);
                setTimeout(() => {
                    if (!isActive) return;
                    setCycles(c => c + 1);
                }, pattern.pause * 1000);
            } else {
                setCycles(c => c + 1);
            }
        });
    };

    const toggleExercise = () => {
        if (!isActive) {
            // Iniciar: resetear todo
            setCycles(0);
            setPhase(`Inhala (${pattern.inhale}s)`);
            scaleAnim.setValue(0.8);
            opacityAnim.setValue(0.5);
        } else {
            // Pausar
            setPhase('Pausado');
        }
        setIsActive(!isActive);
    };

    const completeExercise = async () => {
        setIsActive(false);
        try {
            await API.post('/progress/log-practice', {
                techniqueId: technique.id || technique._id,
                duration: Math.ceil((technique.duration || 5)),
                completed: true,
            });
            
            Toast.show({
                type: 'success',
                text1: '🎉 ¡Excelente trabajo!',
                text2: `Completaste ${cycles} ciclos de respiración`,
                visibilityTime: 3000
            });
            
            await scheduleLocalNotification({
                title: '🧘 Práctica completada',
                body: `${technique.name} - ${cycles} ciclos completados`,
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

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="close" size={28} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Content */}
            <View style={styles.content}>
                <Text style={styles.title}>{technique.name}</Text>
                
                {/* Breathing Circle Animation */}
                <View style={styles.circleContainer}>
                    <Animated.View
                        style={[
                            styles.circle,
                            {
                                transform: [{ scale: scaleAnim }],
                                opacity: opacityAnim,
                            },
                        ]}
                    />
                    <Text style={styles.phaseText}>{phase}</Text>
                </View>

                {/* Progress */}
                <Text style={styles.progressText}>
                    Ciclo {cycles} de {targetCycles}
                </Text>

                {/* Instructions */}
                <View style={styles.instructions}>
                    <View style={styles.instructionItem}>
                        <Text style={styles.instructionPhase}>Inhala</Text>
                        <Text style={styles.instructionDuration}>{pattern.inhale} segundos</Text>
                    </View>
                    {pattern.hold > 0 && (
                        <View style={styles.instructionItem}>
                            <Text style={styles.instructionPhase}>Sostén</Text>
                            <Text style={styles.instructionDuration}>{pattern.hold} segundos</Text>
                        </View>
                    )}
                    <View style={styles.instructionItem}>
                        <Text style={styles.instructionPhase}>Exhala</Text>
                        <Text style={styles.instructionDuration}>{pattern.exhale} segundos</Text>
                    </View>
                    {pattern.pause > 0 && (
                        <View style={styles.instructionItem}>
                            <Text style={styles.instructionPhase}>Pausa</Text>
                            <Text style={styles.instructionDuration}>{pattern.pause} segundos</Text>
                        </View>
                    )}
                </View>

                {/* Control Button */}
                <TouchableOpacity
                    style={styles.controlButton}
                    onPress={toggleExercise}
                >
                    <Ionicons
                        name={isActive ? 'pause' : 'play'}
                        size={32}
                        color="#7BB6E8"
                    />
                    <Text style={styles.controlText}>
                        {isActive ? 'Pausar' : 'Comenzar'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#7BB6E8',
    },
    header: {
        paddingTop: 60,
        paddingHorizontal: 20,
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 60,
    },
    circleContainer: {
        width: 250,
        height: 250,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 40,
    },
    circle: {
        position: 'absolute',
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: '#fff',
    },
    phaseText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#7BB6E8',
        zIndex: 1,
    },
    progressText: {
        fontSize: 18,
        color: 'rgba(255, 255, 255, 0.9)',
        marginBottom: 40,
    },
    instructions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        marginBottom: 40,
    },
    instructionItem: {
        alignItems: 'center',
    },
    instructionPhase: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 4,
    },
    instructionDuration: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.7)',
    },
    controlButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    controlText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#7BB6E8',
        marginLeft: 8,
    },
});
