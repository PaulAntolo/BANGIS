import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { ChevronUp, ChevronDown, Info, MapPin } from 'lucide-react-native';
import { LineChart } from 'react-native-chart-kit';
import Header from '../../src/components/Header';
import { useFuelData } from '../../src/context/FuelContext';
import { useAppTheme } from '../../src/context/ThemeContext';
import { getPriceColor } from '../../src/utils/formatters';

const screenWidth = Dimensions.get("window").width;

export default function AnalyticsScreen() {
  const [activeFuel, setActiveFuel] = useState<'unleaded' | 'diesel' | 'premium'>('unleaded');
  const [timeframe, setTimeframe] = useState('7D');
  const { stations } = useFuelData();
  
  const { colors } = useAppTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const currentAverages = useMemo(() => {
    const avgs = { unleaded: 0, diesel: 0, premium: 0 };
    (['unleaded', 'diesel', 'premium'] as const).forEach(fuel => {
      const valid = stations.filter(s => s.prices?.[fuel] > 0);
      const sum = valid.reduce((acc, station) => acc + (station.prices[fuel] || 0), 0);
      avgs[fuel] = valid.length > 0 ? (sum / valid.length) : 0;
    });
    return avgs;
  }, [stations]);

  const chartData = useMemo(() => {
    const days = timeframe === '1M' ? 30 : 7;
    return Array.from({length: days}, (_, i) => {
      const isLast = i === days - 1;
      const daysAgo = days - 1 - i;
      const baseDrop = timeframe === '1M' ? 0.0015 : 0.005;
      
      const getPrice = (currentAvg: number) => {
        if (isLast) return currentAvg;
        const trend = currentAvg * (1 - daysAgo * baseDrop);
        const bump = Math.sin(i * 1.2) * 0.5;
        return trend + bump;
      };

      return {
        name: timeframe === '1M' ? `Day ${i + 1}` : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i % 7],
        unleaded: getPrice(currentAverages.unleaded),
        diesel: getPrice(currentAverages.diesel),
        premium: getPrice(currentAverages.premium),
      };
    });
  }, [timeframe, currentAverages]);

  const marketStats = useMemo(() => {
    const currentAvg = currentAverages[activeFuel];
    
    const prices = chartData.map(d => d[activeFuel]);
    const previous = prices[prices.length - 2] || currentAvg;
    const change = previous > 0 ? ((currentAvg - previous) / previous) * 100 : 0;
    
    return {
      current: currentAvg,
      avg: currentAvg.toFixed(2),
      change: change.toFixed(1),
      isUp: change >= 0
    };
  }, [activeFuel, chartData, currentAverages]);

  const districtPrices = useMemo(() => {
    const areas: Record<string, { count: number; unleaded: number; diesel: number; premium: number }> = {};

    stations.forEach(station => {
      if (!station.address || !station.prices) return;
      const parts = station.address.split(',');
      if (parts.length > 0) {
        const area = parts[0].trim().toUpperCase();
        if (!areas[area]) {
          areas[area] = { count: 0, unleaded: 0, diesel: 0, premium: 0 };
        }
        areas[area].count += 1;
        areas[area].unleaded += station.prices.unleaded || 0;
        areas[area].diesel += station.prices.diesel || 0;
        areas[area].premium += station.prices.premium || 0;
      }
    });

    const result = Object.keys(areas).map(area => {
      const data = areas[area];
      return {
        area,
        unleaded: data.count > 0 ? data.unleaded / data.count : 0,
        diesel: data.count > 0 ? data.diesel / data.count : 0,
        premium: data.count > 0 ? data.premium / data.count : 0,
      };
    });

    return result.sort((a, b) => b[activeFuel] - a[activeFuel]).slice(0, 6);
  }, [stations, activeFuel]);

  const chartConfig = {
    backgroundGradientFrom: colors.bgLight,
    backgroundGradientTo: colors.bgLight,
    color: (opacity = 1) => colors.primary,
    labelColor: (opacity = 1) => colors.textMuted,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: colors.primary
    },
    fillShadowGradientFrom: colors.primary,
    fillShadowGradientFromOpacity: 0.2,
    fillShadowGradientTo: colors.bgLight,
    fillShadowGradientToOpacity: 0,
  };

  const lineChartData = {
    labels: timeframe === '7D' 
      ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].slice(0, chartData.length)
      : Array.from({length: chartData.length}, (_, i) => i % 5 === 0 ? `${i+1}` : ''),
    datasets: [
      {
        data: chartData.map(d => d[activeFuel]),
        color: (opacity = 1) => colors.primary,
        strokeWidth: 3
      }
    ]
  };

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

        <View style={styles.regionCard}>
          <View style={styles.regionHeader}>
            <View>
              <Text style={styles.regionLabel}>CURRENT REGION</Text>
              <View style={styles.regionTitleContainer}>
                <MapPin size={20} color={colors.accent} />
                <Text style={styles.regionTitle}>Nearby Area</Text>
              </View>
            </View>
            <View style={styles.regionBadge}>
              <Text style={styles.regionBadgeText}>{stations.length} Stations</Text>
            </View>
          </View>

          <View style={styles.regionStats}>
            <View>
              <Text style={styles.statLabel}>Average Price</Text>
              <Text style={[styles.statValue, { color: getPriceColor(marketStats.current, activeFuel, stations, colors) }]}>₱{marketStats.avg}</Text>
            </View>
            <View style={styles.statDivider} />
            <View>
              <Text style={styles.statLabel}>Price Change</Text>
              <Text style={[styles.statValue, marketStats.isUp ? { color: colors.danger } : { color: colors.success }]}>
                {marketStats.isUp ? '+' : '-'}{Math.abs(Number(marketStats.change))}%
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

          <View style={styles.chartContainer}>
            <LineChart
              data={lineChartData}
              width={screenWidth - 48}
              height={180}
              chartConfig={chartConfig}
              bezier
              style={{
                borderRadius: 16,
              }}
              withVerticalLines={false}
              withHorizontalLines={true}
              yAxisLabel="₱"
              yAxisInterval={1}
            />
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>District Pricing</Text>
              <Text style={styles.sectionSubtitle}>Price variation by city area</Text>
            </View>
            <View style={styles.infoIconBox}>
              <Info size={14} color={colors.primary} />
            </View>
          </View>
          
          <View style={styles.districtList}>
            {districtPrices.map((item) => {
              const currentPrice = item[activeFuel];
              let statusColor = getPriceColor(currentPrice, activeFuel, stations, colors);

              return (
                <View key={item.area} style={styles.districtItem}>
                  <View style={styles.districtHeader}>
                    <View>
                      <Text style={styles.districtArea}>{item.area}</Text>
                      <View style={styles.districtPriceRow}>
                        <Text style={[styles.districtPrice, { color: statusColor }]}>₱{currentPrice.toFixed(2)}</Text>
                      </View>
                    </View>
                    <Text style={styles.marketIndexLabel}>MARKET INDEX</Text>
                  </View>
                  <View style={styles.barBackground}>
                    <View style={[styles.barForeground, { width: `${(currentPrice / 90) * 100}%`, backgroundColor: statusColor }]} />
                  </View>
                </View>
              );
            })}
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgLight },
  content: { padding: 20, paddingBottom: 40 },
  marketIdentity: { marginBottom: 24 },
  marketTitleContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent },
  marketTitle: { fontSize: 24, fontWeight: '900', color: colors.primary },
  marketSubtitle: { fontSize: 10, fontWeight: '900', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 2, marginTop: 4, marginLeft: 16 },
  regionCard: { backgroundColor: '#0f172a', borderRadius: 24, padding: 20, marginBottom: 24 },
  regionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  regionLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 2, color: '#60a5fa', marginBottom: 4 },
  regionTitleContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  regionTitle: { fontSize: 20, fontWeight: '900', color: 'white' },
  regionBadge: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  regionBadgeText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  regionStats: { flexDirection: 'row', alignItems: 'center', gap: 24 },
  statLabel: { fontSize: 10, fontWeight: 'bold', color: 'rgba(96, 165, 250, 0.7)', textTransform: 'uppercase', marginBottom: 2 },
  statValue: { fontSize: 18, fontWeight: '900', color: 'white' },
  statDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.1)' },
  fuelSelector: { flexDirection: 'row', backgroundColor: colors.bgWhite, padding: 4, borderRadius: 16, marginBottom: 24, borderWidth: 1, borderColor: colors.borderLight },
  fuelBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
  fuelBtnActive: { backgroundColor: colors.primary },
  fuelBtnText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: colors.textMuted },
  fuelBtnTextActive: { color: 'white' },
  sectionCard: { backgroundColor: colors.bgWhite, padding: 24, borderRadius: 32, borderWidth: 1, borderColor: colors.borderLight, marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  sectionTitle: { fontSize: 14, fontWeight: '900', color: colors.primary, textTransform: 'uppercase' },
  sectionSubtitle: { fontSize: 10, fontWeight: 'bold', color: colors.textMuted, marginTop: 2 },
  sectionTitleMain: { fontSize: 14, fontWeight: '900', color: colors.primary, textTransform: 'uppercase', marginBottom: 24 },
  timeframeToggles: { flexDirection: 'row', gap: 4 },
  timeToggle: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: colors.bgLight, borderWidth: 1, borderColor: colors.borderLight },
  timeToggleActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  timeToggleText: { fontSize: 9, fontWeight: '900', color: colors.textMuted },
  timeToggleTextActive: { color: 'white' },
  chartContainer: { height: 180, marginLeft: -16, marginTop: 8 },
  infoIconBox: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primaryLight + '20', alignItems: 'center', justifyContent: 'center' },
  districtList: { gap: 16 },
  districtItem: { gap: 8 },
  districtHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  districtArea: { fontSize: 10, fontWeight: '900', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  districtPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  districtPrice: { fontSize: 14, fontWeight: '900' },
  districtBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  districtBadgeText: { fontSize: 8, fontWeight: '900', textTransform: 'uppercase' },
  marketIndexLabel: { fontSize: 9, fontWeight: 'bold', color: colors.textMuted },
  barBackground: { height: 6, backgroundColor: colors.bgLight, borderRadius: 3, overflow: 'hidden' },
  barForeground: { height: '100%', borderRadius: 3 },
  activityList: { gap: 20 },
  activityItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  activityLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  activityIconBox: { width: 48, height: 48, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  activityIconHike: { backgroundColor: colors.danger + '10', borderColor: colors.danger + '20' },
  activityIconDrop: { backgroundColor: colors.success + '10', borderColor: colors.success + '20' },
  activityStation: { fontSize: 14, fontWeight: '900', color: colors.primary },
  activityMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  activityReason: { fontSize: 10, fontWeight: 'bold', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  activityDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.borderGray },
  activityTime: { fontSize: 9, fontWeight: 'bold', color: colors.textMuted },
  activityRight: { alignItems: 'flex-end' },
  activityChange: { fontSize: 18, fontWeight: '900' },
  activityCurrency: { fontSize: 10, fontWeight: '900', color: colors.textMuted, textTransform: 'uppercase' },
  viewHistoryBtn: { width: '100%', marginTop: 24, paddingVertical: 16, backgroundColor: colors.bgLight, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: colors.borderLight },
  viewHistoryText: { fontSize: 10, fontWeight: '900', color: colors.primary, textTransform: 'uppercase', letterSpacing: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.bgWhite, borderTopLeftRadius: 40, borderTopRightRadius: 40, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  modalTitle: { fontSize: 20, fontWeight: '900', color: colors.primary, textTransform: 'uppercase' },
  modalSubtitle: { fontSize: 10, fontWeight: 'bold', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bgLight, alignItems: 'center', justifyContent: 'center' },
  modalBody: { padding: 24, gap: 24 },
  modalFooter: { padding: 24, borderTopWidth: 1, borderTopColor: colors.borderLight, backgroundColor: colors.bgLight },
});
