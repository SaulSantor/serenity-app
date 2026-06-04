import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    TouchableOpacity,
    Dimensions,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import API from '../../api/backend';

const { width, height } = Dimensions.get('window');

export default function LandingScreen({ navigation }) {
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalTechniques: 0,
        averageRating: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const response = await API.get('/stats');
            if (response.data.success) {
                setStats({
                    totalUsers: response.data.stats.totalUsers || 0,
                    totalTechniques: response.data.stats.totalTechniques || 0,
                    averageRating: response.data.stats.averageRating || 4.8,
                });
            }
        } catch (error) {
            console.error('Error loading stats:', error);
            // Usar valores por defecto en caso de error
            setStats({
                totalUsers: 10000,
                totalTechniques: 50,
                averageRating: 4.8,
            });
        } finally {
            setLoading(false);
        }
    };
    const features = [
        {
            icon: 'body',
            title: 'Meditación guiada',
            description: 'Encuentra paz interior',
            gradient: ['#667EEA', '#764BA2'],
        },
        {
            icon: 'fitness',
            title: 'Respiración',
            description: 'Calma tu mente',
            gradient: ['#F093FB', '#F5576C'],
        },
        {
            icon: 'heart',
            title: 'Estado emocional',
            description: 'Conoce tus patrones',
            gradient: ['#4FACFE', '#00F2FE'],
        },
        {
            icon: 'trending-up',
            title: 'Progreso',
            description: 'Sigue tu evolución',
            gradient: ['#43E97B', '#38F9D7'],
        },
    ];

    const benefits = [
        {
            icon: 'shield-checkmark',
            title: 'Científicamente probado',
            description: 'Técnicas validadas por estudios',
        },
        {
            icon: 'people',
            title: 'Comunidad activa',
            description: 'Comparte tu experiencia',
        },
        {
            icon: 'stats-chart',
            title: 'Seguimiento detallado',
            description: 'Visualiza tu progreso',
        },
    ];

    return (
        <ScrollView style={styles.container}>
            {/* Hero Section */}
            <LinearGradient
                colors={['#7BB6E8', '#88C9A1']}
                style={styles.heroSection}
            >
                <View style={styles.heroContent}>
                    <Text style={styles.brandName}>Serenity</Text>
                    <Text style={styles.heroTitle}>
                        Despliega tu{'\n'}
                        <Text style={styles.heroHighlight}>POTENCIAL</Text>
                    </Text>
                    <Text style={styles.heroSubtitle}>
                        Transforma el estrés en serenidad con técnicas científicamente probadas
                    </Text>
                    
                    <View style={styles.heroActions}>
                        <TouchableOpacity 
                            style={styles.btnPrimary}
                            onPress={() => navigation.navigate('Register')}
                        >
                            <Text style={styles.btnPrimaryText}>Comenzar gratis</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={styles.btnOutline}
                            onPress={() => navigation.navigate('Login')}
                        >
                            <Text style={styles.btnOutlineText}>Iniciar sesión</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Decorative circles */}
                <View style={styles.circle1} />
                <View style={styles.circle2} />
            </LinearGradient>

            {/* Features Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Tu arsenal de bienestar</Text>
                <Text style={styles.sectionSubtitle}>
                    Descubre las herramientas que transformarán tu vida
                </Text>
                
                <View style={styles.featuresGrid}>
                    {features.map((feature, index) => (
                        <TouchableOpacity 
                            key={index}
                            style={styles.featureCard}
                            onPress={() => navigation.navigate('Login')}
                        >
                            <LinearGradient
                                colors={feature.gradient}
                                style={styles.featureIconContainer}
                            >
                                <Ionicons name={feature.icon} size={28} color="#fff" />
                            </LinearGradient>
                        <View style={styles.featureContent}>
                                <Text style={styles.featureTitle}>{feature.title}</Text>
                                <Text style={styles.featureDescription}>{feature.description}</Text>
                            </View>
                            <Ionicons name="arrow-forward" size={20} color="#7BB6E8" />
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Benefits Section */}
            <View style={styles.benefitsSection}>
                <Text style={styles.sectionTitle}>¿Por qué Serenity?</Text>
                
                <View style={styles.benefitsGrid}>
                    {benefits.map((benefit, index) => (
                        <View key={index} style={styles.benefitCard}>
                            <View style={styles.benefitIconContainer}>
                                <Ionicons name={benefit.icon} size={32} color="#7BB6E8" />
                            </View>
                            <Text style={styles.benefitTitle}>{benefit.title}</Text>
                            <Text style={styles.benefitDescription}>{benefit.description}</Text>
                        </View>
                    ))}
                </View>
            </View>

            {/* Stats Section */}
            <View style={styles.statsSection}>
                {loading ? (
                    <ActivityIndicator size="large" color="#7BB6E8" />
                ) : (
                    <>
                        <View style={styles.statCard}>
                            <Text style={styles.statNumber}>
                                {stats.totalUsers >= 1000 
                                    ? `${(stats.totalUsers / 1000).toFixed(1)}k+` 
                                    : `${stats.totalUsers}+`}
                            </Text>
                            <Text style={styles.statLabel}>Usuarios activos</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statNumber}>{stats.totalTechniques}+</Text>
                            <Text style={styles.statLabel}>Ejercicios</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statNumber}>
                                {stats.averageRating.toFixed(1)}★
                            </Text>
                            <Text style={styles.statLabel}>Valoración</Text>
                        </View>
                    </>
                )}
            </View>

            {/* CTA Section */}
            <LinearGradient
                colors={['#7BB6E8', '#88C9A1']}
                style={styles.ctaSection}
            >
                <Text style={styles.ctaTitle}>Comienza tu transformación hoy</Text>
                <Text style={styles.ctaSubtitle}>
                    Únete a miles de personas que ya mejoraron su bienestar
                </Text>
                <TouchableOpacity 
                    style={styles.ctaButton}
                    onPress={() => navigation.navigate('Register')}
                >
                    <Text style={styles.ctaButtonText}>Crear cuenta gratis</Text>
                    <Ionicons name="arrow-forward" size={20} color="#7BB6E8" />
                </TouchableOpacity>
            </LinearGradient>

            {/* Footer */}
            <View style={styles.footer}>
                <Text style={styles.footerText}>© 2025 Serenity. Todos los derechos reservados.</Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    heroSection: {
        minHeight: height * 0.75,
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 40,
        position: 'relative',
        overflow: 'hidden',
    },
    heroContent: {
        zIndex: 1,
    },
    brandName: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 20,
    },
    heroTitle: {
        fontSize: 42,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 16,
        lineHeight: 50,
    },
    heroHighlight: {
        color: '#88C9A1',
    },
    heroSubtitle: {
        fontSize: 18,
        color: 'rgba(255,255,255,0.9)',
        marginBottom: 32,
        lineHeight: 26,
    },
    heroActions: {
        gap: 12,
    },
    btnPrimary: {
        backgroundColor: '#fff',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    btnPrimaryText: {
        color: '#7BB6E8',
        fontSize: 16,
        fontWeight: '700',
    },
    btnOutline: {
        backgroundColor: 'transparent',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#fff',
        alignItems: 'center',
    },
    btnOutlineText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    circle1: {
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: 'rgba(255,255,255,0.1)',
        top: -100,
        right: -100,
    },
    circle2: {
        position: 'absolute',
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: 'rgba(255,255,255,0.1)',
        bottom: -50,
        left: -50,
    },
    section: {
        padding: 20,
        paddingTop: 40,
    },
    sectionTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
        textAlign: 'center',
    },
    sectionSubtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 24,
    },
    featuresGrid: {
        gap: 12,
    },
    featureCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#C9D1D9',
    },
    featureIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    featureContent: {
        flex: 1,
    },
    featureTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#333',
        marginBottom: 4,
    },
    featureDescription: {
        fontSize: 14,
        color: '#666',
    },
    benefitsSection: {
        padding: 20,
        backgroundColor: '#F3F6F8',
    },
    benefitsGrid: {
        gap: 16,
    },
    benefitCard: {
        backgroundColor: '#fff',
        padding: 24,
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    benefitIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#F3F6F8',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    benefitTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
        marginBottom: 8,
        textAlign: 'center',
    },
    benefitDescription: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
    statsSection: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 20,
        paddingVertical: 40,
    },
    statCard: {
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#7BB6E8',
        marginBottom: 8,
    },
    statLabel: {
        fontSize: 14,
        color: '#666',
    },
    ctaSection: {
        margin: 20,
        padding: 32,
        borderRadius: 20,
        alignItems: 'center',
    },
    ctaTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 12,
        textAlign: 'center',
    },
    ctaSubtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.9)',
        marginBottom: 24,
        textAlign: 'center',
    },
    ctaButton: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 12,
        alignItems: 'center',
        gap: 8,
    },
    ctaButtonText: {
        color: '#7BB6E8',
        fontSize: 16,
        fontWeight: '700',
    },
    footer: {
        padding: 20,
        alignItems: 'center',
        backgroundColor: '#F3F6F8',
    },
    footerText: {
        fontSize: 12,
        color: '#999',
    },
});
