/**
 * @fileoverview Player store for managing current player information and state
 * Handles player data, authentication state, and player-specific actions
 * Requirements: 6.7 - MobX for reactive state management
 */

import { makeAutoObservable } from 'mobx';
import { Player } from '@skribbl-clone/types';
import type { RootStore } from './RootStore';

/**
 * PlayerStore manages the current player's information and state
 * This includes player data, connection status, and player preferences
 */
export class PlayerStore {
  // Current player information (null if not joined a room)
  currentPlayer: Player | null = null;
  
  // Player's connection status to the server
  isConnected: boolean = false;
  
  // Player's name (set when joining a room)
  playerName: string = '';
  
  // Whether the player is ready to start the game
  isReady: boolean = false;

  constructor(private rootStore: RootStore) {
    // Make this store observable so React components can react to changes
    makeAutoObservable(this);
  }

  /**
   * Set the current player data
   * Called when successfully joining a room
   */
  setCurrentPlayer(player: Player) {
    this.currentPlayer = player;
    this.playerName = player.name;
  }

  /**
   * Update the player's name
   * Used when entering name before joining a room
   */
  setPlayerName(name: string) {
    this.playerName = name.trim();
  }

  /**
   * Update the player's connection status
   * Called when socket connection changes
   */
  setConnectionStatus(connected: boolean) {
    this.isConnected = connected;
  }

  /**
   * Update the player's score
   * Called when player earns points during the game
   */
  updateScore(newScore: number) {
    if (this.currentPlayer) {
      this.currentPlayer.score = newScore;
    }
  }

  /**
   * Set whether the player is currently drawing
   * Called when it's the player's turn to draw
   */
  setIsDrawing(isDrawing: boolean) {
    if (this.currentPlayer) {
      this.currentPlayer.isDrawing = isDrawing;
    }
  }

  /**
   * Toggle the player's ready status
   * Used in lobby before game starts
   */
  toggleReady() {
    this.isReady = !this.isReady;
  }

  /**
   * Check if the player name is valid for joining a room
   * Name must be between 2-20 characters and not empty
   */
  get isPlayerNameValid(): boolean {
    return this.playerName.length >= 2 && this.playerName.length <= 20;
  }

  /**
   * Check if the player is currently in a room
   * Used to determine which screens to show
   */
  get isInRoom(): boolean {
    return this.currentPlayer !== null;
  }

  /**
   * Get the player's current score
   * Returns 0 if no player is set
   */
  get currentScore(): number {
    return this.currentPlayer?.score || 0;
  }

  /**
   * Check if the current player is drawing
   * Used to enable/disable drawing tools
   */
  get isDrawing(): boolean {
    return this.currentPlayer?.isDrawing || false;
  }

  /**
   * Reset the player store to initial state
   * Called when leaving a room or starting fresh
   */
  reset() {
    this.currentPlayer = null;
    this.isConnected = false;
    this.playerName = '';
    this.isReady = false;
  }
}