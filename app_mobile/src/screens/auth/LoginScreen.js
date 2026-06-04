import React, { useContext, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, StatusBar } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { AuthContext } from "../../context/AuthContext";

export default function LoginScreen({ navigation }) {
    const { login } = useContext(AuthContext);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const onLogin = async () => {
        if (!email && !password) {
            Toast.show({
                type: 'error',
                text1: 'Campos requeridos',
                text2: 'Por favor ingresa tu email y contraseña'
            });
            return;
        }
        if (!email) {
            Toast.show({
                type: 'error',
                text1: 'Email requerido',
                text2: 'Por favor ingresa tu email'
            });
            return;
        }
        if (!password) {
            Toast.show({
                type: 'error',
                text1: 'Contraseña requerida',
                text2: 'Por favor ingresa tu contraseña'
            });
            return;
        }

        setLoading(true);
        try {
            await login(email.trim().toLowerCase(), password);
        } catch (err) {
            const errorMessage = err.message || "Credenciales incorrectas";
            Toast.show({
                type: 'error',
                text1: 'Error de autenticación',
                text2: errorMessage
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <KeyboardAvoidingView 
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardView}
            >
                <ScrollView 
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.brand}>Serenity</Text>
                        <Text style={styles.tagline}>Tu espacio de bienestar mental</Text>
                    </View>

                    {/* Form */}
                    <View style={styles.formContainer}>
                        <Text style={styles.welcomeText}>Iniciar Sesión</Text>
                        <Text style={styles.instructionText}>Continúa tu viaje de transformación</Text>

                            {/* Email Input */}
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Email</Text>
                                <View style={styles.inputWrapper}>
                                    <Ionicons name="mail-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                                    <TextInput
                                        placeholder="tu@email.com"
                                        placeholderTextColor="#6b7280"
                                        style={styles.input}
                                        value={email}
                                        onChangeText={setEmail}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                    />
                                </View>
                            </View>

                            {/* Password Input */}
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Contraseña</Text>
                                <View style={styles.inputWrapper}>
                                    <Ionicons name="lock-closed-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                                    <TextInput
                                        placeholder="••••••••"
                                        placeholderTextColor="#6b7280"
                                        secureTextEntry={!showPassword}
                                        style={styles.input}
                                        value={password}
                                        onChangeText={setPassword}
                                    />
                                    <TouchableOpacity 
                                        onPress={() => setShowPassword(!showPassword)}
                                        style={styles.eyeIcon}
                                    >
                                        <Ionicons 
                                            name={showPassword ? "eye-outline" : "eye-off-outline"} 
                                            size={20} 
                                            color="#9ca3af" 
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Login Button */}
                            <TouchableOpacity 
                                style={[styles.loginButton, loading && styles.loginButtonDisabled]} 
                                onPress={onLogin}
                                disabled={loading}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.loginButtonText}>
                                    {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
                                </Text>
                            </TouchableOpacity>

                            {/* Register Link */}
                            <View style={styles.registerContainer}>
                                <Text style={styles.registerText}>¿No tienes una cuenta? </Text>
                                <TouchableOpacity onPress={() => navigation.navigate("Register")}>
                                    <Text style={styles.registerLink}>Regístrate</Text>
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
        justifyContent: 'center',
        paddingVertical: 40,
    },
    header: {
        marginBottom: 48,
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
        marginBottom: 32,
    },
    inputContainer: {
        marginBottom: 20,
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
    loginButton: {
        backgroundColor: '#7BB6E8',
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 24,
        shadowColor: '#7BB6E8',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    loginButtonDisabled: {
        opacity: 0.6,
    },
    loginButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    registerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 24,
    },
    registerText: {
        fontSize: 15,
        color: '#2F3A45',
        opacity: 0.7,
    },
    registerLink: {
        fontSize: 15,
        color: '#7BB6E8',
        fontWeight: '600',
    },
});