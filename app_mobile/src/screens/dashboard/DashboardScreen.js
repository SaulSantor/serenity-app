import React, { useState, useEffect, useContext } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../../context/AuthContext';
import API, { getServerURL } from '../../api/backend';

export default function DashboardScreen({ navigation }) {
    const { user } = useContext(AuthContext);
    const [progress, setProgress] = useState(null);
    const [techniques, setTechniques] = useState([]);
    const [recentActivity, setRecentActivity] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    useFocusEffect(
        React.useCallback(() => {
            loadData();
        }, [])
    );

    const loadData = async () => {
        try {
            const [progressRes, techniquesRes, practicesRes] = await Promise.all([
                API.get('/progress/me'),
                API.get('/content/techniques'),
                API.get('/progress/practices')
            ]);

            setProgress(progressRes.data.progress);
            setTechniques(techniquesRes.data.techniques || []);
            
            // Obtener la práctica más reciente
            const practices = practicesRes.data.practices || [];
            if (practices.length > 0) {
                const lastPractice = practices[0]; // Ya viene ordenada por fecha descendente
                
                // Buscar la técnica correspondiente
                const technique = techniquesRes.data.techniques.find(
                    t => t.id === lastPractice.techniqueId || t._id === lastPractice.techniqueId
                );
                
                if (technique) {
                    setRecentActivity({
                        ...lastPractice,
                        technique: technique
                    });
                } else {
                    setRecentActivity(null);
                }
            } else {
                setRecentActivity(null);
            }
        } catch (error) {
            // Error silencioso
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    return (
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
        >
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    {user?.photo && !user.photo.includes('default-avatar') ? (
                        <Image
                            source={{ uri: `${user.photo.startsWith('/') ? `${getServerURL()}${user.photo}` : user.photo}?uid=${user._id || user.id}` }}
                            style={styles.headerAvatar}
                        />
                    ) : (
                        <View style={styles.headerAvatarPlaceholder}>
                            <Ionicons name="person" size={20} color="#7BB6E8" />
                        </View>
                    )}
                    <View>
                        <Text style={styles.greeting}>¡Bienvenido!</Text>
                        <Text style={styles.username}>{user?.firstName || 'Usuario'}</Text>
                    </View>
                </View>
                <Ionicons name="notifications-outline" size={28} color="#333" />
            </View>

            {/* Stats Cards */}
            <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                    <Ionicons name="calendar" size={24} color="#7BB6E8" />
                    <Text style={styles.statValue}>{progress?.practicesThisMonth || 0}</Text>
                    <Text style={styles.statLabel}>Prácticas este mes</Text>
                </View>

                <View style={styles.statCard}>
                    <Ionicons name="flame" size={24} color="#FF6B6B" />
                    <Text style={styles.statValue}>{progress?.streak || 0}</Text>
                    <Text style={styles.statLabel}>Días consecutivos</Text>
                </View>

                <View style={styles.statCard}>
                    <Ionicons name="trophy" size={24} color="#88C9A1" />
                    <Text style={styles.statValue}>{progress?.level || 1}</Text>
                    <Text style={styles.statLabel}>Nivel</Text>
                </View>
            </View>

            {/* Recent Activity */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Actividad reciente</Text>
                {recentActivity ? (
                    <TouchableOpacity 
                        style={styles.recommendedCard}
                        onPress={() => navigation.navigate('Prácticas', {
                            screen: 'TechniqueDetail',
                            params: { techniqueId: recentActivity.technique.id || recentActivity.technique._id }
                        })}
                    >
                        <View style={styles.recommendedContent}>
                            <View style={styles.recentActivityIcon}>
                                <Ionicons name="checkmark-circle" size={40} color="#51CF66" />
                            </View>
                            <View style={styles.recommendedText}>
                                <Text style={styles.recommendedTitle}>{recentActivity.technique.name}</Text>
                                <Text style={styles.recommendedSubtitle}>
                                    {recentActivity.duration} minutos • {new Date(recentActivity.date).toLocaleDateString('es-ES', { 
                                        day: 'numeric', 
                                        month: 'short',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </Text>
                                {recentActivity.completed && (
                                    <Text style={styles.completedBadge}>✓ Completado</Text>
                                )}
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color="#999" />
                    </TouchableOpacity>
                ) : (
                    <View style={styles.emptyActivity}>
                        <Ionicons name="time-outline" size={48} color="#CCC" />
                        <Text style={styles.emptyActivityText}>Aún no has realizado ninguna práctica</Text>
                        <TouchableOpacity 
                            style={styles.startButton}
                            onPress={() => navigation.navigate('Prácticas')}
                        >
                            <Text style={styles.startButtonText}>Comenzar ahora</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {/* IoT Monitor Card */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Dispositivo IoT</Text>
                <TouchableOpacity
                    style={styles.iotCard}
                    onPress={() => navigation.navigate('IoTMonitor')}
                >
                    <View style={styles.iotIconContainer}>
                        <Ionicons name="hardware-chip" size={40} color="#FFFFFF" />
                    </View>
                    <View style={styles.iotContent}>
                        <Text style={styles.iotTitle}>Monitor IoT Antiestrés</Text>
                        <Text style={styles.iotSubtitle}>
                            Ver datos en tiempo real de tu dispositivo
                        </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color="#7BB6E8" />
                </TouchableOpacity>
            </View>

            {/* Quick Actions */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Acceso rápido</Text>
                <View style={styles.quickActionsGrid}>
                    {techniques.slice(0, 4).map((tech, index) => (
                        <TouchableOpacity
                            key={tech.id || tech._id || index}
                            style={styles.quickActionCard}
                            onPress={() => navigation.navigate('Prácticas', {
                                screen: 'TechniqueDetail',
                                params: { techniqueId: tech.id || tech._id }
                            })}
                        >
                            <Ionicons name="leaf" size={32} color="#7BB6E8" />
                            <Text style={styles.quickActionText}>{tech.name}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F6F8',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingTop: 60,
        backgroundColor: '#FFFFFF',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        marginRight: 12,
    },
    headerAvatarPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#E8F4FB',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    greeting: {
        fontSize: 16,
        color: '#2F3A45',
        opacity: 0.7,
    },
    username: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2F3A45',
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 20,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginHorizontal: 4,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2F3A45',
        marginTop: 8,
    },
    statLabel: {
        fontSize: 12,
        color: '#2F3A45',
        opacity: 0.7,
        marginTop: 4,
        textAlign: 'center',
    },
    section: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2F3A45',
        marginBottom: 16,
    },
    quickActionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    quickActionCard: {
        width: '48%',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    quickActionText: {
        fontSize: 14,
        color: '#2F3A45',
        marginTop: 8,
        textAlign: 'center',
    },
    recommendedCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    recommendedContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    recommendedText: {
        marginLeft: 16,
        flex: 1,
    },
    recommendedTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2F3A45',
    },
    recommendedSubtitle: {
        fontSize: 14,
        color: '#2F3A45',
        opacity: 0.7,
        marginTop: 4,
    },
    recentActivityIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#E6FCF5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    completedBadge: {
        fontSize: 12,
        color: '#51CF66',
        fontWeight: '600',
        marginTop: 4,
    },
    emptyActivity: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 32,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    emptyActivityText: {
        fontSize: 16,
        color: '#C9D1D9',
        marginTop: 16,
        marginBottom: 20,
        textAlign: 'center',
    },
    startButton: {
        backgroundColor: '#7BB6E8',
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 24,
    },
    startButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    iotCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    iotIconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#7BB6E8',
        justifyContent: 'center',
        alignItems: 'center',
    },
    iotContent: {
        flex: 1,
        marginLeft: 16,
    },
    iotTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2F3A45',
    },
    iotSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 4,
    },
});
