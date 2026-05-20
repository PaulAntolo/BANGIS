import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ViewStyle, TextInputProps } from 'react-native';
import { theme } from '../constants/theme';

interface InputFieldProps extends TextInputProps {
  label: string;
  icon?: React.ReactNode;
  error?: string;
  containerStyle?: ViewStyle;
}

export default function InputField({ 
  label, 
  icon, 
  error, 
  multiline, 
  containerStyle,
  ...props 
}: InputFieldProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      
      <View style={[
        styles.inputContainer,
        isFocused && styles.inputFocused,
        error ? styles.inputError : null,
      ]}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        
        <TextInput
          style={[
            styles.input,
            multiline && styles.multilineInput,
            icon ? { paddingLeft: 8 } : { paddingLeft: 12 }
          ]}
          multiline={multiline}
          placeholderTextColor={theme.colors.textMuted}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />
      </View>
      
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 6,
  },
  label: {
    fontSize: 10,
    fontWeight: 'bold',
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.bgWhite,
    borderWidth: 1,
    borderColor: theme.colors.borderGray,
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
  },
  inputFocused: {
    borderColor: theme.colors.primaryLight,
  },
  inputError: {
    borderColor: theme.colors.danger,
  },
  iconContainer: {
    paddingLeft: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingRight: 12,
    fontSize: theme.typography.sm,
    color: theme.colors.textPrimary,
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: 10,
    color: theme.colors.danger,
    fontWeight: '500',
    marginLeft: 4,
  },
});
