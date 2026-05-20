import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Modal } from 'react-native';
import { TrendingUp, Zap, ChevronUp, ChevronDown, Info, X } from 'lucide-react-native';
import Header from '../../src/components/Header';
import { TREND_DATA, TREND_DATA_30D, REGIONAL_PRICES, ACTIVITY, EXTENDED_ACTIVITY } from '../../src/utils/mockData';
import { theme } from '../../src/constants/theme';
import Button from '../../src/components/Button';

export default function AnalyticsScreen() {
  const [activeFuel, setActiveFuel] = useState<'unleaded' | 'diesel' | 'premium'>('unleaded');
  const [timeframe, setTimeframe] = useState('7D');
  const [showHistory, setShowHistory] = useState(false);

  const chartData = useMemo(() => {
    return timeframe === '1M' ? TREND_DATA_30D : TREND_DATA;
  }, [timeframe]);

  const marketStats = useMemo(() => {
    const prices = chartData.map(d => d[activeFuel]);
    const current = prices[prices.length - 1];
    const previous = prices[prices.length - 2];
    const change = ((current - previous) / previous) * 100;
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    
    return {
      current,
      avg: avg.toFixed(2),
      change: change.toFixed(1),
      isUp: change > 0
    };
  }, [activeFuel, chartData]);

  return (
    <View style={styles.container}>
      <Header />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        <View style={styles.marketIdentity}>
          <View style={styles.marketTitleContainer}>
            <View style={styles.pulseDot} />
            <Text style={styles.marketTitle}>Bacolod Market</Text>
          </View>
          <Text style={styles.marketSubtitle}>Live Supply & Price Oversight</Text>
        </View>

        <View style={styles.intelligenceCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardBadge}>
              <Text style={styles.cardBadgeText}>Market Summary</Text>
            </View>
            <Text style={styles.updateText}>Updated 12m ago</Text>
          </View>
          
          <View style={styles.statsContainer}>
            <View>
              <Text style={styles.avgLabel}>Current Avg ({activeFuel})</Text>
              <Text style={styles.avgValue}>₱{marketStats.avg}</Text>
            </View>
            <View style={[styles.changeBadge, marketStats.isUp ? styles.changeUp : styles.changeDown]}>
              {marketStats.isUp ? <ChevronUp size={14} color={theme.colors.danger} /> : <ChevronDown size={14} color={theme.colors.success} />}
              <Text style={[styles.changeText, marketStats.isUp ? styles.changeTextUp : styles.changeTextDown]}>
                {Math.abs(Number(marketStats.change))}%
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.fuelSelector}>
          {(['unleaded', 'diesel', 'premium'] as const).map((type) => (
            <TouchableOpacity
              key={type}
              onPress={() => setActiveFuel(type)}
              style={[styles.fuelBtn, activeFuel === type && styles.fuelBtnActive]}
            >
              <Text style={[styles.fuelBtnText, activeFuel === type && styles.fuelBtnTextActive]}>
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Price Performance</Text>
              <Text style={styles.sectionSubtitle}>Bacolod City Market Trend ({timeframe})</Text>
            </View>
            <View style={styles.timeframeToggles}>
              {['7D', '1M'].map(t => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setTimeframe(t)}
                  style={[styles.timeToggle, timeframe === t && styles.timeToggleActive]}
                >
                  <Text style={[styles.timeToggleText, timeframe === t && styles.timeToggleTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.chartMock}>
            <Text style={styles.chartMockText}>[ Chart Placeholder ]</Text>
            <Text style={styles.chartMockDesc}>Expo Recharts not installed. Mocking graph view.</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>District Pricing</Text>
              <Text style={styles.sectionSubtitle}>Price variation by city area</Text>
            </View>
            <View style={styles.infoIconBox}>
              <Info size={14} color={theme.colors.primary} />
            </View>
          </View>
          
          <View style={styles.districtList}>
            {(() => {
              const prices = REGIONAL_PRICES.map(item => item[activeFuel]);
              const min = Math.min(...prices);
              const max = Math.max(...prices);

              return REGIONAL_PRICES.map((item) => {
                const currentPrice = item[activeFuel];
                let statusColor = theme.colors.primary;
                let label = "";

                if (currentPrice === min) {
                  statusColor = theme.colors.success;
                  label = "Lowest";
                } else if (currentPrice === max) {
                  statusColor = theme.colors.danger;
                  label = "Highest";
                }

                return (
                  <View key={item.area} style={styles.districtItem}>
                    <View style={styles.districtHeader}>
                      <View>
                        <Text style={styles.districtArea}>{item.area}</Text>
                        <View style={styles.districtPriceRow}>
                          <Text style={[styles.districtPrice, { color: statusColor }]}>₱{currentPrice.toFixed(2)}</Text>
                          {label ? (
                            <View style={[styles.districtBadge, { backgroundColor: statusColor + '20' }]}>
                              <Text style={[styles.districtBadgeText, { color: statusColor }]}>{label}</Text>
                            </View>
                          ) : null}
                        </View>
                      </View>
                      <Text style={styles.marketIndexLabel}>MARKET INDEX</Text>
                    </View>
                    <View style={styles.barBackground}>
                      <View style={[styles.barForeground, { width: `${(currentPrice / 60) * 100}%`, backgroundColor: statusColor }]} />
                    </View>
                  </View>
                );
              });
            })()}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitleMain}>Market Volatility</Text>
          <View style={styles.activityList}>
            {ACTIVITY.map((act) => (
              <View key={act.id} style={styles.activityItem}>
                <View style={styles.activityLeft}>
                  <View style={[styles.activityIconBox, act.type === 'price_hike' ? styles.activityIconHike : styles.activityIconDrop]}>
                    {act.type === 'price_hike' ? <TrendingUp size={20} color={theme.colors.danger} /> : <Zap size={20} color={theme.colors.success} />}
                  </View>
                  <View>
                    <Text style={styles.activityStation}>{act.station}</Text>
                    <View style={styles.activityMetaRow}>
                      <Text style={styles.activityReason}>{act.reason}</Text>
                      <View style={styles.activityDot} />
                      <Text style={styles.activityTime}>{act.time}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.activityRight}>
                  <Text style={[styles.activityChange, act.type === 'price_hike' ? { color: theme.colors.danger } : { color: theme.colors.success }]}>
                    {act.change}
                  </Text>
                  <Text style={styles.activityCurrency}>PHP</Text>
                </View>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.viewHistoryBtn} onPress={() => setShowHistory(true)}>
            <Text style={styles.viewHistoryText}>VIEW DETAILED HISTORY</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      <Modal visible={showHistory} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Market History</Text>
                <Text style={styles.modalSubtitle}>Live Bacolod Intelligence</Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setShowHistory(false)}>
                <X size={20} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              {EXTENDED_ACTIVITY.map((act) => (
                <View key={act.id} style={styles.activityItem}>
                  <View style={styles.activityLeft}>
                    <View style={[styles.activityIconBox, act.type === 'price_hike' ? styles.activityIconHike : styles.activityIconDrop]}>
                      {act.type === 'price_hike' ? <TrendingUp size={20} color={theme.colors.danger} /> : <Zap size={20} color={theme.colors.success} />}
                    </View>
                    <View>
                      <Text style={styles.activityStation}>{act.station}</Text>
                      <View style={styles.activityMetaRow}>
                        <Text style={styles.activityReason}>{act.reason}</Text>
                        <View style={styles.activityDot} />
                        <Text style={styles.activityTime}>{act.time}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.activityRight}>
                    <Text style={[styles.activityChange, act.type === 'price_hike' ? { color: theme.colors.danger } : { color: theme.colors.success }]}>
                      {act.change}
                    </Text>
                    <Text style={styles.activityCurrency}>PHP</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
            <View style={styles.modalFooter}>
              <Button fullWidth onPress={() => setShowHistory(false)}>
                Close History
              </Button>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bgLight },
  content: { padding: 20, paddingBottom: 40 },
  marketIdentity: { marginBottom: 24 },
  marketTitleContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.accent },
  marketTitle: { fontSize: 24, fontWeight: '900', color: theme.colors.primary },
  marketSubtitle: { fontSize: 10, fontWeight: '900', color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: 2, marginTop: 4, marginLeft: 16 },
  intelligenceCard: { backgroundColor: theme.colors.primary, padding: 24, borderRadius: 32, marginBottom: 24 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  cardBadgeText: { fontSize: 9, fontWeight: '900', color: 'white', textTransform: 'uppercase', letterSpacing: 1 },
  updateText: { fontSize: 10, fontWeight: 'bold', color: 'rgba(255,255,255,0.6)' },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  avgLabel: { fontSize: 10, fontWeight: '900', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  avgValue: { fontSize: 36, fontWeight: '900', color: 'white' },
  changeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  changeUp: { backgroundColor: 'rgba(239, 68, 68, 0.2)' },
  changeDown: { backgroundColor: 'rgba(34, 197, 94, 0.2)' },
  changeText: { fontSize: 12, fontWeight: '900' },
  changeTextUp: { color: theme.colors.danger },
  changeTextDown: { color: theme.colors.success },
  fuelSelector: { flexDirection: 'row', backgroundColor: theme.colors.bgWhite, padding: 4, borderRadius: 16, marginBottom: 24, borderWidth: 1, borderColor: theme.colors.borderLight },
  fuelBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
  fuelBtnActive: { backgroundColor: theme.colors.primary },
  fuelBtnText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: theme.colors.textMuted },
  fuelBtnTextActive: { color: 'white' },
  sectionCard: { backgroundColor: theme.colors.bgWhite, padding: 24, borderRadius: 32, borderWidth: 1, borderColor: theme.colors.borderLight, marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  sectionTitle: { fontSize: 14, fontWeight: '900', color: theme.colors.primary, textTransform: 'uppercase' },
  sectionSubtitle: { fontSize: 10, fontWeight: 'bold', color: theme.colors.textMuted, marginTop: 2 },
  sectionTitleMain: { fontSize: 14, fontWeight: '900', color: theme.colors.primary, textTransform: 'uppercase', marginBottom: 24 },
  timeframeToggles: { flexDirection: 'row', gap: 4 },
  timeToggle: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: theme.colors.bgLight, borderWidth: 1, borderColor: theme.colors.borderLight },
  timeToggleActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  timeToggleText: { fontSize: 9, fontWeight: '900', color: theme.colors.textMuted },
  timeToggleTextActive: { color: 'white' },
  chartMock: { height: 180, backgroundColor: theme.colors.bgLight, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.borderLight, borderStyle: 'dashed' },
  chartMockText: { fontSize: 12, fontWeight: 'bold', color: theme.colors.textMuted },
  chartMockDesc: { fontSize: 10, color: theme.colors.textSecondary, marginTop: 4 },
  infoIconBox: { width: 32, height: 32, borderRadius: 16, backgroundColor: theme.colors.primaryLight + '20', alignItems: 'center', justifyContent: 'center' },
  districtList: { gap: 16 },
  districtItem: { gap: 8 },
  districtHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  districtArea: { fontSize: 10, fontWeight: '900', color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  districtPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  districtPrice: { fontSize: 14, fontWeight: '900' },
  districtBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  districtBadgeText: { fontSize: 8, fontWeight: '900', textTransform: 'uppercase' },
  marketIndexLabel: { fontSize: 9, fontWeight: 'bold', color: theme.colors.textMuted },
  barBackground: { height: 6, backgroundColor: theme.colors.bgLight, borderRadius: 3, overflow: 'hidden' },
  barForeground: { height: '100%', borderRadius: 3 },
  activityList: { gap: 20 },
  activityItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  activityLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  activityIconBox: { width: 48, height: 48, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  activityIconHike: { backgroundColor: theme.colors.danger + '10', borderColor: theme.colors.danger + '20' },
  activityIconDrop: { backgroundColor: theme.colors.success + '10', borderColor: theme.colors.success + '20' },
  activityStation: { fontSize: 14, fontWeight: '900', color: theme.colors.primary },
  activityMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  activityReason: { fontSize: 10, fontWeight: 'bold', color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  activityDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: theme.colors.borderGray },
  activityTime: { fontSize: 9, fontWeight: 'bold', color: theme.colors.textMuted },
  activityRight: { alignItems: 'flex-end' },
  activityChange: { fontSize: 18, fontWeight: '900' },
  activityCurrency: { fontSize: 10, fontWeight: '900', color: theme.colors.textMuted, textTransform: 'uppercase' },
  viewHistoryBtn: { width: '100%', marginTop: 24, paddingVertical: 16, backgroundColor: theme.colors.bgLight, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.borderLight },
  viewHistoryText: { fontSize: 10, fontWeight: '900', color: theme.colors.primary, textTransform: 'uppercase', letterSpacing: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: theme.colors.bgWhite, borderTopLeftRadius: 40, borderTopRightRadius: 40, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: theme.colors.borderLight },
  modalTitle: { fontSize: 20, fontWeight: '900', color: theme.colors.primary, textTransform: 'uppercase' },
  modalSubtitle: { fontSize: 10, fontWeight: 'bold', color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.bgLight, alignItems: 'center', justifyContent: 'center' },
  modalBody: { padding: 24, gap: 24 },
  modalFooter: { padding: 24, borderTopWidth: 1, borderTopColor: theme.colors.borderLight, backgroundColor: theme.colors.bgLight },
});
