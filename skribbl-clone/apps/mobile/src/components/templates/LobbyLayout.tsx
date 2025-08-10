/**
 * @fileoverview Lobby layout template for room creation and joining screens
 * Provides layout for waiting room before game starts and room management
 * Requirements: 6.6, 8.1, 8.2 - Template components with atomic design and responsive layout
 */

import React from 'react';
import { View, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { observer } from 'mobx-react-lite';

// Import organism and molecule components
import { PlayerList } from '../organisms';
import { RoomCodeDisplay } from '../molecules';

// Import atoms for basic UI elements
import { Button, Text, Input } from '../atoms';

// Import store context for state management
import { useRootStore } from '../../contexts/StoreContext';

/**
 * Props interface for LobbyLayout component
 * Defines the configuration options for the lobby layout
 */
interface LobbyLayoutProps {
  /** Whether this is a room creation flow or joining flow */
  mode: 'create' | 'join' | 'waiting';
  /** Callback when user wants to create a room */
  onCreateRoom?: (playerName: string) => void;
  /** Callback when user wants to join a room */
  onJoinRoom?: (roomCode: string, playerName: string) => void;
  /** Callback when user wants to start the game (room host only) */
  onStartGame?: () => void;
  /** Callback when user wants to leave the room */
  onLeaveRoom?: () => void;
  /** Whether the start game button should be enabled */
  canStartGame?: boolean;
  /** Custom styles to apply to the layout container */
  containerStyle?: any;
}

/**
 * LobbyLayout template component
 * 
 * This template provides different layouts based on the mode:
 * - 'create': Form to create a new room with player name input
 * - 'join': Form to join existing room with room code and player name
 * - 'waiting': Waiting room showing players and room code
 * 
 * The layout is responsive and includes:
 * - Room creation/joining forms
 * - Room code display and sharing
 * - Player list with connection status
 * - Game start controls (for room host)
 * - Leave room functionality
 */
export const LobbyLayout: React.FC<LobbyLayoutProps> = observer(({
  mode,
  onCreateRoom,
  onJoinRoom,
  onStartGame,
  onLeaveRoom,
  canStartGame = false,
  containerStyle,
}) => {
  // Get stores from context for reactive state management
  const rootStore = useRootStore();
  const { roomStore, playerStore } = rootStore;

  // Local state for form inputs
  const [playerName, setPlayerName] = React.useState('');
  const [roomCode, setRoomCode] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  // Get screen dimensions for responsive layout
  const { width, height } = Dimensions.get('window');
  const isTablet = width > 768;
  // const isLandscape = width > height;

  // Calculate layout dimensions based on screen size
  const layoutDimensions = React.useMemo(() => {
    if (isTablet) {
      return {
        formWidth: Math.min(400, width * 0.6),
        playerListHeight: height * 0.5,
      };
    } else {
      return {
        formWidth: width * 0.9,
        playerListHeight: height * 0.4,
      };
    }
  }, [width, height, isTablet]);

  /**
   * Handle room creation with validation
   */
  const handleCreateRoom = async () => {
    if (!playerName.trim()) return;
    
    setIsLoading(true);
    try {
      await onCreateRoom?.(playerName.trim());
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle room joining with validation
   */
  const handleJoinRoom = async () => {
    if (!playerName.trim() || !roomCode.trim()) return;
    
    setIsLoading(true);
    try {
      await onJoinRoom?.(roomCode.trim().toUpperCase(), playerName.trim());
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle game start with validation
   */
  const handleStartGame = async () => {
    if (!canStartGame) return;
    
    setIsLoading(true);
    try {
      await onStartGame?.();
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Render the room creation form
   */
  const renderCreateForm = () => (
    <View style={[styles.formContainer, { width: layoutDimensions.formWidth }]}>
      <Text variant="h2" style={styles.title}>
        Create New Room
      </Text>
      
      <Text variant="body1" style={styles.description}>
        Enter your name to create a new game room. You'll get a room code to share with friends.
      </Text>

      <View style={styles.inputContainer}>
        <Input
          placeholder="Enter your name"
          value={playerName}
          onChangeText={setPlayerName}
          maxLength={20}
          autoCapitalize="words"
          returnKeyType="done"
          onSubmitEditing={handleCreateRoom}
        />
      </View>

      <Button
        title="Create Room"
        onPress={handleCreateRoom}
        disabled={!playerName.trim() || isLoading}
        loading={isLoading}
        variant="primary"
        style={styles.actionButton}
      />
    </View>
  );

  /**
   * Render the room joining form
   */
  const renderJoinForm = () => (
    <View style={[styles.formContainer, { width: layoutDimensions.formWidth }]}>
      <Text variant="h2" style={styles.title}>
        Join Room
      </Text>
      
      <Text variant="body1" style={styles.description}>
        Enter the room code and your name to join an existing game.
      </Text>

      <View style={styles.inputContainer}>
        <Input
          placeholder="Room Code (e.g. ABC123)"
          value={roomCode}
          onChangeText={(text) => setRoomCode(text.toUpperCase())}
          maxLength={6}
          autoCapitalize="characters"
          returnKeyType="next"
        />
      </View>

      <View style={styles.inputContainer}>
        <Input
          placeholder="Enter your name"
          value={playerName}
          onChangeText={setPlayerName}
          maxLength={20}
          autoCapitalize="words"
          returnKeyType="done"
          onSubmitEditing={handleJoinRoom}
        />
      </View>

      <Button
        title="Join Room"
        onPress={handleJoinRoom}
        disabled={!playerName.trim() || !roomCode.trim() || isLoading}
        loading={isLoading}
        variant="primary"
        style={styles.actionButton}
      />
    </View>
  );

  /**
   * Render the waiting room interface
   */
  const renderWaitingRoom = () => (
    <ScrollView style={styles.waitingContainer} showsVerticalScrollIndicator={false}>
      {/* Room code display section */}
      <View style={styles.roomCodeSection}>
        <Text variant="h2" style={styles.title}>
          Room Created!
        </Text>
        
        <Text variant="body1" style={styles.description}>
          Share this code with friends to let them join your game.
        </Text>

        <RoomCodeDisplay
          roomCode={roomStore.currentRoomCode || ''}
          style={styles.roomCodeDisplay}
        />
      </View>

      {/* Players section */}
      <View style={styles.playersSection}>
        <Text variant="h3" style={styles.sectionTitle}>
          Players ({roomStore.players.length}/8)
        </Text>
        
        <View style={[
          styles.playerListContainer,
          { height: layoutDimensions.playerListHeight }
        ]}>
          <PlayerList
            players={roomStore.players}
            showConnectionStatus={true}
            compact={!isTablet}
          />
        </View>
      </View>

      {/* Game controls section */}
      <View style={styles.gameControlsSection}>
        {/* Start game button (only for room host) */}
        {playerStore.isRoomHost && (
          <Button
            title={`Start Game (${roomStore.players.length} players)`}
            onPress={handleStartGame}
            disabled={!canStartGame || roomStore.players.length < 2 || isLoading}
            loading={isLoading}
            variant="primary"
            style={styles.startGameButton}
          />
        )}

        {/* Game requirements info */}
        {roomStore.players.length < 2 && (
          <Text variant="body2" style={styles.requirementText}>
            Need at least 2 players to start the game
          </Text>
        )}

        {/* Leave room button */}
        <Button
          title="Leave Room"
          onPress={onLeaveRoom}
          variant="secondary"
          style={styles.leaveButton}
        />
      </View>
    </ScrollView>
  );

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Header section */}
      <View style={styles.header}>
        <Text variant="h1" style={styles.appTitle}>
          Skribbl Clone
        </Text>
        {mode === 'waiting' && roomStore.currentRoomCode && (
          <Text variant="body2" style={styles.roomInfo}>
            Room: {roomStore.currentRoomCode}
          </Text>
        )}
      </View>

      {/* Main content based on mode */}
      <View style={styles.content}>
        {mode === 'create' && renderCreateForm()}
        {mode === 'join' && renderJoinForm()}
        {mode === 'waiting' && renderWaitingRoom()}
      </View>
    </View>
  );
});

/**
 * Styles for the LobbyLayout component
 * Includes responsive design patterns and form layouts
 */
const styles = StyleSheet.create({
  // Main container for the entire lobby layout
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  // Header section with app title and room info
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#4A90E2',
    alignItems: 'center',
  },

  // App title in header
  appTitle: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },

  // Room information in header
  roomInfo: {
    color: '#E3F2FD',
    marginTop: 4,
  },

  // Main content area
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  // Form container for create/join forms
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    alignItems: 'center',
  },

  // Form title
  title: {
    textAlign: 'center',
    marginBottom: 12,
    color: '#333333',
  },

  // Form description text
  description: {
    textAlign: 'center',
    marginBottom: 24,
    color: '#666666',
    lineHeight: 20,
  },

  // Input container with spacing
  inputContainer: {
    width: '100%',
    marginBottom: 16,
  },

  // Action button styling
  actionButton: {
    width: '100%',
    marginTop: 8,
  },

  // Waiting room container
  waitingContainer: {
    flex: 1,
    width: '100%',
  },

  // Room code section
  roomCodeSection: {
    alignItems: 'center',
    marginBottom: 32,
  },

  // Room code display styling
  roomCodeDisplay: {
    marginTop: 16,
  },

  // Players section
  playersSection: {
    marginBottom: 32,
  },

  // Section title
  sectionTitle: {
    marginBottom: 16,
    color: '#333333',
    textAlign: 'center',
  },

  // Player list container
  playerListContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },

  // Game controls section
  gameControlsSection: {
    alignItems: 'center',
    gap: 16,
  },

  // Start game button
  startGameButton: {
    width: '100%',
    maxWidth: 300,
  },

  // Requirement text
  requirementText: {
    color: '#FF9800',
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Leave room button
  leaveButton: {
    width: '100%',
    maxWidth: 200,
  },
});