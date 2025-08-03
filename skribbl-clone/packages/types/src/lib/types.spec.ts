/**
 * @fileoverview Test suite for core game types and interfaces
 * 
 * This file contains comprehensive unit tests for all core data types used throughout
 * the Skribbl.io clone application. Tests validate type contracts, enum values,
 * interface structures, and ensure data integrity across the system.
 * 
 * Requirements Coverage:
 * - 6.3: Real-time drawing synchronization data structures
 * - 6.5: Chat and messaging system type definitions
 * 
 * @author Skribbl Clone Development Team
 * @version 1.0.0
 */

import {
  GameState,
  PlayerStatus,
  Player,
  Room,
  DrawingData,
  ChatMessage,
  RoundResults
} from './types';

/**
 * Test suite for GameState enumeration
 * 
 * Validates that all required game states are properly defined and accessible.
 * The GameState enum controls the flow of the multiplayer drawing game,
 * ensuring proper state transitions during gameplay.
 */
describe('GameState enum', () => {
  /**
   * Verifies that all game state values match expected string representations.
   * These states control the game flow from waiting room to game completion.
   */
  it('should have all required game states', () => {
    expect(GameState.WAITING).toBe('waiting');
    expect(GameState.STARTING).toBe('starting');
    expect(GameState.PLAYING).toBe('playing');
    expect(GameState.ROUND_END).toBe('round_end');
    expect(GameState.GAME_END).toBe('game_end');
  });

  /**
   * Ensures the enum contains exactly the expected number of states.
   * This prevents accidental addition or removal of game states.
   */
  it('should have exactly 5 game states', () => {
    const states = Object.values(GameState);
    expect(states).toHaveLength(5);
  });
});

/**
 * Test suite for PlayerStatus enumeration
 * 
 * Validates player connection and activity states used for real-time
 * multiplayer coordination and UI state management.
 */
describe('PlayerStatus enum', () => {
  /**
   * Verifies that all player status values match expected string representations.
   * These statuses track player connection state and current game activity.
   */
  it('should have all required player statuses', () => {
    expect(PlayerStatus.CONNECTED).toBe('connected');
    expect(PlayerStatus.DISCONNECTED).toBe('disconnected');
    expect(PlayerStatus.DRAWING).toBe('drawing');
    expect(PlayerStatus.GUESSING).toBe('guessing');
  });

  /**
   * Ensures the enum contains exactly the expected number of statuses.
   * This prevents accidental modification of player state definitions.
   */
  it('should have exactly 4 player statuses', () => {
    const statuses = Object.values(PlayerStatus);
    expect(statuses).toHaveLength(4);
  });
});

/**
 * Test suite for Player interface
 * 
 * Validates the core player data structure used throughout the application
 * for user representation, scoring, and game state tracking.
 */
describe('Player interface', () => {
  /**
   * Mock player object used for testing interface compliance.
   * Represents a typical player state during active gameplay.
   */
  const mockPlayer: Player = {
    id: 'player-123',
    name: 'TestPlayer',
    score: 100,
    isDrawing: false,
    isConnected: true,
    status: PlayerStatus.CONNECTED,
    joinedAt: new Date('2024-01-01T00:00:00Z')
  };

  /**
   * Validates that a properly structured player object conforms to the interface.
   * Tests all property types and values for correctness.
   */
  it('should accept valid player object', () => {
    expect(mockPlayer.id).toBe('player-123');
    expect(mockPlayer.name).toBe('TestPlayer');
    expect(mockPlayer.score).toBe(100);
    expect(mockPlayer.isDrawing).toBe(false);
    expect(mockPlayer.isConnected).toBe(true);
    expect(mockPlayer.status).toBe(PlayerStatus.CONNECTED);
    expect(mockPlayer.joinedAt).toBeInstanceOf(Date);
  });

  /**
   * Ensures all required properties are present on the Player interface.
   * This test prevents accidental removal of essential player data fields.
   */
  it('should have all required properties', () => {
    const requiredProps = ['id', 'name', 'score', 'isDrawing', 'isConnected', 'status', 'joinedAt'];
    requiredProps.forEach(prop => {
      expect(mockPlayer).toHaveProperty(prop);
    });
  });
});

