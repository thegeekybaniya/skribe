/**
 * @fileoverview Game layout template for main game screen
 * Provides the main game interface layout with canvas, chat, and scoreboard
 * Requirements: 6.6, 8.1, 8.2 - Template components with atomic design and responsive layout
 */

import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { observer } from 'mobx-react-lite';

// Import organism components that make up the game layout
import {
  DrawingCanvas,
  ChatPanel,
  Scoreboard,
  GameControls,
  PlayerList,
} from '../organisms';

// Import atoms for basic UI elements
import { Timer, Text } from '../atoms';

// Import store context for state management
import { useRootStore } from '../../contexts/StoreContext';

/**
 * Props interface for GameLayout component
 * Defines the configuration options for the game layout
 */
interface GameLayoutProps {
  /** Whether to show the scoreboard (can be hidden on small screens) */
  showScoreboard?: boolean;
  /** Whether to show the player list (can be collapsed on small screens) */
  showPlayerList?: boolean;
  /** Whether to show game controls (drawing tools) */
  showGameControls?: boolean;
  /** Custom styles to apply to the layout container */
  containerStyle?: any;
}

/**
 * GameLayout template component
 * 
 * This template provides the main game interface layout combining:
 * - Drawing canvas (center, largest area)
 * - Chat panel (bottom section for guessing)
 * - Scoreboard (right side on tablets, overlay on phones)
 * - Game controls (drawing tools when it's player's turn)
 * - Timer (top center, always visible)
 * 
 * The layout is responsive and adapts to different screen sizes:
 * - Phone: Stacked layout with collapsible panels
 * - Tablet: Side-by-side layout with more space
 */
export const GameLayout: React.FC<GameLayoutProps> = observer(({
  showScoreboard = true,
  showPlayerList = true,
  showGameControls = true,
  containerStyle,
}) => {
  // Get stores from context for reactive state management
  const rootStore = useRootStore();
  const { gameStore, playerStore, roomStore } = rootStore;

  // Get screen dimensions for responsive layout calculations
  const { width, height } = Dimensions.get('window');
  const isTablet = width > 768; // Consider tablets as devices wider than 768px
  const isLandscape = width > height;

  // Calculate layout dimensions based on screen size and orientation
  const layoutDimensions = React.useMemo(() => {
    if (isTablet) {
      // Tablet layout: side-by-side with more space
      return {
        canvasWidth: width * 0.6, // 60% of screen width
        canvasHeight: height * 0.7, // 70% of screen height
        sidebarWidth: width * 0.35, // 35% for sidebar (scoreboard + chat)
        chatHeight: height * 0.4, // 40% of screen height for chat
      };
    } else if (isLandscape) {
      // Phone landscape: horizontal layout
      return {
        canvasWidth: width * 0.65, // 65% of screen width
        canvasHeight: height * 0.8, // 80% of screen height
        sidebarWidth: width * 0.3, // 30% for sidebar
        chatHeight: height * 0.5, // 50% of screen height for chat
      };
    } else {
      // Phone portrait: stacked layout
      return {
        canvasWidth: width * 0.95, // 95% of screen width
        canvasHeight: height * 0.5, // 50% of screen height
        sidebarWidth: width, // Full width for stacked elements
        chatHeight: height * 0.25, // 25% of screen height for chat
      };
    }
  }, [width, height, isTablet, isLandscape]);

  // Determine if current player is the drawer
  const isCurrentDrawer = playerStore.currentPlayer?.id === gameStore.currentDrawerId;

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Header section with timer and game info */}
      <View style={styles.header}>
        <View style={styles.gameInfo}>
          <Text variant="h3" color="primary">
            Round {gameStore.currentRound} of {gameStore.maxRounds}
          </Text>
          {gameStore.currentWord && isCurrentDrawer && (
            <Text variant="body1" color="secondary">
              Draw: {gameStore.currentWord}
            </Text>
          )}
        </View>
        
        {/* Timer component showing remaining time */}
        <Timer
          timeRemaining={gameStore.timeRemaining}
          totalTime={60}
          size="large"
          showProgress={true}
        />
      </View>

      {/* Main content area with responsive layout */}
      <View style={[
        styles.mainContent,
        isTablet ? styles.tabletLayout : styles.phoneLayout
      ]}>
        {/* Left/Top section: Canvas and controls */}
        <View style={[
          styles.canvasSection,
          {
            width: layoutDimensions.canvasWidth,
            height: layoutDimensions.canvasHeight,
          }
        ]}>
          {/* Drawing canvas - main interaction area */}
          <DrawingCanvas
            width={layoutDimensions.canvasWidth}
            height={layoutDimensions.canvasHeight - (showGameControls ? 60 : 0)}
            isDrawingEnabled={isCurrentDrawer}
          />
          
          {/* Game controls (drawing tools) - only show when it's player's turn */}
          {showGameControls && isCurrentDrawer && (
            <View style={styles.gameControlsContainer}>
              <GameControls />
            </View>
          )}
        </View>

        {/* Right/Bottom section: Sidebar with scoreboard and chat */}
        <View style={[
          styles.sidebar,
          {
            width: layoutDimensions.sidebarWidth,
            flexDirection: isTablet ? 'column' : 'column',
          }
        ]}>
          {/* Scoreboard section */}
          {showScoreboard && (
            <View style={[
              styles.scoreboardContainer,
              { height: isTablet ? '60%' : '40%' }
            ]}>
              <Scoreboard />
            </View>
          )}

          {/* Player list section (can be collapsed on small screens) */}
          {showPlayerList && roomStore.players.length > 0 && (
            <View style={[
              styles.playerListContainer,
              { height: isTablet ? '20%' : '15%' }
            ]}>
              <PlayerList
                players={roomStore.players}
                currentDrawerId={gameStore.currentDrawerId}
                compact={!isTablet}
              />
            </View>
          )}

          {/* Chat panel section */}
          <View style={[
            styles.chatContainer,
            {
              height: layoutDimensions.chatHeight,
              flex: isTablet ? 1 : 0,
            }
          ]}>
            <ChatPanel
              height={layoutDimensions.chatHeight}
              isDrawingMode={isCurrentDrawer}
            />
          </View>
        </View>
      </View>
    </View>
  );
});

/**
 * Styles for the GameLayout component
 * Includes responsive design patterns and layout configurations
 */
const styles = StyleSheet.create({
  // Main container for the entire game layout
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  // Header section with timer and game information
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  // Game information section in header
  gameInfo: {
    flex: 1,
  },

  // Main content area containing canvas and sidebar
  mainContent: {
    flex: 1,
    padding: 8,
  },

  // Tablet layout: side-by-side arrangement
  tabletLayout: {
    flexDirection: 'row',
    gap: 12,
  },

  // Phone layout: stacked arrangement
  phoneLayout: {
    flexDirection: 'column',
    gap: 8,
  },

  // Canvas section containing drawing area and controls
  canvasSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    overflow: 'hidden',
  },

  // Container for game controls (drawing tools)
  gameControlsContainer: {
    height: 60,
    backgroundColor: '#F8F9FA',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },

  // Sidebar containing scoreboard, player list, and chat
  sidebar: {
    gap: 8,
  },

  // Scoreboard container with styling
  scoreboardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    overflow: 'hidden',
  },

  // Player list container with styling
  playerListContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    overflow: 'hidden',
  },

  // Chat container with styling
  chatContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    overflow: 'hidden',
  },
});