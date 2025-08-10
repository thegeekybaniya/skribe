/**
 * @fileoverview PlayerCard molecule component showing player name, score, and status
 * 
 * This component combines atoms (Text, Icon) to display player information
 * in a card format. It shows the player's name, current score, connection status,
 * and whether they are currently drawing. This is used in player lists and scoreboards.
 * 
 * Requirements covered: 6.6 (atomic design), 8.1, 8.2 (accessibility)
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Text } from '../atoms/Text';
import { Icon } from '../atoms/Icon';
import { Player } from '@skribbl-clone/types';

// Props interface for the PlayerCard component
export interface PlayerCardProps {
  /** Player data to display */
  player: Player;
  /** Whether this player is the current user */
  isCurrentPlayer?: boolean;
  /** Whether to show the score */
  showScore?: boolean;
  /** Whether to show the status indicator */
  showStatus?: boolean;
  /** Custom styles for the card container */
  style?: ViewStyle;
  /** Function called when the card is pressed */
  onPress?: () => void;
}

/**
 * PlayerCard component - Displays player information in a card format
 * 
 * This is a molecule component that combines Text and Icon atoms to show
 * comprehensive player information. It provides visual indicators for
 * connection status, drawing state, and score information.
 * 
 * @param props - Player data and display configuration
 * @returns JSX element representing a player information card
 */
export const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  isCurrentPlayer = false,
  showScore = true,
  showStatus = true,
  style,
  onPress,
}) => {
  // Determine the status icon and color based on player state
  const getStatusIcon = () => {
    if (!player.isConnected) {
      return { name: 'close' as const, color: 'error' as const };
    }
    if (player.isDrawing) {
      return { name: 'edit' as const, color: 'accent' as const };
    }
    return { name: 'check' as const, color: 'success' as const };
  };

  // Get status text for accessibility
  const getStatusText = () => {
    if (!player.isConnected) return 'Disconnected';
    if (player.isDrawing) return 'Currently drawing';
    return 'Connected';
  };

  // Get appropriate text color based on player state
  const getNameColor = () => {
    if (!player.isConnected) return 'secondary';
    if (isCurrentPlayer) return 'accent';
    return 'primary';
  };

  const statusIcon = getStatusIcon();
  const statusText = getStatusText();
  const nameColor = getNameColor();

  // Combine styles based on player state
  const cardStyle = [
    styles.container,
    isCurrentPlayer && styles.currentPlayerContainer,
    !player.isConnected && styles.disconnectedContainer,
    player.isDrawing && styles.drawingContainer,
    style,
  ];

  return (
    <View 
      style={cardStyle}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`Player ${player.name}, score ${player.score}, ${statusText}`}
      accessibilityHint={onPress ? 'Tap for more options' : undefined}
    >
      {/* Player name and status indicator row */}
      <View style={styles.headerRow}>
        <View style={styles.nameContainer}>
          <Text 
            variant="body" 
            color={nameColor}
            bold={isCurrentPlayer}
            style={styles.playerName}
          >
            {player.name}
          </Text>
          
          {/* Current player indicator */}
          {isCurrentPlayer && (
            <Text 
              variant="caption" 
              color="accent"
              style={styles.currentPlayerLabel}
            >
              (You)
            </Text>
          )}
        </View>

        {/* Status icon */}
        {showStatus && (
          <View 
            style={styles.statusContainer}
            accessible={true}
            accessibilityLabel={statusText}
          >
            <Icon 
              name={statusIcon.name}
              size="small"
              color={statusIcon.color}
            />
          </View>
        )}
      </View>

      {/* Score display */}
      {showScore && (
        <View style={styles.scoreRow}>
          <Icon 
            name="trophy"
            size="small"
            color="secondary"
          />
          <Text 
            variant="body" 
            color="secondary"
            style={styles.scoreText}
          >
            {player.score} points
          </Text>
        </View>
      )}

      {/* Drawing indicator for current drawer */}
      {player.isDrawing && (
        <View style={styles.drawingIndicator}>
          <Text 
            variant="caption" 
            color="accent"
            bold
          >
            Drawing now...
          </Text>
        </View>
      )}
    </View>
  );
};

// Design system colors - these would typically come from a theme file
const colors = {
  background: '#FFFFFF',
  backgroundCurrent: '#F0F8FF',
  backgroundDisconnected: '#F5F5F5',
  backgroundDrawing: '#E8F5E8',
  border: '#E5E5EA',
  borderCurrent: '#007AFF',
  borderDrawing: '#34C759',
  shadow: '#000000',
};

// Styles for the PlayerCard component following the design system
const styles = StyleSheet.create({
  // Main container for the player card
  container: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: colors.border,
    // Shadow for iOS
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // Elevation for Android
    elevation: 2,
  },

  // Header row containing name and status
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },

  // Container for player name and current player label
  nameContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Player name text styling
  playerName: {
    marginRight: 8,
  },

  // "You" label for current player
  currentPlayerLabel: {
    fontStyle: 'italic',
  },

  // Container for status icon
  statusContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Score row with trophy icon and points
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },

  // Score text styling
  scoreText: {
    marginLeft: 6,
  },

  // Drawing indicator for current drawer
  drawingIndicator: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  // Current player card styling
  currentPlayerContainer: {
    backgroundColor: colors.backgroundCurrent,
    borderColor: colors.borderCurrent,
    borderWidth: 2,
  },

  // Disconnected player card styling
  disconnectedContainer: {
    backgroundColor: colors.backgroundDisconnected,
    opacity: 0.7,
  },

  // Drawing player card styling
  drawingContainer: {
    backgroundColor: colors.backgroundDrawing,
    borderColor: colors.borderDrawing,
    borderWidth: 2,
  },
});