/**
 * @fileoverview Scoreboard organism component displaying all players with current scores
 * 
 * This component provides a comprehensive scoreboard showing all players in the game,
 * their current scores, connection status, and turn indicators. It updates in real-time
 * as scores change and provides visual feedback for score changes and player status.
 * The component integrates with multiple stores for complete game state awareness.
 * 
 * Requirements covered: 5.1, 5.2, 5.3, 5.4, 5.5 (scoreboard and player management)
 * Requirements covered: 6.6 (atomic design), 8.1, 8.2 (accessibility)
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ViewStyle,
  Animated,
} from 'react-native';
import { observer } from 'mobx-react-lite';
import { useStores } from '../../contexts/StoreContext';
import { Player } from '@skribbl-clone/types';
import { PlayerCard } from '../molecules/PlayerCard';
import { Text } from '../atoms/Text';
import { Icon } from '../atoms/Icon';
import { Timer } from '../atoms/Timer';

// Props interface for the Scoreboard component
export interface ScoreboardProps {
  /** Custom styles for the scoreboard container */
  style?: ViewStyle;
  /** Whether to show detailed player information */
  showDetails?: boolean;
  /** Whether to show the current round timer */
  showTimer?: boolean;
  /** Whether to animate score changes */
  animateScores?: boolean;
}

/**
 * Scoreboard component - Displays all players with scores and game status
 * 
 * This organism component combines PlayerCard molecules with Timer and Text atoms
 * to create a comprehensive game status display. It shows player rankings,
 * current scores, turn indicators, and round information. The component provides
 * real-time updates and visual feedback for score changes and game events.
 * 
 * @param props - Scoreboard configuration and display options
 * @returns JSX element representing a complete game scoreboard
 */
