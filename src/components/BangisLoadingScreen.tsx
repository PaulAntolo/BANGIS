import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Image, Animated, Easing } from 'react-native';
import { Truck } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const BAR_WIDTH = width * 0.7; 
const VEHICLE_SIZE = 32;

interface Props {
  onFinish?: () => void;
}

export default function BangisLoadingScreen({ onFinish }: Props) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 2500,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished && onFinish) {
        onFinish();
      }
    });
  }, [progress, onFinish]);

  const vehicleTranslateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, BAR_WIDTH - VEHICLE_SIZE]
  });

  const fillWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, BAR_WIDTH]
  });

  return (
    <View style={styles.container}>
      <Image 
        source={require('../../assets/BANGIS-logo.png')} 
        style={styles.logo} 
        resizeMode="contain"
      />

      <View style={styles.loaderContainer}>
        <Animated.View style={[styles.vehicleWrapper, { transform: [{ translateX: vehicleTranslateX }] }]}>
          <Truck size={VEHICLE_SIZE} color="#F97316" />
        </Animated.View>

        <View style={styles.barTrack}>
          <Animated.View style={[styles.barFill, { width: fillWidth }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: 60,
  },
  loaderContainer: {
    width: BAR_WIDTH,
    height: 50,
    justifyContent: 'flex-end',
  },
  vehicleWrapper: {
    position: 'absolute',
    bottom: 12,
    zIndex: 10,
  },
  barTrack: {
    height: 8,
    backgroundColor: '#F1FAEE',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#F97316',
    borderRadius: 4,
  },
});
