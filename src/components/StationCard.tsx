import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Bookmark, MapPin } from 'lucide-react-native';
import { formatCurrency } from '../utils/formatters';
import { getDistanceLabel } from '../utils/geo';
import { theme } from '../constants/theme';

interface StationCardProps {
  station: any;
  fuelType: string;
  userLocation?: [number, number];
}

export default function StationCard({ station, fuelType, userLocation = [10.6667, 122.9500] }: StationCardProps) {
  const price = station.prices[fuelType.toLowerCase()] || station.prices.unleaded;

  return (
    <View style={styles.card}>
      <View style={styles.leftSection}>
        <View style={styles.brandRow}>
          <Text style={styles.brandName}>{station.brand}</Text>
        </View>
        <View style={styles.metaRow}>
          <View style={styles.distanceContainer}>
            <MapPin size={12} color={theme.colors.accent} />
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
          <Text style={styles.priceValue}>{formatCurrency(price)}</Text>
          <Text style={styles.priceUnit}>PHP / L</Text>
        </View>
        <TouchableOpacity style={styles.bookmarkButton}>
          <Bookmark size={20} color={theme.colors.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.bgWhite,
    padding: 16,
    borderRadius: theme.borderRadius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    // Note: react-native shadows
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
  brandName: {
    fontWeight: 'bold',
    color: theme.colors.primary,
    fontSize: theme.typography.md,
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
    color: theme.colors.textMuted,
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
    backgroundColor: theme.colors.success,
  },
  verifiedText: {
    color: theme.colors.success,
    fontSize: 11,
    fontWeight: '500',
  },
  addressText: {
    fontSize: 10,
    color: theme.colors.textMuted,
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
    borderLeftColor: theme.colors.bgLight,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceValue: {
    fontSize: 20,
    fontWeight: '900',
    color: theme.colors.primary,
    lineHeight: 20,
  },
  priceUnit: {
    fontSize: 8,
    color: theme.colors.textMuted,
    fontWeight: 'bold',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  bookmarkButton: {
    padding: 4,
  },
});
