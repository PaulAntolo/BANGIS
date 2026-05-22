import { Image, ImageSourcePropType, Platform } from 'react-native';

/** Local assets in assets/logo — keyed by normalized brand slug */
const BRAND_LOGO_ASSETS: Record<string, ImageSourcePropType> = {
  shell: require('../../assets/logo/shell.jpg'),
  petron: require('../../assets/logo/petron.png'),
  caltex: require('../../assets/logo/caltex.png'),
  phoenix: require('../../assets/logo/phoenix.png'),
  seaoil: require('../../assets/logo/seaoil.jpg'),
  unioil: require('../../assets/logo/unioil.png'),
  jetti: require('../../assets/logo/jetti.png'),
  flyingv: require('../../assets/logo/flying v.png'),
  cleanfuel: require('../../assets/logo/cleanfuel.jpg'),
  total: require('../../assets/logo/total.png'),
  ptt: require('../../assets/logo/ptt station.png'),
  nitrofuel: require('../../assets/logo/nitrofuel.png'),
};

const BRAND_ALIASES: Record<string, string> = {
  'flying v': 'flyingv',
  'flying-v': 'flyingv',
  'ptt station': 'ptt',
  'ptt ': 'ptt',
};

export function normalizeBrandKey(brand: string): string {
  const lower = brand.trim().toLowerCase();
  if (BRAND_ALIASES[lower]) return BRAND_ALIASES[lower];
  return lower.replace(/[^a-z0-9]/g, '');
}

export function getBrandLogo(brand: string): ImageSourcePropType | null {
  const key = normalizeBrandKey(brand);
  return BRAND_LOGO_ASSETS[key] ?? null;
}

export function getBrandLogoUri(brand: string): string | undefined {
  const asset = getBrandLogo(brand);
  if (!asset) return undefined;
  
  if (Platform.OS === 'web') {
    return typeof asset === 'string' ? asset : (asset as any)?.uri;
  }
  
  return Image.resolveAssetSource?.(asset)?.uri;
}

export function withStationLogo<T extends { brand: string }>(station: T): T & { logo: ImageSourcePropType | null; logoUri?: string } {
  const logo = getBrandLogo(station.brand);
  let logoUri: string | undefined;
  
  if (logo) {
    if (Platform.OS === 'web') {
      logoUri = typeof logo === 'string' ? logo : (logo as any)?.uri;
    } else {
      logoUri = Image.resolveAssetSource?.(logo)?.uri;
    }
  }
  
  return { ...station, logo, logoUri };
}
