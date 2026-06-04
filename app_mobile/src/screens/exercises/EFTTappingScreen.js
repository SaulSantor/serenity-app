import React, { useState } from 'react';
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

const tappingPoints = [
    { id: 1, name: 'Punto Karate', description: 'Lado de la mano (punto de acupuntura de intestino delgado)', instruction: 'Golpetea suavemente con 2-3 dedos' },
    { id: 2, name: 'Cabeza', description: 'Parte superior de la cabeza', instruction: 'Usa todos los dedos, golpetea suavemente' },
    { id: 3, name: 'Ceja', description: 'Inicio de la ceja (cerca de la nariz)', instruction: 'Usa 2 dedos en ambas cejas' },
    { id: 4, name: 'Lado del ojo', description: 'Hueso exterior del ojo', instruction: '2 dedos en la esquina exterior' },
    { id: 5, name: 'Bajo el ojo', description: 'Hueso debajo del ojo', instruction: '2 dedos en el hueso bajo el ojo' },
    { id: 6, name: 'Bajo la nariz', description: 'Entre nariz y labio superior', instruction: '2 dedos en el centro' },
    { id: 7, name: 'Barbilla', description: 'Entre labio inferior y barbilla', instruction: '2 dedos en el centro' },
    { id: 8, name: 'Clavícula', description: 'Debajo de la clavícula', instruction: 'Usa todos los dedos o puño' },
    { id: 9, name: 'Bajo el brazo', description: '10 cm debajo de la axila', instruction: 'Usa todos los dedos en el costado' },
];

