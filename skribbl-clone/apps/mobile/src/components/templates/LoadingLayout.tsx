/**
 * @fileoverview Loading layout template for loading states and connection status
 * Provides consistent loading UI across the app with connection status indicators
 * Requirements: 6.6, 8.1, 8.2 - Template components with atomic design and responsive layout
 */

import React from 'react';
import { View, StyleSheet, Dimensions, ActivityIndicator, Animated } from 'react-native';
import { observer } from 'mobx-react-lite';

// Import atoms for basic UI elements
import { Button, Text, Icon } from '../atoms';

// Import store context for connection status
import { useRootStore } from '../../contexts/StoreContext';

/**
 * Props interface for LoadingLayout component
 * Defines the configuration options for different loading states
 */
interface LoadingLayoutProps {
  /** Type of loading state to display */
  type: 'connecting' | 'joining' | 'starting' | 'reconnecting' | 'error';
  /** Main loading message to display */
  message?: string;
  /** Secondary message or details */
  subtitle?: string;
  /** Whether to show a retry button */
  showRetry?: boolean;
  /** Callback when retry button is pressed */
  onRetry?: () => void;
  /** Whether to show a cancel button */
  showCancel?: boolean;
  /** Callback when cancel button is pressed */
  onCancel?: () => void;
  /** Custom error message for error state */
  errorMessage?: string;
  /** Whether the loading is in progress */
  isLoading?: boolean;
  /** Custom styles to apply to the layout container */
  containerStyle?: any;
}

/**
 * LoadingLayout template component
 * 
 * This template provides consistent loading states throughout the app:
 * - 'connecting': Initial connection to server
 * - 'joining': Joining a game room
 * - 'starting': Game is starting
 * - 'reconnecting': Attempting to reconnect after disconnection
 * - 'error': Error state with retry options
 * 
 * Features:
 * - Animated loading indicators
 * - Connection status display
 * - Retry and cancel functionality
 * - Responsive design for different screen sizes
 * - Accessibility support with proper labels
 */
export const LoadingLayout: React.FC<LoadingLayoutProps> = observer(({
  type,
  message,
  subtitle,
  showRetry = false,
  onRetry,
  showCancel = false,
  onCancel,
  errorMessage,
  isLoading = true,
  containerStyle,
}) => {
  // Get stores from context for connection status
  const rootStore = useRootStore();
  const { playerStore } = rootStore;

  // Animation values for loading indicators
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  // Get screen dimensions for responsive layout
  const { width } = Dimensions.get('window');
  const isTablet = width > 768;

  // Start animations when component mounts
  React.useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Pulse animation for loading states
    if (isLoading && type !== 'error') {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.7,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();

      return () => pulseAnimation.stop();
    }
  }, [fadeAnim, pulseAnim, isLoading, type]);

  /**
   * Get the appropriate icon and color for the loading type
   */
  const getLoadingConfig = () => {
    switch (type) {
      case 'connecting':
        return {
          icon: 'wifi',
          color: '#4A90E2',
          defaultMessage: 'Connecting to server...',
          defaultSubtitle: 'Please wait while we establish connection',
        };
      case 'joining':
        return {
          icon: 'users',
          color: '#4CAF50',
          defaultMessage: 'Joining room...',
          defaultSubtitle: 'Getting room information',
        };
      case 'starting':
        return {
          icon: 'play',
          color: '#FF9800',
          defaultMessage: 'Starting game...',
          defaultSubtitle: 'Preparing the game for all players',
        };
      case 'reconnecting':
        return {
          icon: 'refresh',
          color: '#FF9800',
          defaultMessage: 'Reconnecting...',
          defaultSubtitle: 'Attempting to restore connection',
        };
      case 'error':
        return {
          icon: 'alert-circle',
          color: '#F44336',
          defaultMessage: 'Connection Error',
          defaultSubtitle: errorMessage || 'Something went wrong. Please try again.',
        };
      default:
        return {
          icon: 'loader',
          color: '#4A90E2',
          defaultMessage: 'Loading...',
          defaultSubtitle: 'Please wait',
        };
    }
  };

  const config = getLoadingConfig();
  const displayMessage = message || config.defaultMessage;
  const displaySubtitle = subtitle || config.defaultSubtitle;

  /**
   * Render the loading indicator based on type
   */
  const renderLoadingIndicator = () => {
    if (type === 'error') {
      return (
        <Animated.View style={[styles.iconContainer, { opacity: fadeAnim }]}>
          <Icon
            name={config.icon}
            size={isTablet ? 80 : 64}
            color={config.color}
          />
        </Animated.View>
      );
    }

    return (
      <Animated.View style={[
        styles.loadingIndicatorContainer,
        { opacity: fadeAnim, transform: [{ scale: pulseAnim }] }
      ]}>
        <ActivityIndicator
          size={isTablet ? 'large' : 'large'}
          color={config.color}
        />
        <Icon
          name={config.icon}
          size={isTablet ? 32 : 24}
          color={config.color}
          style={styles.loadingIcon}
        />
      </Animated.View>
    );
  };

  /**
   * Render action buttons (retry, cancel)
   */
  const renderActionButtons = () => {
    if (!showRetry && !showCancel) return null;

    return (
      <View style={styles.actionButtonsContainer}>
        {showRetry && (
          <Button
            title="Retry"
            onPress={onRetry}
            variant="primary"
            style={[styles.actionButton, { width: showCancel ? '48%' : '100%' }]}
          />
        )}
        
        {showCancel && (
          <Button
            title="Cancel"
            onPress={onCancel}
            variant="secondary"
            style={[styles.actionButton, { width: showRetry ? '48%' : '100%' }]}
          />
        )}
      </View>
    );
  };

  /**
   * Render connection status information
   */
  const renderConnectionStatus = () => {
    if (type === 'error' || !playerStore.isConnected) {
      return (
        <View style={styles.statusContainer}>
          <View style={[styles.statusIndicator, styles.statusDisconnected]} />
          <Text variant="body2" style={styles.statusText}>
            Disconnected
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.statusContainer}>
        <View style={[styles.statusIndicator, styles.statusConnected]} />
        <Text variant="body2" style={styles.statusText}>
          Connected
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Loading indicator */}
        {renderLoadingIndicator()}

        {/* Main message */}
        <Text variant="h2" style={[styles.message, { color: config.color }]}>
          {displayMessage}
        </Text>

        {/* Subtitle */}
        <Text variant="body1" style={styles.subtitle}>
          {displaySubtitle}
        </Text>

        {/* Connection status */}
        {renderConnectionStatus()}

        {/* Action buttons */}
        {renderActionButtons()}

        {/* Additional loading dots for visual feedback */}
        {isLoading && type !== 'error' && (
          <View style={styles.loadingDotsContainer}>
            <LoadingDots color={config.color} />
          </View>
        )}
      </Animated.View>
    </View>
  );
});

