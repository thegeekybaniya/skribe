/**
 * @fileoverview PlayerManager service for handling player sessions and game mechanics
 * 
 * This service handles all player-related operations including:
 * - Managing player sessions and connection states
 * - Handling player joining and leaving room functionality
 * - Tracking player connection state and cleanup on disconnect
 * - Managing player turn rotation logic for drawing rounds
 * - Implementing player scoring system with point calculations
 * - Coordinating with RoomManager for room-level operations
 * 
 * Requirements covered: 1.1, 1.3, 1.4, 1.5, 5.1, 5.2, 9.1
 */

import { Player, Room, PlayerStatus } from '@skribbl-clone/types';
import { EventEmitter } from 'events';
import { RoomManager } from './RoomManager';

/**
 * Interface for scoring configuration
 * Defines point values for different game actions
 */
interface ScoringConfig {
    correctGuessPoints: number;    // Points awarded to player who guesses correctly
    drawerPoints: number;          // Points awarded to drawer when someone guesses correctly
    bonusPointsForSpeed: number;   // Bonus points for quick correct guesses
    speedBonusThreshold: number;   // Time threshold (in seconds) for speed bonus
}

/**
 * Interface for turn rotation configuration
 * Defines how turns are managed in the game
 */
interface TurnConfig {
    roundDuration: number;         // Duration of each drawing round in seconds
    maxRounds: number;             // Maximum number of rounds per game
    minPlayersToStart: number;     // Minimum players needed to start a game
}

/**
 * PlayerManager handles all player lifecycle operations and game mechanics
 * Works closely with RoomManager to coordinate room and player state
 * Extends EventEmitter to notify other services of player changes
 */
export class PlayerManager extends EventEmitter {
    // Reference to RoomManager for room operations
    private roomManager: RoomManager;

    // Configuration for scoring system
    private readonly scoringConfig: ScoringConfig = {
        correctGuessPoints: 10,
        drawerPoints: 5,
        bonusPointsForSpeed: 5,
        speedBonusThreshold: 15 // 15 seconds for speed bonus
    };

    // Configuration for turn management
    private readonly turnConfig: TurnConfig = {
        roundDuration: 60,
        maxRounds: 3,
        minPlayersToStart: 2
    };

    // Track active drawing rounds with timestamps
    private activeRounds: Map<string, { startTime: Date; word: string; drawer: string }> = new Map();

    // Track players who have already guessed correctly in current round
    private correctGuessers: Map<string, Set<string>> = new Map(); // roomId -> Set of playerIds

    constructor(roomManager: RoomManager) {
        super();
        this.roomManager = roomManager;
        
        // Listen to room events to handle player-related cleanup
        this.setupRoomEventListeners();
    }

