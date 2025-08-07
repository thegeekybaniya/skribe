/**
 * @fileoverview Timer atom component for countdown display with formatting
 * 
 * This component provides a countdown timer display with proper formatting
 * and visual feedback. It's designed to show game round timers with
 * different visual states based on remaining time.
 * 
 * Requirements covered: 6.6 (atomic design), 8.1, 8.2 (accessibility)
 */

import React from 'react';
import { View, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Text } from './Text';

// Define the different visual states the timer can have
export type TimerState = 'normal' | 'warning' | 'critical' | 'expired';

// Props interface for the Timer component
export interface TimerProps {
  /** Number of seconds remaining */
  seconds: number;
  /** Whether to show minutes and seconds (MM:SS) or just seconds */
  showMinutes?: boolean;
  /** Custom styles for the timer container */
  containerStyle?: ViewStyle;
  /** Custom styles for the timer text */
  textStyle?: TextStyle;
  /** Function called when timer reaches zero */
  onExpire?: () => void;
  /** Whether the timer is currently active/running */
  isActive?: boolean;
}

/**
 * Timer component - A countdown display with visual feedback
 * 
 * This is an atom component that displays time remaining in a countdown
 * format. It provides visual feedback based on how much time is left
 * and includes proper accessibility features for screen readers.
 * 
 * @param props - Timer configuration and styling options
 * @returns JSX element representing a countdown timer
 */
export const Timer: React.FC<TimerProps> = ({
  seconds,
  showMinutes = true,
  containerStyle,
  textStyle,
  onExpire,
  isActive = true,
}) => {
  // Determine the timer state based on remaining seconds
  const getTimerState = (): TimerState => {
    if (seconds <= 0) return 'expired';
    if (seconds <= 10) return 'critical';
    if (seconds <= 30) return 'warning';
    return 'normal';
  };

  const timerState = getTimerState();

  // Format the time display based on showMinutes prop
  const formatTime = (): string => {
    if (seconds <= 0) return showMinutes ? '00:00' : '0';
    
    if (showMinutes) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    } else {
      return seconds.toString();
    }
  };

  // Get accessibility description for screen readers
  const getAccessibilityLabel = (): string => {
    if (seconds <= 0) return 'Timer expired';
    
    if (showMinutes) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      
      if (minutes > 0) {
        return `${minutes} minute${minutes !== 1 ? 's' : ''} and ${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''} remaining`;
      } else {
        return `${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''} remaining`;
      }
    } else {
      return `${seconds} second${seconds !== 1 ? 's' : ''} remaining`;
    }
  };

  // Get the appropriate styles based on timer state
  const containerStyles = [
    styles.container,
    styles[`${timerState}Container`],
    !isActive ? styles.inactiveContainer : undefined,
    containerStyle,
  ].filter(Boolean) as ViewStyle[];

  const textStyles = [
    styles.text,
    styles[`${timerState}Text`],
    !isActive ? styles.inactiveText : undefined,
    textStyle,
  ].filter(Boolean) as TextStyle[];

  // Call onExpire callback when timer reaches zero
  React.useEffect(() => {
    if (seconds <= 0 && onExpire) {
      onExpire();
    }
  }, [seconds, onExpire]);

  return (
    <View 
      style={containerStyles}
      accessible={true}
      accessibilityRole="timer"
      accessibilityLabel={getAccessibilityLabel()}
      accessibilityLiveRegion="polite" // Announces changes to screen readers
    >
      <Text
        variant="h2"
        style={StyleSheet.flatten(textStyles)}
        accessibilityLabel={getAccessibilityLabel()}
      >
        {formatTime()}
      </Text>
    </View>
  );
};

// Design system colors - these would typically come from a theme file
const colors = {
  normal: '#007AFF',
  warning: '#FF9500',
  critical: '#FF3B30',
  expired: '#8E8E93',
  background: '#F2F2F7',
  backgroundWarning: '#FFF3E0',
  backgroundCritical: '#FFEBEE',
  backgroundExpired: '#F5F5F5',
  text: '#000000',
  textWarning: '#E65100',
  textCritical: '#C62828',
  textExpired: '#8E8E93',
  inactive: '#C7C7CC',
};

// Styles for the timer component following the design system
const styles = StyleSheet.create({
  // Base container styles
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
    minHeight: 44, // Minimum touch target size for accessibility
  },
  
  // Base text styles
  text: {
    fontFamily: 'monospace', // Use monospace for consistent digit width
    fontWeight: '600',
  },
  
  // Normal state - plenty of time remaining
  normalContainer: {
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.normal,
  },
  
  normalText: {
    color: colors.normal,
  },
  
  // Warning state - time is running low
  warningContainer: {
    backgroundColor: colors.backgroundWarning,
    borderWidth: 2,
    borderColor: colors.warning,
  },
  
  warningText: {
    color: colors.textWarning,
  },
  
  // Critical state - very little time left
  criticalContainer: {
    backgroundColor: colors.backgroundCritical,
    borderWidth: 2,
    borderColor: colors.critical,
  },
  
  criticalText: {
    color: colors.textCritical,
  },
  
  // Expired state - time is up
  expiredContainer: {
    backgroundColor: colors.backgroundExpired,
    borderWidth: 2,
    borderColor: colors.expired,
  },
  
  expiredText: {
    color: colors.textExpired,
  },
  
  // Inactive state - timer is paused or stopped
  inactiveContainer: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.inactive,
    opacity: 0.6,
  },
  
  inactiveText: {
    color: colors.inactive,
  },
});