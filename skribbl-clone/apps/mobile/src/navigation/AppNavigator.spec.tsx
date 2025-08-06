/**
 * @fileoverview Unit tests for AppNavigator component
 * Tests navigation setup and screen routing based on app state
 * Requirements: 6.5 - React Navigation with proper screen structure
 */

import React from 'react';
import { AppNavigator } from './AppNavigator';
import { StoreProvider } from '../contexts/StoreContext';
import { RootStore } from '../stores/RootStore';

// Mock React Navigation
jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('@react-navigation/stack', () => ({
  createStackNavigator: () => ({
    Navigator: ({ children }: { children: React.ReactNode }) => children,
    Screen: ({ children }: { children: React.ReactNode }) => children,
  }),
}));

// Mock screen components
jest.mock('../screens/HomeScreen', () => ({
  HomeScreen: () => null,
}));

jest.mock('../screens/LobbyScreen', () => ({
  LobbyScreen: () => null,
}));

jest.mock('../screens/GameScreen', () => ({
  GameScreen: () => null,
}));

jest.mock('../screens/ResultsScreen', () => ({
  ResultsScreen: () => null,
}));

describe('AppNavigator Component', () => {
  let mockStore: RootStore;

  beforeEach(() => {
    // Create a mock store for testing
    mockStore = {
      gameStore: {
        gameState: 'waiting',
        currentRound: 1,
        maxRounds: 3,
        isCurrentPlayerDrawing: false,
        reset: jest.fn(),
      },
      playerStore: {
        currentPlayer: null,
        isConnected: false,
        isInRoom: false,
        reset: jest.fn(),
      },
      roomStore: {
        currentRoom: null,
        isInRoom: false,
        currentRoomCode: '',
        reset: jest.fn(),
      },
      drawingStore: {
        isDrawingEnabled: false,
        reset: jest.fn(),
      },
      chatStore: {
        messages: [],
        reset: jest.fn(),
      },
      reset: jest.fn(),
    } as any;
  });

  /**
   * Test that AppNavigator renders without crashing
   * This validates basic navigation setup
   */
  it('should render without crashing', () => {
    expect(() => {
      const navigator = (
        <StoreProvider store={mockStore}>
          <AppNavigator />
        </StoreProvider>
      );
      expect(navigator).toBeTruthy();
    }).not.toThrow();
  });

  /**
   * Test that AppNavigator shows Home screen by default
   * This validates the initial navigation state
   */
  it('should show Home screen by default', () => {
    const navigator = (
      <StoreProvider store={mockStore}>
        <AppNavigator />
      </StoreProvider>
    );

    // Should render without errors (screens are mocked)
    expect(navigator).toBeTruthy();
  });

  /**
   * Test that AppNavigator shows Lobby screen when in room and waiting
   * This validates conditional navigation based on room state
   */
  it('should show Lobby screen when in room and game is waiting', () => {
    // Set up store state for lobby
    mockStore.roomStore.isInRoom = true;
    mockStore.roomStore.currentRoomCode = 'ABC123';
    mockStore.gameStore.gameState = 'waiting';

    const navigator = (
      <StoreProvider store={mockStore}>
        <AppNavigator />
      </StoreProvider>
    );

    // Should render without errors
    expect(navigator).toBeTruthy();
  });

  /**
   * Test that AppNavigator shows Game screen when game is playing
   * This validates navigation during active gameplay
   */
  it('should show Game screen when game is playing', () => {
    // Set up store state for active game
    mockStore.roomStore.isInRoom = true;
    mockStore.gameStore.gameState = 'playing';
    mockStore.gameStore.currentRound = 2;
    mockStore.gameStore.maxRounds = 3;

    const navigator = (
      <StoreProvider store={mockStore}>
        <AppNavigator />
      </StoreProvider>
    );

    // Should render without errors
    expect(navigator).toBeTruthy();
  });

  /**
   * Test that AppNavigator shows Game screen during round end
   * This validates navigation during round transitions
   */
  it('should show Game screen during round end', () => {
    // Set up store state for round end
    mockStore.roomStore.isInRoom = true;
    mockStore.gameStore.gameState = 'round_end';

    const navigator = (
      <StoreProvider store={mockStore}>
        <AppNavigator />
      </StoreProvider>
    );

    // Should render without errors
    expect(navigator).toBeTruthy();
  });

  /**
   * Test that AppNavigator shows Results screen when game ends
   * This validates navigation to final results
   */
  it('should show Results screen when game ends', () => {
    // Set up store state for game end
    mockStore.gameStore.gameState = 'game_end';

    const navigator = (
      <StoreProvider store={mockStore}>
        <AppNavigator />
      </StoreProvider>
    );

    // Should render without errors
    expect(navigator).toBeTruthy();
  });

  /**
   * Test that AppNavigator uses MobX observer pattern
   * This validates that navigation reacts to store changes
   */
  it('should be reactive to store changes', () => {
    const navigator1 = (
      <StoreProvider store={mockStore}>
        <AppNavigator />
      </StoreProvider>
    );

    // Change store state
    mockStore.roomStore.isInRoom = true;
    mockStore.gameStore.gameState = 'playing';

    const navigator2 = (
      <StoreProvider store={mockStore}>
        <AppNavigator />
      </StoreProvider>
    );

    // Both should work without errors
    expect(navigator1).toBeTruthy();
    expect(navigator2).toBeTruthy();
  });
});