import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import API from '../../api/backend';

// Muscle groups with instructions
const MUSCLE_GROUPS = [
    {
        name: 'Manos y Antebrazos',
        icon: 'hand-left-outline',
        tension: 'Cierra los puños con fuerza',
        release: 'Abre las manos y relaja completamente',
        duration: 10,
    },
    {
        name: 'Brazos y Bíceps',
        icon: 'fitness-outline',
        tension: 'Dobla los codos y tensa los bíceps',
        release: 'Relaja los brazos a los lados',
        duration: 10,
    },
    {
        name: 'Hombros',
        icon: 'arrow-up-outline',
        tension: 'Eleva los hombros hacia las orejas',
        release: 'Baja los hombros y relaja',
        duration: 10,
    },
    {
        name: 'Cuello',
        icon: 'ellipse-outline',
        tension: 'Inclina la cabeza hacia atrás suavemente',
        release: 'Vuelve la cabeza al centro y relaja',
        duration: 10,
    },
    {
        name: 'Frente',
        icon: 'scan-outline',
        tension: 'Eleva las cejas lo más alto posible',
        release: 'Relaja la frente completamente',
        duration: 10,
    },
    {
        name: 'Ojos y Nariz',
        icon: 'eye-outline',
        tension: 'Cierra los ojos con fuerza y arruga la nariz',
        release: 'Relaja los ojos y la nariz',
        duration: 10,
    },
    {
        name: 'Mandíbula',
        icon: 'chatbox-outline',
        tension: 'Aprieta los dientes con fuerza',
        release: 'Abre ligeramente la boca y relaja',
        duration: 10,
    },
    {
        name: 'Pecho y Espalda',
        icon: 'body-outline',
        tension: 'Junta los omóplatos',
        release: 'Relaja el pecho y la espalda',
        duration: 10,
    },
    {
        name: 'Abdomen',
        icon: 'nutrition-outline',
        tension: 'Contrae los músculos abdominales',
        release: 'Relaja el abdomen completamente',
        duration: 10,
    },
    {
        name: 'Muslos',
        icon: 'walk-outline',
        tension: 'Tensa los músculos de los muslos',
        release: 'Relaja los muslos',
        duration: 10,
    },
    {
        name: 'Pantorrillas',
        icon: 'footsteps-outline',
        tension: 'Apunta los dedos de los pies hacia arriba',
        release: 'Relaja las pantorrillas',
        duration: 10,
    },
    {
        name: 'Pies',
        icon: 'football-outline',
        tension: 'Curva los dedos de los pies hacia abajo',
        release: 'Relaja los pies completamente',
        duration: 10,
    },
];

