import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Bookmark, MapPin } from 'lucide-react-native';
import { formatCurrency, getPriceColor } from '../utils/formatters';
import { getDistanceLabel } from '../utils/geo';
import { useAppTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useFuelData } from '../context/FuelContext';

interface StationCardProps {
  station: any;
  fuelType: string;
  userLocation?: [number, number];
}

export default function StationCard({ station, fuelType, userLocation = [14.5995, 120.9842] }: StationCardProps) {
  const price = station.prices[fuelType.toLowerCase()] || station.prices.unleaded || 0;
  const { colors } = useAppTheme();
  const { profile, toggleBookmark } = useAuth();
  const { stations } = useFuelData();
  
  const priceColor = getPriceColor(price, fuelType, stations, colors);
  
  const isBookmarked = profile?.bookmarks?.includes(station.id);
  const styles = useMemo(() => getStyles(colors), [colors]);

  return (
    <View style={styles.card}>
      <View style={styles.leftSection}>
        <View style={styles.brandRow}>
          {station.logo ? (
            <Image source={station.logo} style={styles.brandLogo} resizeMode="contain" />
          ) : null}
          <Text style={styles.brandName}>{station.brand}</Text>
        </View>
        <View style={styles.metaRow}>
          <View style={styles.distanceContainer}>
            <MapPin size={12} color={colors.accent} />
            <Text style={styles.metaText}>{getDistanceLabel(station, userLocation)}</Text>
          </View>
          {station.verificationCount > 0 && (
            <View style={styles.verifiedContainer}>
              <View style={styles.verifiedDot} />
              <Text style={styles.verifiedText}>{station.verificationCount} Verified</Text>
            </View>
          )}
        </View>
        <Text style={styles.addressText} numberOfLines={1}>{station.address}</Text>
      </View>

      <View style={styles.rightSection}>
        <View style={styles.priceContainer}>
          <Text style={[styles.priceValue, { color: priceColor }]}>{formatCurrency(price)}</Text>
          <Text style={styles.priceUnit}>PHP / L</Text>
        </View>
        <TouchableOpacity style={styles.bookmarkButton} onPress={() => toggleBookmark(station.id)}>
          <Bookmark size={20} color={isBookmarked ? colors.accent : colors.textMuted} fill={isBookmarked ? colors.accent : "transparent"} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  card: {
    backgroundColor: colors.bgWhite,
    padding: 16,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  leftSection: {
    flex: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  brandLogo: {
    width: 32,
    height: 32,
  },
  brandName: {
    fontWeight: 'bold',
    color: colors.primary,
    fontSize: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },
  verifiedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.success,
  },
  verifiedText: {
    color: colors.success,
    fontSize: 11,
    fontWeight: '500',
  },
  addressText: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingLeft: 16,
    borderLeftWidth: 1,
    borderLeftColor: colors.bgLight,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceValue: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.primary,
    lineHeight: 20,
  },
  priceUnit: {
    fontSize: 8,
    color: colors.textMuted,
    fontWeight: 'bold',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  bookmarkButton: {
    padding: 4,
  },
});
