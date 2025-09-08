// Pantalla de Login
// - Permite iniciar sesión con email/usuario y contraseña
// - Valida campos requeridos y persiste token/usuario en AsyncStorage
// - Incluye toggle para mostrar/ocultar contraseña y navegación al drawer
import { Palette, Radius, Spacing } from '@/constants/theme';
import { signIn } from '@/services/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function LoginScreen() {
    // Estado local del formulario y navegación
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    // Estados de validación y error general
    const [emailError, setEmailError] = useState<string | null>(null);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [generalError, setGeneralError] = useState<string | null>(null);

    // Handler: valida inputs, hace signIn y guarda credenciales
    const onLogin = async () => {
        // Reset de errores previos
        setEmailError(null);
        setPasswordError(null);
        setGeneralError(null);

        // Validaciones locales simples
        const trimmedEmail = email.trim();
        const trimmedPassword = password.trim();
        let hasError = false;

        if (!trimmedEmail) {
            setEmailError('Usuario requerido');
            hasError = true;
        } else if (trimmedEmail.length < 3) {
            setEmailError('Usuario incompleto');
            hasError = true;
        }

        if (!trimmedPassword) {
            setPasswordError('Contraseña requerida');
            hasError = true;
        } else if (trimmedPassword.length < 4) {
            setPasswordError('Contraseña demasiado corta');
            hasError = true;
        }

        if (hasError) return;

        setLoading(true);
        try {
            const { token, user } = await signIn(trimmedEmail, trimmedPassword);
            await AsyncStorage.setItem('auth_token', token);
            await AsyncStorage.setItem('auth_user', JSON.stringify(user));
            router.replace('/(drawer)');
        } catch (e: any) {
            const raw = String(e?.message || '');
            // Mapeo de errores comunes a mensajes amigables
            let friendly = 'No se pudo iniciar sesión';
            const lower = raw.toLowerCase();

            const mentionsUser = lower.includes('user') || lower.includes('usuario') || lower.includes('username') || lower.includes('does not exist') || lower.includes('not found');
            const mentionsPass = lower.includes('password') || lower.includes('contrase') || lower.includes('pass');
            const genericInvalid = lower.includes('invalid credentials') || lower.includes('invalid username or password') || lower.includes('invalid login') || lower.includes('invalid') || lower.includes('unauthorized') || lower.includes('401');

            if (genericInvalid || (mentionsUser && mentionsPass)) {
                friendly = 'Credenciales inválidas';
            } else if (mentionsPass) {
                friendly = 'Contraseña incorrecta';
            } else if (mentionsUser) {
                friendly = 'Usuario incorrecto';
            }

            setGeneralError(friendly);
        } finally {
            setLoading(false);
        }
    };

    // UI principal: tarjeta centrada sobre fondo con gradiente del tema
    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.background}>
            <View style={styles.center}>
                <View style={styles.card}>
                    {/* Logo de marca */}
                    <Image
                        source={require('./../../assets/images/dTalentLogo.webp')}
                        style={styles.logoImg}
                        resizeMode="contain"
                    />
                    {/* Mensaje de bienvenida */}
                    <Text style={styles.welcome}>Bienvenido a DTalent.</Text>
                    <Text style={styles.forgotLine}>
                        ¿Has olvidado tu contraseña? <Text style={styles.link}>Haz clic aquí</Text>
                    </Text>

                    <Text style={styles.label}>Usuario</Text>
                    <TextInput
                        autoCapitalize="none"
                        keyboardType="email-address"
                        placeholder="Ingrese su usuario"
                        placeholderTextColor={Palette.textMuted}
                        style={[styles.input, emailError ? styles.inputError : null]}
                        value={email}
                        onChangeText={setEmail}
                    />
                    {!!emailError && <Text style={styles.errorText}>{emailError}</Text>}

                    {/* Campo de contraseña con botón Mostrar/Ocultar */}
                    <Text style={[styles.label, { marginTop: Spacing.md }]}>Contraseña</Text>
                    <View style={styles.inputRow}>
                        <TextInput
                            placeholder="Ingrese su contraseña"
                            placeholderTextColor={Palette.textMuted}
                            secureTextEntry={!showPassword}
                            style={[styles.input, { flex: 1 }, passwordError ? styles.inputError : null]}
                            value={password}
                            onChangeText={setPassword}
                        />
                        <TouchableOpacity onPress={() => setShowPassword((v) => !v)} style={styles.eyeBtn}>
                            <Text style={styles.eyeBtnText}>{showPassword ? 'Ocultar' : 'Mostrar'}</Text>
                        </TouchableOpacity>
                    </View>
                    {!!passwordError && <Text style={styles.errorText}>{passwordError}</Text>}

                    {/* CTA principal: Login */}
                    <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={onLogin} disabled={loading}>
                        <Text style={styles.buttonText}>{loading ? 'Ingresando...' : 'Login'}</Text>
                    </TouchableOpacity>
                    {!!generalError && <Text style={[styles.errorText, { textAlign: 'center', marginTop: Spacing.sm }]}>{generalError}</Text>}

                    <Text style={styles.terms}>
                        Al continuar, aceptas nuestros <Text style={styles.link}>Términos de Servicio</Text> y
                        <Text> </Text>
                        <Text style={styles.link}>Política de Privacidad</Text>.
                    </Text>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

// Estilos locales de la pantalla de Login
const styles = StyleSheet.create({
    background: {
        flex: 1,
        backgroundColor: Palette.gradientFrom,
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.xl,
    },
    card: {
        width: '100%',
        maxWidth: 520,
        backgroundColor: '#2A2F52',
        padding: Spacing.xl,
        borderRadius: Radius.xl,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(255,255,255,0.12)',
    },
    logo: {
        textAlign: 'center',
        fontSize: 22,
        color: '#fff',
        marginBottom: Spacing.md,
        fontWeight: '700',
    },
    logoImg: {
        width: 170,
        height: 70,
        alignSelf: 'center',
        marginBottom: Spacing.sm,
    },
    welcome: {
        textAlign: 'center',
        fontSize: 20,
        color: '#fff',
        fontWeight: '700',
    },
    forgotLine: {
        textAlign: 'center',
        color: '#C6CBF3',
        marginTop: Spacing.sm,
        marginBottom: Spacing.lg,
    },
    label: {
        color: '#C6CBF3',
        fontSize: 13,
        marginBottom: Spacing.xs,
    },
    input: {
        borderWidth: 1,
        borderColor: '#525C97',
        borderRadius: 12,
        paddingHorizontal: Spacing.md,
        paddingVertical: 12,
        color: '#fff',
        backgroundColor: 'rgba(255,255,255,0.04)',
    },
    inputError: {
        borderColor: '#FF6B6B',
    },
    button: {
        marginTop: Spacing.xl,
        backgroundColor: Palette.primary,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    eyeBtn: {
        paddingHorizontal: 10,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#525C97',
        backgroundColor: 'rgba(255,255,255,0.04)'
    },
    eyeBtnText: {
        color: '#C6CBF3',
        fontWeight: '600',
        fontSize: 12,
    },
    errorText: {
        color: '#FF8A8A',
        fontSize: 12,
        marginTop: 6,
    },
    terms: {
        textAlign: 'center',
        color: '#C6CBF3',
        fontSize: 12,
        marginTop: Spacing.md,
    },
    link: {
        color: '#8FA2FF',
        textDecorationLine: 'underline',
    },
});
