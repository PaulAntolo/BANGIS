import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, Image, Switch } from 'react-native';
import { Shield, User, Save } from 'lucide-react-native';
import Header from '../src/components/Header';
import { useAuth } from '../src/context/AuthContext';
import Button from '../src/components/Button';
import { theme } from '../src/constants/theme';
import { useAppTheme } from '../src/context/ThemeContext';

export default function SecurityScreen() {
  const { user, profile, updateUser } = useAuth();
  const { isDarkMode, toggleTheme, colors } = useAppTheme();
  const styles = React.useMemo(() => getStyles(colors), [colors]);
  const [name, setName] = useState(profile?.displayName || '');
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateUser({ displayName: name });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (error) {
      console.error('Update failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  return (
    <View style={styles.container}>
      <Header title="Security & Account" showBack />
      
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        <View style={styles.accountCard}>
          <View style={styles.accountHeader}>
            <View style={styles.avatarBorder}>
              <Image
                source={{ uri: profile?.photoURL || `https://api.dicebear.com/7.x/avataaars/png?seed=${profile?.displayName || 'User'}` }}
                style={styles.avatarImage}
              />
            </View>
            <View style={styles.accountInfo}>
              <Text style={styles.displayName}>{profile?.displayName}</Text>
              <Text style={styles.emailText}>{user?.email}</Text>
            </View>
          </View>

          <View style={styles.memberSinceBox}>
            <Text style={styles.memberSinceLabel}>MEMBER SINCE</Text>
            <Text style={styles.memberSinceDate}>{formatDate(profile?.createdAt)}</Text>
          </View>
        </View>

        <View style={styles.editSection}>
          <Text style={styles.sectionTitle}>Edit Account Details</Text>
          
          <View style={styles.editCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>FULL NAME</Text>
              <View style={styles.inputContainer}>
                <User size={18} color={theme.colors.primaryLight} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Your full name"
                  placeholderTextColor={theme.colors.borderGray}
                />
              </View>
            </View>

            <View style={styles.divider} />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={[styles.inputIcon, { width: 32, alignItems: 'center' }]}>
                  <Shield size={16} color={theme.colors.accent} />
                </View>
                <View>
                  <Text style={[styles.inputLabel, { marginLeft: 0 }]}>DARK MODE</Text>
                  <Text style={{ fontSize: 10, color: theme.colors.textMuted, marginTop: 2 }}>Toggle application theme</Text>
                </View>
              </View>
              <Switch value={isDarkMode} onValueChange={toggleTheme} trackColor={{ false: theme.colors.borderGray, true: theme.colors.accent }} />
            </View>

            <View style={styles.divider} />

            <Button
              onPress={handleSave}
              fullWidth
              disabled={isLoading}
              style={{ marginTop: 8 }}
            >
              {isLoading ? 'SAVING...' : 'SAVE CHANGES'}
            </Button>
          </View>

          <View style={[styles.securityInfo, { marginTop: 24 }]}>
            <Shield size={24} color={theme.colors.accent} style={styles.securityIcon} />
            <View style={{ flex: 1 }}>
              <Text style={styles.securityTitle}>Bank-Grade Security</Text>
              <Text style={styles.securityDesc}>Your information is protected by industry-leading encryption and security protocols.</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgLight },
  accountCard: { backgroundColor: colors.bgWhite, padding: 20, borderRadius: 24, borderWidth: 1, borderColor: colors.borderLight, marginBottom: 24 },
  avatarSection: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatarBorder: { width: 64, height: 64, borderRadius: 32, borderWidth: 4, borderColor: colors.primary + '10', padding: 2 },
  avatarImage: { width: '100%', height: '100%', borderRadius: 28, backgroundColor: colors.bgLight },
  accountInfo: { flex: 1 },
  displayName: { fontSize: 20, fontWeight: '900', color: colors.primary },
  emailText: { fontSize: 14, fontWeight: '500', color: colors.textMuted },
  memberSinceBox: { backgroundColor: colors.bgLight, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: colors.borderLight },
  memberSinceLabel: { fontSize: 10, fontWeight: '900', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 2 },
  memberSinceDate: { fontSize: 14, fontWeight: 'bold', color: colors.primary, marginTop: 4 },
  editSection: { gap: 8 },
  sectionTitle: { fontSize: 11, fontWeight: '900', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16, marginLeft: 4 },
  editCard: { backgroundColor: colors.bgWhite, padding: 20, borderRadius: 24, borderWidth: 1, borderColor: colors.borderLight, gap: 16 },
  inputGroup: { gap: 8 },
  inputLabel: { fontSize: 11, fontWeight: '900', color: colors.primary + '99', textTransform: 'uppercase', letterSpacing: 2, marginLeft: 4 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgLight, borderRadius: 16, paddingHorizontal: 16, borderWidth: 1, borderColor: colors.borderLight },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, paddingVertical: 16, fontSize: 14, fontWeight: 'bold', color: colors.primary },
  divider: { height: 1, backgroundColor: colors.borderLight, marginVertical: 8 },
  securityInfo: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: colors.accent + '10', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: colors.accent + '20', gap: 12 },
  securityIcon: { marginTop: 2 },
  securityTitle: { fontSize: 12, fontWeight: '900', color: colors.primary, textTransform: 'uppercase', letterSpacing: 1 },
  securityDesc: { fontSize: 10, fontWeight: '500', color: colors.textMuted, marginTop: 4, lineHeight: 16 },
});
