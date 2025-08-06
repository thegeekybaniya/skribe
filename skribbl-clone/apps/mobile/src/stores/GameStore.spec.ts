/**
 * @fileoverview Unit tests for GameStore
 * Tests game state management, timers, and game flow logic
 * Requirements: 6.7 - MobX for reactive state management
 */

import { GameStore } from './GameStore';
import { RootStore } from './RootStore';
import { GameState } from '@skribbl-clone/types';

// Mock timers
jest.useFakeTimers();

describe('GameStore', () => {
  let gameStore: GameStore;
  let rootStore: RootStore;

  beforeEach(() => {
    rootStore = new RootStore();
    gameStore = rootStore.gameStore;
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  /**
   * Test initial state of GameStore
   * This validates default values are set correctly
   */
  it('should initialize with correct default values', () => {
    expect(gameStore.gameState).toBe(GameState.WAITING);
    expect(gameStore.currentRound).toBe(0);
    expect(gameStore.maxRounds).toBe(3);
    expect(gameStore.timeRemaining).toBe(60);
    expect(gameStore.currentWord).toBeNull();
    expect(gameStore.currentDrawerId).toBeNull();
  });

  /**
   * Test starting a new game
   * This validates game initialization logic
   */
  it('should start a new game correctly', () => {
    gameStore.startGame(5);

    expect(gameStore.maxRounds).toBe(5);
    expect(gameStore.currentRound).toBe(1);
    expect(gameStore.gameState).toBe(GameState.PLAYING);
    expect(gameStore.timeRemaining).toBe(60);
  });

  /**
   * Test timer countdown functionality
   * This validates the round timer works correctly
   */
  it('should countdown timer correctly', () => {
    gameStore.startGame();

    // Fast-forward time
    jest.advanceTimersByTime(5000); // 5 seconds

    expect(gameStore.timeRemaining).toBe(55);
  });

  /**
   * Test round ending when timer reaches zero
   * This validates automatic round progression
   */
  it('should end round when timer reaches zero', () => {
    gameStore.startGame();

    // Fast-forward to end of round
    jest.advanceTimersByTime(60000); // 60 seconds

    expect(gameStore.gameState).toBe(GameState.ROUND_END);
  });

  /**
   * Test game ending after all rounds
   * This validates game completion logic
   */
  it('should end game after all rounds are completed', () => {
    gameStore.startGame(1); // Only 1 round

    // Fast-forward to end of round
    jest.advanceTimersByTime(60000);

    expect(gameStore.gameState).toBe(GameState.GAME_END);
  });

  /**
   * Test setting current drawer
   * This validates drawer assignment functionality
   */
  it('should set current drawer and word correctly', () => {
    const playerId = 'player123';
    const word = 'cat';

    gameStore.setCurrentDrawer(playerId, word);

    expect(gameStore.currentDrawerId).toBe(playerId);
    expect(gameStore.currentWord).toBe(word);
  });

  /**
   * Test checking if current player is drawing
   * This validates drawing permission logic
   */
  it('should correctly identify if current player is drawing', () => {
    // Mock player store
    rootStore.playerStore.currentPlayer = { id: 'player123' } as any;
    
    // Set different player as drawer
    gameStore.setCurrentDrawer('player456', 'word');
    expect(gameStore.isCurrentPlayerDrawing).toBe(false);

    // Set current player as drawer
    gameStore.setCurrentDrawer('player123', 'word');
    expect(gameStore.isCurrentPlayerDrawing).toBe(true);
  });

  /**
   * Test formatted time remaining
   * This validates time display formatting
   */
  it('should format time remaining correctly', () => {
    gameStore.timeRemaining = 65; // 1:05
    expect(gameStore.formattedTimeRemaining).toBe('1:05');

    gameStore.timeRemaining = 30; // 0:30
    expect(gameStore.formattedTimeRemaining).toBe('0:30');

    gameStore.timeRemaining = 5; // 0:05
    expect(gameStore.formattedTimeRemaining).toBe('0:05');
  });

  /**
   * Test store reset functionality
   * This validates cleanup when leaving game
   */
  it('should reset to initial state when reset is called', () => {
    // Set up some state
    gameStore.startGame(5);
    gameStore.setCurrentDrawer('player123', 'word');

    // Reset
    gameStore.reset();

    // Verify reset to initial state
    expect(gameStore.gameState).toBe(GameState.WAITING);
    expect(gameStore.currentRound).toBe(0);
    expect(gameStore.maxRounds).toBe(3);
    expect(gameStore.timeRemaining).toBe(60);
    expect(gameStore.currentWord).toBeNull();
    expect(gameStore.currentDrawerId).toBeNull();
  });

  /**
   * Test timer cleanup on reset
   * This validates proper timer cleanup
   */
  it('should clear timer when reset is called', () => {
    gameStore.startGame();
    
    // Verify timer is running
    expect(gameStore.timerInterval).not.toBeNull();

    gameStore.reset();

    // Verify timer is cleared
    expect(gameStore.timerInterval).toBeNull();
  });
});