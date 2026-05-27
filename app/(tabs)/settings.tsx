import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Switch, Alert, Modal } from 'react-native';
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
  
  const [modalVisible, setModalVisible] = React.useState(false);
  const [modalTitle, setModalTitle] = React.useState('');
  const [modalContent, setModalContent] = React.useState<React.ReactNode>(null);

  const confirmLogout = () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to log out of your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              router.replace('/(auth)/login');
            } catch (error) {
              Alert.alert('Logout Failed', 'Please try again.');
            }
          }
        },
      ]
    );
  };

  const openLegalModal = (title: string, type: 'terms' | 'privacy' | 'about') => {
    setModalTitle(title);
    
    let content = null;
    if (type === 'terms') {
      content = (
        <Text style={styles.modalText}>
          Welcome to BANGIS. By using our application, you agree to these terms. {'\n\n'}
          1. Use of Service: BANGIS provides real-time fuel tracking data. We do not guarantee the absolute accuracy of prices as they are subject to station changes.{'\n\n'}
          2. User Accounts: You are responsible for maintaining the security of your account.{'\n\n'}
          3. Fair Use: Do not misuse the application or attempt to overload our servers.
        </Text>
      );
    } else if (type === 'privacy') {
      content = (
        <Text style={styles.modalText}>
          Your privacy is important to us.{'\n\n'}
          1. Data Collection: We collect basic profile information (email, name, avatar) for account functionality.{'\n\n'}
          2. Location Data: We request your GPS location solely to provide accurate distance metrics to fuel stations. We do not track your location in the background.{'\n\n'}
          3. Data Security: Your data is securely stored on Firebase.
        </Text>
      );
    } else if (type === 'about') {
      content = (
        <Text style={styles.modalText}>
          BANGIS (Bacolod Advanced Network for Gas and Information System){'\n\n'}
          BANGIS was created to help drivers in Bacolod City easily track, compare, and find the cheapest fuel prices in real-time. Our automated systems gather prices directly from reliable market trackers so you never overpay for gas again.{'\n\n'}
          Version: 1.0.0
        </Text>
      );
    }
    
    setModalContent(content);
    setModalVisible(true);
  };

  const settingsItems = [
    { icon: FileText, title: 'Terms & Conditions', color: colors.primary, type: 'terms' },
    { icon: ShieldAlert, title: 'Privacy Policy', color: colors.accent, type: 'privacy' },
    { icon: Info, title: 'About BANGIS', color: colors.success, type: 'about' },
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
                onPress={() => openLegalModal(item.title, item.type as any)}
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
          <TouchableOpacity
            onPress={confirmLogout}
            style={[styles.logoutBtn, { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }]}
          >
            <LogOut size={20} color={colors.danger} style={{ marginRight: 8 }} />
            <Text style={styles.logoutBtnText}>LOGOUT</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footerInfo}>
          <Text style={styles.versionText}>BANGIS v1.0.0</Text>
          <Text style={styles.copyrightText}>© 2026 Bangis Inc. All rights reserved.</Text>
        </View>

      </ScrollView>

      {/* Modal for Legal/Info */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{modalTitle}</Text>
            <ScrollView style={styles.modalScroll}>
              {modalContent}
            </ScrollView>
            <TouchableOpacity 
              style={[styles.closeModalBtn, { backgroundColor: colors.primary }]} 
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeModalText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    paddingVertical: 16,
    borderRadius: 24,
  },
  logoutBtnText: {
    color: colors.danger,
    fontWeight: '900',
    letterSpacing: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: colors.bgWhite,
    borderRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  modalScroll: {
    marginBottom: 24,
  },
  modalText: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.textSecondary,
  },
  closeModalBtn: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  closeModalText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
