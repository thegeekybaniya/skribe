/**
 * @fileoverview Unit tests for RootStore
 * Tests the main store initialization and coordination between stores
 * Requirements: 6.7 - MobX for reactive state management
 */

import { RootStore } from './RootStore';

describe('RootStore', () => {
  let rootStore: RootStore;

  beforeEach(() => {
    rootStore = new RootStore();
  });

  /**
   * Test that RootStore initializes all individual stores
   * This validates that all required stores are created
   */
  it('should initialize all individual stores', () => {
    expect(rootStore.gameStore).toBeDefined();
    expect(rootStore.playerStore).toBeDefined();
    expect(rootStore.roomStore).toBeDefined();
    expect(rootStore.drawingStore).toBeDefined();
    expect(rootStore.chatStore).toBeDefined();
  });

  /**
   * Test that all stores have access to the root store
   * This validates the dependency injection pattern
   */
  it('should provide root store reference to all individual stores', () => {
    // Each store should have access to the root store for cross-store communication
    expect((rootStore.gameStore as any).rootStore).toBe(rootStore);
    expect((rootStore.playerStore as any).rootStore).toBe(rootStore);
    expect((rootStore.roomStore as any).rootStore).toBe(rootStore);
    expect((rootStore.drawingStore as any).rootStore).toBe(rootStore);
    expect((rootStore.chatStore as any).rootStore).toBe(rootStore);
  });

  /**
   * Test that reset method calls reset on all stores
   * This validates proper cleanup functionality
   */
  it('should reset all stores when reset is called', () => {
    // Spy on reset methods
    const gameStoreSpy = jest.spyOn(rootStore.gameStore, 'reset');
    const playerStoreSpy = jest.spyOn(rootStore.playerStore, 'reset');
    const roomStoreSpy = jest.spyOn(rootStore.roomStore, 'reset');
    const drawingStoreSpy = jest.spyOn(rootStore.drawingStore, 'reset');
    const chatStoreSpy = jest.spyOn(rootStore.chatStore, 'reset');

    // Call reset
    rootStore.reset();

    // Verify all stores were reset
    expect(gameStoreSpy).toHaveBeenCalled();
    expect(playerStoreSpy).toHaveBeenCalled();
    expect(roomStoreSpy).toHaveBeenCalled();
    expect(drawingStoreSpy).toHaveBeenCalled();
    expect(chatStoreSpy).toHaveBeenCalled();
  });

  /**
   * Test that stores can communicate with each other through root store
   * This validates cross-store communication capability
   */
  it('should allow cross-store communication', () => {
    // Set up some state in one store
    rootStore.playerStore.setPlayerName('TestPlayer');
    
    // Other stores should be able to access this through the root store
    expect(rootStore.playerStore.playerName).toBe('TestPlayer');
    
    // Game store should be able to check player state
    expect(rootStore.gameStore.isCurrentPlayerDrawing).toBe(false);
  });
});