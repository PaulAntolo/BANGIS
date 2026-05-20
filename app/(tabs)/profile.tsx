import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Shield, History, LogOut, ChevronRight, Camera } from 'lucide-react-native';
import Header from '../../src/components/Header';
import { useAuth } from '../../src/context/AuthContext';
import Button from '../../src/components/Button';
import { theme } from '../../src/constants/theme';

export default function ProfileScreen() {
  const { user, profile, logout, updateUser } = useAuth();
  const router = useRouter();

  const menuRows = [
    { icon: Shield, title: 'Security & Account', color: theme.colors.primary, path: '/security' },
  ];

  const handleAvatarClick = () => {
    Alert.alert('Notice', 'Avatar upload requires expo-image-picker. Stubbed for now.');
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/(auth)/login');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Profile" showBack />
      
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        <View style={styles.userCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarBorder}>
              <Image
                source={{ uri: profile?.photoURL || `https://api.dicebear.com/7.x/avataaars/png?seed=${profile?.displayName || 'User'}` }}
                style={styles.avatarImage}
              />
            </View>
            <TouchableOpacity style={styles.cameraBtn} onPress={handleAvatarClick}>
              <Camera size={14} color="white" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.displayName}>{profile?.displayName || 'Set Name'}</Text>
          <Text style={styles.emailText}>{user?.email}</Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Rank</Text>
              <Text style={styles.statValue}>{profile?.rank || 'Operative'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>ACCOUNT SETTINGS</Text>
          <View style={styles.menuList}>
            {menuRows.map((item, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => item.path ? router.push(item.path as any) : Alert.alert(`Opening ${item.title}`)}
                style={[styles.menuItem, i > 0 && styles.menuItemBorder]}
              >
                <View style={styles.menuItemLeft}>
                  <View style={[styles.menuIconBox, { backgroundColor: item.color + '10' }]}>
                    <item.icon size={20} color={item.color} />
                  </View>
                  <Text style={styles.menuItemTitle}>{item.title}</Text>
                </View>
                <ChevronRight size={18} color={theme.colors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>DATA SOURCES</Text>
          <View style={styles.menuList}>
            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIconBox, { backgroundColor: theme.colors.accent + '10' }]}>
                  <Text style={{ fontSize: 20 }}>📊</Text>
                </View>
                <View>
                  <Text style={styles.menuItemTitle}>MetroFuel Tracker</Text>
                  <Text style={{ fontSize: 10, color: theme.colors.textMuted, marginTop: 2 }}>metrofueltracker.com</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.logoutContainer}>
          <Button
            onPress={handleLogout}
            variant="danger"
            fullWidth
            style={styles.logoutBtn}
            textStyle={styles.logoutBtnText}
          >
            <LogOut size={20} color={theme.colors.danger} style={{ marginRight: 8 }} />
            LOGOUT
          </Button>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bgLight,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  userCard: {
    backgroundColor: theme.colors.bgWhite,
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarBorder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    borderColor: theme.colors.primary + '10',
    padding: 4,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
    backgroundColor: theme.colors.bgLight,
  },
  cameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
    elevation: 4,
  },
  displayName: {
    fontSize: 24,
    fontWeight: '900',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  emailText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.textMuted,
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    width: '100%',
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: theme.colors.bgLight,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: theme.colors.borderLight,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginTop: 8,
  },
  menuSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginLeft: 4,
    marginBottom: 12,
  },
  menuList: {
    backgroundColor: theme.colors.bgWhite,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  menuItemBorder: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.bgLight,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  menuIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  logoutContainer: {
    paddingBottom: 40,
  },
  logoutBtn: {
    backgroundColor: theme.colors.danger + '10',
    borderWidth: 0,
    paddingVertical: 16,
  },
  logoutBtnText: {
    color: theme.colors.danger,
    fontWeight: '900',
    letterSpacing: 2,
  },
});
