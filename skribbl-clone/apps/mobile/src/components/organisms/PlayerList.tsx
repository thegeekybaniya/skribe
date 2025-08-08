/**
 * @fileoverview PlayerList organism component showing connected players and their status
 * 
 * This component provides a comprehensive list of all players in the current room,
 * showing their connection status, scores, and current game role. It includes
 * features like player search, filtering, and detailed status information.
 * The component updates in real-time as players join, leave, or change status.
 * 
 * Requirements covered: 1.3, 1.4, 1.5 (player management and room display)
 * Requirements covered: 5.1, 5.2 (player status and information)
 * Requirements covered: 6.6 (atomic design), 8.1, 8.2 (accessibility)
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ViewStyle,
  RefreshControl,
} from 'react-native';
import { observer } from 'mobx-react-lite';
import { useStores } from '../../contexts/StoreContext';
import { Player, PlayerStatus } from '@skribbl-clone/types';
import { PlayerCard } from '../molecules/PlayerCard';
import { Input } from '../atoms/Input';
import { Button } from '../atoms/Button';
import { Text } from '../atoms/Text';
import { Icon } from '../atoms/Icon';

// Filter options for player list
type PlayerFilter = 'all' | 'connected' | 'disconnected' | 'drawing';

// Props interface for the PlayerList component
export interface PlayerListProps {
  /** Custom styles for the list container */
  style?: ViewStyle;
  /** Whether to show search functionality */
  showSearch?: boolean;
  /** Whether to show filter options */
  showFilters?: boolean;
  /** Whether to show detailed player information */
  showDetails?: boolean;
  /** Whether to enable pull-to-refresh */
  enableRefresh?: boolean;
  /** Maximum number of players to display */
  maxPlayers?: number;
  /** Callback when a player is selected */
  onPlayerSelect?: (player: Player) => void;
  /** Callback when refresh is triggered */
  onRefresh?: () => void;
}

/**
 * PlayerList component - Comprehensive player management interface
 * 
 * This organism component combines PlayerCard molecules with Input and Button atoms
 * to create a complete player list with search, filtering, and management capabilities.
 * It provides real-time updates of player status and supports various interaction modes
 * for different game states and user roles.
 * 
 * @param props - Player list configuration and event handlers
 * @returns JSX element representing a complete player list interface
 */
