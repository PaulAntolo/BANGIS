export const lightColors = {
  primary: '#0066ff',
  primaryLight: '#3385ff',
  primaryDark: '#004cbf',
  secondary: '#1c1c1c',
  accent: '#ffb200', // Swapped accent to yellow to complement the blue
  success: '#00cc66',
  danger: '#ff3333',
  warning: '#ffcc00',
  textPrimary: '#111827',
  textSecondary: '#4b5563',
  textMuted: '#9ca3af',
  bgLight: '#f9fafb',
  bgWhite: '#ffffff',
  borderLight: '#f3f4f6',
  borderGray: '#e5e7eb',
};

export const darkColors = {
  primary: '#3b82f6',
  primaryLight: '#60a5fa',
  primaryDark: '#2563eb',
  secondary: '#f9fafb',
  accent: '#ffb200',
  success: '#00cc66',
  danger: '#ff4444',
  warning: '#ffcc00',
  textPrimary: '#f9fafb',
  textSecondary: '#d1d5db',
  textMuted: '#6b7280',
  bgLight: '#111827',
  bgWhite: '#1f2937',
  borderLight: '#374151',
  borderGray: '#4b5563',
};

// Fallback for statically styled components until they are migrated
export const theme = {
  colors: lightColors,
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 24,
    full: 9999,
  },
  typography: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    h1: 24,
    h2: 20,
    h3: 18,
    fontFamily: {
      regular: 'System',
      bold: 'System',
      black: 'System',
    },
  },
};
