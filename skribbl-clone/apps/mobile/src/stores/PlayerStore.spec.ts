/**
 * @fileoverview Unit tests for PlayerStore
 * Tests player state management, authentication, and player-specific actions
 * Requirements: 6.7 - MobX for reactive state management
 */

import { PlayerStore } from './PlayerStore';
import { RootStore } from './RootStore';
import { Player } from '@skribbl-clone/types';

describe('PlayerStore', () => {
  let playerStore: PlayerStore;
  let rootStore: RootStore;

  beforeEach(() => {
    rootStore = new RootStore();
    playerStore = rootStore.playerStore;
  });

  /**
   * Test initial state of PlayerStore
   * This validates default values are set correctly
   */
  it('should initialize with correct default values', () => {
    expect(playerStore.currentPlayer).toBeNull();
    expect(playerStore.isConnected).toBe(false);
    expect(playerStore.playerName).toBe('');
    expect(playerStore.isReady).toBe(false);
  });

  /**
   * Test setting current player data
   * This validates player data assignment
   */
  it('should set current player correctly', () => {
    const mockPlayer: Player = {
      id: 'player123',
      name: 'TestPlayer',
      score: 100,
      isDrawing: false,
      isConnected: true,
      joinedAt: new Date(),
    };

    playerStore.setCurrentPlayer(mockPlayer);

    expect(playerStore.currentPlayer).toStrictEqual(mockPlayer);
    expect(playerStore.playerName).toBe('TestPlayer');
  });

  /**
   * Test setting player name
   * This validates name input handling and trimming
   */
  it('should set player name and trim whitespace', () => {
    playerStore.setPlayerName('  TestPlayer  ');
    expect(playerStore.playerName).toBe('TestPlayer');

    playerStore.setPlayerName('AnotherName');
    expect(playerStore.playerName).toBe('AnotherName');
  });

  /**
   * Test connection status updates
   * This validates connection state management
   */
  it('should update connection status correctly', () => {
    expect(playerStore.isConnected).toBe(false);

    playerStore.setConnectionStatus(true);
    expect(playerStore.isConnected).toBe(true);

    playerStore.setConnectionStatus(false);
    expect(playerStore.isConnected).toBe(false);
  });

  /**
   * Test score updates
   * This validates score management for current player
   */
  it('should update player score when player exists', () => {
    const mockPlayer: Player = {
      id: 'player123',
      name: 'TestPlayer',
      score: 0,
      isDrawing: false,
      isConnected: true,
      joinedAt: new Date(),
    };

    playerStore.setCurrentPlayer(mockPlayer);
    playerStore.updateScore(150);

    expect(playerStore.currentPlayer?.score).toBe(150);
  });

  /**
   * Test score updates when no player is set
   * This validates graceful handling of score updates without player
   */
  it('should handle score updates gracefully when no player is set', () => {
    expect(() => {
      playerStore.updateScore(100);
    }).not.toThrow();

    expect(playerStore.currentPlayer).toBeNull();
  });

  /**
   * Test setting drawing status
   * This validates drawing state management
   */
  it('should set drawing status when player exists', () => {
    const mockPlayer: Player = {
      id: 'player123',
      name: 'TestPlayer',
      score: 0,
      isDrawing: false,
      isConnected: true,
      joinedAt: new Date(),
    };

    playerStore.setCurrentPlayer(mockPlayer);
    playerStore.setIsDrawing(true);

    expect(playerStore.currentPlayer?.isDrawing).toBe(true);

    playerStore.setIsDrawing(false);
    expect(playerStore.currentPlayer?.isDrawing).toBe(false);
  });

  /**
   * Test setting drawing status when no player is set
   * This validates graceful handling of drawing status without player
   */
  it('should handle drawing status updates gracefully when no player is set', () => {
    expect(() => {
      playerStore.setIsDrawing(true);
    }).not.toThrow();

    expect(playerStore.currentPlayer).toBeNull();
  });

  /**
   * Test ready status toggle
   * This validates ready state management for lobby
   */
  it('should toggle ready status correctly', () => {
    expect(playerStore.isReady).toBe(false);

    playerStore.toggleReady();
    expect(playerStore.isReady).toBe(true);

    playerStore.toggleReady();
    expect(playerStore.isReady).toBe(false);
  });

  /**
   * Test player name validation
   * This validates name length requirements
   */
  it('should validate player name correctly', () => {
    // Too short
    playerStore.setPlayerName('A');
    expect(playerStore.isPlayerNameValid).toBe(false);

    // Valid length
    playerStore.setPlayerName('TestPlayer');
    expect(playerStore.isPlayerNameValid).toBe(true);

    // Too long
    playerStore.setPlayerName('A'.repeat(21));
    expect(playerStore.isPlayerNameValid).toBe(false);

    // Empty
    playerStore.setPlayerName('');
    expect(playerStore.isPlayerNameValid).toBe(false);

    // Minimum valid
    playerStore.setPlayerName('AB');
    expect(playerStore.isPlayerNameValid).toBe(true);

    // Maximum valid
    playerStore.setPlayerName('A'.repeat(20));
    expect(playerStore.isPlayerNameValid).toBe(true);
  });

  /**
   * Test room membership check
   * This validates room membership detection
   */
  it('should correctly identify if player is in room', () => {
    expect(playerStore.isInRoom).toBe(false);

    const mockPlayer: Player = {
      id: 'player123',
      name: 'TestPlayer',
      score: 0,
      isDrawing: false,
      isConnected: true,
      joinedAt: new Date(),
    };

    playerStore.setCurrentPlayer(mockPlayer);
    expect(playerStore.isInRoom).toBe(true);
  });

  /**
   * Test current score getter
   * This validates score retrieval with fallback
   */
  it('should return current score or 0 if no player', () => {
    expect(playerStore.currentScore).toBe(0);

    const mockPlayer: Player = {
      id: 'player123',
      name: 'TestPlayer',
      score: 250,
      isDrawing: false,
      isConnected: true,
      joinedAt: new Date(),
    };

    playerStore.setCurrentPlayer(mockPlayer);
    expect(playerStore.currentScore).toBe(250);
  });

  /**
   * Test drawing status getter
   * This validates drawing status retrieval with fallback
   */
  it('should return drawing status or false if no player', () => {
    expect(playerStore.isDrawing).toBe(false);

    const mockPlayer: Player = {
      id: 'player123',
      name: 'TestPlayer',
      score: 0,
      isDrawing: true,
      isConnected: true,
      joinedAt: new Date(),
    };

    playerStore.setCurrentPlayer(mockPlayer);
    expect(playerStore.isDrawing).toBe(true);
  });

  /**
   * Test store reset functionality
   * This validates cleanup when leaving game
   */
  it('should reset to initial state when reset is called', () => {
    // Set up some state
    const mockPlayer: Player = {
      id: 'player123',
      name: 'TestPlayer',
      score: 100,
      isDrawing: true,
      isConnected: true,
      joinedAt: new Date(),
    };

    playerStore.setCurrentPlayer(mockPlayer);
    playerStore.setConnectionStatus(true);
    playerStore.toggleReady();

    // Reset
    playerStore.reset();

    // Verify reset to initial state
    expect(playerStore.currentPlayer).toBeNull();
    expect(playerStore.isConnected).toBe(false);
    expect(playerStore.playerName).toBe('');
    expect(playerStore.isReady).toBe(false);
  });
});