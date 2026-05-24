import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { WifiOff } from 'lucide-react-native';
import { useAppTheme } from '../context/ThemeContext';

export default function NetworkOverlay() {
  const [isConnected, setIsConnected] = useState<boolean | null>(true);
  const { colors } = useAppTheme();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      // isConnected can be null temporarily, treat it as true to avoid flashing
      setIsConnected(state.isConnected ?? true);
    });

    return () => unsubscribe();
  }, []);

  if (isConnected) return null;

  return (
    <Modal transparent animationType="fade" visible={!isConnected}>
      <View style={[styles.container, { backgroundColor: 'rgba(0, 0, 0, 0.85)' }]}>
        <View style={[styles.card, { backgroundColor: colors.bgWhite }]}>
          <View style={styles.iconBox}>
            <WifiOff size={40} color={colors.danger} />
          </View>
          <Text style={[styles.title, { color: colors.primary }]}>You're Offline</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            BANGIS requires an active internet connection to fetch real-time prices and maps. Please check your network connection.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  iconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
