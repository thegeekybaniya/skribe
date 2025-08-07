/**
 * @fileoverview Icon atom component for SVG icons with size variants
 * 
 * This component provides a reusable icon system using SVG icons with
 * different size variants and color options. It ensures consistent
 * icon usage across the app with proper accessibility features.
 * 
 * Requirements covered: 6.6 (atomic design), 8.1, 8.2 (accessibility)
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Path, Circle, Line, Rect, SvgProps } from 'react-native-svg';

// Define the different icon sizes available
export type IconSize = 'small' | 'medium' | 'large' | 'xlarge';

// Define color variants for icons
export type IconColor = 
  | 'primary'   // Main icon color (black)
  | 'secondary' // Secondary icon color (gray)
  | 'accent'    // Accent color (blue)
  | 'error'     // Error color (red)
  | 'success'   // Success color (green)
  | 'white';    // White icon

// Define available icon names - these would be expanded as needed
export type IconName = 
  | 'home'
  | 'users'
  | 'edit'
  | 'message'
  | 'timer'
  | 'trophy'
  | 'settings'
  | 'close'
  | 'check'
  | 'arrow-left'
  | 'arrow-right';

// Props interface for the Icon component
export interface IconProps {
  /** Name of the icon to display */
  name: IconName;
  /** Size variant of the icon */
  size?: IconSize;
  /** Color variant of the icon */
  color?: IconColor;
  /** Custom styles for the icon container */
  style?: ViewStyle;
  /** Accessibility label for screen readers */
  accessibilityLabel?: string;
}

/**
 * Icon component - An SVG icon with consistent sizing and coloring
 * 
 * This is an atom component that provides consistent icon styling
 * across the app. It supports different sizes and colors, and includes
 * proper accessibility features for screen readers.
 * 
 * @param props - Icon configuration and styling options
 * @returns JSX element representing an SVG icon
 */
