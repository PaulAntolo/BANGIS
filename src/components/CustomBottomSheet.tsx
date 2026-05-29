import React, { useRef, useState } from 'react';
import { View, Animated, PanResponder, StyleSheet, Dimensions, Platform } from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function CustomBottomSheet({ children, snapPoints, initialIndex = 1, backgroundColor = '#fff' }) {
  // snapPoints is an array of percentages like ['15%', '50%', '90%']
  const parsedSnaps = snapPoints.map(p => {
    const percentage = parseFloat(p) / 100;
    return SCREEN_HEIGHT - (SCREEN_HEIGHT * percentage);
  });

  const [currentSnap, setCurrentSnap] = useState(parsedSnaps[initialIndex]);
  const panY = useRef(new Animated.Value(parsedSnaps[initialIndex])).current;

  // Dynamically calculate the exact height so the bottom of the sheet ALWAYS touches the physical bottom of the screen.
  // This guarantees the list never overflows off-screen regardless of what snap point it is in!
  const dynamicHeight = panY.interpolate({
    inputRange: [-SCREEN_HEIGHT, SCREEN_HEIGHT * 2],
    outputRange: [SCREEN_HEIGHT * 2, -SCREEN_HEIGHT]
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dy) > 10;
      },
      onPanResponderMove: (evt, gestureState) => {
        let newY = currentSnap + gestureState.dy;
        if (newY < parsedSnaps[parsedSnaps.length - 1]) newY = parsedSnaps[parsedSnaps.length - 1]; // min y (highest point)
        if (newY > parsedSnaps[0]) newY = parsedSnaps[0]; // max y (lowest point)
        panY.setValue(newY);
      },
      onPanResponderRelease: (evt, gestureState) => {
        const finalY = currentSnap + gestureState.dy;
        // Find closest snap point
        const closestSnap = parsedSnaps.reduce((prev, curr) => {
          return (Math.abs(curr - finalY) < Math.abs(prev - finalY) ? curr : prev);
        });

        setCurrentSnap(closestSnap);
        Animated.spring(panY, {
          toValue: closestSnap,
          useNativeDriver: false,
          bounciness: 4,
          speed: 12
        }).start();
      },
    })
  ).current;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY: panY }], backgroundColor, height: dynamicHeight }]}>
      <View {...panResponder.panHandlers} style={styles.handleContainer}>
        <View style={styles.handle} />
      </View>
      <View style={styles.content}>
        {children}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
    zIndex: 100,
  },
  handleContainer: {
    width: '100%',
    height: 44, // Larger hit area to make it very easy to grab and hide quickly
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent'
  },
  handle: {
    width: 48,
    height: 6,
    backgroundColor: '#ccc',
    borderRadius: 3,
  },
  content: {
    flex: 1,
  }
});
