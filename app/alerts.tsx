import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Bell, MapPin, Zap, ChevronRight } from 'lucide-react-native';
import Header from '../src/components/Header';
import { useAppTheme } from '../src/context/ThemeContext';

export default function AlertsScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const alerts = [
    { title: 'Shell raised price "+₱0.50"', sub: 'Market adjustment detected in Makati CBD', time: '2h ago', icon: <ChevronRight size={14} color={colors.danger} />, type: 'price' },
    { title: 'Petron discount alert', sub: 'Loyalty flash deal available for Platinum Reporters only', time: '5h ago', icon: <Zap size={14} color={colors.accent} />, type: 'promo' },
    { title: 'New Station Reported', sub: 'A user reported a new CleanFuel station in Quezon City', time: '1d ago', icon: <MapPin size={14} color={colors.primaryLight} />, type: 'report' },
    { title: 'Price Drop Warning', sub: 'Caltex prices expected to drop tomorrow morning', time: '1d ago', icon: <ChevronRight size={14} color={colors.success} style={{ transform: [{ rotate: '90deg' }] }} />, type: 'price' },
  ];

  return (
    <View style={styles.container}>
      <Header title="Alerts & Notifications" showBack />
      
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>RECENT</Text>
          <View style={styles.list}>
            {alerts.map((alert, i) => (
              <TouchableOpacity key={i} style={styles.card}>
                <View style={styles.iconBox}>
                  {alert.icon}
                </View>
                <View style={styles.cardInfo}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{alert.title}</Text>
                    <Text style={styles.cardTime}>{alert.time}</Text>
                  </View>
                  <Text style={styles.cardSub}>{alert.sub}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgLight },
  content: { padding: 16 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 10, fontWeight: '900', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16 },
  list: { gap: 12 },
  card: { flexDirection: 'row', backgroundColor: colors.bgWhite, padding: 16, borderRadius: 16, gap: 16, borderWidth: 1, borderColor: colors.borderLight },
  iconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.bgLight, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.borderLight },
  cardInfo: { flex: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitle: { fontSize: 14, fontWeight: 'bold', color: colors.primary, flex: 1, marginRight: 8 },
  cardTime: { fontSize: 9, fontWeight: 'bold', color: colors.textMuted },
  cardSub: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
});