export const Icon: React.FC<IconProps> = ({
  name,
  size = 'medium',
  color = 'primary',
  style,
  accessibilityLabel,
}) => {
  // Get the numeric size value based on the size variant
  const iconSize = sizes[size];
  
  // Get the color value based on the color variant
  const iconColor = colors[color];
  
  // Get the SVG content for the specified icon
  const IconSvg = iconComponents[name];
  
  if (!IconSvg) {
    // If icon doesn't exist, show a placeholder
    console.warn(`Icon "${name}" not found`);
    return (
      <View 
        style={[
          styles.container,
          { width: iconSize, height: iconSize },
          style,
        ]}
        accessible={true}
        accessibilityRole="image"
        accessibilityLabel={accessibilityLabel || `${name} icon`}
      >
        <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24">
          <Rect
            x="2"
            y="2"
            width="20"
            height="20"
            stroke={iconColor}
            strokeWidth="2"
            fill="none"
          />
        </Svg>
      </View>
    );
  }

  return (
    <View 
      style={[
        styles.container,
        { width: iconSize, height: iconSize },
        style,
      ]}
      accessible={true}
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel || `${name} icon`}
    >
      <IconSvg 
        width={iconSize} 
        height={iconSize} 
        color={iconColor}
      />
    </View>
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

// Size variants following design system principles
const sizes = {
  small: 16,
  medium: 24,
  large: 32,
  xlarge: 48,
};

// Individual icon components using SVG paths
// These are simplified versions - in a real app, you'd use a proper icon library

const HomeIcon: React.FC<{ width: number; height: number; color: string }> = ({ width, height, color }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24">
    <Path
      d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
      stroke={color}
      strokeWidth="2"
      fill="none"
    />
    <Path
      d="M9 22V12h6v10"
      stroke={color}
      strokeWidth="2"
      fill="none"
    />
  </Svg>
);

const UsersIcon: React.FC<{ width: number; height: number; color: string }> = ({ width, height, color }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24">
    <Path
      d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
      stroke={color}
      strokeWidth="2"
      fill="none"
    />
    <Circle
      cx="9"
      cy="7"
      r="4"
      stroke={color}
      strokeWidth="2"
      fill="none"
    />
    <Path
      d="M23 21v-2a4 4 0 0 0-3-3.87"
      stroke={color}
      strokeWidth="2"
      fill="none"
    />
    <Path
      d="M16 3.13a4 4 0 0 1 0 7.75"
      stroke={color}
      strokeWidth="2"
      fill="none"
    />
  </Svg>
);

const EditIcon: React.FC<{ width: number; height: number; color: string }> = ({ width, height, color }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24">
    <Path
      d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
      stroke={color}
      strokeWidth="2"
      fill="none"
    />
    <Path
      d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
      stroke={color}
      strokeWidth="2"
      fill="none"
    />
  </Svg>
);

const MessageIcon: React.FC<{ width: number; height: number; color: string }> = ({ width, height, color }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24">
    <Path
      d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
      stroke={color}
      strokeWidth="2"
      fill="none"
    />
  </Svg>
);

const TimerIcon: React.FC<{ width: number; height: number; color: string }> = ({ width, height, color }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24">
    <Circle
      cx="12"
      cy="12"
      r="10"
      stroke={color}
      strokeWidth="2"
      fill="none"
    />
    <Path
      d="M12 6v6l4 2"
      stroke={color}
      strokeWidth="2"
      fill="none"
    />
  </Svg>
);

const TrophyIcon: React.FC<{ width: number; height: number; color: string }> = ({ width, height, color }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24">
    <Path
      d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"
      stroke={color}
      strokeWidth="2"
      fill="none"
    />
    <Path
      d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"
      stroke={color}
      strokeWidth="2"
      fill="none"
    />
    <Path
      d="M18 20H6"
      stroke={color}
      strokeWidth="2"
      fill="none"
    />
    <Path
      d="M6 9a6 6 0 0 0 12 0"
      stroke={color}
      strokeWidth="2"
      fill="none"
    />
  </Svg>
);

const SettingsIcon: React.FC<{ width: number; height: number; color: string }> = ({ width, height, color }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24">
    <Circle
      cx="12"
      cy="12"
      r="3"
      stroke={color}
      strokeWidth="2"
      fill="none"
    />
    <Path
      d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
      stroke={color}
      strokeWidth="2"
      fill="none"
    />
  </Svg>
);

const CloseIcon: React.FC<{ width: number; height: number; color: string }> = ({ width, height, color }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24">
    <Line
      x1="18"
      y1="6"
      x2="6"
      y2="18"
      stroke={color}
      strokeWidth="2"
    />
    <Line
      x1="6"
      y1="6"
      x2="18"
      y2="18"
      stroke={color}
      strokeWidth="2"
    />
  </Svg>
);

const CheckIcon: React.FC<{ width: number; height: number; color: string }> = ({ width, height, color }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24">
    <Path
      d="M20 6L9 17l-5-5"
      stroke={color}
      strokeWidth="2"
      fill="none"
    />
  </Svg>
);

const ArrowLeftIcon: React.FC<{ width: number; height: number; color: string }> = ({ width, height, color }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24">
    <Line
      x1="19"
      y1="12"
      x2="5"
      y2="12"
      stroke={color}
      strokeWidth="2"
    />
    <Path
      d="M12 19l-7-7 7-7"
      stroke={color}
      strokeWidth="2"
      fill="none"
    />
  </Svg>
);

const ArrowRightIcon: React.FC<{ width: number; height: number; color: string }> = ({ width, height, color }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24">
    <Line
      x1="5"
      y1="12"
      x2="19"
      y2="12"
      stroke={color}
      strokeWidth="2"
    />
    <Path
      d="M12 5l7 7-7 7"
      stroke={color}
      strokeWidth="2"
      fill="none"
    />
  </Svg>
);

// Map of icon names to their components
const iconComponents = {
  home: HomeIcon,
  users: UsersIcon,
  edit: EditIcon,
  message: MessageIcon,
  timer: TimerIcon,
  trophy: TrophyIcon,
  settings: SettingsIcon,
  close: CloseIcon,
  check: CheckIcon,
  'arrow-left': ArrowLeftIcon,
  'arrow-right': ArrowRightIcon,
};

// Styles for the icon component
const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});