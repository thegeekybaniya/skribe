/**
 * @fileoverview Room store for managing room data and player lists
 * Handles room information, player management, and room state changes
 * Requirements: 6.7 - MobX for reactive state management
 */

import { makeAutoObservable } from 'mobx';
import { Room, Player } from '@skribbl-clone/types';
import type { RootStore } from './RootStore';

/**
 * RoomStore manages room data and the list of players in the room
 * This includes room information, player lists, and room state tracking
 */
export class RoomStore {
  // Current room information (null if not in a room)
  currentRoom: Room | null = null;
  
  // List of all players in the current room
  players: Player[] = [];
  
  // Room code for joining (6-character code)
  roomCode: string = '';
  
  // Whether the room is at maximum capacity (8 players)
  isRoomFull: boolean = false;

  constructor(private rootStore: RootStore) {
    // Make this store observable so React components can react to changes
    makeAutoObservable(this);
  }

  /**
   * Set the current room data
   * Called when successfully creating or joining a room
   */
  setCurrentRoom(room: Room) {
    this.currentRoom = room;
    this.roomCode = room.code;
    this.players = [...room.players];
    this.isRoomFull = room.players.length >= 8;
  }

  /**
   * Update the room code for joining
   * Used when user enters a room code
   */
  setRoomCode(code: string) {
    this.roomCode = code.toUpperCase().trim();
  }

  /**
   * Add a new player to the room
   * Called when another player joins the room
   */
  addPlayer(player: Player) {
    // Check if player already exists (avoid duplicates)
    const existingPlayerIndex = this.players.findIndex(p => p.id === player.id);
    
    if (existingPlayerIndex >= 0) {
      // Update existing player data
      this.players[existingPlayerIndex] = player;
    } else {
      // Add new player
      this.players.push(player);
    }
    
    // Update room full status
    this.isRoomFull = this.players.length >= 8;
    
    // Update current room player list if room exists
    if (this.currentRoom) {
      this.currentRoom.players = [...this.players];
    }
  }

  /**
   * Remove a player from the room
   * Called when a player leaves or disconnects
   */
  removePlayer(playerId: string) {
    this.players = this.players.filter(player => player.id !== playerId);
    this.isRoomFull = false; // Room is no longer full
    
    // Update current room player list if room exists
    if (this.currentRoom) {
      this.currentRoom.players = [...this.players];
    }
  }

  /**
   * Update a specific player's data
   * Called when player score or status changes
   */
  updatePlayer(updatedPlayer: Player) {
    const playerIndex = this.players.findIndex(p => p.id === updatedPlayer.id);
    
    if (playerIndex >= 0) {
      this.players[playerIndex] = updatedPlayer;
      
      // Update current room player list if room exists
      if (this.currentRoom) {
        this.currentRoom.players = [...this.players];
      }
    }
  }

  /**
   * Update the room's game state
   * Called when game state changes (waiting, playing, etc.)
   */
  updateRoomGameState(gameState: any) {
    if (this.currentRoom) {
      this.currentRoom.gameState = gameState;
    }
  }

  /**
   * Check if the room code is valid format
   * Room codes should be exactly 6 characters
   */
  get isRoomCodeValid(): boolean {
    return this.roomCode.length === 6;
  }

  /**
   * Get the number of players currently in the room
   * Used for displaying room capacity
   */
  get playerCount(): number {
    return this.players.length;
  }

  /**
   * Get players sorted by score (highest first)
   * Used for displaying leaderboard
   */
  get playersByScore(): Player[] {
    return [...this.players].sort((a, b) => b.score - a.score);
  }

  /**
   * Check if the current room exists
   * Used to determine if player is in a room
   */
  get isInRoom(): boolean {
    return this.currentRoom !== null;
  }

  /**
   * Get the current room's code
   * Used for displaying and sharing room code
   */
  get currentRoomCode(): string {
    return this.currentRoom?.code || '';
  }

  /**
   * Check if there are enough players to start the game
   * Minimum 2 players required to start
   */
  get canStartGame(): boolean {
    return this.players.length >= 2;
  }

  /**
   * Reset the room store to initial state
   * Called when leaving a room or starting fresh
   */
  reset() {
    this.currentRoom = null;
    this.players = [];
    this.roomCode = '';
    this.isRoomFull = false;
  }
}