/**
 * @fileoverview Text atom component with typography variants and theming
 * 
 * This component provides consistent typography across the app with different
 * size variants, colors, and styling options. It ensures text accessibility
 * and maintains design system consistency.
 * 
 * Requirements covered: 6.6 (atomic design), 8.1, 8.2 (accessibility)
 */

import React from 'react';
import {
  Text as RNText,
  StyleSheet,
  TextStyle,
  TextProps as RNTextProps,
} from 'react-native';

// Define the different typography variants available
export type TextVariant = 
  | 'h1'      // Large heading
  | 'h2'      // Medium heading  
  | 'h3'      // Small heading
  | 'body'    // Regular body text
  | 'caption' // Small caption text
  | 'button'; // Button text styling

// Define color variants for text
export type TextColor = 
  | 'primary'   // Main text color (black)
  | 'secondary' // Secondary text color (gray)
  | 'accent'    // Accent color (blue)
  | 'error'     // Error color (red)
  | 'success'   // Success color (green)
  | 'white';    // White text

// Props interface extending React Native Text props
export interface TextProps extends RNTextProps {
  /** The text content to display */
  children: React.ReactNode;
  /** Typography variant that determines size and weight */
  variant?: TextVariant;
  /** Color variant for the text */
  color?: TextColor;
  /** Whether the text should be centered */
  center?: boolean;
  /** Whether the text should be bold */
  bold?: boolean;
  /** Whether the text should be italic */
  italic?: boolean;
  /** Custom text styles */
  style?: TextStyle;
}

/**
 * Text component - A typography element with consistent styling
 * 
 * This is an atom component that provides consistent text styling
 * across the app. It supports different typography variants, colors,
 * and includes proper accessibility features for screen readers.
 * 
 * @param props - Text configuration and styling options
 * @returns JSX element representing styled text
 */
export const Text: React.FC<TextProps> = ({
  children,
  variant = 'body',
  color = 'primary',
  center = false,
  bold = false,
  italic = false,
  style,
  ...otherProps
}) => {
  // Combine all the styles based on props
  const textStyle = [
    styles.base,
    styles[variant],
    styles[`${color}Color`],
    center && styles.center,
    bold && styles.bold,
    italic && styles.italic,
    style,
  ];

  return (
    <RNText
      style={textStyle}
      // Accessibility features for screen readers
      accessible={true}
      accessibilityRole="text"
      {...otherProps}
    >
      {children}
    </RNText>
  );
};

// Design system colors - these would typically come from a theme file
const colors = {
  primary: '#000000',
  secondary: '#8E8E93',
  accent: '#007AFF',
  error: '#FF3B30',
  success: '#34C759',
  white: '#FFFFFF',
};

// Typography scale following design system principles
const typography = {
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40,
  },
  h2: {
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
};

// Styles for the text component following the design system
const styles = StyleSheet.create({
  // Base styles applied to all text variants
  base: {
    color: colors.primary,
  },
  
  // Typography variant styles
  h1: {
    fontSize: typography.h1.fontSize,
    fontWeight: typography.h1.fontWeight,
    lineHeight: typography.h1.lineHeight,
  },
  
  h2: {
    fontSize: typography.h2.fontSize,
    fontWeight: typography.h2.fontWeight,
    lineHeight: typography.h2.lineHeight,
  },
  
  h3: {
    fontSize: typography.h3.fontSize,
    fontWeight: typography.h3.fontWeight,
    lineHeight: typography.h3.lineHeight,
  },
  
  body: {
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight,
    lineHeight: typography.body.lineHeight,
  },
  
  caption: {
    fontSize: typography.caption.fontSize,
    fontWeight: typography.caption.fontWeight,
    lineHeight: typography.caption.lineHeight,
  },
  
  button: {
    fontSize: typography.button.fontSize,
    fontWeight: typography.button.fontWeight,
    lineHeight: typography.button.lineHeight,
  },
  
  // Color variant styles
  primaryColor: {
    color: colors.primary,
  },
  
  secondaryColor: {
    color: colors.secondary,
  },
  
  accentColor: {
    color: colors.accent,
  },
  
  errorColor: {
    color: colors.error,
  },
  
  successColor: {
    color: colors.success,
  },
  
  whiteColor: {
    color: colors.white,
  },
  
  // Text alignment and styling modifiers
  center: {
    textAlign: 'center',
  },
  
  bold: {
    fontWeight: '700',
  },
  
  italic: {
    fontStyle: 'italic',
  },
});