/**
 * Test suite for Room interface
 * 
 * Validates the game room data structure that manages multiplayer sessions,
 * including player lists, game state, and room configuration.
 */
describe('Room interface', () => {
  /**
   * Mock room object used for testing interface compliance.
   * Represents a newly created room in waiting state with no players.
   */
  const mockRoom: Room = {
    id: 'room-456',
    code: 'ABC123',
    players: [],
    currentDrawer: null,
    currentWord: null,
    roundNumber: 1,
    maxRounds: 3,
    gameState: GameState.WAITING,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    lastActivity: new Date('2024-01-01T00:05:00Z'),
    maxPlayers: 8
  };

  /**
   * Validates that a properly structured room object conforms to the interface.
   * Tests all property types including nullable fields and date objects.
   */
  it('should accept valid room object', () => {
    expect(mockRoom.id).toBe('room-456');
    expect(mockRoom.code).toBe('ABC123');
    expect(mockRoom.players).toEqual([]);
    expect(mockRoom.currentDrawer).toBeNull();
    expect(mockRoom.currentWord).toBeNull();
    expect(mockRoom.roundNumber).toBe(1);
    expect(mockRoom.maxRounds).toBe(3);
    expect(mockRoom.gameState).toBe(GameState.WAITING);
    expect(mockRoom.createdAt).toBeInstanceOf(Date);
    expect(mockRoom.lastActivity).toBeInstanceOf(Date);
    expect(mockRoom.maxPlayers).toBe(8);
  });

  /**
   * Ensures all required properties are present on the Room interface.
   * This test prevents accidental removal of essential room management fields.
   */
  it('should have all required properties', () => {
    const requiredProps = [
      'id', 'code', 'players', 'currentDrawer', 'currentWord',
      'roundNumber', 'maxRounds', 'gameState', 'createdAt', 'lastActivity', 'maxPlayers'
    ];
    requiredProps.forEach(prop => {
      expect(mockRoom).toHaveProperty(prop);
    });
  });
});

/**
 * Test suite for DrawingData interface
 * 
 * Validates the real-time drawing data structure used for synchronizing
 * drawing strokes across all connected clients. Critical for smooth
 * collaborative drawing experience.
 * 
 * Requirements: 6.3 - Real-time drawing synchronization
 */
describe('DrawingData interface', () => {
  /**
   * Mock drawing data object representing a brush stroke with previous position.
   * Used for testing continuous line drawing synchronization.
   */
  const mockDrawingData: DrawingData = {
    x: 100,
    y: 200,
    prevX: 95,
    prevY: 195,
    color: '#FF0000',
    brushSize: 5,
    isDrawing: true,
    timestamp: Date.now()
  };

  /**
   * Validates that drawing data with all properties conforms to the interface.
   * Tests coordinate values, styling properties, and timing information.
   */
  it('should accept valid drawing data object', () => {
    expect(mockDrawingData.x).toBe(100);
    expect(mockDrawingData.y).toBe(200);
    expect(mockDrawingData.prevX).toBe(95);
    expect(mockDrawingData.prevY).toBe(195);
    expect(mockDrawingData.color).toBe('#FF0000');
    expect(mockDrawingData.brushSize).toBe(5);
    expect(mockDrawingData.isDrawing).toBe(true);
    expect(typeof mockDrawingData.timestamp).toBe('number');
  });

  /**
   * Tests that drawing data works correctly without optional previous coordinates.
   * This handles the case of starting a new stroke or single point drawing.
   */
  it('should work without optional previous coordinates', () => {
    const drawingDataWithoutPrev: DrawingData = {
      x: 100,
      y: 200,
      color: '#FF0000',
      brushSize: 5,
      isDrawing: true,
      timestamp: Date.now()
    };

    expect(drawingDataWithoutPrev.prevX).toBeUndefined();
    expect(drawingDataWithoutPrev.prevY).toBeUndefined();
  });

  /**
   * Ensures all required properties are present on the DrawingData interface.
   * Previous coordinates are optional for stroke start points.
   */
  it('should have all required properties', () => {
    const requiredProps = ['x', 'y', 'color', 'brushSize', 'isDrawing', 'timestamp'];
    requiredProps.forEach(prop => {
      expect(mockDrawingData).toHaveProperty(prop);
    });
  });
});

