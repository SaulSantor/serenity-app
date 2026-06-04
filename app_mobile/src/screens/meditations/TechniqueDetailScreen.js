import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import API from '../../api/backend';

export default function TechniqueDetailScreen({ route, navigation }) {
    const { techniqueId } = route.params;
    const [technique, setTechnique] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTechnique();
    }, []);

    const loadTechnique = async () => {
        try {
            const res = await API.get(`/content/techniques/${techniqueId}`);
            setTechnique(res.data.technique);
        } catch (error) {
            console.error('Error loading technique:', error);
        } finally {
            setLoading(false);
        }
    };

    const startPractice = () => {
        // Determinar el tipo de ejercicio por el nombre o categoría
        const techniqueName = technique.name.toLowerCase();
        const category = technique.category ? technique.category.toLowerCase() : '';
        
        // Mindfulness respiración (PRIMERO para que no sea capturado por "respiración")
        if (techniqueName.includes('mindfulness')) {
            navigation.navigate('MeditationPlayer', { technique });
        }
        // Ejercicios de respiración específicos (4-7-8 y Box Breathing)
        else if (techniqueName.includes('4-7-8') || techniqueName.includes('box')) {
            navigation.navigate('BreathingExercise', { technique });
        }
        // Grounding 5-4-3-2-1
        else if (techniqueName.includes('grounding') || techniqueName.includes('5-4-3-2-1')) {
            navigation.navigate('GroundingExercise', { technique });
        }
        // Relajación Muscular Progresiva
        else if (techniqueName.includes('pmr') || techniqueName.includes('relajación muscular') || techniqueName.includes('progresiva')) {
            navigation.navigate('PMRExercise', { technique });
        }
        // EFT Tapping
        else if (techniqueName.includes('eft') || techniqueName.includes('tapping') || category.includes('eft')) {
            navigation.navigate('EFTTapping', { technique });
        }
        // Body Scan / Escaneo corporal
        else if (techniqueName.includes('body scan') || techniqueName.includes('escaneo') || techniqueName.includes('corporal')) {
            navigation.navigate('MeditationPlayer', { technique });
        }
        // Yoga Nidra
        else if (techniqueName.includes('yoga nidra') || techniqueName.includes('nidra')) {
            navigation.navigate('MeditationPlayer', { technique });
        }
        // Autocompasión
        else if (techniqueName.includes('autocompasión') || techniqueName.includes('compasión') || category.includes('compasion')) {
            navigation.navigate('MeditationPlayer', { technique });
        }
        // Visualización
        else if (techniqueName.includes('visualización') || techniqueName.includes('visualization') || category.includes('visualizacion')) {
            navigation.navigate('MeditationPlayer', { technique });
        }
        // Por defecto
        else {
            navigation.navigate('MeditationPlayer', { technique });
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#7BB6E8" />
            </View>
        );
    }

    if (!technique) {
        return (
            <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={64} color="#999" />
                <Text style={styles.errorText}>No se encontró la técnica</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView style={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>
                </View>

                {/* Icon */}
                <View style={styles.iconContainer}>
                    <View style={styles.iconCircle}>
                        <Ionicons name="leaf" size={48} color="#7BB6E8" />
                    </View>
                </View>

                {/* Title */}
                <Text style={styles.title}>{technique.name}</Text>

                {/* Meta Info */}
                <View style={styles.metaContainer}>
                    <View style={styles.metaItem}>
                        <Ionicons name="time-outline" size={20} color="#7BB6E8" />
                        <Text style={styles.metaText}>{technique.duration} min</Text>
                    </View>
                    <View style={styles.metaItem}>
                        <Ionicons name="bar-chart-outline" size={20} color="#7BB6E8" />
                        <Text style={styles.metaText}>{technique.difficulty}</Text>
                    </View>
                    <View style={styles.metaItem}>
                        <Ionicons name="bookmark-outline" size={20} color="#7BB6E8" />
                        <Text style={styles.metaText}>{technique.category}</Text>
                    </View>
                </View>

                {/* Description */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Descripción</Text>
                    <Text style={styles.description}>{technique.description}</Text>
                </View>

                {/* Benefits */}
                {technique.benefits && technique.benefits.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Beneficios</Text>
                        {technique.benefits.map((benefit, index) => (
                            <View key={index} style={styles.benefitItem}>
                                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                                <Text style={styles.benefitText}>{benefit}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Instructions */}
                {technique.instructions && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Instrucciones</Text>
                        <Text style={styles.instructions}>{technique.instructions}</Text>
                    </View>
                )}
            </ScrollView>

            {/* Start Button */}
            <View style={styles.footer}>
                <TouchableOpacity style={styles.startButton} onPress={startPractice}>
                    <Ionicons name="play" size={24} color="#FFFFFF" />
                    <Text style={styles.startButtonText}>Comenzar práctica</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F6F8',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        fontSize: 18,
        color: '#999',
        marginTop: 16,
    },
    content: {
        flex: 1,
    },
    header: {
        padding: 20,
        paddingTop: 60,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    iconContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    iconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#F3F6F8',
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginBottom: 24,
        paddingHorizontal: 20,
    },
    metaContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 32,
        paddingHorizontal: 20,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 12,
    },
    metaText: {
        fontSize: 14,
        color: '#666',
        marginLeft: 6,
    },
    section: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    description: {
        fontSize: 16,
        color: '#666',
        lineHeight: 24,
    },
    benefitItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    benefitText: {
        flex: 1,
        fontSize: 15,
        color: '#666',
        marginLeft: 12,
        lineHeight: 22,
    },
    instructions: {
        fontSize: 15,
        color: '#666',
        lineHeight: 24,
    },
    footer: {
        padding: 20,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#C9D1D9',
    },
    startButton: {
        flexDirection: 'row',
        backgroundColor: '#7BB6E8',
        borderRadius: 12,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
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
});
