import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Shield, History, LogOut, ChevronRight, Camera, Database, Bookmark, Star, MapPin } from 'lucide-react-native';
import Header from '../../src/components/Header';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useFuelData } from '../../src/context/FuelContext';
import StationCard from '../../src/components/StationCard';
import Button from '../../src/components/Button';
import { useAppTheme } from '../../src/context/ThemeContext';
import * as ImagePicker from 'expo-image-picker';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, profile, logout, updateUser } = useAuth();
  const { stations } = useFuelData();
  const { colors } = useAppTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  
  const [uploading, setUploading] = useState(false);

  const bookmarkedStations = useMemo(() => {
    if (!profile?.bookmarks || !stations) return [];
    return stations.filter(s => profile.bookmarks.includes(s.id));
  }, [stations, profile?.bookmarks]);

  const pickImage = async () => {
    if (!user) return;

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
        return;
      }

      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setUploading(true);
        const imageUri = result.assets[0].uri;
        
        // Save locally to AsyncStorage context
        await updateUser({ photoURL: imageUri });
        setUploading(false);
      }
    } catch (error) {
      console.error('Image picking error:', error);
      Alert.alert('Error', 'An error occurred while picking the image.');
      setUploading(false);
    }
  };

  const menuItems = [
    { icon: Shield, title: 'Security & Account', color: colors.primary, path: '/security' },
    { icon: History, title: 'Activity History', color: colors.accent, path: '/(tabs)/analytics' },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/(auth)/login');
    } catch (error) {
      Alert.alert('Logout Failed', 'Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Header title="My Profile" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarBorder}>
              {uploading ? (
                <View style={[styles.avatar, { justifyContent: 'center', alignItems: 'center' }]}>
                  <ActivityIndicator color={colors.primary} />
                </View>
              ) : (
                <Image 
                  source={{ uri: profile?.photoURL || `https://api.dicebear.com/7.x/avataaars/png?seed=${profile?.displayName || 'User'}` }}
                  style={styles.avatar}
                />
              )}
            </View>
            <TouchableOpacity style={styles.editAvatarBtn} onPress={pickImage} disabled={uploading}>
              <Camera size={14} color="white" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{profile?.displayName || 'User'}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Verified User</Text>
            </View>
          </View>
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>ACCOUNT SETTINGS</Text>
          <View style={styles.menuList}>
            {menuItems.map((item, index) => (
              <TouchableOpacity 
                key={index}
                style={[styles.menuItem, index !== menuItems.length - 1 && styles.menuItemBorder]}
                onPress={() => item.path && router.push(item.path as any)}
              >
                <View style={styles.menuItemLeft}>
                  <View style={[styles.menuIconBox, { backgroundColor: item.color + '10' }]}>
                    <item.icon size={18} color={item.color} />
                  </View>
                  <Text style={styles.menuItemTitle}>{item.title}</Text>
                </View>
                <ChevronRight size={18} color={colors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>DATA SOURCES</Text>
          <View style={styles.menuList}>
            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIconBox, { backgroundColor: colors.accent + '10' }]}>
                  <Database size={18} color={colors.accent} />
                </View>
                <View>
                  <Text style={styles.menuItemTitle}>MetroFuel Tracker</Text>
                  <Text style={{ fontSize: 10, color: colors.textMuted, marginTop: 2 }}>gaswatchph.com</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>MY BOOKMARKS</Text>
          {bookmarkedStations.length > 0 ? (
            <View style={styles.bookmarksContainer}>
              {bookmarkedStations.map(station => (
                <View key={station.id} style={{ marginBottom: 12 }}>
                  <StationCard station={station} fuelType="unleaded" />
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyBookmarks}>
              <Bookmark size={24} color={colors.textMuted} style={{ marginBottom: 8 }} />
              <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: 'bold' }}>No saved stations yet.</Text>
            </View>
          )}
        </View>

      </ScrollView>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgLight,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: colors.bgWhite,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.borderLight,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarBorder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: colors.primary + '10',
    padding: 3,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 45,
    backgroundColor: colors.bgLight,
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.bgWhite,
  },
  userInfo: {
    alignItems: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.primary,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '500',
    marginBottom: 12,
  },
  badge: {
    backgroundColor: colors.success + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.success + '30',
  },
  badgeText: {
    color: colors.success,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.borderLight,
  },
  menuSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 12,
    marginLeft: 16,
  },
  menuList: {
    backgroundColor: colors.bgWhite,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
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
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  bookmarksContainer: {
    paddingHorizontal: 16,
  },
  emptyBookmarks: {
    backgroundColor: colors.bgWhite,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginHorizontal: 16,
  },
  logoutContainer: {
    marginTop: 8,
  },
  logoutBtn: {
    backgroundColor: colors.danger + '10',
    borderWidth: 1,
    borderColor: colors.danger + '30',
  },
  logoutBtnText: {
    color: colors.danger,
    fontWeight: '900',
    letterSpacing: 2,
  },
});