/**
 * Test suite for ChatMessage interface
 * 
 * Validates the chat message data structure used for player communication
 * and guess validation in the multiplayer game environment.
 * 
 * Requirements: 6.5 - Chat and messaging system
 */
describe('ChatMessage interface', () => {
  /**
   * Mock chat message object representing a regular player message.
   * Used for testing standard chat functionality and message structure.
   */
  const mockChatMessage: ChatMessage = {
    id: 'msg-789',
    playerId: 'player-123',
    playerName: 'TestPlayer',
    message: 'Hello world!',
    isCorrectGuess: false,
    timestamp: new Date('2024-01-01T00:10:00Z')
  };

  /**
   * Validates that a standard chat message conforms to the interface.
   * Tests message metadata, content, and guess validation flag.
   */
  it('should accept valid chat message object', () => {
    expect(mockChatMessage.id).toBe('msg-789');
    expect(mockChatMessage.playerId).toBe('player-123');
    expect(mockChatMessage.playerName).toBe('TestPlayer');
    expect(mockChatMessage.message).toBe('Hello world!');
    expect(mockChatMessage.isCorrectGuess).toBe(false);
    expect(mockChatMessage.timestamp).toBeInstanceOf(Date);
  });

  /**
   * Tests that chat messages can be marked as correct guesses.
   * This is essential for game scoring and visual feedback systems.
   */
  it('should handle correct guess messages', () => {
    const correctGuessMessage: ChatMessage = {
      ...mockChatMessage,
      message: 'cat',
      isCorrectGuess: true
    };

    expect(correctGuessMessage.isCorrectGuess).toBe(true);
  });

  /**
   * Ensures all required properties are present on the ChatMessage interface.
   * This prevents missing essential message metadata or content.
   */
  it('should have all required properties', () => {
    const requiredProps = ['id', 'playerId', 'playerName', 'message', 'isCorrectGuess', 'timestamp'];
    requiredProps.forEach(prop => {
      expect(mockChatMessage).toHaveProperty(prop);
    });
  });
});

/**
 * Test suite for RoundResults interface
 * 
 * Validates the round completion data structure used for displaying
 * end-of-round statistics, scoring, and game progression information.
 */
describe('RoundResults interface', () => {
  /**
   * Mock player object for round results testing.
   * Represents a player who participated in the completed round.
   */
  const mockPlayer: Player = {
    id: 'player-123',
    name: 'TestPlayer',
    score: 100,
    isDrawing: false,
    isConnected: true,
    status: PlayerStatus.CONNECTED,
    joinedAt: new Date()
  };

  /**
   * Mock round results object representing a completed game round.
   * Contains all information needed for end-of-round display and scoring.
   */
  const mockRoundResults: RoundResults = {
    roundNumber: 1,
    word: 'cat',
    drawer: mockPlayer,
    correctGuessers: [mockPlayer],
    scores: [{ playerId: 'player-123', pointsEarned: 50 }]
  };

  /**
   * Validates that round results data conforms to the interface structure.
   * Tests round metadata, player references, and scoring information.
   */
  it('should accept valid round results object', () => {
    expect(mockRoundResults.roundNumber).toBe(1);
    expect(mockRoundResults.word).toBe('cat');
    expect(mockRoundResults.drawer).toEqual(mockPlayer);
    expect(mockRoundResults.correctGuessers).toHaveLength(1);
    expect(mockRoundResults.scores).toHaveLength(1);
    expect(mockRoundResults.scores[0].playerId).toBe('player-123');
    expect(mockRoundResults.scores[0].pointsEarned).toBe(50);
  });

  /**
   * Ensures all required properties are present on the RoundResults interface.
   * This prevents missing essential round completion data for UI display.
   */
  it('should have all required properties', () => {
    const requiredProps = ['roundNumber', 'word', 'drawer', 'correctGuessers', 'scores'];
    requiredProps.forEach(prop => {
      expect(mockRoundResults).toHaveProperty(prop);
    });
  });
});
