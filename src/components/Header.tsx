import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Platform } from 'react-native';
import { ChevronLeft, Bell } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { theme } from '../constants/theme';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  transparent?: boolean;
}

export default function Header({ title, showBack, transparent }: HeaderProps) {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { hasUnread } = useNotifications();
  const insets = useSafeAreaInsets();

  return (
    <View style={[
      styles.container,
      transparent ? styles.transparent : styles.solid,
      { paddingTop: Math.max(insets.top, 16) }
    ]}>
      <View style={styles.leftSection}>
        {showBack ? (
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.logoContainer}>
            <View style={styles.logoIconContainer}>
              <Svg width={20} height={20} fill="currentColor" viewBox="0 0 24 24" color="#ffffff">
                <Path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"/>
              </Svg>
            </View>
            <View style={styles.logoTextContainer}>
              <Text style={styles.logoTextMain}>BANGIS</Text>
              <Text style={styles.logoTextSub}>Fuel Tracker</Text>
            </View>
          </View>
        )}
        {title && <Text style={styles.titleText}>{title}</Text>}
      </View>

      <View style={styles.rightSection}>
        <TouchableOpacity 
          onPress={() => router.push('/alerts')}
          style={styles.iconButton}
        >
          <Bell size={22} color={theme.colors.textSecondary} />
          {hasUnread && (
            <View style={styles.notificationDot} />
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={() => router.push('/profile')} 
          style={styles.profileButton}
        >
          <Image 
            source={{ uri: profile?.photoURL || `https://api.dicebear.com/7.x/avataaars/png?seed=${profile?.displayName || 'User'}` }}
            style={styles.profileImage}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    zIndex: 10,
  },
  transparent: {
    backgroundColor: 'transparent',
  },
  solid: {
    backgroundColor: theme.colors.bgWhite,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    padding: 4,
    marginLeft: -4,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoIconContainer: {
    width: 32,
    height: 32,
    backgroundColor: theme.colors.accent,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  logoTextContainer: {
    flexDirection: 'column',
  },
  logoTextMain: {
    fontWeight: 'bold',
    fontSize: 18,
    letterSpacing: -0.5,
    color: theme.colors.primary,
    lineHeight: 18,
  },
  logoTextSub: {
    fontSize: 8,
    fontWeight: 'bold',
    color: theme.colors.textSecondary,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  titleText: {
    fontWeight: 'bold',
    fontSize: 18,
    color: theme.colors.textPrimary,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    position: 'relative',
    padding: 4,
  },
  notificationDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    backgroundColor: theme.colors.danger,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: theme.colors.bgWhite,
  },
  profileButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.borderLight,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: theme.colors.bgWhite,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
});