export default function EFTTappingScreen({ route, navigation }) {
    const { technique } = route.params;
    const [currentPoint, setCurrentPoint] = useState(0);
    const [setupPhrase, setSetupPhrase] = useState('');
    const [showSetup, setShowSetup] = useState(true);
    const [tapsCount, setTapsCount] = useState(0);
    const targetTaps = 7; // 7 veces en cada punto

    const handleSetupComplete = () => {
        setSetupPhrase('Aunque tengo esta preocupación, me acepto profunda y completamente');
        setShowSetup(false);
    };

    const handleTap = () => {
        const newCount = tapsCount + 1;
        setTapsCount(newCount);

        if (newCount >= targetTaps) {
            if (currentPoint < tappingPoints.length - 1) {
                setTimeout(() => {
                    setCurrentPoint(currentPoint + 1);
                    setTapsCount(0);
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
                duration: Math.ceil(technique.duration || 10),
                completed: true,
            });
            Alert.alert(
                '¡Excelente!',
                'Has completado la ronda de EFT Tapping',
                [{ text: 'Continuar', onPress: () => navigation.goBack() }]
            );
        } catch (error) {
            console.error('Error logging practice:', error);
            Alert.alert('Error', 'No se pudo guardar la práctica');
        }
    };

    const progress = ((currentPoint + 1) / tappingPoints.length) * 100;
    const point = tappingPoints[currentPoint];

    if (showSetup) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="close" size={28} color="#333" />
                    </TouchableOpacity>
                </View>
                
                <ScrollView contentContainerStyle={styles.setupContent}>
                    <View style={styles.setupIcon}>
                        <Ionicons name="hand-left-outline" size={80} color="#7BB6E8" />
                    </View>
                    
                    <Text style={styles.setupTitle}>Preparación EFT</Text>
                    
                    <Text style={styles.setupInstruction}>
                        Antes de comenzar, identifica la emoción o problema que deseas trabajar.
                    </Text>
                    
                    <View style={styles.setupBox}>
                        <Text style={styles.setupBoxTitle}>Frase de preparación:</Text>
                        <Text style={styles.setupPhrase}>
                            "Aunque tengo [este problema/emoción], me acepto profunda y completamente"
                        </Text>
                    </View>
                    
                    <Text style={styles.setupNote}>
                        Repite esta frase 3 veces mientras golpeteas suavemente el punto karate (lado de tu mano).
                    </Text>
                    
                    <TouchableOpacity
                        style={styles.startButton}
                        onPress={handleSetupComplete}
                    >
                        <Text style={styles.startButtonText}>Comenzar Secuencia</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="close" size={28} color="#333" />
                </TouchableOpacity>
                <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${progress}%` }]} />
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Point indicator */}
                <View style={styles.pointHeader}>
                    <Text style={styles.pointNumber}>Punto {currentPoint + 1} de {tappingPoints.length}</Text>
                    <Text style={styles.pointName}>{point.name}</Text>
                </View>

                {/* Visual indicator */}
                <View style={styles.visualContainer}>
                    <View style={styles.circleContainer}>
                        <View style={[styles.circle, tapsCount > 0 && styles.circleActive]}>
                            <Ionicons name="hand-right" size={60} color="#7BB6E8" />
                        </View>
                        <Text style={styles.tapCount}>{tapsCount} / {targetTaps}</Text>
                    </View>
                </View>

                {/* Instructions */}
                <View style={styles.instructionBox}>
                    <Text style={styles.instructionTitle}>Ubicación:</Text>
                    <Text style={styles.instructionText}>{point.description}</Text>
                    
                    <Text style={[styles.instructionTitle, { marginTop: 16 }]}>Cómo golpetear:</Text>
                    <Text style={styles.instructionText}>{point.instruction}</Text>
                    
                    <Text style={[styles.instructionTitle, { marginTop: 16 }]}>Mientras golpeteas, repite:</Text>
                    <Text style={styles.reminderPhrase}>"{setupPhrase}"</Text>
                </View>

                {/* Tap button */}
                <TouchableOpacity
                    style={styles.tapButton}
                    onPress={handleTap}
                >
                    <Text style={styles.tapButtonText}>Golpetear</Text>
                    <Text style={styles.tapButtonSubtext}>(Toca {targetTaps - tapsCount} veces más)</Text>
                </TouchableOpacity>
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
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#C9D1D9',
    },
    progressBar: {
        flex: 1,
        height: 4,
        backgroundColor: '#C9D1D9',
        borderRadius: 2,
        marginLeft: 16,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#7BB6E8',
        borderRadius: 2,
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    pointHeader: {
        alignItems: 'center',
        marginBottom: 24,
    },
    pointNumber: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    pointName: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
    },
    visualContainer: {
        alignItems: 'center',
        marginVertical: 32,
    },
    circleContainer: {
        alignItems: 'center',
    },
    circle: {
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#7BB6E8',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    circleActive: {
        backgroundColor: '#F3F6F8',
        transform: [{ scale: 1.05 }],
    },
    tapCount: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#7BB6E8',
        marginTop: 16,
    },
    instructionBox: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 20,
        marginBottom: 24,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    instructionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    instructionText: {
        fontSize: 15,
        color: '#666',
        lineHeight: 22,
    },
    reminderPhrase: {
        fontSize: 15,
        color: '#7BB6E8',
        fontStyle: 'italic',
        lineHeight: 22,
    },
    tapButton: {
        backgroundColor: '#7BB6E8',
        borderRadius: 30,
        paddingVertical: 20,
        paddingHorizontal: 40,
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#7BB6E8',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    tapButtonText: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
    },
    tapButtonSubtext: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        marginTop: 4,
    },
    // Setup styles
    setupContent: {
        padding: 24,
        alignItems: 'center',
    },
    setupIcon: {
        marginTop: 40,
        marginBottom: 24,
    },
    setupTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
    },
    setupInstruction: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 24,
    },
    setupBox: {
        backgroundColor: '#F3F6F8',
        borderRadius: 12,
        padding: 20,
        marginBottom: 24,
        width: '100%',
    },
    setupBoxTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    setupPhrase: {
        fontSize: 17,
        color: '#7BB6E8',
        fontStyle: 'italic',
        lineHeight: 26,
    },
    setupNote: {
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 32,
    },
    startButton: {
        backgroundColor: '#7BB6E8',
        borderRadius: 30,
        paddingVertical: 16,
        paddingHorizontal: 48,
        elevation: 4,
        shadowColor: '#7BB6E8',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    startButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
