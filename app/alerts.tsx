import React, { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronRight, Zap, MapPin } from 'lucide-react-native';
import Header from '../src/components/Header';
import { useNotifications } from '../src/context/NotificationContext';
import { theme } from '../src/constants/theme';

export default function AlertsScreen() {
  const { markAsRead } = useNotifications();

  useEffect(() => {
    markAsRead();
  }, [markAsRead]);

  const notifications = [
    { title: 'Shell raised price "+₱0.50"', sub: 'Market adjustment detected in Makati CBD', time: '2h ago', icon: <ChevronRight size={14} color={theme.colors.danger} />, type: 'price' },
    { title: 'Petron discount alert', sub: 'Loyalty flash deal available for Platinum Reporters only', time: '5h ago', icon: <Zap size={14} color={theme.colors.accent} />, type: 'promo' },
    { title: 'New Station Reported', sub: 'A user reported a new CleanFuel station in Quezon City', time: '1d ago', icon: <MapPin size={14} color={theme.colors.primaryLight} />, type: 'report' },
    { title: 'Price Drop Warning', sub: 'Caltex prices expected to drop tomorrow morning', time: '1d ago', icon: <ChevronRight size={14} color={theme.colors.success} style={{ transform: [{ rotate: '90deg' }] }} />, type: 'price' },
  ];

  return (
    <View style={styles.container}>
      <Header title="Notifications" showBack />
      
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>ALL NOTIFICATIONS</Text>
        
        <View style={styles.list}>
          {notifications.map((item, i) => (
            <TouchableOpacity key={i} style={styles.card}>
              <View style={styles.iconBox}>
                {item.icon}
              </View>
              <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardTime}>{item.time}</Text>
                </View>
                <Text style={styles.cardSub} numberOfLines={1}>{item.sub}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bgLight },
  content: { padding: 20 },
  sectionTitle: { fontSize: 10, fontWeight: '900', color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16 },
  list: { gap: 12 },
  card: { flexDirection: 'row', backgroundColor: theme.colors.bgWhite, padding: 16, borderRadius: 16, gap: 16, borderWidth: 1, borderColor: theme.colors.borderLight },
  iconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: theme.colors.bgLight, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.borderLight },
  cardContent: { flex: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitle: { fontSize: 14, fontWeight: 'bold', color: theme.colors.primary, flex: 1, marginRight: 8 },
  cardTime: { fontSize: 9, fontWeight: 'bold', color: theme.colors.textMuted },
  cardSub: { fontSize: 11, color: theme.colors.textMuted, marginTop: 2 },
});
