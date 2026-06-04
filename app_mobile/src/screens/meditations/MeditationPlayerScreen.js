import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import API from '../../api/backend';
import { scheduleLocalNotification } from '../../services/notificationService';

export default function MeditationPlayerScreen({ route, navigation }) {
    const { technique } = route.params;
    const [currentStep, setCurrentStep] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [completedSteps, setCompletedSteps] = useState([]);
    const [steps, setSteps] = useState([]);
    const pulseAnim = React.useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Generar pasos específicos al cargar
        const generatedSteps = generateStepsFromTechnique(technique);
        setSteps(generatedSteps);
    }, []);

    useEffect(() => {
        let interval;
        if (isActive) {
            interval = setInterval(() => {
                setElapsedTime(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isActive]);

    // Animación de pulso para escaneo corporal
    useEffect(() => {
        if (isBodyScan() && isActive) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.1,
                        duration: 2000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 2000,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
        }
    }, [isActive, currentStep]);

    const isBodyScan = () => {
        const techName = (technique.name || technique.title || '').toLowerCase();
        return techName.includes('body scan') || techName.includes('escaneo') || techName.includes('corporal');
    };

    function generateStepsFromTechnique(tech) {
        const techName = (tech.name || tech.title || '').toLowerCase();
        
        // Body Scan específico
        if (techName.includes('body scan') || techName.includes('escaneo') || techName.includes('corporal')) {
            return [
                { title: 'Preparación', instruction: 'Acuéstate en una posición cómoda. Cierra los ojos y toma tres respiraciones profundas.' },
                { title: 'Pies', instruction: 'Lleva tu atención a tus pies. Observa cualquier sensación: calor, frío, hormigueo, tensión. No juzgues, solo observa.' },
                { title: 'Piernas', instruction: 'Sube tu atención a las piernas. Pantorrillas, rodillas, muslos. Nota el peso, la temperatura, las sensaciones.' },
                { title: 'Torso', instruction: 'Escanea tu abdomen, pecho y espalda. Observa el movimiento de tu respiración. Las sensaciones en cada área.' },
                { title: 'Brazos', instruction: 'Lleva tu atención a tus brazos, desde los hombros hasta las manos y dedos. Observa cada sensación.' },
                { title: 'Cabeza', instruction: 'Escanea tu cuello, rostro y cabeza. Nota la tensión en la mandíbula, las sensaciones en el cuero cabelludo.' },
                { title: 'Integración', instruction: 'Siente tu cuerpo como un todo. Observa la conexión entre todas las partes. Respira profundamente.' },
                { title: 'Cierre', instruction: 'Lentamente mueve tus dedos de manos y pies. Cuando estés listo, abre los ojos.' }
            ];
        }
        
        // Yoga Nidra específico
        if (techName.includes('yoga nidra') || techName.includes('nidra')) {
            return [
                { title: 'Sankalpa', instruction: 'Establece tu intención o resolución (Sankalpa). Una frase corta y positiva en tiempo presente.' },
                { title: 'Rotación de conciencia', instruction: 'Lleva tu atención a cada parte del cuerpo sistemáticamente, sin moverte. Dedo pulgar derecho, índice, medio...' },
                { title: 'Respiración', instruction: 'Observa tu respiración natural. Cuenta mentalmente las respiraciones del 27 al 1 de forma regresiva.' },
                { title: 'Sensaciones opuestas', instruction: 'Experimenta sensaciones opuestas: pesadez/ligereza, calor/frío, dolor/placer. Sin juzgar.' },
                { title: 'Visualización', instruction: 'Visualiza imágenes rápidas y fluidas: un lago, una montaña, flores, el cielo. Déjalas fluir sin esfuerzo.' },
                { title: 'Sankalpa final', instruction: 'Repite tu Sankalpa tres veces con convicción y sentimiento.' },
                { title: 'Retorno', instruction: 'Gradualmente trae tu conciencia de vuelta. Mueve suavemente tus dedos, abre los ojos cuando estés listo.' }
            ];
        }
        
        // Mindfulness de la respiración
        if (techName.includes('mindfulness')) {
            return [
                { title: 'Postura', instruction: 'Siéntate con la espalda recta pero relajada. Cierra los ojos suavemente.' },
                { title: 'Anclaje', instruction: 'Lleva tu atención a la respiración. Observa dónde la sientes más: nariz, pecho o abdomen.' },
                { title: 'Observación', instruction: 'Observa cada inhalación y exhalación. No intentes cambiar la respiración, solo obsérvala.' },
                { title: 'Mente divagando', instruction: 'Cuando notes que tu mente divaga, reconócelo amablemente y vuelve a la respiración. Esto es normal.' },
                { title: 'Práctica sostenida', instruction: 'Continúa observando tu respiración. Cada vez que te distraigas, vuelve al anclaje de la respiración.' },
                { title: 'Cierre', instruction: 'Toma tres respiraciones profundas. Abre los ojos lentamente y vuelve al presente.' }
            ];
        }
        
        // Autocompasión
        if (techName.includes('autocompasión') || techName.includes('compasión') || techName.includes('self-compassion')) {
            return [
                { title: 'Reconocimiento', instruction: 'Identifica un momento de sufrimiento o dificultad. Reconoce: "Este es un momento difícil".' },
                { title: 'Humanidad compartida', instruction: 'Reconoce que el sufrimiento es parte de la experiencia humana. No estás solo en esto.' },
                { title: 'Gesto físico', instruction: 'Coloca tu mano sobre tu corazón o abraza tu cuerpo. Siente el calor y la conexión contigo mismo.' },
                { title: 'Frases de bondad', instruction: 'Repite: "Que pueda ser amable conmigo mismo. Que pueda aceptarme como soy. Que pueda estar en paz."' },
                { title: 'Respiración con compasión', instruction: 'Respira dirigiendo compasión hacia ti mismo con cada inhalación. Libera autocrítica con cada exhalación.' },
                { title: 'Integración', instruction: 'Permanece con estos sentimientos de amabilidad hacia ti mismo unos momentos más.' },
                { title: 'Cierre', instruction: 'Toma una respiración profunda. Abre los ojos cuando estés listo, llevando esta compasión contigo.' }
            ];
        }
        
        // Visualización
        if (techName.includes('visualización') || techName.includes('visualization')) {
            return [
                { title: 'Preparación', instruction: 'Cierra los ojos. Respira profundamente tres veces para relajarte completamente.' },
                { title: 'Lugar seguro', instruction: 'Imagina un lugar donde te sientas completamente seguro y en paz. Puede ser real o imaginario.' },
                { title: 'Detalles visuales', instruction: 'Observa los colores, las formas, la luz. ¿Qué ves a tu alrededor en este lugar seguro?' },
                { title: 'Sonidos', instruction: '¿Qué sonidos hay? El viento, el agua, pájaros, silencio. Escucha los sonidos de tu lugar seguro.' },
                { title: 'Sensaciones', instruction: '¿Qué sientes? La temperatura, el suelo bajo tus pies, la brisa. Experimenta las sensaciones.' },
                { title: 'Emoción', instruction: 'Conecta con la emoción de paz y seguridad. Permítete sentirla plenamente en tu cuerpo.' },
                { title: 'Anclaje', instruction: 'Crea un anclaje: un gesto o palabra que puedas usar para volver a este lugar cuando lo necesites.' },
                { title: 'Retorno', instruction: 'Gradualmente regresa al presente. Abre los ojos sabiendo que puedes volver cuando quieras.' }
            ];
        }
        
        // Pasos genéricos usando las instrucciones de la técnica
        const instructions = tech.instructions || [];
        if (instructions.length > 0) {
            // Usar las instrucciones de la base de datos
            return instructions.map((inst, index) => ({
                title: `Paso ${index + 1}`,
                instruction: inst
            }));
        }
        
        // Fallback si no hay instrucciones
        return [
            {
                title: 'Preparación',
                instruction: 'Encuentra una posición cómoda. Cierra los ojos suavemente y toma tres respiraciones profundas.'
            },
            {
                title: 'Atención',
                instruction: tech.description || 'Lleva tu atención al momento presente. Observa sin juzgar.'
            },
            {
                title: 'Práctica',
                instruction: 'Continúa con la práctica manteniendo tu atención en el presente. Si tu mente divaga, vuelve suavemente.'
            },
            {
                title: 'Cierre',
                instruction: 'Toma una respiración profunda. Mueve suavemente tus dedos. Abre los ojos cuando estés listo.'
            }
        ];
    }

    const handleStart = () => {
        setIsActive(true);
    };

    const handlePause = () => {
        setIsActive(false);
    };

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCompletedSteps([...completedSteps, currentStep]);
            setCurrentStep(currentStep + 1);
        } else {
            handleComplete();
        }
    };

    const handlePrevious = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleComplete = async () => {
        setIsActive(false);
        
        try {
            await API.post('/progress/log-practice', {
                techniqueId: technique.id || technique._id,
                duration: Math.ceil(elapsedTime / 60),
                completed: true,
            });

            const minutes = Math.floor(elapsedTime / 60);
            Toast.show({
                type: 'success',
                text1: '🧘 ¡Excelente trabajo!',
                text2: `${minutes} minutos de práctica mindfulness`,
                visibilityTime: 3000
            });
            
            await scheduleLocalNotification({
                title: '✨ Sesión completada',
                body: `${technique.name} - ${minutes} minutos de meditación`,
                seconds: 2
            });
            
            setTimeout(() => navigation.goBack(), 2000);
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'No se pudo guardar la práctica'
            });
            setTimeout(() => navigation.goBack(), 1500);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Si aún no se han generado los pasos, mostrar loading
    if (steps.length === 0) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: '#666' }}>Cargando...</Text>
            </View>
        );
    }

    const currentStepData = steps[currentStep];
    
    // Renderizar visualización del cuerpo para Body Scan
    const renderBodyVisualization = () => {
        if (!isBodyScan()) return null;

        const bodyParts = [
            { name: 'Cabeza', step: 5, icon: 'head', top: '5%' },
            { name: 'Brazos', step: 4, icon: 'hand-left', top: '25%', left: '15%' },
            { name: 'Brazos', step: 4, icon: 'hand-right', top: '25%', right: '15%' },
            { name: 'Torso', step: 3, icon: 'body', top: '35%' },
            { name: 'Piernas', step: 2, icon: 'walk', top: '60%' },
            { name: 'Pies', step: 1, icon: 'footsteps', top: '85%' },
        ];

        return (
            <View style={styles.bodyVisualization}>
                <View style={styles.bodyContainer}>
                    {/* Cabeza */}
                    <Animated.View
                        style={[
                            styles.bodyPart,
                            styles.bodyPartHead,
                            (currentStep === 5 || completedSteps.includes(5)) && styles.bodyPartActive,
                            completedSteps.includes(5) && styles.bodyPartCompleted,
                            currentStep === 5 && { transform: [{ scale: pulseAnim }] },
                        ]}
                    >
                        <Ionicons 
                            name="happy-outline" 
                            size={32} 
                            color={currentStep === 5 ? '#667EEA' : completedSteps.includes(5) ? '#51CF66' : '#CCC'} 
                        />
                    </Animated.View>

                    {/* Torso */}
                    <Animated.View
                        style={[
                            styles.bodyPart,
                            styles.bodyPartTorso,
                            (currentStep === 3 || completedSteps.includes(3)) && styles.bodyPartActive,
                            completedSteps.includes(3) && styles.bodyPartCompleted,
                            currentStep === 3 && { transform: [{ scale: pulseAnim }] },
                        ]}
                    >
                        <Ionicons 
                            name="heart-outline" 
                            size={40} 
                            color={currentStep === 3 ? '#667EEA' : completedSteps.includes(3) ? '#51CF66' : '#CCC'} 
                        />
                    </Animated.View>

                    {/* Brazos */}
                    <Animated.View
                        style={[
                            styles.bodyPart,
                            styles.bodyPartArmLeft,
                            (currentStep === 4 || completedSteps.includes(4)) && styles.bodyPartActive,
                            completedSteps.includes(4) && styles.bodyPartCompleted,
                            currentStep === 4 && { transform: [{ scale: pulseAnim }] },
                        ]}
                    >
                        <Ionicons 
                            name="hand-left-outline" 
                            size={28} 
                            color={currentStep === 4 ? '#667EEA' : completedSteps.includes(4) ? '#51CF66' : '#CCC'} 
                        />
                    </Animated.View>

                    <Animated.View
                        style={[
                            styles.bodyPart,
                            styles.bodyPartArmRight,
                            (currentStep === 4 || completedSteps.includes(4)) && styles.bodyPartActive,
                            completedSteps.includes(4) && styles.bodyPartCompleted,
                            currentStep === 4 && { transform: [{ scale: pulseAnim }] },
                        ]}
                    >
                        <Ionicons 
                            name="hand-right-outline" 
                            size={28} 
                            color={currentStep === 4 ? '#667EEA' : completedSteps.includes(4) ? '#51CF66' : '#CCC'} 
                        />
                    </Animated.View>

                    {/* Piernas */}
                    <Animated.View
                        style={[
                            styles.bodyPart,
                            styles.bodyPartLegs,
                            (currentStep === 2 || completedSteps.includes(2)) && styles.bodyPartActive,
                            completedSteps.includes(2) && styles.bodyPartCompleted,
                            currentStep === 2 && { transform: [{ scale: pulseAnim }] },
                        ]}
                    >
                        <Ionicons 
                            name="walk-outline" 
                            size={36} 
                            color={currentStep === 2 ? '#667EEA' : completedSteps.includes(2) ? '#51CF66' : '#CCC'} 
                        />
                    </Animated.View>

                    {/* Pies */}
                    <Animated.View
                        style={[
                            styles.bodyPart,
                            styles.bodyPartFeet,
                            (currentStep === 1 || completedSteps.includes(1)) && styles.bodyPartActive,
                            completedSteps.includes(1) && styles.bodyPartCompleted,
                            currentStep === 1 && { transform: [{ scale: pulseAnim }] },
                        ]}
                    >
                        <Ionicons 
                            name="footsteps-outline" 
                            size={28} 
                            color={currentStep === 1 ? '#667EEA' : completedSteps.includes(1) ? '#51CF66' : '#CCC'} 
                        />
                    </Animated.View>
                </View>
                <Text style={styles.bodyVisualizationHint}>
                    {currentStep === 0 && '👆 Preparándote para comenzar'}
                    {currentStep === 1 && '👣 Enfocado en tus pies'}
                    {currentStep === 2 && '🦵 Escaneando tus piernas'}
                    {currentStep === 3 && '❤️ Atención en tu torso'}
                    {currentStep === 4 && '✋ Observando tus brazos'}
                    {currentStep === 5 && '🧠 Explorando tu cabeza'}
                    {currentStep === 6 && '✨ Integrando todo tu cuerpo'}
                    {currentStep === 7 && '🙏 Finalizando con gratitud'}
                </Text>
            </View>
        );
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
                <Text style={styles.headerTitle} numberOfLines={1}>
                    {technique.name}
                </Text>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Progress Indicator */}
                <View style={styles.progressContainer}>
                    <Text style={styles.progressText}>
                        Paso {currentStep + 1} de {steps.length}
                    </Text>
                    <View style={styles.progressBar}>
                        <View
                            style={[
                                styles.progressFill,
                                {
                                    width: `${((currentStep + 1) / steps.length) * 100}%`,
                                },
                            ]}
                        />
                    </View>
                </View>

                {/* Timer */}
                <View style={styles.timerContainer}>
                    <Ionicons name="time-outline" size={24} color="#7BB6E8" />
                    <Text style={styles.timerText}>{formatTime(elapsedTime)}</Text>
                </View>

                {/* Body Visualization for Body Scan */}
                {renderBodyVisualization()}

                {/* Current Step Card */}
                <View style={styles.stepCard}>
                    <View style={styles.stepIcon}>
                        <Ionicons name="flower-outline" size={48} color="#7BB6E8" />
                    </View>
                    <Text style={styles.stepTitle}>{currentStepData.title}</Text>
                    <Text style={styles.stepInstruction}>
                        {currentStepData.instruction}
                    </Text>
                </View>

                {/* Controls */}
                <View style={styles.controls}>
                    {!isActive ? (
                        <TouchableOpacity
                            style={styles.playButton}
                            onPress={handleStart}
                        >
                            <Ionicons name="play" size={32} color="#fff" />
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={styles.playButton}
                            onPress={handlePause}
                        >
                            <Ionicons name="pause" size={32} color="#fff" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Navigation Buttons */}
                <View style={styles.navigationButtons}>
                    <TouchableOpacity
                        style={[
                            styles.navButton,
                            currentStep === 0 && styles.navButtonDisabled,
                        ]}
                        onPress={handlePrevious}
                        disabled={currentStep === 0}
                    >
                        <Ionicons
                            name="chevron-back"
                            size={24}
                            color={currentStep === 0 ? '#CCC' : '#7BB6E8'}
                        />
                        <Text
                            style={[
                                styles.navButtonText,
                                currentStep === 0 && styles.navButtonTextDisabled,
                            ]}
                        >
                            Anterior
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.navButton}
                        onPress={handleNext}
                    >
                        <Text style={styles.navButtonText}>
                            {currentStep === steps.length - 1 ? 'Finalizar' : 'Siguiente'}
                        </Text>
                        <Ionicons name="chevron-forward" size={24} color="#7BB6E8" />
                    </TouchableOpacity>
                </View>

                {/* Steps List */}
                <View style={styles.stepsList}>
                    <Text style={styles.stepsListTitle}>Pasos de la práctica</Text>
                    {steps.map((step, index) => (
                        <View
                            key={index}
                            style={[
                                styles.stepItem,
                                index === currentStep && styles.stepItemActive,
                                completedSteps.includes(index) && styles.stepItemCompleted,
                            ]}
                        >
                            <Ionicons
                                name={
                                    completedSteps.includes(index)
                                        ? 'checkmark-circle'
                                        : index === currentStep
                                        ? 'radio-button-on'
                                        : 'radio-button-off'
                                }
                                size={20}
                                color={
                                    completedSteps.includes(index)
                                        ? '#51CF66'
                                        : index === currentStep
                                        ? '#667EEA'
                                        : '#CCC'
                                }
                            />
                            <Text
                                style={[
                                    styles.stepItemText,
                                    index === currentStep && styles.stepItemTextActive,
                                ]}
                            >
                                {step.title}
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
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
        textAlign: 'center',
        marginHorizontal: 8,
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
    timerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    timerText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginLeft: 8,
    },
    stepCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 32,
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    stepIcon: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#F3F6F8',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    stepTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
        textAlign: 'center',
    },
    stepInstruction: {
        fontSize: 16,
        color: '#666',
        lineHeight: 24,
        textAlign: 'center',
    },
    controls: {
        alignItems: 'center',
        marginBottom: 24,
    },
    playButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#7BB6E8',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#7BB6E8',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    navigationButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    navButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#7BB6E8',
    },
    navButtonDisabled: {
        borderColor: '#E0E0E0',
    },
    navButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#7BB6E8',
        marginHorizontal: 4,
    },
    navButtonTextDisabled: {
        color: '#CCC',
    },
    stepsList: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
    },
    stepsListTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },
    stepItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    stepItemActive: {
        backgroundColor: '#F3F6F8',
        marginHorizontal: -8,
        paddingHorizontal: 8,
        borderRadius: 8,
    },
    stepItemCompleted: {
        opacity: 0.6,
    },
    stepItemText: {
        fontSize: 14,
        color: '#666',
        marginLeft: 12,
    },
    stepItemTextActive: {
        color: '#7BB6E8',
        fontWeight: '600',
    },
    bodyVisualization: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        marginBottom: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    bodyContainer: {
        width: 200,
        height: 320,
        position: 'relative',
        marginBottom: 16,
    },
    bodyPart: {
        position: 'absolute',
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#F5F7FA',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#E0E0E0',
    },
    bodyPartActive: {
        backgroundColor: '#F3F6F8',
        borderColor: '#7BB6E8',
        borderWidth: 3,
    },
    bodyPartCompleted: {
        backgroundColor: '#E6FCF5',
        borderColor: '#51CF66',
    },
    bodyPartHead: {
        top: 0,
        left: '50%',
        marginLeft: -30,
        width: 70,
        height: 70,
        borderRadius: 35,
    },
    bodyPartTorso: {
        top: 90,
        left: '50%',
        marginLeft: -40,
        width: 80,
        height: 100,
        borderRadius: 40,
    },
    bodyPartArmLeft: {
        top: 100,
        left: 0,
        width: 50,
        height: 80,
        borderRadius: 25,
    },
    bodyPartArmRight: {
        top: 100,
        right: 0,
        width: 50,
        height: 80,
        borderRadius: 25,
    },
    bodyPartLegs: {
        top: 200,
        left: '50%',
        marginLeft: -35,
        width: 70,
        height: 90,
        borderRadius: 35,
    },
    bodyPartFeet: {
        bottom: 0,
        left: '50%',
        marginLeft: -30,
    },
    bodyVisualizationHint: {
        fontSize: 16,
        color: '#7BB6E8',
        fontWeight: '600',
        textAlign: 'center',
        marginTop: 8,
    },
});