export const Scoreboard: React.FC<ScoreboardProps> = observer(({
  style,
  showDetails = true,
  showTimer = true,
  animateScores = true,
}) => {
  const { roomStore, gameStore, playerStore } = useStores();
  const [scoreAnimations, setScoreAnimations] = useState<Map<string, Animated.Value>>(new Map());

  /**
   * Get players sorted by score (descending)
   * Also handles tie-breaking by join time
   */
  const getSortedPlayers = useCallback((): Player[] => {
    return [...roomStore.players].sort((a, b) => {
      // Primary sort: by score (descending)
      if (a.score !== b.score) {
        return b.score - a.score;
      }
      // Secondary sort: by join time (ascending - earlier joiners first)
      return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
    });
  }, [roomStore.players]);

  /**
   * Get the rank/position of a player (1-based)
   */
  const getPlayerRank = useCallback((player: Player, sortedPlayers: Player[]): number => {
    return sortedPlayers.findIndex(p => p.id === player.id) + 1;
  }, []);

  /**
   * Get rank display with medal emojis for top 3
   */
  const getRankDisplay = useCallback((rank: number): string => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  }, []);

  /**
   * Animate score changes for visual feedback
   */
  const animateScoreChange = useCallback((playerId: string) => {
    if (!animateScores) return;

    let animation = scoreAnimations.get(playerId);
    if (!animation) {
      animation = new Animated.Value(1);
      setScoreAnimations(prev => new Map(prev.set(playerId, animation!)));
    }

    // Scale animation for score change
    Animated.sequence([
      Animated.timing(animation, {
        toValue: 1.2,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(animation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [animateScores, scoreAnimations]);

  /**
   * Get current game status text
   */
  const getGameStatusText = useCallback((): string => {
    if (!gameStore.isPlaying) {
      return `Waiting for players (${roomStore.players.length}/${roomStore.maxPlayers})`;
    }
    
    if (gameStore.currentDrawer) {
      return `Round ${gameStore.currentRound}/${gameStore.maxRounds} - ${gameStore.currentDrawer.name} is drawing`;
    }
    
    return `Round ${gameStore.currentRound}/${gameStore.maxRounds}`;
  }, [gameStore, roomStore]);

  /**
   * Get time remaining in current round
   */
  const getTimeRemaining = useCallback((): number => {
    if (!gameStore.roundStartTime || !gameStore.roundDuration) return 0;
    
    const elapsed = Date.now() - gameStore.roundStartTime.getTime();
    const remaining = Math.max(0, gameStore.roundDuration - elapsed);
    return Math.ceil(remaining / 1000); // Convert to seconds
  }, [gameStore.roundStartTime, gameStore.roundDuration]);

  // Effect to handle score change animations
  useEffect(() => {
    // This would be triggered by score changes in the store
    // For now, we just set up the animation infrastructure
  }, [roomStore.players]);

  const sortedPlayers = getSortedPlayers();
  const gameStatusText = getGameStatusText();
  const timeRemaining = getTimeRemaining();

  return (
    <View 
      style={[styles.container, style]}
      accessible={true}
      accessibilityRole="list"
      accessibilityLabel="Game scoreboard"
    >
      {/* Scoreboard header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Icon name="trophy" size="medium" color="accent" />
          <Text variant="subtitle" color="primary" style={styles.title}>
            Scoreboard
          </Text>
        </View>
        
        {showTimer && gameStore.isPlaying && (
          <View style={styles.timerContainer}>
            <Timer
              seconds={timeRemaining}
              color={timeRemaining <= 10 ? 'error' : 'primary'}
              size="small"
            />
          </View>
        )}
      </View>

      {/* Game status */}
      <View style={styles.statusContainer}>
        <Text variant="body" color="secondary" style={styles.statusText}>
          {gameStatusText}
        </Text>
        
        {gameStore.isPlaying && gameStore.currentWord && playerStore.currentPlayer?.isDrawing && (
          <Text variant="caption" color="accent" style={styles.wordHint}>
            Word: {gameStore.currentWord}
          </Text>
        )}
      </View>

      {/* Players list */}
      <ScrollView
        style={styles.playersList}
        contentContainerStyle={styles.playersContent}
        showsVerticalScrollIndicator={false}
        accessible={true}
        accessibilityLabel="Players list"
      >
        {sortedPlayers.length === 0 ? (
          <View style={styles.emptyState}>
            <Text variant="body" color="secondary" style={styles.emptyText}>
              No players in the room
            </Text>
          </View>
        ) : (
          sortedPlayers.map((player, index) => {
            const rank = getPlayerRank(player, sortedPlayers);
            const rankDisplay = getRankDisplay(rank);
            const isCurrentPlayer = player.id === playerStore.currentPlayer?.id;
            const animation = scoreAnimations.get(player.id);

            return (
              <Animated.View
                key={player.id}
                style={[
                  styles.playerItem,
                  animation && { transform: [{ scale: animation }] }
                ]}
              >
                {/* Rank indicator */}
                <View style={styles.rankContainer}>
                  <Text 
                    variant="body" 
                    color={rank <= 3 ? 'accent' : 'secondary'}
                    bold={rank <= 3}
                    style={styles.rankText}
                  >
                    {rankDisplay}
                  </Text>
                </View>

                {/* Player card */}
                <PlayerCard
                  player={player}
                  isCurrentPlayer={isCurrentPlayer}
                  showScore={true}
                  showStatus={showDetails}
                  style={[
                    styles.playerCard,
                    rank === 1 && styles.firstPlaceCard,
                    player.isDrawing && styles.drawingPlayerCard,
                  ]}
                />

                {/* Additional player info */}
                {showDetails && (
                  <View style={styles.playerDetails}>
                    {player.isDrawing && (
                      <View style={styles.drawingIndicator}>
                        <Icon name="edit" size="small" color="accent" />
                      </View>
                    )}
                    
                    {!player.isConnected && (
                      <View style={styles.disconnectedIndicator}>
                        <Icon name="close" size="small" color="error" />
                      </View>
                    )}
                  </View>
                )}
              </Animated.View>
            );
          })
        )}
      </ScrollView>

      {/* Scoreboard footer with game info */}
      {gameStore.isPlaying && (
        <View style={styles.footer}>
          <Text variant="caption" color="secondary">
            Round {gameStore.currentRound} of {gameStore.maxRounds}
          </Text>
          
          {gameStore.gameEndTime && (
            <Text variant="caption" color="secondary">
              Game ends: {gameStore.gameEndTime.toLocaleTimeString()}
            </Text>
          )}
        </View>
      )}
    </View>
  );
});

// Design system colors
const colors = {
  background: '#FFFFFF',
  backgroundSecondary: '#F8F9FA',
  backgroundFirst: '#FFF8E1',
  backgroundDrawing: '#E8F5E8',
  border: '#E5E5EA',
  borderFirst: '#FFD700',
  borderDrawing: '#34C759',
  shadow: '#000000',
  accent: '#007AFF',
  success: '#34C759',
  error: '#FF3B30',
};

// Styles for the Scoreboard component
const styles = StyleSheet.create({
  // Main container for the entire scoreboard
  container: {
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
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

  // Header with title and timer
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.backgroundSecondary,
  },

  // Title row with icon and text
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Title text
  title: {
    marginLeft: 8,
  },

  // Timer container
  timerContainer: {
    alignItems: 'center',
  },

  // Game status container
  statusContainer: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: 'center',
  },

  // Status text
  statusText: {
    textAlign: 'center',
    marginBottom: 4,
  },

  // Word hint for drawer
  wordHint: {
    fontWeight: 'bold',
    textAlign: 'center',
  },

  // Scrollable players list
  playersList: {
    flex: 1,
    maxHeight: 400, // Limit height
  },

  // Content container for players
  playersContent: {
    padding: 8,
  },

  // Empty state when no players
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },

  // Empty state text
  emptyText: {
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Individual player item container
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },

  // Rank indicator container
  rankContainer: {
    width: 40,
    alignItems: 'center',
    marginRight: 8,
  },

  // Rank text
  rankText: {
    fontSize: 16,
  },

  // Player card
  playerCard: {
    flex: 1,
  },

  // First place player card styling
  firstPlaceCard: {
    backgroundColor: colors.backgroundFirst,
    borderColor: colors.borderFirst,
    borderWidth: 2,
  },

  // Drawing player card styling
  drawingPlayerCard: {
    backgroundColor: colors.backgroundDrawing,
    borderColor: colors.borderDrawing,
  },

  // Additional player details
  playerDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },

  // Drawing indicator
  drawingIndicator: {
    marginHorizontal: 4,
  },

  // Disconnected indicator
  disconnectedIndicator: {
    marginHorizontal: 4,
  },

  // Footer with game information
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.backgroundSecondary,
  },
});