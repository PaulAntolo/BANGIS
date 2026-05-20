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
  const { isDarkMode, toggleTheme } = useAppTheme();
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
                  <Text style={{ fontSize: 16 }}>{isDarkMode ? '🌙' : '☀️'}</Text>
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
              variant={isSaved ? 'accent' : 'primary'}
              isLoading={isLoading}
            >
              <Save size={18} color="white" style={{ marginRight: 8 }} />
              {isSaved ? 'Changes Saved!' : 'Save Modifications'}
            </Button>
          </View>
        </View>

        <View style={styles.securityInfo}>
          <Shield size={24} color={theme.colors.accent} style={styles.securityIcon} />
          <View style={styles.securityTextContainer}>
            <Text style={styles.securityTitle}>SECURE ACCOUNT</Text>
            <Text style={styles.securityDesc}>
              Your data is encrypted and stored securely. We never share your personal information with third-party providers without your explicit consent.
            </Text>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bgLight },
  content: { padding: 20 },
  accountCard: { backgroundColor: theme.colors.bgWhite, padding: 20, borderRadius: 24, borderWidth: 1, borderColor: theme.colors.borderLight, marginBottom: 24 },
  accountHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24 },
  avatarBorder: { width: 64, height: 64, borderRadius: 32, borderWidth: 4, borderColor: theme.colors.primary + '10', padding: 2 },
  avatarImage: { width: '100%', height: '100%', borderRadius: 28, backgroundColor: theme.colors.bgLight },
  accountInfo: { flex: 1 },
  displayName: { fontSize: 20, fontWeight: '900', color: theme.colors.primary },
  emailText: { fontSize: 14, fontWeight: '500', color: theme.colors.textMuted },
  memberSinceBox: { backgroundColor: theme.colors.bgLight, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.borderLight },
  memberSinceLabel: { fontSize: 10, fontWeight: '900', color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: 2 },
  memberSinceDate: { fontSize: 14, fontWeight: 'bold', color: theme.colors.primary, marginTop: 4 },
  editSection: { marginBottom: 24 },
  sectionTitle: { fontSize: 11, fontWeight: '900', color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16, marginLeft: 4 },
  editCard: { backgroundColor: theme.colors.bgWhite, padding: 20, borderRadius: 24, borderWidth: 1, borderColor: theme.colors.borderLight, gap: 16 },
  inputGroup: { gap: 6 },
  inputLabel: { fontSize: 11, fontWeight: '900', color: theme.colors.primary + '99', textTransform: 'uppercase', letterSpacing: 2, marginLeft: 4 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.bgLight, borderRadius: 16, paddingHorizontal: 16, borderWidth: 1, borderColor: theme.colors.borderLight },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, paddingVertical: 16, fontSize: 14, fontWeight: 'bold', color: theme.colors.primary },
  divider: { height: 1, backgroundColor: theme.colors.borderLight, marginVertical: 8 },
  securityInfo: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: theme.colors.accent + '10', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.accent + '20', gap: 12 },
  securityIcon: { marginTop: 2 },
  securityTextContainer: { flex: 1 },
  securityTitle: { fontSize: 12, fontWeight: '900', color: theme.colors.primary, textTransform: 'uppercase', letterSpacing: 1 },
  securityDesc: { fontSize: 10, fontWeight: '500', color: theme.colors.textMuted, marginTop: 4, lineHeight: 16 },
});