export default function PMRExerciseScreen({ route, navigation }) {
    const { technique } = route.params;
    const [currentGroup, setCurrentGroup] = useState(0);
    const [phase, setPhase] = useState('ready'); // ready, tension, release, transition
    const [timer, setTimer] = useState(0);
    const [started, setStarted] = useState(false);
    const [totalTime, setTotalTime] = useState(0);

    useEffect(() => {
        let interval;
        if (started && phase !== 'ready') {
            interval = setInterval(() => {
                setTimer((prev) => {
                    if (prev <= 1) {
                        handlePhaseComplete();
                        return 0;
                    }
                    return prev - 1;
                });
                setTotalTime((prev) => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [started, phase, currentGroup]);

    const handlePhaseComplete = () => {
        if (phase === 'tension') {
            setPhase('release');
            setTimer(MUSCLE_GROUPS[currentGroup].duration);
        } else if (phase === 'release') {
            if (currentGroup < MUSCLE_GROUPS.length - 1) {
                setPhase('transition');
                setTimer(3); // 3 seconds transition
            } else {
                // Exercise complete
                handleComplete();
            }
        } else if (phase === 'transition') {
            setCurrentGroup((prev) => prev + 1);
            setPhase('tension');
            setTimer(MUSCLE_GROUPS[currentGroup + 1].duration);
        }
    };

    const handleComplete = async () => {
        setStarted(false);
        setPhase('ready');

        try {
            await API.post('/progress/log-practice', {
                techniqueId: technique.id || technique._id,
                duration: Math.ceil(totalTime / 60),
                completed: true,
            });

            Alert.alert(
                '¡Excelente trabajo!',
                'Has completado la relajación muscular progresiva',
                [
                    {
                        text: 'OK',
                        onPress: () => navigation.goBack(),
                    },
                ]
            );
        } catch (error) {
            console.error('Error logging practice:', error);
            navigation.goBack();
        }
    };

    const startExercise = () => {
        setStarted(true);
        setPhase('tension');
        setTimer(MUSCLE_GROUPS[0].duration);
    };

    const skipToNext = () => {
        handlePhaseComplete();
    };

    const getCurrentInstruction = () => {
        const group = MUSCLE_GROUPS[currentGroup];
        if (phase === 'tension') {
            return group.tension;
        } else if (phase === 'release') {
            return group.release;
        } else if (phase === 'transition') {
            return 'Preparándose para el siguiente grupo...';
        }
        return 'Presiona comenzar cuando estés listo';
    };

    const getPhaseColor = () => {
        switch (phase) {
            case 'tension':
                return '#FF6B6B';
            case 'release':
                return '#51CF66';
            case 'transition':
                return '#FFD93D';
            default:
                return '#667EEA';
        }
    };

    const getPhaseLabel = () => {
        switch (phase) {
            case 'tension':
                return 'TENSIÓN';
            case 'release':
                return 'RELAJACIÓN';
            case 'transition':
                return 'TRANSICIÓN';
            default:
                return 'LISTO';
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                >
                    <Ionicons name="close" size={28} color="#333" />
                </TouchableOpacity>
                <Text style={styles.title}>Relajación Muscular Progresiva</Text>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Progress */}
                <View style={styles.progressContainer}>
                    <Text style={styles.progressText}>
                        Grupo {currentGroup + 1} de {MUSCLE_GROUPS.length}
                    </Text>
                    <View style={styles.progressBar}>
                        <View
                            style={[
                                styles.progressFill,
                                {
                                    width: `${
                                        ((currentGroup + 1) / MUSCLE_GROUPS.length) * 100
                                    }%`,
                                },
                            ]}
                        />
                    </View>
                </View>

                {/* Current Muscle Group */}
                <View style={styles.muscleGroupCard}>
                    <View
                        style={[
                            styles.iconContainer,
                            { backgroundColor: getPhaseColor() + '20' },
                        ]}
                    >
                        <Ionicons
                            name={MUSCLE_GROUPS[currentGroup].icon}
                            size={48}
                            color={getPhaseColor()}
                        />
                    </View>
                    <Text style={styles.muscleGroupName}>
                        {MUSCLE_GROUPS[currentGroup].name}
                    </Text>
                </View>

                {/* Phase Indicator */}
                <View
                    style={[styles.phaseCard, { backgroundColor: getPhaseColor() }]}
                >
                    <Text style={styles.phaseLabel}>{getPhaseLabel()}</Text>
                    {started && phase !== 'ready' && (
                        <Text style={styles.timer}>{timer}s</Text>
                    )}
                </View>

                {/* Instruction */}
                <View style={styles.instructionCard}>
                    <Text style={styles.instructionText}>
                        {getCurrentInstruction()}
                    </Text>
                </View>

                {/* Controls */}
                {!started ? (
                    <TouchableOpacity
                        style={styles.startButton}
                        onPress={startExercise}
                    >
                        <Ionicons name="play" size={24} color="#fff" />
                        <Text style={styles.startButtonText}>Comenzar</Text>
                    </TouchableOpacity>
                ) : (
                    <View style={styles.controls}>
                        <TouchableOpacity
                            style={styles.skipButton}
                            onPress={skipToNext}
                        >
                            <Ionicons name="play-skip-forward" size={20} color="#7BB6E8" />
                            <Text style={styles.skipButtonText}>Siguiente</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* All Muscle Groups List */}
                <View style={styles.groupsList}>
                    <Text style={styles.groupsListTitle}>Grupos Musculares</Text>
                    {MUSCLE_GROUPS.map((group, index) => (
                        <View
                            key={index}
                            style={[
                                styles.groupItem,
                                index === currentGroup && styles.groupItemActive,
                                index < currentGroup && styles.groupItemCompleted,
                            ]}
                        >
                            <Ionicons
                                name={
                                    index < currentGroup
                                        ? 'checkmark-circle'
                                        : index === currentGroup
                                        ? 'radio-button-on'
                                        : 'radio-button-off'
                                }
                                size={20}
                                color={
                                    index < currentGroup
                                        ? '#51CF66'
                                        : index === currentGroup
                                        ? '#667EEA'
                                        : '#CCC'
                                }
                            />
                            <Text
                                style={[
                                    styles.groupItemText,
                                    index === currentGroup && styles.groupItemTextActive,
                                ]}
                            >
                                {group.name}
                            </Text>
                        </View>
                    ))}
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
        backgroundColor: '#fff',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 60,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#C9D1D9',
    },
    backButton: {
        padding: 4,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    progressContainer: {
        marginBottom: 24,
    },
    progressText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
        textAlign: 'center',
    },
    progressBar: {
        height: 8,
        backgroundColor: '#C9D1D9',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#7BB6E8',
        borderRadius: 4,
    },
    muscleGroupCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    muscleGroupName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
    },
    phaseCard: {
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        marginBottom: 16,
    },
    phaseLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
        letterSpacing: 2,
    },
    timer: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 8,
    },
    instructionCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    instructionText: {
        fontSize: 18,
        color: '#333',
        textAlign: 'center',
        lineHeight: 26,
    },
    startButton: {
        flexDirection: 'row',
        backgroundColor: '#7BB6E8',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        shadowColor: '#7BB6E8',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    startButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    controls: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 24,
    },
    skipButton: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 24,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#7BB6E8',
    },
    skipButtonText: {
        color: '#7BB6E8',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    groupsList: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
    },
    groupsListTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },
    groupItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    groupItemActive: {
        backgroundColor: '#F3F6F8',
        marginHorizontal: -8,
        paddingHorizontal: 8,
        borderRadius: 8,
    },
    groupItemCompleted: {
        opacity: 0.6,
    },
    groupItemText: {
        fontSize: 14,
        color: '#666',
        marginLeft: 12,
    },
    groupItemTextActive: {
        color: '#7BB6E8',
        fontWeight: '600',
    },
});
