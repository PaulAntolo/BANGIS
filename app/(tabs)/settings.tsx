import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Switch, Alert } from 'react-native';
import { Settings as SettingsIcon, FileText, Info, ShieldAlert, ChevronRight, Moon, LogOut } from 'lucide-react-native';
import Header from '../../src/components/Header';
import { useAppTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { useRouter } from 'expo-router';
import Button from '../../src/components/Button';

export default function SettingsScreen() {
  const { colors, isDarkMode, toggleTheme } = useAppTheme();
  const { logout } = useAuth();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/(auth)/login');
    } catch (error) {
      Alert.alert('Logout Failed', 'Please try again.');
    }
  };

  const settingsItems = [
    { icon: FileText, title: 'Terms & Conditions', color: colors.primary },
    { icon: ShieldAlert, title: 'Privacy Policy', color: colors.accent },
    { icon: Info, title: 'About BANGIS', color: colors.success },
  ];

  return (
    <View style={styles.container}>
      <Header title="Settings" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>PREFERENCES</Text>
          <View style={styles.menuList}>
            <View style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIconBox, { backgroundColor: colors.accent + '10' }]}>
                  <Moon size={18} color={colors.accent} />
                </View>
                <Text style={styles.menuItemTitle}>Dark Mode</Text>
              </View>
              <Switch 
                value={isDarkMode} 
                onValueChange={toggleTheme} 
                trackColor={{ false: colors.borderLight, true: colors.accent + '80' }}
                thumbColor={isDarkMode ? colors.accent : colors.bgLight}
              />
            </View>
          </View>
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>LEGAL & INFO</Text>
          <View style={styles.menuList}>
            {settingsItems.map((item, index) => (
              <TouchableOpacity 
                key={index}
                style={[styles.menuItem, index !== settingsItems.length - 1 && styles.menuItemBorder]}
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

        <View style={styles.logoutContainer}>
          <Button
            onPress={handleLogout}
            variant="danger"
            fullWidth
            style={styles.logoutBtn}
            textStyle={styles.logoutBtnText}
          >
            <LogOut size={20} color={colors.danger} style={{ marginRight: 8 }} />
            LOGOUT
          </Button>
        </View>

        <View style={styles.footerInfo}>
          <Text style={styles.versionText}>BANGIS v1.0.0</Text>
          <Text style={styles.copyrightText}>© 2026 Bangis Inc. All rights reserved.</Text>
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
    paddingTop: 32,
    paddingBottom: 40,
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
  footerInfo: {
    marginTop: 40,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textMuted,
    marginBottom: 4,
  },
  copyrightText: {
    fontSize: 10,
    color: colors.textMuted,
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
