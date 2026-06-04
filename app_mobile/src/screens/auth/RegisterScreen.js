import React, { useState, useContext } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import { AuthContext } from '../../context/AuthContext';
import API from '../../api/backend';

export default function RegisterScreen({ navigation }) {
    const { login } = useContext(AuthContext);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleRegister = async () => {
        if (!formData.firstName.trim()) {
            Toast.show({
                type: 'error',
                text1: 'Campo requerido',
                text2: 'Por favor ingresa tu nombre'
            });
            return;
        }
        if (!formData.lastName.trim()) {
            Toast.show({
                type: 'error',
                text1: 'Campo requerido',
                text2: 'Por favor ingresa tu apellido'
            });
            return;
        }
        if (!formData.email.trim()) {
            Toast.show({
                type: 'error',
                text1: 'Campo requerido',
                text2: 'Por favor ingresa tu email'
            });
            return;
        }
        if (!formData.email.includes('@')) {
            Toast.show({
                type: 'error',
                text1: 'Email inválido',
                text2: 'Por favor ingresa un email válido'
            });
            return;
        }
        if (!formData.password) {
            Toast.show({
                type: 'error',
                text1: 'Campo requerido',
                text2: 'Por favor ingresa una contraseña'
            });
            return;
        }
        if (formData.password.length < 6) {
            Toast.show({
                type: 'error',
                text1: 'Contraseña muy corta',
                text2: 'Debe tener al menos 6 caracteres'
            });
            return;
        }
        if (!formData.confirmPassword) {
            Toast.show({
                type: 'error',
                text1: 'Campo requerido',
                text2: 'Por favor confirma tu contraseña'
            });
            return;
        }
        if (formData.password !== formData.confirmPassword) {
            Toast.show({
                type: 'error',
                text1: 'Contraseñas no coinciden',
                text2: 'Las contraseñas ingresadas no son iguales'
            });
            return;
        }

        setLoading(true);
        try {
            const response = await API.post('/auth/register', {
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
                email: formData.email.trim().toLowerCase(),
                password: formData.password,
            });

            await login(formData.email.trim().toLowerCase(), formData.password);
        } catch (error) {
            const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Error al crear la cuenta';
            Toast.show({
                type: 'error',
                text1: 'Error en el registro',
                text2: errorMessage
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.brand}>Serenity</Text>
                        <Text style={styles.tagline}>Tu espacio de bienestar mental</Text>
                    </View>

                    {/* Form */}
                    <View style={styles.formContainer}>
                        <Text style={styles.welcomeText}>Crear Cuenta</Text>
                        <Text style={styles.instructionText}>Comienza tu viaje hacia el bienestar</Text>

                            {/* First Name */}
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Nombre</Text>
                                <View style={styles.inputWrapper}>
                                    <Ionicons name="person-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Tu nombre"
                                        placeholderTextColor="#6b7280"
                                        value={formData.firstName}
                                        onChangeText={(text) =>
                                            setFormData({ ...formData, firstName: text })
                                        }
                                        autoCapitalize="words"
                                    />
                                </View>
                            </View>

                            {/* Last Name */}
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Apellido</Text>
                                <View style={styles.inputWrapper}>
                                    <Ionicons name="person-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Tu apellido"
                                        placeholderTextColor="#6b7280"
                                        value={formData.lastName}
                                        onChangeText={(text) =>
                                            setFormData({ ...formData, lastName: text })
                                        }
                                        autoCapitalize="words"
                                    />
                                </View>
                            </View>

                            {/* Email */}
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Email</Text>
                                <View style={styles.inputWrapper}>
                                    <Ionicons name="mail-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="tu@email.com"
                                        placeholderTextColor="#6b7280"
                                        value={formData.email}
                                        onChangeText={(text) =>
                                            setFormData({ ...formData, email: text })
                                        }
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                    />
                                </View>
                            </View>

                            {/* Password */}
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Contraseña</Text>
                                <View style={styles.inputWrapper}>
                                    <Ionicons name="lock-closed-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="••••••••"
                                        placeholderTextColor="#6b7280"
                                        value={formData.password}
                                        onChangeText={(text) =>
                                            setFormData({ ...formData, password: text })
                                        }
                                        secureTextEntry={!showPassword}
                                    />
                                    <TouchableOpacity
                                        onPress={() => setShowPassword(!showPassword)}
                                        style={styles.eyeIcon}
                                    >
                                        <Ionicons
                                            name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                                            size={20}
                                            color="#9ca3af"
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Confirm Password */}
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Confirmar Contraseña</Text>
                                <View style={styles.inputWrapper}>
                                    <Ionicons name="lock-closed-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="••••••••"
                                        placeholderTextColor="#6b7280"
                                        value={formData.confirmPassword}
                                        onChangeText={(text) =>
                                            setFormData({ ...formData, confirmPassword: text })
                                        }
                                        secureTextEntry={!showConfirmPassword}
                                    />
                                    <TouchableOpacity
                                        onPress={() =>
                                            setShowConfirmPassword(!showConfirmPassword)
                                        }
                                        style={styles.eyeIcon}
                                    >
                                        <Ionicons
                                            name={
                                                showConfirmPassword
                                                    ? 'eye-outline'
                                                    : 'eye-off-outline'
                                            }
                                            size={20}
                                            color="#9ca3af"
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Register Button */}
                            <TouchableOpacity
                                style={[styles.registerButton, loading && styles.registerButtonDisabled]}
                                onPress={handleRegister}
                                disabled={loading}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.registerButtonText}>
                                    {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
                                </Text>
                            </TouchableOpacity>

                            {/* Login Link */}
                            <View style={styles.loginLinkContainer}>
                                <Text style={styles.loginLinkText}>¿Ya tienes cuenta? </Text>
                                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                                    <Text style={styles.loginLink}>Inicia Sesión</Text>
                                </TouchableOpacity>
                            </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F6F8',
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 32,
        paddingTop: 60,
        paddingBottom: 40,
    },
    header: {
        marginBottom: 40,
        alignItems: 'center',
    },
    brand: {
        fontSize: 36,
        fontWeight: '800',
        color: '#2F3A45',
        marginBottom: 8,
    },
    tagline: {
        fontSize: 16,
        color: '#2F3A45',
        textAlign: 'center',
        opacity: 0.7,
    },
    formContainer: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 8,
    },
    welcomeText: {
        fontSize: 24,
        fontWeight: '700',
        color: '#2F3A45',
        marginBottom: 8,
    },
    instructionText: {
        fontSize: 15,
        color: '#2F3A45',
        opacity: 0.7,
        marginBottom: 24,
    },
    inputContainer: {
        marginBottom: 18,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2F3A45',
        marginBottom: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F6F8',
        borderWidth: 1.5,
        borderColor: '#C9D1D9',
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 56,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#2F3A45',
    },
    eyeIcon: {
        padding: 4,
    },
    registerButton: {
        backgroundColor: '#7BB6E8',
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        shadowColor: '#7BB6E8',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    registerButtonDisabled: {
        opacity: 0.6,
    },
    registerButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    loginLinkContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 24,
    },
    loginLinkText: {
        fontSize: 15,
        color: '#2F3A45',
        opacity: 0.7,
    },
    loginLink: {
        fontSize: 15,
        color: '#7BB6E8',
        fontWeight: '600',
    },
});