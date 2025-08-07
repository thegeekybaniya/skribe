/**
 * @fileoverview Button atom component with variants and accessibility support
 * 
 * This component provides a reusable button with different visual variants
 * (primary, secondary, disabled) and proper accessibility features.
 * It follows atomic design principles as the most basic interactive element.
 * 
 * Requirements covered: 6.6 (atomic design), 8.1, 8.2 (accessibility)
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from 'react-native';

// Define the different visual variants the button can have
export type ButtonVariant = 'primary' | 'secondary' | 'disabled';

// Props interface extending TouchableOpacity props for full customization
export interface ButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  /** The text to display inside the button */
  title: string;
  /** Visual variant of the button - affects colors and styling */
  variant?: ButtonVariant;
  /** Custom styles for the button container */
  style?: ViewStyle;
  /** Custom styles for the button text */
  textStyle?: TextStyle;
  /** Function called when button is pressed */
  onPress?: () => void;
}

/**
 * Button component - A basic interactive element that users can tap
 * 
 * This is an atom component (cannot be broken down further) that provides
 * consistent button styling across the app. It supports different variants
 * for different use cases and includes proper accessibility features.
 * 
 * @param props - Button configuration and event handlers
 * @returns JSX element representing a styled button
 */
export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  style,
  textStyle,
  onPress,
  disabled,
  ...otherProps
}) => {
  // Determine if button should be disabled (either explicitly or via variant)
  const isDisabled = disabled || variant === 'disabled';
  
  // Get the appropriate styles based on the variant
  const buttonStyle = [
    styles.base,
    styles[variant],
    isDisabled && styles.disabled,
    style,
  ];
  
  const buttonTextStyle = [
    styles.baseText,
    styles[`${variant}Text`],
    isDisabled && styles.disabledText,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={isDisabled}
      // Accessibility features for screen readers
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={isDisabled ? 'Button is disabled' : 'Tap to activate'}
      {...otherProps}
    >
      <Text style={buttonTextStyle}>{title}</Text>
    </TouchableOpacity>
  );
};

// Design system colors - these would typically come from a theme file
const colors = {
  primary: '#007AFF',
  primaryDark: '#0056CC',
  secondary: '#8E8E93',
  secondaryDark: '#6D6D70',
  disabled: '#C7C7CC',
  white: '#FFFFFF',
  black: '#000000',
  gray: '#8E8E93',
};

// Styles for the button component following the design system
const styles = StyleSheet.create({
  // Base styles applied to all button variants
  base: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44, // Minimum touch target size for accessibility
    minWidth: 44,
  },
  
  // Primary button - main call-to-action style
  primary: {
    backgroundColor: colors.primary,
  },
  
  // Secondary button - less prominent actions
  secondary: {
    backgroundColor: colors.secondary,
  },
  
  // Disabled state - non-interactive appearance
  disabled: {
    backgroundColor: colors.disabled,
  },
  
  // Base text styles for all variants
  baseText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  
  // Primary button text - white text on colored background
  primaryText: {
    color: colors.white,
  },
  
  // Secondary button text - white text on gray background
  secondaryText: {
    color: colors.white,
  },
  
  // Disabled button text - gray text for disabled state
  disabledText: {
    color: colors.gray,
  },
});