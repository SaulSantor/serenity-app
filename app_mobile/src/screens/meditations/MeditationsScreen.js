import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import API from '../../api/backend';

export default function MeditationsScreen({ navigation }) {
    const [techniques, setTechniques] = useState([]);
    const [filteredTechniques, setFilteredTechniques] = useState([]);
    const [search, setSearch] = useState('');

    useFocusEffect(
        React.useCallback(() => {
            loadTechniques();
        }, [])
    );

    useEffect(() => {
        if (search) {
            setFilteredTechniques(
                techniques.filter(t => 
                    t.name.toLowerCase().includes(search.toLowerCase())
                )
            );
        } else {
            setFilteredTechniques(techniques);
        }
    }, [search, techniques]);

    const loadTechniques = async () => {
        try {
            const res = await API.get('/content/techniques');
            setTechniques(res.data.techniques || []);
            setFilteredTechniques(res.data.techniques || []);
        } catch (error) {
            // Error silencioso
        }
    };

    const renderTechnique = ({ item }) => (
        <TouchableOpacity 
            style={styles.techniqueCard}
            onPress={() => navigation.navigate('TechniqueDetail', { techniqueId: item.id || item._id })}
        >
            <View style={styles.techniqueIcon}>
                <Ionicons name="leaf" size={32} color="#7BB6E8" />
            </View>
            <View style={styles.techniqueInfo}>
                <Text style={styles.techniqueName}>{item.name}</Text>
                <Text style={styles.techniqueDescription}>
                    {String(item.shortDescription || item.description || "")}
                </Text>

                <View style={styles.techniqueMeta}>
                    <Text style={styles.techniqueMetaText}>
                        <Ionicons name="time-outline" size={14} /> {item.duration} min
                    </Text>
                    <Text style={styles.techniqueMetaText}>{item.difficulty}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Prácticas</Text>
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Buscar técnica..."
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>
            </View>

            <FlatList
                data={filteredTechniques}
                renderItem={renderTechnique}
                keyExtractor={(item, index) => item.id || item._id || String(index)}
                contentContainerStyle={styles.list}
            />
        </View>
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
        marginBottom: 16,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F6F8',
        borderRadius: 12,
        paddingHorizontal: 12,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 16,
        color: '#2F3A45',
    },
    list: {
        padding: 20,
    },
    techniqueCard: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    techniqueIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#F3F6F8',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    techniqueInfo: {
        flex: 1,
    },
    techniqueName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2F3A45',
        marginBottom: 4,
    },
    techniqueDescription: {
        fontSize: 14,
        color: '#2F3A45',
        opacity: 0.7,
        marginBottom: 8,
    },
    techniqueMeta: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    techniqueMetaText: {
        fontSize: 12,
        color: '#C9D1D9',
        marginRight: 12,
    },
});
