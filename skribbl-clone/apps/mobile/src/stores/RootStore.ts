/**
 * @fileoverview Root store that combines all individual MobX stores
 * This is the main entry point for state management in the app
 * Requirements: 6.7 - MobX for reactive state management
 */

import { GameStore } from './GameStore';
import { PlayerStore } from './PlayerStore';
import { RoomStore } from './RoomStore';
import { DrawingStore } from './DrawingStore';
import { ChatStore } from './ChatStore';

/**
 * RootStore combines all individual stores and provides dependency injection
 * This follows the MobX pattern of having a single root store that contains all other stores
 */
export class RootStore {
  // Individual stores that manage different aspects of the app state
  public gameStore: GameStore;
  public playerStore: PlayerStore;
  public roomStore: RoomStore;
  public drawingStore: DrawingStore;
  public chatStore: ChatStore;

  constructor() {
    // Initialize all stores and pass the root store for cross-store communication
    this.gameStore = new GameStore(this);
    this.playerStore = new PlayerStore(this);
    this.roomStore = new RoomStore(this);
    this.drawingStore = new DrawingStore(this);
    this.chatStore = new ChatStore(this);
  }

  /**
   * Reset all stores to their initial state
   * Useful when leaving a game or starting fresh
   */
  reset() {
    this.gameStore.reset();
    this.playerStore.reset();
    this.roomStore.reset();
    this.drawingStore.reset();
    this.chatStore.reset();
  }
}