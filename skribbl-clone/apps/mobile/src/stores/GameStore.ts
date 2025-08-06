/**
 * @fileoverview Game store for managing overall game state and flow
 * Handles game phases, rounds, timers, and coordinates between other stores
 * Requirements: 6.7 - MobX for reactive state management
 */

import { makeAutoObservable } from 'mobx';
import { GameState } from '@skribbl-clone/types';
import type { RootStore } from './RootStore';

/**
 * GameStore manages the overall game state and flow
 * This includes game phases, round management, and timer coordination
 */
export class GameStore {
  // Current game state (waiting, playing, round_end, etc.)
  gameState: GameState = GameState.WAITING;
  
  // Current round information
  currentRound: number = 0;
  maxRounds: number = 3;
  
  // Timer state for drawing rounds (60 seconds per round)
  timeRemaining: number = 60;
  timerInterval: NodeJS.Timeout | null = null;
  
  // Current word being drawn (only visible to drawer)
  currentWord: string | null = null;
  
  // ID of the player who is currently drawing
  currentDrawerId: string | null = null;

  constructor(private rootStore: RootStore) {
    // Make this store observable so React components can react to changes
    makeAutoObservable(this);
  }

  /**
   * Start a new game with the specified number of rounds
   * Transitions from waiting state to playing state
   */
  startGame(maxRounds: number = 3) {
    this.maxRounds = maxRounds;
    this.currentRound = 1;
    this.gameState = GameState.PLAYING;
    this.startRound();
  }

  /**
   * Start a new drawing round
   * Sets up the timer and selects the next drawer
   */
  startRound() {
    this.timeRemaining = 60;
    this.startTimer();
  }

  /**
   * Start the countdown timer for the current round
   * Timer counts down from 60 seconds to 0
   */
  private startTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    
    this.timerInterval = setInterval(() => {
      this.timeRemaining--;
      
      // End round when timer reaches 0
      if (this.timeRemaining <= 0) {
        this.endRound();
      }
    }, 1000);
  }

  /**
   * End the current round and progress to next round or end game
   * Clears the timer and updates game state
   */
  endRound() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    this.gameState = GameState.ROUND_END;
    
    // Check if this was the last round
    if (this.currentRound >= this.maxRounds) {
      this.endGame();
    } else {
      // Move to next round after a brief delay
      setTimeout(() => {
        this.currentRound++;
        this.gameState = GameState.PLAYING;
        this.startRound();
      }, 3000);
    }
  }

  /**
   * End the entire game and show final results
   * Transitions to game end state
   */
  endGame() {
    this.gameState = GameState.GAME_END;
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  /**
   * Set the current drawer and word for the round
   * Called when server assigns drawing turn to a player
   */
  setCurrentDrawer(playerId: string, word: string) {
    this.currentDrawerId = playerId;
    this.currentWord = word;
  }

  /**
   * Check if the current player is the drawer
   * Used to enable/disable drawing tools
   */
  get isCurrentPlayerDrawing(): boolean {
    return this.currentDrawerId === this.rootStore.playerStore.currentPlayer?.id;
  }

  /**
   * Get formatted time remaining as MM:SS
   * Used for displaying the countdown timer
   */
  get formattedTimeRemaining(): string {
    const minutes = Math.floor(this.timeRemaining / 60);
    const seconds = this.timeRemaining % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Reset the game store to initial state
   * Called when leaving a game or starting fresh
   */
  reset() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    
    this.gameState = GameState.WAITING;
    this.currentRound = 0;
    this.maxRounds = 3;
    this.timeRemaining = 60;
    this.currentWord = null;
    this.currentDrawerId = null;
  }
}