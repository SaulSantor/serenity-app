import React, { useState, useContext } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';
import { AuthContext } from '../../context/AuthContext';
import API, { getServerURL } from '../../api/backend';

export default function EditProfileScreen({ navigation }) {
    const { user, setUser } = useContext(AuthContext);
    const [firstName, setFirstName] = useState(user?.firstName || '');
    const [lastName, setLastName] = useState(user?.lastName || '');
    const [profileImage, setProfileImage] = useState(null);
    const [loading, setLoading] = useState(false);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Toast.show({
                type: 'error',
                text1: 'Permiso necesario',
                text2: 'Se necesita acceso a la galería'
            });
            return;
        }

        // Pick image
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            setProfileImage(result.assets[0]);
        }
    };

    const handleSave = async () => {
        if (!firstName.trim()) {
            Toast.show({
                type: 'error',
                text1: 'Campo requerido',
                text2: 'El nombre es requerido'
            });
            return;
        }

        if (!lastName.trim()) {
            Toast.show({
                type: 'error',
                text1: 'Campo requerido',
                text2: 'El apellido es requerido'
            });
            return;
        }

        setLoading(true);

        try {
            // Actualizar nombre y apellido
            const updateData = {
                firstName: firstName.trim(),
                lastName: lastName.trim(),
            };

            const res = await API.put('/users/me', updateData);

            if (res.data.user) {
                setUser(res.data.user);
            }

            // Si hay imagen seleccionada, subirla por separado
            if (profileImage) {
                const formData = new FormData();
                const uriParts = profileImage.uri.split('.');
                const fileType = uriParts[uriParts.length - 1];

                formData.append('photo', {
                    uri: profileImage.uri,
                    name: `profile.${fileType}`,
                    type: `image/${fileType}`,
                });

                const photoRes = await API.post('/users/photo', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });

                // Actualizar usuario con la nueva foto
                if (photoRes.data.photoUrl) {
                    const updatedUserRes = await API.get('/users/me');
                    if (updatedUserRes.data.user) {
                        setUser(updatedUserRes.data.user);
                    }
                }
            }

            Toast.show({
                type: 'success',
                text1: 'Éxito',
                text2: 'Perfil actualizado correctamente'
            });
            setTimeout(() => navigation.goBack(), 1000);
        } catch (error) {
            const message = error.response?.data?.message || error.response?.data?.error || 'Error al actualizar el perfil';
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: message
            });
        } finally {
            setLoading(false);
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
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.title}>Editar Perfil</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Profile Image */}
                <View style={styles.imageSection}>
                    <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
                        {profileImage ? (
                            <Image
                                source={{ uri: profileImage.uri }}
                                style={styles.profileImage}
                            />
                        ) : user?.photo && !user.photo.includes('default-avatar') ? (
                            <Image
                                source={{ uri: `${user.photo.startsWith('/') ? `${getServerURL()}${user.photo}` : user.photo}?uid=${user._id || user.id}` }}
                                style={styles.profileImage}
                            />
                        ) : (
                            <View style={styles.placeholderImage}>
                                <Ionicons name="person" size={60} color="#7BB6E8" />
                            </View>
                        )}
                        <View style={styles.editIcon}>
                            <Ionicons name="camera" size={20} color="#fff" />
                        </View>
                    </TouchableOpacity>
                    <Text style={styles.imageHint}>Toca para cambiar foto</Text>
                </View>

                {/* Form Fields */}
                <View style={styles.form}>
                    {/* First Name */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Nombre</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="person-outline" size={20} color="#999" />
                            <TextInput
                                style={styles.input}
                                value={firstName}
                                onChangeText={setFirstName}
                                placeholder="Tu nombre"
                                autoCapitalize="words"
                            />
                        </View>
                    </View>

                    {/* Last Name */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Apellido</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="person-outline" size={20} color="#999" />
                            <TextInput
                                style={styles.input}
                                value={lastName}
                                onChangeText={setLastName}
                                placeholder="Tu apellido"
                                autoCapitalize="words"
                            />
                        </View>
                    </View>

                    {/* Save Button */}
                    <TouchableOpacity
                        style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                        onPress={handleSave}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.saveButtonText}>Guardar Cambios</Text>
                        )}
                    </TouchableOpacity>
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
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    content: {
        flex: 1,
    },
    imageSection: {
        alignItems: 'center',
        paddingVertical: 32,
        backgroundColor: '#fff',
    },
    imagePicker: {
        position: 'relative',
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
    },
    placeholderImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#F3F6F8',
        justifyContent: 'center',
        alignItems: 'center',
    },
    editIcon: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#7BB6E8',
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#fff',
    },
    imageHint: {
        marginTop: 12,
        fontSize: 14,
        color: '#999',
    },
    form: {
        padding: 20,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: '#C9D1D9',
    },
    input: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 12,
        fontSize: 14,
        color: '#333',
    },
    saveButton: {
        backgroundColor: '#7BB6E8',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 32,
        shadowColor: '#7BB6E8',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    saveButtonDisabled: {
        opacity: 0.6,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
