import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, Lock, Eye, EyeOff, User } from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import Button from '../../src/components/Button';
import InputField from '../../src/components/InputField';
import { theme } from '../../src/constants/theme';
import Svg, { Path } from 'react-native-svg';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signUp, signInWithGoogle } = useAuth();
  const router = useRouter();

  const handleSignUp = async () => {
    setIsLoading(true);
    try {
      await signUp({ email, password, name });
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('Signup failed:', error);
      Alert.alert('Signup Failed', error.message || 'Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Google login failed:', error);
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
            <Text style={styles.title}>Join Bangis</Text>
            <Text style={styles.subtitle}>Create an account to start tracking</Text>
          </View>

          <View style={styles.form}>
            <InputField
              label="FULL NAME"
              placeholder="Juan Dela Cruz"
              icon={<User size={18} color={theme.colors.textMuted} />}
              value={name}
              onChangeText={setName}
            />

            <InputField
              label="EMAIL"
              placeholder="your@email.com"
              icon={<Mail size={18} color={theme.colors.textMuted} />}
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
                icon={<Lock size={18} color={theme.colors.textMuted} />}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity 
                style={styles.eyeIcon} 
                onPress={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} color={theme.colors.textMuted} /> : <Eye size={18} color={theme.colors.textMuted} />}
              </TouchableOpacity>
            </View>

            <Button onPress={handleSignUp} isLoading={isLoading} fullWidth>
              Create Account
            </Button>
          </View>

          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR SIGN UP WITH</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleLogin}>
            <Svg width={20} height={20} viewBox="0 0 24 24">
              <Path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <Path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <Path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
              <Path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </Svg>
            <Text style={styles.googleBtnText}>Google</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.toggleBar}>
          <TouchableOpacity style={styles.toggleInactive} onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.toggleInactiveText}>LOGIN</Text>
          </TouchableOpacity>
          <View style={styles.toggleActive}>
            <Text style={styles.toggleActiveText}>SIGNUP ACTIVE</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eff6ff',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: theme.colors.bgWhite,
    padding: 32,
    borderRadius: 24,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
    borderWidth: 1,
    borderColor: theme.colors.bgWhite,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: theme.colors.primary,
  },
  subtitle: {
    color: theme.colors.textSecondary,
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
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 32,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.borderLight,
  },
  dividerText: {
    paddingHorizontal: 12,
    fontSize: 10,
    fontWeight: 'bold',
    color: theme.colors.textMuted,
    letterSpacing: 2,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.bgWhite,
  },
  googleBtnText: {
    fontWeight: 'bold',
    color: theme.colors.primary,
    fontSize: 14,
  },
  toggleBar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.bgWhite,
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
    backgroundColor: theme.colors.accent,
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: 'center',
  },
  toggleActiveText: {
    color: theme.colors.bgWhite,
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
    color: theme.colors.textMuted,
    fontWeight: '900',
    fontSize: 10,
    letterSpacing: 1,
  },
});
