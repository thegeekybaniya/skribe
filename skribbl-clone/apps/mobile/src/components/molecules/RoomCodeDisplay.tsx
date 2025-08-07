/**
 * @fileoverview RoomCodeDisplay molecule component with copy-to-clipboard functionality
 * 
 * This component combines atoms (Text, Button, Icon) to display a room code
 * with copy-to-clipboard functionality. It provides visual feedback for
 * copy actions and proper accessibility features.
 * 
 * Requirements covered: 6.6 (atomic design), 8.1, 8.2 (accessibility)
 */

import React, { useState } from 'react';
import { View, StyleSheet, ViewStyle, Alert } from 'react-native';
import { Text } from '../atoms/Text';
import { Button } from '../atoms/Button';
import { Icon } from '../atoms/Icon';
import * as Clipboard from 'expo-clipboard';

// Props interface for the RoomCodeDisplay component
export interface RoomCodeDisplayProps {
  /** Room code to display */
  roomCode: string;
  /** Whether to show the copy button */
  showCopyButton?: boolean;
  /** Whether to show a label */
  showLabel?: boolean;
  /** Custom label text */
  label?: string;
  /** Custom styles for the container */
  style?: ViewStyle;
  /** Function called when copy is successful */
  onCopySuccess?: () => void;
  /** Function called when copy fails */
  onCopyError?: (error: Error) => void;
  /** Whether the component is disabled */
  disabled?: boolean;
}

/**
 * RoomCodeDisplay component - Displays a room code with copy functionality
 * 
 * This is a molecule component that combines Text, Button, and Icon atoms
 * to create a room code display with copy-to-clipboard functionality.
 * It provides visual feedback and proper accessibility features.
 * 
 * @param props - Room code display configuration and event handlers
 * @returns JSX element representing a room code display with copy functionality
 */
export const RoomCodeDisplay: React.FC<RoomCodeDisplayProps> = ({
  roomCode,
  showCopyButton = true,
  showLabel = true,
  label = 'Room Code',
  style,
  onCopySuccess,
  onCopyError,
  disabled = false,
}) => {
  const [isCopying, setIsCopying] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Handle copy to clipboard
  const handleCopy = async () => {
    if (disabled || isCopying) return;

    try {
      setIsCopying(true);
      
      // Copy to clipboard using Expo Clipboard
      await Clipboard.setStringAsync(roomCode);
      
      // Show success feedback
      setCopySuccess(true);
      
      // Call success callback
      if (onCopySuccess) {
        onCopySuccess();
      }

      // Show success alert
      Alert.alert(
        'Copied!',
        `Room code "${roomCode}" has been copied to your clipboard.`,
        [{ text: 'OK', style: 'default' }]
      );

      // Reset success state after 2 seconds
      setTimeout(() => {
        setCopySuccess(false);
      }, 2000);

    } catch (error) {
      console.error('Failed to copy room code:', error);
      
      // Call error callback
      if (onCopyError) {
        onCopyError(error as Error);
      }

      // Show error alert
      Alert.alert(
        'Copy Failed',
        'Failed to copy room code to clipboard. Please try again.',
        [{ text: 'OK', style: 'default' }]
      );
    } finally {
      setIsCopying(false);
    }
  };

  // Format room code for display (add spaces for readability)
  const formatRoomCode = (code: string): string => {
    // Add spaces every 2 characters for better readability
    return code.replace(/(.{2})/g, '$1 ').trim();
  };

  // Get copy button text based on state
  const getCopyButtonText = (): string => {
    if (isCopying) return 'Copying...';
    if (copySuccess) return 'Copied!';
    return 'Copy';
  };

  // Get copy button variant based on state
  const getCopyButtonVariant = () => {
    if (copySuccess) return 'secondary';
    return 'primary';
  };

  // Get accessibility label for the room code
  const getRoomCodeAccessibilityLabel = (): string => {
    const formattedCode = roomCode.split('').join(' ');
    return `Room code: ${formattedCode}`;
  };

  // Get accessibility label for the copy button
  const getCopyButtonAccessibilityLabel = (): string => {
    if (isCopying) return 'Copying room code to clipboard';
    if (copySuccess) return 'Room code copied successfully';
    return `Copy room code ${roomCode} to clipboard`;
  };

  return (
    <View 
      style={[styles.container, style]}
      accessible={true}
      accessibilityRole="group"
      accessibilityLabel={`${label}: ${roomCode}`}
    >
      {/* Label */}
      {showLabel && label && (
        <Text 
          variant="body" 
          color="secondary"
          style={styles.label}
        >
          {label}
        </Text>
      )}

      {/* Room code display container */}
      <View style={styles.codeContainer}>
        {/* Room code text */}
        <View style={styles.codeDisplay}>
          <Text 
            variant="h2" 
            color="primary"
            bold
            center
            style={styles.codeText}
            accessible={true}
            accessibilityLabel={getRoomCodeAccessibilityLabel()}
            accessibilityRole="text"
          >
            {formatRoomCode(roomCode)}
          </Text>
        </View>

        {/* Copy button */}
        {showCopyButton && (
          <View style={styles.copyButtonContainer}>
            <Button
              title={getCopyButtonText()}
              variant={getCopyButtonVariant()}
              onPress={handleCopy}
              disabled={disabled || isCopying}
              style={styles.copyButton}
              accessibilityLabel={getCopyButtonAccessibilityLabel()}
              accessibilityHint="Double tap to copy room code to clipboard"
            />
            
            {/* Copy success indicator */}
            {copySuccess && (
              <View style={styles.successIndicator}>
                <Icon 
                  name="check"
                  size="small"
                  color="success"
                />
              </View>
            )}
          </View>
        )}
      </View>

      {/* Instructions text */}
      <Text 
        variant="caption" 
        color="secondary"
        center
        style={styles.instructions}
      >
        Share this code with friends to join your room
      </Text>
    </View>
  );
};

// Design system colors and spacing
const colors = {
  background: '#FFFFFF',
  codeBackground: '#F8F9FA',
  border: '#E5E5EA',
  codeBorder: '#007AFF',
  shadow: '#000000',
};

// Styles for the RoomCodeDisplay component following the design system
const styles = StyleSheet.create({
  // Main container for the room code display
  container: {
    padding: 20,
    backgroundColor: colors.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    // Shadow for iOS
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    // Elevation for Android
    elevation: 4,
  },

  // Label text styling
  label: {
    marginBottom: 12,
    fontWeight: '500',
  },

  // Container for the code display and copy button
  codeContainer: {
    width: '100%',
    alignItems: 'center',
  },

  // Room code display area
  codeDisplay: {
    backgroundColor: colors.codeBackground,
    borderWidth: 2,
    borderColor: colors.codeBorder,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 16,
    minWidth: 200,
    // Shadow for iOS
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    // Elevation for Android
    elevation: 2,
  },

  // Room code text styling
  codeText: {
    fontFamily: 'monospace', // Use monospace for consistent character width
    letterSpacing: 2,
    fontSize: 24,
  },

  // Copy button container
  copyButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Copy button styling
  copyButton: {
    minWidth: 100,
    paddingHorizontal: 20,
  },

  // Success indicator styling
  successIndicator: {
    marginLeft: 8,
    padding: 4,
  },

  // Instructions text styling
  instructions: {
    marginTop: 12,
    paddingHorizontal: 16,
    lineHeight: 18,
  },
});