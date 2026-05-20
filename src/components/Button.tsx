import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { theme } from '../constants/theme';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'accent' | 'danger';
  fullWidth?: boolean;
  isLoading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  children?: React.ReactNode;
  disabled?: boolean;
  onPress?: () => void;
}

export default function Button({
  variant = 'primary',
  fullWidth = false,
  isLoading = false,
  style,
  textStyle,
  children,
  disabled,
  onPress,
}: ButtonProps) {
  
  const getContainerStyle = (): ViewStyle => {
    switch (variant) {
      case 'primary':
        return { backgroundColor: theme.colors.primary };
      case 'secondary':
        return { backgroundColor: theme.colors.bgWhite, borderWidth: 1, borderColor: theme.colors.primary };
      case 'accent':
        return { backgroundColor: theme.colors.accent };
      case 'danger':
        return { backgroundColor: 'transparent' }; // Danger uses text color usually
      default:
        return { backgroundColor: theme.colors.primary };
    }
  };

  const getTextStyle = (): TextStyle => {
    switch (variant) {
      case 'primary':
      case 'accent':
        return { color: theme.colors.bgWhite };
      case 'secondary':
        return { color: theme.colors.primary };
      case 'danger':
        return { color: theme.colors.danger };
      default:
        return { color: theme.colors.bgWhite };
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        getContainerStyle(),
        fullWidth && styles.fullWidth,
        (disabled || isLoading) && styles.disabled,
        style,
      ]}
      disabled={disabled || isLoading}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'secondary' || variant === 'danger' ? theme.colors.primary : theme.colors.bgWhite} />
      ) : (
        <Text style={[styles.text, getTextStyle(), textStyle]}>
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.7,
  },
  text: {
    fontSize: theme.typography.md,
    fontWeight: 'bold',
  },
});
