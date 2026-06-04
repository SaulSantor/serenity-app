import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import API from '../../api/backend';

const { width } = Dimensions.get('window');

export default function ProgressScreen() {
    const [progress, setProgress] = useState(null);
    const [courses, setCourses] = useState([]);

    useFocusEffect(
        React.useCallback(() => {
            loadProgress();
        }, [])
    );

    const loadProgress = async () => {
        try {
            const [progressRes, coursesRes] = await Promise.all([
                API.get('/progress/me'),
                API.get('/progress/courses')
            ]);

            setProgress(progressRes.data.progress);
            setCourses(coursesRes.data.courses || []);
        } catch (error) {
            console.error('Error loading progress:', error);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Tu Progreso</Text>
            </View>

            {/* Level Card */}
            <View style={styles.levelCard}>
                <View style={styles.levelInfo}>
                    <Ionicons name="trophy" size={40} color="#FFD93D" />
                    <View style={styles.levelText}>
                        <Text style={styles.levelLabel}>Nivel {progress?.level || 1}</Text>
                        <Text style={styles.xpSubtext}>
                            {progress?.xp || 0} / {((progress?.level || 1) * 500)} XP
                        </Text>
                    </View>
                </View>
                <View style={styles.levelProgressContainer}>
                    <View style={styles.levelProgressBar}>
                        <View 
                            style={[
                                styles.levelProgressFill, 
                                { 
                                    width: `${((progress?.xp || 0) % 500) / 5}%` 
                                }
                            ]} 
                        />
                    </View>
                    <Text style={styles.nextLevelText}>
                        {500 - ((progress?.xp || 0) % 500)} XP para nivel {(progress?.level || 1) + 1}
                    </Text>
                </View>
            </View>

            {/* Stats */}
            <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                    <Ionicons name="calendar" size={24} color="#88C9A1" />
                    <Text style={styles.statValue}>{progress?.practicesThisMonth || 0}</Text>
                    <Text style={styles.statLabel}>Prácticas</Text>
                </View>

                <View style={styles.statItem}>
                    <Ionicons name="flame" size={24} color="#FF6B6B" />
                    <Text style={styles.statValue}>{progress?.streak || 0}</Text>
                    <Text style={styles.statLabel}>Racha</Text>
                </View>

                <View style={styles.statItem}>
                    <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                    <Text style={styles.statValue}>{progress?.consistency || 0}%</Text>
                    <Text style={styles.statLabel}>Consistencia</Text>
                </View>
            </View>

            {/* All Courses */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Mis prácticas</Text>
                {courses.map((course, index) => (
                    <View key={index} style={styles.courseCard}>
                        <View style={styles.courseHeader}>
                            <Text style={styles.courseName}>{course.name}</Text>
                            {course.status === 'completed' && (
                                <View style={styles.completedBadge}>
                                    <Ionicons name="checkmark-circle" size={20} color="#51CF66" />
                                    <Text style={styles.completedText}>Completado</Text>
                                </View>
                            )}
                        </View>
                        <View style={styles.progressBar}>
                            <View style={[
                                styles.progressFill, 
                                { width: `${course.progress}%` },
                                course.status === 'completed' && styles.progressCompleted
                            ]} />
                        </View>
                        <Text style={styles.progressText}>
                            {course.currentLesson}/{course.totalLessons} prácticas • {course.progress}%
                        </Text>
                    </View>
                ))}

                {courses.length === 0 && (
                    <Text style={styles.emptyText}>Aún no has iniciado ninguna práctica</Text>
                )}
            </View>

            {/* Completed Courses */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Cursos completados</Text>
                <View style={styles.badgesContainer}>
                    {courses.filter(c => c.status === 'completed').length > 0 ? (
                        courses.filter(c => c.status === 'completed').map((course, index) => (
                            <View key={index} style={styles.badgeCard}>
                                <Ionicons name="checkmark-circle" size={32} color="#51CF66" />
                                <Text style={styles.badgeText}>{course.name}</Text>
                            </View>
                        ))
                    ) : (
                        <Text style={styles.emptyText}>Aún no has completado ningún curso</Text>
                    )}
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
        backgroundColor: '#FFFFFF',
        padding: 20,
        paddingTop: 60,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#2F3A45',
    },
    levelCard: {
        backgroundColor: '#88C9A1',
        margin: 20,
        borderRadius: 16,
        padding: 20,
    },
    levelInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    levelText: {
        marginLeft: 16,
        flex: 1,
    },
    levelLabel: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
    },
    xpSubtext: {
        color: '#fff',
        fontSize: 14,
        opacity: 0.9,
        marginTop: 4,
    },
    levelProgressContainer: {
        width: '100%',
    },
    levelProgressBar: {
        height: 8,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 8,
    },
    levelProgressFill: {
        height: '100%',
        backgroundColor: '#FFD93D',
        borderRadius: 4,
    },
    nextLevelText: {
        color: '#fff',
        fontSize: 12,
        opacity: 0.8,
        textAlign: 'center',
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    statItem: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginHorizontal: 4,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2F3A45',
        marginTop: 8,
    },
    statLabel: {
        fontSize: 12,
        color: '#2F3A45',
        opacity: 0.7,
        marginTop: 4,
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
    courseCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
    },
    courseHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    courseName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2F3A45',
        flex: 1,
    },
    completedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E6FCF5',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    completedText: {
        fontSize: 12,
        color: '#51CF66',
        fontWeight: '600',
        marginLeft: 4,
    },
    progressBar: {
        height: 8,
        backgroundColor: '#C9D1D9',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#88C9A1',
    },
    progressCompleted: {
        backgroundColor: '#88C9A1',
    },
    progressText: {
        fontSize: 12,
        color: '#2F3A45',
        opacity: 0.7,
    },
    badgesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    badgeCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginRight: 12,
        marginBottom: 12,
        alignItems: 'center',
        minWidth: 100,
    },
    badgeText: {
        fontSize: 12,
        color: '#2F3A45',
        marginTop: 8,
        textAlign: 'center',
    },
    emptyText: {
        fontSize: 14,
        color: '#C9D1D9',
        textAlign: 'center',
        padding: 20,
    },
});
