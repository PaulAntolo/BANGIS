import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import Button from '../../src/components/Button';
import InputField from '../../src/components/InputField';
import { theme } from '../../src/constants/theme';
import { useAppTheme } from '../../src/context/ThemeContext';
import Svg, { Path } from 'react-native-svg';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, loginAsGuest, signInWithGoogle } = useAuth();
  const router = useRouter();
  const { colors } = useAppTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      await login(email, password);
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('Login failed:', error);
      if (error.code === 'auth/invalid-credential') {
        Alert.alert('Login Failed', 'Invalid email or password. If you signed up with Google, please use the Google login button.');
      } else {
        Alert.alert('Login Failed', 'Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
      // the real logic will handle routing
    } catch (error) {
      console.error('Google login failed:', error);
    }
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    try {
      await loginAsGuest();
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Guest login failed:', error);
      Alert.alert('Login Failed', 'Could not continue as guest.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Image source={require('../../assets/BANGIS-logo.png')} style={{ width: 80, height: 80, resizeMode: 'contain', marginBottom: 16 }} />
            <Text style={styles.title}>Bangis</Text>
            <Text style={styles.subtitle}>Log in to track fuel prices</Text>
          </View>

          <View style={styles.form}>
            <InputField
              label="EMAIL"
              placeholder="your@email.com"
              icon={<Mail size={18} color={colors.textMuted} />}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <View style={styles.passwordContainer}>
              <InputField
                label="PASSWORD"
                placeholder="••••••••"
                secureTextEntry={!showPassword}
                icon={<Lock size={18} color={colors.textMuted} />}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity 
                style={styles.eyeIcon} 
                onPress={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} color={colors.textMuted} /> : <Eye size={18} color={colors.textMuted} />}
              </TouchableOpacity>
              <TouchableOpacity style={styles.forgotBtn}>
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            <Button onPress={handleLogin} isLoading={isLoading} fullWidth>
              Log In
            </Button>
          </View>

          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleLogin}>
            <Svg width={20} height={20} viewBox="0 0 24 24">
              <Path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <Path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <Path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
              <Path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </Svg>
            <Text style={styles.googleBtnText}>Google Login</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.googleBtn, { marginTop: 12, backgroundColor: colors.bgLight }]} onPress={handleGuestLogin}>
            <Text style={styles.googleBtnText}>Continue as Guest</Text>
          </TouchableOpacity>

          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text style={styles.signupLink}>Create an account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgLight,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: colors.bgWhite,
    padding: 32,
    borderRadius: 24,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
    borderWidth: 1,
    borderColor: colors.bgWhite,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.primary,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  form: {
    gap: 20,
  },
  passwordContainer: {
    position: 'relative',
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
    top: 36,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: 6,
  },
  forgotText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.accent,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 32,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.borderLight,
  },
  dividerText: {
    paddingHorizontal: 12,
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.textMuted,
    letterSpacing: 2,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: colors.bgWhite,
  },
  googleBtnText: {
    fontWeight: 'bold',
    color: colors.primary,
    fontSize: 14,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  signupText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  signupLink: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.accent,
  },
  toggleBar: {
    flexDirection: 'row',
    backgroundColor: colors.bgWhite,
    padding: 6,
    borderRadius: 30,
    marginTop: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleActive: {
    flex: 1,
    backgroundColor: colors.accent,
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: 'center',
  },
  toggleActiveText: {
    color: colors.bgWhite,
    fontWeight: '900',
    fontSize: 10,
    letterSpacing: 1,
  },
  toggleInactive: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: 'center',
  },
  toggleInactiveText: {
    color: colors.textMuted,
    fontWeight: '900',
    fontSize: 10,
    letterSpacing: 1,
  },
});