    /**
     * Handles a player joining a room through the PlayerManager
     * This method coordinates with RoomManager and handles player-specific logic
     * @param roomCode - The room code to join
     * @param playerName - Name of the joining player
     * @param socketId - Socket ID for connection tracking
     * @returns Promise resolving to room and player data
     */
    async joinRoom(roomCode: string, playerName: string, socketId: string): Promise<{ room: Room; player: Player }> {
        try {
            // Use RoomManager to handle the actual room joining
            const { room, player } = await this.roomManager.joinRoom(roomCode, playerName);

            // Initialize player-specific data
            await this.initializePlayerSession(player, room, socketId);

            // Emit event for other services
            this.emit('playerJoined', room, player);

            return { room, player };
        } catch (error) {
            // Re-throw with additional context
            throw new Error(`Failed to join room: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Handles a player leaving a room through the PlayerManager
     * @param playerId - ID of the player leaving
     * @returns Promise resolving to updated room or null if room was deleted
     */
    async leaveRoom(playerId: string): Promise<Room | null> {
        try {
            // Find the room containing this player
            const room = this.findPlayerRoom(playerId);
            if (!room) {
                throw new Error('Player not found in any room');
            }

            // Clean up player-specific data before leaving
            await this.cleanupPlayerSession(playerId, room);

            // Use RoomManager to handle the actual room leaving
            const updatedRoom = await this.roomManager.leaveRoom(playerId);

            // Emit event for other services
            this.emit('playerLeft', room, playerId);

            return updatedRoom;
        } catch (error) {
            throw new Error(`Failed to leave room: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Updates a player's connection status and handles reconnection logic
     * @param playerId - ID of the player
     * @param isConnected - New connection status
     * @param socketId - New socket ID (for reconnections)
     * @returns Promise resolving to updated room
     */
    async updatePlayerConnection(playerId: string, isConnected: boolean, socketId?: string): Promise<Room | null> {
        try {
            // Update connection status through RoomManager
            const room = await this.roomManager.updatePlayerConnection(playerId, isConnected);
            
            if (!room) {
                return null;
            }

            const player = room.players.find(p => p.id === playerId);
            if (!player) {
                return null;
            }

            // Handle reconnection logic
            if (isConnected && socketId) {
                await this.handlePlayerReconnection(player, room, socketId);
            } else if (!isConnected) {
                await this.handlePlayerDisconnection(player, room);
            }

            // Emit event for other services
            this.emit('playerConnectionChanged', room, player, isConnected);

            return room;
        } catch (error) {
            throw new Error(`Failed to update player connection: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Gets the next player in turn rotation for drawing
     * @param roomId - ID of the room
     * @returns Next player to draw, or null if no valid players
     */
    getNextDrawer(roomId: string): Player | null {
        const room = this.roomManager.getRoomById(roomId);
        if (!room) {
            return null;
        }

        // Get all connected players
        const connectedPlayers = room.players.filter(p => p.isConnected);
        
        if (connectedPlayers.length < this.turnConfig.minPlayersToStart) {
            return null;
        }

        // If no current drawer, start with the first player
        if (!room.currentDrawer) {
            return connectedPlayers[0];
        }

        // Find current drawer index
        const currentDrawerIndex = connectedPlayers.findIndex(p => p.id === room.currentDrawer);
        
        // If current drawer not found or is last player, wrap to first player
        if (currentDrawerIndex === -1 || currentDrawerIndex === connectedPlayers.length - 1) {
            return connectedPlayers[0];
        }

        // Return next player in rotation
        return connectedPlayers[currentDrawerIndex + 1];
    }

    /**
     * Starts a new drawing round with the specified player as drawer
     * @param roomId - ID of the room
     * @param drawerId - ID of the player who will draw
     * @param word - Word to be drawn
     * @returns Promise resolving to success status
     */
    async startDrawingRound(roomId: string, drawerId: string, word: string): Promise<boolean> {
        try {
            const room = this.roomManager.getRoomById(roomId);
            if (!room) {
                throw new Error('Room not found');
            }

            const drawer = room.players.find(p => p.id === drawerId);
            if (!drawer) {
                throw new Error('Drawer not found in room');
            }

            // Update room state
            room.currentDrawer = drawerId;
            room.currentWord = word;
            room.roundNumber += 1;

            // Update player statuses
            room.players.forEach(player => {
                if (player.id === drawerId) {
                    player.isDrawing = true;
                    player.status = PlayerStatus.DRAWING;
                } else {
                    player.isDrawing = false;
                    player.status = PlayerStatus.GUESSING;
                }
            });

            // Track the active round
            this.activeRounds.set(roomId, {
                startTime: new Date(),
                word: word,
                drawer: drawerId
            });

            // Clear previous round's correct guessers
            this.correctGuessers.set(roomId, new Set());

            // Emit event for other services
            this.emit('roundStarted', room, drawer, word);

            return true;
        } catch (error) {
            throw new Error(`Failed to start drawing round: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Ends the current drawing round and calculates scores
     * @param roomId - ID of the room
     * @returns Promise resolving to round results
     */
    async endDrawingRound(roomId: string): Promise<{ room: Room; roundResults: any } | null> {
        try {
            const room = this.roomManager.getRoomById(roomId);
            if (!room) {
                return null;
            }

            const activeRound = this.activeRounds.get(roomId);
            if (!activeRound) {
                return null;
            }

            // Calculate final scores for the round
            const roundResults = await this.calculateRoundScores(room, activeRound);

            // Update player statuses back to connected
            room.players.forEach(player => {
                player.isDrawing = false;
                player.status = PlayerStatus.CONNECTED;
            });

            // Clear round data
            room.currentDrawer = null;
            room.currentWord = null;
            this.activeRounds.delete(roomId);
            this.correctGuessers.delete(roomId);

            // Emit event for other services
            this.emit('roundEnded', room, roundResults);

            return { room, roundResults };
        } catch (error) {
            throw new Error(`Failed to end drawing round: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Processes a player's guess and awards points if correct
     * @param playerId - ID of the guessing player
     * @param guess - The player's guess
     * @returns Promise resolving to guess result
     */
    async processGuess(playerId: string, guess: string): Promise<{ isCorrect: boolean; pointsAwarded: number; room: Room | null }> {
        try {
            const room = this.findPlayerRoom(playerId);
            if (!room) {
                return { isCorrect: false, pointsAwarded: 0, room: null };
            }

            const activeRound = this.activeRounds.get(room.id);
            if (!activeRound) {
                return { isCorrect: false, pointsAwarded: 0, room };
            }

            // Don't allow the drawer to guess
            if (playerId === activeRound.drawer) {
                return { isCorrect: false, pointsAwarded: 0, room };
            }

            // Check if player already guessed correctly this round
            const correctGuessersSet = this.correctGuessers.get(room.id) || new Set();
            if (correctGuessersSet.has(playerId)) {
                return { isCorrect: false, pointsAwarded: 0, room };
            }

            // Check if guess is correct (case-insensitive)
            const isCorrect = guess.toLowerCase().trim() === activeRound.word.toLowerCase().trim();
            
            if (!isCorrect) {
                return { isCorrect: false, pointsAwarded: 0, room };
            }

            // Award points for correct guess
            const pointsAwarded = await this.awardPointsForCorrectGuess(room, playerId, activeRound);

            // Mark player as having guessed correctly
            correctGuessersSet.add(playerId);
            this.correctGuessers.set(room.id, correctGuessersSet);

            // Emit event for other services
            this.emit('correctGuess', room, playerId, guess, pointsAwarded);

            return { isCorrect: true, pointsAwarded, room };
        } catch (error) {
            throw new Error(`Failed to process guess: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Gets the current game statistics for a room
     * @param roomId - ID of the room
     * @returns Game statistics or null if room not found
     */
    getGameStats(roomId: string): { room: Room; activeRound: any; correctGuessers: string[] } | null {
        const room = this.roomManager.getRoomById(roomId);
        if (!room) {
            return null;
        }

        const activeRound = this.activeRounds.get(roomId);
        const correctGuessersSet = this.correctGuessers.get(roomId) || new Set();

        return {
            room,
            activeRound: activeRound || null,
            correctGuessers: Array.from(correctGuessersSet)
        };
    }

    /**
     * Checks if a game can be started in a room
     * @param roomId - ID of the room
     * @returns Whether the game can be started
     */
    canStartGame(roomId: string): boolean {
        const room = this.roomManager.getRoomById(roomId);
        if (!room) {
            return false;
        }

        const connectedPlayers = room.players.filter(p => p.isConnected);
        return connectedPlayers.length >= this.turnConfig.minPlayersToStart;
    }

    /**
     * Gets the leaderboard for a room (players sorted by score)
     * @param roomId - ID of the room
     * @returns Array of players sorted by score (highest first)
     */
    getLeaderboard(roomId: string): Player[] {
        const room = this.roomManager.getRoomById(roomId);
        if (!room) {
            return [];
        }

        return [...room.players].sort((a, b) => b.score - a.score);
    }

    // Private helper methods

    /**
     * Sets up event listeners for room events
     */
    private setupRoomEventListeners(): void {
        this.roomManager.on('roomDeleted', (room: Room) => {
            // Clean up player data when room is deleted
            this.activeRounds.delete(room.id);
            this.correctGuessers.delete(room.id);
        });

        this.roomManager.on('playerLeft', (room: Room, player: Player) => {
            // Handle any player-specific cleanup when they leave
            this.handlePlayerLeaving(room, player);
        });
    }

    /**
     * Initializes a player session when they join a room
     * @param player - The player joining
     * @param room - The room being joined
     * @param socketId - Socket ID for connection tracking
     */
    private async initializePlayerSession(player: Player, room: Room, socketId: string): Promise<void> {
        // Set initial player status
        player.status = PlayerStatus.CONNECTED;
        player.isConnected = true;
        
        // Additional initialization logic can be added here
        // For example: tracking socket connections, setting up player preferences, etc.
    }

    /**
     * Cleans up player session data when they leave
     * @param playerId - ID of the leaving player
     * @param room - The room being left
     */
    private async cleanupPlayerSession(playerId: string, room: Room): Promise<void> {
        // If this player was the current drawer, end the round
        if (room.currentDrawer === playerId) {
            await this.endDrawingRound(room.id);
        }

        // Remove from correct guessers if present
        const correctGuessersSet = this.correctGuessers.get(room.id);
        if (correctGuessersSet) {
            correctGuessersSet.delete(playerId);
        }
    }

    /**
     * Handles player reconnection logic
     * @param player - The reconnecting player
     * @param room - The room they're in
     * @param socketId - New socket ID
     */
    private async handlePlayerReconnection(player: Player, room: Room, socketId: string): Promise<void> {
        // Update player status
        player.status = PlayerStatus.CONNECTED;
        
        // If there's an active round and this player was drawing, restore drawing status
        const activeRound = this.activeRounds.get(room.id);
        if (activeRound && activeRound.drawer === player.id) {
            player.status = PlayerStatus.DRAWING;
            player.isDrawing = true;
        } else if (activeRound) {
            player.status = PlayerStatus.GUESSING;
        }
    }

    /**
     * Handles player disconnection logic
     * @param player - The disconnecting player
     * @param room - The room they're in
     */
    private async handlePlayerDisconnection(player: Player, room: Room): Promise<void> {
        player.status = PlayerStatus.DISCONNECTED;
        
        // If this player was drawing, we might want to pause the round
        // For now, we'll let the round continue and handle it in the game service
    }

    /**
     * Finds which room a player is in
     * @param playerId - ID of the player
     * @returns Room containing the player, or null if not found
     */
    private findPlayerRoom(playerId: string): Room | null {
        const allRooms = this.roomManager.getAllRooms();
        return allRooms.find(room => room.players.some(p => p.id === playerId)) || null;
    }

    /**
     * Awards points for a correct guess
     * @param room - The room where the guess occurred
     * @param guesserId - ID of the player who guessed correctly
     * @param activeRound - Current round information
     * @returns Points awarded to the guesser
     */
    private async awardPointsForCorrectGuess(room: Room, guesserId: string, activeRound: any): Promise<number> {
        const guesser = room.players.find(p => p.id === guesserId);
        const drawer = room.players.find(p => p.id === activeRound.drawer);
        
        if (!guesser || !drawer) {
            return 0;
        }

        // Calculate base points
        let guesserPoints = this.scoringConfig.correctGuessPoints;
        const drawerPoints = this.scoringConfig.drawerPoints;

        // Calculate speed bonus
        const roundDuration = (new Date().getTime() - activeRound.startTime.getTime()) / 1000;
        if (roundDuration <= this.scoringConfig.speedBonusThreshold) {
            guesserPoints += this.scoringConfig.bonusPointsForSpeed;
        }

        // Award points
        guesser.score += guesserPoints;
        drawer.score += drawerPoints;

        // Emit scoring events
        this.emit('pointsAwarded', room, guesser, guesserPoints);
        this.emit('pointsAwarded', room, drawer, drawerPoints);

        return guesserPoints;
    }

    /**
     * Calculates final scores for a completed round
     * @param room - The room where the round occurred
     * @param activeRound - Round information
     * @returns Round results summary
     */
    private async calculateRoundScores(room: Room, activeRound: any): Promise<any> {
        const drawer = room.players.find(p => p.id === activeRound.drawer);
        const correctGuessersSet = this.correctGuessers.get(room.id) || new Set();
        const correctGuesserPlayers = room.players.filter(p => correctGuessersSet.has(p.id));

        return {
            roundNumber: room.roundNumber,
            word: activeRound.word,
            drawer: drawer,
            correctGuessers: correctGuesserPlayers,
            scores: room.players.map(p => ({
                playerId: p.id,
                playerName: p.name,
                totalScore: p.score
            }))
        };
    }

    /**
     * Handles cleanup when a player leaves
     * @param room - The room the player left
     * @param player - The player who left
     */
    private handlePlayerLeaving(room: Room, player: Player): void {
        // Remove from correct guessers
        const correctGuessersSet = this.correctGuessers.get(room.id);
        if (correctGuessersSet) {
            correctGuessersSet.delete(player.id);
        }
    }

    /**
     * Cleans up all resources when shutting down
     */
    public shutdown(): void {
        this.activeRounds.clear();
        this.correctGuessers.clear();
        this.removeAllListeners();
    }
}