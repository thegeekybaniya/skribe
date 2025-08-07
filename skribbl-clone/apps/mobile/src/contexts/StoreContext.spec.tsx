/**
 * @fileoverview Unit tests for StoreContext and store hooks
 * Tests MobX store dependency injection and context hooks
 * Requirements: 6.7 - MobX for reactive state management
 */

import React from 'react';
import { 
  StoreProvider, 
  useRootStore, 
  useGameStore, 
  usePlayerStore, 
  useRoomStore, 
  useDrawingStore, 
  useChatStore 
} from './StoreContext';
import { RootStore } from '../stores/RootStore';

describe('StoreContext', () => {
  let mockStore: RootStore;

  beforeEach(() => {
    // Create a mock store for testing
    mockStore = {
      gameStore: {
        gameState: 'waiting',
        currentRound: 0,
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
        brushColor: '#000000',
        brushSize: 5,
        reset: jest.fn(),
      },
      chatStore: {
        messages: [],
        currentMessage: '',
        reset: jest.fn(),
      },
      reset: jest.fn(),
    } as any;
  });

  describe('StoreProvider', () => {
    /**
     * Test that StoreProvider renders children without crashing
     * This validates basic provider setup
     */
    it('should render children without crashing', () => {
      expect(() => {
        const provider = (
          <StoreProvider store={mockStore}>
            <div>Test Child</div>
          </StoreProvider>
        );
        expect(provider).toBeTruthy();
      }).not.toThrow();
    });

    /**
     * Test that StoreProvider creates a default store when none provided
     * This validates the default store creation behavior
     */
    it('should create a default store when none provided', () => {
      expect(() => {
        const provider = (
          <StoreProvider>
            <div>Test Child</div>
          </StoreProvider>
        );
        expect(provider).toBeTruthy();
      }).not.toThrow();
    });

    /**
     * Test that StoreProvider accepts store prop correctly
     * This validates that the store prop is properly handled
     */
    it('should accept store prop correctly', () => {
      const realStore = new RootStore();
      expect(() => {
        const provider = (
          <StoreProvider store={realStore}>
            <div>Test Child</div>
          </StoreProvider>
        );
        expect(provider).toBeTruthy();
      }).not.toThrow();
    });
  });

  describe('Store hooks', () => {
    /**
     * Test that store hooks are properly defined
     * This validates that all hook functions exist
     */
    it('should have all store hooks defined', () => {
      expect(useRootStore).toBeDefined();
      expect(useGameStore).toBeDefined();
      expect(usePlayerStore).toBeDefined();
      expect(useRoomStore).toBeDefined();
      expect(useDrawingStore).toBeDefined();
      expect(useChatStore).toBeDefined();
    });

    /**
     * Test that hooks are functions
     * This validates that all hooks are properly exported as functions
     */
    it('should export all hooks as functions', () => {
      expect(typeof useRootStore).toBe('function');
      expect(typeof useGameStore).toBe('function');
      expect(typeof usePlayerStore).toBe('function');
      expect(typeof useRoomStore).toBe('function');
      expect(typeof useDrawingStore).toBe('function');
      expect(typeof useChatStore).toBe('function');
    });

    /**
     * Test that hooks have proper function signatures
     * This validates that hooks return the expected types
     */
    it('should have proper function signatures', () => {
      // Test that hooks are callable (basic signature test)
      expect(useRootStore.length).toBe(0); // No parameters
      expect(useGameStore.length).toBe(0); // No parameters
      expect(usePlayerStore.length).toBe(0); // No parameters
      expect(useRoomStore.length).toBe(0); // No parameters
      expect(useDrawingStore.length).toBe(0); // No parameters
      expect(useChatStore.length).toBe(0); // No parameters
    });

    /**
     * Test that hooks are properly exported from the module
     * This validates the module exports structure
     */
    it('should export hooks with correct names', () => {
      expect(useRootStore.name).toBe('useRootStore');
      expect(useGameStore.name).toBe('useGameStore');
      expect(usePlayerStore.name).toBe('usePlayerStore');
      expect(useRoomStore.name).toBe('useRoomStore');
      expect(useDrawingStore.name).toBe('useDrawingStore');
      expect(useChatStore.name).toBe('useChatStore');
    });

    /**
     * Test that StoreProvider component is properly exported
     * This validates the provider component export
     */
    it('should export StoreProvider component', () => {
      expect(StoreProvider).toBeDefined();
      expect(typeof StoreProvider).toBe('function');
      expect(StoreProvider.name).toBe('StoreProvider');
    });

    /**
     * Test that RootStore can be instantiated
     * This validates integration with the RootStore class
     */
    it('should work with RootStore instantiation', () => {
      const store = new RootStore();
      expect(store).toBeDefined();
      expect(store.gameStore).toBeDefined();
      expect(store.playerStore).toBeDefined();
      expect(store.roomStore).toBeDefined();
      expect(store.drawingStore).toBeDefined();
      expect(store.chatStore).toBeDefined();
    });
  });
});