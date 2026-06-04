import React, { useState, useEffect, useContext } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../../context/AuthContext';
import API, { getServerURL } from '../../api/backend';

export default function ProfileScreen({ navigation }) {
    const { logout, user: contextUser } = useContext(AuthContext);
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState(null);

    useFocusEffect(
        React.useCallback(() => {
            loadProfile();
        }, [])
    );

    const loadProfile = async () => {
        try {
            const [userRes, statsRes] = await Promise.all([
                API.get('/users/me'),
                API.get('/progress/me'),
            ]);
            setUser(userRes.data.user || userRes.data);
            setStats(statsRes.data.progress || statsRes.data);
        } catch (error) {
            // Si falla, usar el usuario del contexto
            if (contextUser) {
                setUser(contextUser);
            }
        }
    };

    const handleLogout = () => {
        Alert.alert(
            'Cerrar Sesión',
            '¿Estás seguro de que quieres salir?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Salir',
                    style: 'destructive',
                    onPress: logout,
                },
            ]
        );
    };

    const menuItems = [
        { 
            icon: 'person-outline', 
            label: 'Editar Perfil', 
            action: () => navigation.navigate('EditProfile')
        },
    ];

    return (
        <ScrollView style={styles.container}>
            {/* Profile Header */}
            <View style={styles.headerGradient}>
                <View style={styles.avatarContainer}>
                    {user?.photo && !user.photo.includes('default-avatar') ? (
                        <Image
                            source={{ uri: `${user.photo.startsWith('/') ? `${getServerURL()}${user.photo}` : user.photo}?uid=${user._id || user.id}` }}
                            style={styles.avatarImage}
                        />
                    ) : (
                        <View style={styles.avatar}>
                            <Ionicons name="person" size={48} color="#7BB6E8" />
                        </View>
                    )}
                </View>
                <Text style={styles.userName}>
                    {user?.firstName || user?.name || 'Usuario'} {user?.lastName || ''}
                </Text>
                <Text style={styles.userEmail}>{user?.email}</Text>

                {/* Level Badge */}
                {stats && (
                    <View style={styles.levelBadge}>
                        <Ionicons name="trophy" size={16} color="#88C9A1" />
                        <Text style={styles.levelText}>Nivel {stats.level || 1}</Text>
                    </View>
                )}
            </View>

            {/* Stats Grid */}
            <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                    <View style={styles.statIconContainer}>
                        <Ionicons name="checkmark-circle" size={32} color="#51CF66" />
                    </View>
                    <View style={styles.statInfo}>
                        <Text style={styles.statValue}>
                            {stats?.practicesThisMonth || 0}
                        </Text>
                        <Text style={styles.statLabel}>Prácticas completadas</Text>
                    </View>
                </View>

                <View style={styles.statCard}>
                    <View style={styles.statIconContainer}>
                        <Ionicons name="flame" size={32} color="#FF6B6B" />
                    </View>
                    <View style={styles.statInfo}>
                        <Text style={styles.statValue}>
                            {stats?.streak || 0}
                        </Text>
                        <Text style={styles.statLabel}>Días de racha</Text>
                    </View>
                </View>

                <View style={styles.statCard}>
                    <View style={styles.statIconContainer}>
                        <Ionicons name="star" size={32} color="#FFD700" />
                    </View>
                    <View style={styles.statInfo}>
                        <Text style={styles.statValue}>
                            {stats?.xp || 0}
                        </Text>
                        <Text style={styles.statLabel}>Experiencia total</Text>
                    </View>
                </View>

                <View style={styles.statCard}>
                    <View style={styles.statIconContainer}>
                        <Ionicons name="trophy" size={32} color="#88C9A1" />
                    </View>
                    <View style={styles.statInfo}>
                        <Text style={styles.statValue}>
                            {stats?.level || 1}
                        </Text>
                        <Text style={styles.statLabel}>Nivel actual</Text>
                    </View>
                </View>
            </View>

            {/* Menu Items */}
            <View style={styles.menuContainer}>
                {menuItems.map((item, index) => (
                    <TouchableOpacity
                        key={index}
                        style={styles.menuItem}
                        onPress={item.action}
                    >
                        <View style={styles.menuLeft}>
                            <Ionicons name={item.icon} size={24} color="#7BB6E8" />
                            <Text style={styles.menuLabel}>{item.label}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#999" />
                    </TouchableOpacity>
                ))}
            </View>

            {/* Logout Button */}
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={24} color="#FF6B6B" />
                <Text style={styles.logoutText}>Cerrar Sesión</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
                <Text style={styles.footerText}>Versión 1.0.0</Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F6F8',
    },
    headerGradient: {
        paddingTop: 60,
        paddingBottom: 40,
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 4,
    },
    avatarContainer: {
        marginBottom: 16,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#E8F4FB',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#7BB6E8',
    },
    avatarImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        borderColor: '#7BB6E8',
    },
    userName: {
        fontSize: 24,
        fontWeight: '800',
        color: '#2F3A45',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        color: '#2F3A45',
        opacity: 0.7,
        marginBottom: 12,
    },
    levelBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E8F6ED',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#88C9A1',
    },
    levelText: {
        color: '#88C9A1',
        fontWeight: '700',
        marginLeft: 6,
        fontSize: 14,
    },
    statsContainer: {
        marginHorizontal: 16,
        marginTop: -20,
    },
    statCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    statIconContainer: {
        marginRight: 16,
    },
    statInfo: {
        flex: 1,
    },
    statValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#2F3A45',
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 13,
        color: '#2F3A45',
        opacity: 0.7,
        fontWeight: '500',
    },
    menuContainer: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16,
        marginTop: 24,
        borderRadius: 16,
        overflow: 'hidden',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#C9D1D9',
    },
    menuLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuLabel: {
        fontSize: 16,
        color: '#2F3A45',
        marginLeft: 16,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16,
        marginTop: 24,
        padding: 16,
        borderRadius: 16,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FF6B6B',
        marginLeft: 8,
    },
    footer: {
        alignItems: 'center',
        padding: 32,
    },
    footerText: {
        fontSize: 12,
        color: '#C9D1D9',
    },
});
