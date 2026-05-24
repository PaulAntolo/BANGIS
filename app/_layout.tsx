import { Slot, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { NotificationProvider } from '../src/context/NotificationContext';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import * as ScreenOrientation from 'expo-screen-orientation';
import { ThemeProvider } from '../src/context/ThemeContext';
import { useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import BangisLoadingScreen from '../src/components/BangisLoadingScreen';
import NetworkOverlay from '../src/components/NetworkOverlay';

// Keep the native splash screen visible until we are ready
SplashScreen.preventAutoHideAsync();

// Lock orientation immediately on load, before any component renders
ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);

function InitialLayout() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  const [animationFinished, setAnimationFinished] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    
    // Hide the native splash screen once initial data loading is done.
    SplashScreen.hideAsync();

    const inAuthGroup = segments[0] === '(auth)';
    
    // If not authenticated and not currently in the auth group, force redirect to login
    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      // Redirect to tabs if authenticated and trying to access auth screens
      router.replace('/(tabs)');
    }
  }, [user, isLoading, segments]);

  if (isLoading || !animationFinished) {
    return (
      <BangisLoadingScreen onFinish={() => setAnimationFinished(true)} />
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <InitialLayout />
          <NetworkOverlay />
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
