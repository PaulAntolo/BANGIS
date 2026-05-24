import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Bell, MapPin, Zap, ChevronRight } from 'lucide-react-native';
import Header from '../src/components/Header';
import { useAppTheme } from '../src/context/ThemeContext';
import { useNotifications } from '../src/context/NotificationContext';

export default function AlertsScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { markAsRead } = useNotifications();

  const [alerts, setAlerts] = useState([
    { id: 1, title: 'Shell raised price "+₱0.50"', sub: 'Market adjustment detected in Makati CBD leading to a slight increase across all branches in the area.', time: '2h ago', icon: <ChevronRight size={14} color={colors.danger} />, type: 'price', isRead: false, isExpanded: false },
    { id: 2, title: 'Petron discount alert', sub: 'Loyalty flash deal available for Platinum Reporters only. Claim your reward in the nearest branch today to get fuel discounts.', time: '5h ago', icon: <Zap size={14} color={colors.accent} />, type: 'promo', isRead: false, isExpanded: false },
    { id: 3, title: 'Price Drop Warning', sub: 'Caltex prices expected to drop tomorrow morning based on recent oil market fluctuations.', time: '1d ago', icon: <ChevronRight size={14} color={colors.success} style={{ transform: [{ rotate: '90deg' }] }} />, type: 'price', isRead: true, isExpanded: false },
  ]);

  useEffect(() => {
    const stillUnread = alerts.some(a => !a.isRead);
    if (!stillUnread) {
      markAsRead();
    }
  }, [alerts]);

  const handlePress = (id: number) => {
    setAlerts(prev => prev.map(a => 
      a.id === id ? { ...a, isRead: true, isExpanded: !a.isExpanded } : a
    ));
  };

  return (
    <View style={styles.container}>
      <Header title="Alerts & Notifications" showBack />
      
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>RECENT</Text>
          <View style={styles.list}>
            {alerts.map((alert) => (
              <TouchableOpacity 
                key={alert.id} 
                style={[styles.card, !alert.isRead && { backgroundColor: colors.accent + '15', borderColor: colors.accent + '30' }]}
                onPress={() => handlePress(alert.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconBox, !alert.isRead && { backgroundColor: colors.bgWhite }]}>
                  {alert.icon}
                </View>
                <View style={styles.cardInfo}>
                  <View style={styles.cardHeader}>
                    <Text style={[styles.cardTitle, !alert.isRead && { fontWeight: '900' }]}>{alert.title}</Text>
                    <Text style={[styles.cardTime, !alert.isRead && { color: colors.primary }]}>{alert.time}</Text>
                  </View>
                  <Text 
                    style={[styles.cardSub, !alert.isRead && { color: colors.textPrimary }]}
                    numberOfLines={alert.isExpanded ? undefined : 1}
                  >
                    {alert.sub}
                  </Text>
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
  container: {
    flex: 1,
    backgroundColor: colors.bgLight,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.textSecondary,
    marginBottom: 12,
    letterSpacing: 1,
  },
  list: {
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.bgWhite,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.bgLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  cardTime: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  cardSub: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