/**
 * LoadingDots component for additional visual feedback
 * Creates animated dots that appear and disappear in sequence
 */
const LoadingDots: React.FC<{ color: string }> = ({ color }) => {
  const dot1Anim = React.useRef(new Animated.Value(0)).current;
  const dot2Anim = React.useRef(new Animated.Value(0)).current;
  const dot3Anim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const animateDots = () => {
      const dotAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(dot1Anim, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot2Anim, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot3Anim, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot1Anim, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.timing(dot2Anim, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.timing(dot3Anim, { toValue: 0, duration: 300, useNativeDriver: true }),
        ])
      );
      dotAnimation.start();
      return dotAnimation;
    };

    const animation = animateDots();
    return () => animation.stop();
  }, [dot1Anim, dot2Anim, dot3Anim]);

  return (
    <View style={styles.dotsContainer}>
      <Animated.View style={[styles.dot, { backgroundColor: color, opacity: dot1Anim }]} />
      <Animated.View style={[styles.dot, { backgroundColor: color, opacity: dot2Anim }]} />
      <Animated.View style={[styles.dot, { backgroundColor: color, opacity: dot3Anim }]} />
    </View>
  );
};

/**
 * Styles for the LoadingLayout component
 * Includes animations and responsive design patterns
 */
const styles = StyleSheet.create({
  // Main container for the entire loading layout
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Content container with centered layout
  content: {
    alignItems: 'center',
    paddingHorizontal: 32,
    maxWidth: 400,
  },

  // Loading indicator container with animations
  loadingIndicatorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    position: 'relative',
  },

  // Icon container for error states
  iconContainer: {
    marginBottom: 32,
  },

  // Loading icon positioned over activity indicator
  loadingIcon: {
    position: 'absolute',
  },

  // Main loading message
  message: {
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '600',
  },

  // Subtitle text
  subtitle: {
    textAlign: 'center',
    color: '#666666',
    marginBottom: 24,
    lineHeight: 20,
  },

  // Connection status container
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },

  // Status indicator dot
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },

  // Connected status color
  statusConnected: {
    backgroundColor: '#4CAF50',
  },

  // Disconnected status color
  statusDisconnected: {
    backgroundColor: '#F44336',
  },

  // Status text
  statusText: {
    color: '#666666',
    fontSize: 12,
  },

  // Action buttons container
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 300,
    marginTop: 16,
  },

  // Individual action button
  actionButton: {
    minHeight: 44,
  },

  // Loading dots container
  loadingDotsContainer: {
    marginTop: 24,
  },

  // Dots container for animation
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  // Individual dot styling
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});