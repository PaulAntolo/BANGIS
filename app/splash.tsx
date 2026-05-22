import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Image, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../src/context/ThemeContext';
import * as ScreenOrientation from 'expo-screen-orientation';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  
  const fillAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Attempt to lock to landscape temporarily for the animation effect
    const lockOrientation = async () => {
      try {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      } catch (e) {
        console.warn('Orientation lock failed', e);
      }
    };
    
    lockOrientation();

    Animated.timing(fillAnim, {
      toValue: 100,
      duration: 2500,
      useNativeDriver: false, // We need false because we are animating height/width
    }).start(() => {
      // Unlock orientation
      ScreenOrientation.unlockAsync().catch(() => {});
      // Route to login
      router.replace('/(auth)/login');
    });
    
    return () => {
      ScreenOrientation.unlockAsync().catch(() => {});
    };
  }, []);

  const fillWidth = fillAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.bgLight }]}>
      <View style={styles.content}>
        <Image 
          source={require('../assets/BANGIS-logo.png')} 
          style={styles.logo} 
          resizeMode="contain" 
        />
        <Text style={[styles.title, { color: colors.primary }]}>BANGIS</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Refueling your journey...</Text>

        <View style={[styles.gaugeContainer, { borderColor: colors.borderLight, backgroundColor: colors.bgWhite }]}>
          <Animated.View style={[styles.gaugeFill, { width: fillWidth, backgroundColor: colors.accent }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    width: '80%',
    maxWidth: 400,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: 4,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 40,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  gaugeContainer: {
    width: '100%',
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    overflow: 'hidden',
    position: 'relative',
  },
  gaugeFill: {
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
    borderRadius: 15,
  },
});