export const PlayerList: React.FC<PlayerListProps> = observer(({
  style,
  showSearch = true,
  showFilters = true,
  showDetails = true,
  enableRefresh = true,
  maxPlayers,
  onPlayerSelect,
  onRefresh,
}) => {
  const { roomStore, playerStore, gameStore } = useStores();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<PlayerFilter>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  /**
   * Filter players based on search query and active filter
   */
  const filteredPlayers = useMemo((): Player[] => {
    let players = [...roomStore.players];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      players = players.filter(player =>
        player.name.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    switch (activeFilter) {
      case 'connected':
        players = players.filter(player => player.isConnected);
        break;
      case 'disconnected':
        players = players.filter(player => !player.isConnected);
        break;
      case 'drawing':
        players = players.filter(player => player.isDrawing);
        break;
      case 'all':
      default:
        // No additional filtering
        break;
    }

    // Limit number of players if specified
    if (maxPlayers && players.length > maxPlayers) {
      players = players.slice(0, maxPlayers);
    }

    // Sort players: connected first, then by join time
    return players.sort((a, b) => {
      // Primary sort: connected players first
      if (a.isConnected !== b.isConnected) {
        return a.isConnected ? -1 : 1;
      }
      // Secondary sort: by join time (earlier first)
      return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
    });
  }, [roomStore.players, searchQuery, activeFilter, maxPlayers]);

  /**
   * Get filter button variant based on active state
   */
  const getFilterVariant = useCallback((filter: PlayerFilter): 'primary' | 'secondary' => {
    return activeFilter === filter ? 'primary' : 'secondary';
  }, [activeFilter]);

  /**
   * Get player count for each filter
   */
  const getFilterCounts = useCallback(() => {
    const players = roomStore.players;
    return {
      all: players.length,
      connected: players.filter(p => p.isConnected).length,
      disconnected: players.filter(p => !p.isConnected).length,
      drawing: players.filter(p => p.isDrawing).length,
    };
  }, [roomStore.players]);

  /**
   * Handle player selection
   */
  const handlePlayerSelect = useCallback((player: Player) => {
    onPlayerSelect?.(player);
  }, [onPlayerSelect]);

  /**
   * Handle refresh action
   */
  const handleRefresh = useCallback(async () => {
    if (!enableRefresh) return;
    
    setIsRefreshing(true);
    try {
      await onRefresh?.();
    } finally {
      setIsRefreshing(false);
    }
  }, [enableRefresh, onRefresh]);

  /**
   * Clear search and filters
   */
  const handleClearFilters = useCallback(() => {
    setSearchQuery('');
    setActiveFilter('all');
  }, []);

  /**
   * Get list header text
   */
  const getHeaderText = useCallback((): string => {
    const total = roomStore.players.length;
    const filtered = filteredPlayers.length;
    
    if (searchQuery || activeFilter !== 'all') {
      return `${filtered} of ${total} players`;
    }
    
    return `${total} players in room`;
  }, [roomStore.players.length, filteredPlayers.length, searchQuery, activeFilter]);

  const filterCounts = getFilterCounts();
  const headerText = getHeaderText();

  return (
    <View 
      style={[styles.container, style]}
      accessible={true}
      accessibilityRole="list"
      accessibilityLabel="Players list"
    >
      {/* Header with title and player count */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Icon name="users" size="medium" color="primary" />
          <Text variant="subtitle" color="primary" style={styles.title}>
            Players
          </Text>
        </View>
        
        <Text variant="caption" color="secondary">
          {headerText}
        </Text>
      </View>

      {/* Search and filters */}
      {(showSearch || showFilters) && (
        <View style={styles.controlsContainer}>
          {/* Search input */}
          {showSearch && (
            <Input
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search players..."
              style={styles.searchInput}
              accessible={true}
              accessibilityLabel="Search players"
              accessibilityHint="Type to filter players by name"
            />
          )}

          {/* Filter buttons */}
          {showFilters && (
            <View style={styles.filtersRow}>
              <Button
                title={`All (${filterCounts.all})`}
                variant={getFilterVariant('all')}
                onPress={() => setActiveFilter('all')}
                style={styles.filterButton}
              />
              
              <Button
                title={`Online (${filterCounts.connected})`}
                variant={getFilterVariant('connected')}
                onPress={() => setActiveFilter('connected')}
                style={styles.filterButton}
              />
              
              <Button
                title={`Offline (${filterCounts.disconnected})`}
                variant={getFilterVariant('disconnected')}
                onPress={() => setActiveFilter('disconnected')}
                style={styles.filterButton}
              />
              
              {gameStore.isPlaying && (
                <Button
                  title={`Drawing (${filterCounts.drawing})`}
                  variant={getFilterVariant('drawing')}
                  onPress={() => setActiveFilter('drawing')}
                  style={styles.filterButton}
                />
              )}
            </View>
          )}

          {/* Clear filters button */}
          {(searchQuery || activeFilter !== 'all') && (
            <Button
              title="Clear Filters"
              variant="secondary"
              onPress={handleClearFilters}
              style={styles.clearButton}
            />
          )}
        </View>
      )}

      {/* Players list */}
      <ScrollView
        style={styles.playersList}
        contentContainerStyle={styles.playersContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          enableRefresh ? (
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#007AFF"
            />
          ) : undefined
        }
        accessible={true}
        accessibilityLabel="Players list"
      >
        {filteredPlayers.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="users" size="large" color="secondary" />
            <Text variant="body" color="secondary" style={styles.emptyTitle}>
              {searchQuery || activeFilter !== 'all' ? 
                'No players match your filters' : 
                'No players in room'
              }
            </Text>
            <Text variant="caption" color="secondary" style={styles.emptySubtitle}>
              {searchQuery || activeFilter !== 'all' ? 
                'Try adjusting your search or filters' : 
                'Waiting for players to join...'
              }
            </Text>
          </View>
        ) : (
          filteredPlayers.map((player) => {
            const isCurrentPlayer = player.id === playerStore.currentPlayer?.id;
            
            return (
              <View key={player.id} style={styles.playerItem}>
                <PlayerCard
                  player={player}
                  isCurrentPlayer={isCurrentPlayer}
                  showScore={showDetails}
                  showStatus={showDetails}
                  onPress={() => handlePlayerSelect(player)}
                  style={styles.playerCard}
                />
                
                {/* Additional player actions */}
                {showDetails && isCurrentPlayer && (
                  <View style={styles.playerActions}>
                    <Text variant="caption" color="accent" style={styles.youLabel}>
                      This is you
                    </Text>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Footer with room information */}
      <View style={styles.footer}>
        <View style={styles.footerRow}>
          <Text variant="caption" color="secondary">
            Room: {roomStore.currentRoom?.code}
          </Text>
          
          <Text variant="caption" color="secondary">
            Capacity: {roomStore.players.length}/{roomStore.maxPlayers}
          </Text>
        </View>
        
        {gameStore.isPlaying && gameStore.currentDrawer && (
          <Text variant="caption" color="accent" style={styles.gameStatus}>
            🎨 {gameStore.currentDrawer.name} is drawing
          </Text>
        )}
      </View>
    </View>
  );
});

// Design system colors
const colors = {
  background: '#FFFFFF',
  backgroundSecondary: '#F8F9FA',
  border: '#E5E5EA',
  shadow: '#000000',
  accent: '#007AFF',
  secondary: '#8E8E93',
};

// Styles for the PlayerList component
const styles = StyleSheet.create({
  // Main container for the entire player list
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

  // Header with title and count
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

  // Controls container for search and filters
  controlsContainer: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  // Search input
  searchInput: {
    marginBottom: 12,
  },

  // Filters row
  filtersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },

  // Individual filter button
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 32,
  },

  // Clear filters button
  clearButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 32,
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

  // Empty state container
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },

  // Empty state title
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: '600',
  },

  // Empty state subtitle
  emptySubtitle: {
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Individual player item container
  playerItem: {
    marginVertical: 4,
  },

  // Player card
  playerCard: {
    // Styles inherited from PlayerCard
  },

  // Player actions container
  playerActions: {
    marginTop: 4,
    alignItems: 'center',
  },

  // "You" label
  youLabel: {
    fontStyle: 'italic',
    fontWeight: '600',
  },

  // Footer with room information
  footer: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.backgroundSecondary,
  },

  // Footer row
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },

  // Game status in footer
  gameStatus: {
    textAlign: 'center',
    fontWeight: '600',
  },
});