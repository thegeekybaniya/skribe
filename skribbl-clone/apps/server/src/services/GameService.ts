/**
 * @fileoverview GameService for managing overall game state and flow
 * 
 * This service handles all game flow operations including:
 * - Managing overall game state and flow transitions
 * - Creating turn-based gameplay logic with 60-second timer per round
 * - Adding round progression and game completion detection
 * - Implementing drawer selection and word assignment for each turn
 * - Creating game state transitions (waiting, playing, round end, game end)
 * - Coordinating between RoomManager, PlayerManager, and WordService
 * 
 * Requirements covered: 4.1, 4.2, 4.3, 4.4, 4.5
 */

import { EventEmitter } from 'events';
import { Room, Player, GameState, RoundResults } from '@skribbl-clone/types';
import { RoomManager } from './RoomManager';
import { PlayerManager } from './PlayerManager';
import { WordService } from './WordService';

/**
 * Interface for game configuration
 */
interface GameConfig {
    roundDuration: number;        // Duration of each round in seconds (60s)
    maxRounds: number;           // Maximum rounds per game (3 rounds)
    minPlayersToStart: number;   // Minimum players needed to start (2 players)
    timeBetweenRounds: number;   // Time between rounds in seconds (5s)
    gameStartDelay: number;      // Delay before game starts in seconds (3s)
}

/**
 * Interface for active game tracking
 */
interface ActiveGame {
    roomId: string;
    currentRound: number;
    currentDrawer: string;
    currentWord: string;
    roundStartTime: Date;
    roundTimer: NodeJS.Timeout | null;
    gameState: GameState;
    playersWhoGuessed: Set<string>;
    roundResults: RoundResults[];
}

/**
 * GameService manages the overall game flow and state transitions
 * Coordinates between RoomManager, PlayerManager, and WordService
 * Handles turn-based gameplay with timers and scoring
 * Extends EventEmitter to notify other services of game events
 */
export class GameService extends EventEmitter {
    // Service dependencies
    private roomManager: RoomManager;
    private playerManager: PlayerManager;
    private wordService: WordService;

    // Game configuration
    private readonly config: GameConfig = {
        roundDuration: 60,        // 60 seconds per round
        maxRounds: 3,            // 3 rounds per game
        minPlayersToStart: 2,    // Need at least 2 players
        timeBetweenRounds: 5,    // 5 seconds between rounds
        gameStartDelay: 3        // 3 seconds before game starts
    };

    // Track active games
    private activeGames: Map<string, ActiveGame> = new Map();

    // Track game timers for cleanup
    private gameTimers: Map<string, NodeJS.Timeout[]> = new Map();

    constructor(roomManager: RoomManager, playerManager: PlayerManager, wordService: WordService) {
        super();
        this.roomManager = roomManager;
        this.playerManager = playerManager;
        this.wordService = wordService;

        // Set up event listeners for other services
        this.setupServiceEventListeners();
    }

    /**
     * Starts a new game in the specified room
     * @param roomId - ID of the room to start the game in
     * @returns Promise resolving to success status
     */
    async startGame(roomId: string): Promise<{ success: boolean; message: string }> {
        try {
            const room = this.roomManager.getRoomById(roomId);
            if (!room) {
                return { success: false, message: 'Room not found' };
            }

            // Check if game can be started
            const canStart = this.canStartGame(room);
            if (!canStart.canStart) {
                return { success: false, message: canStart.reason };
            }

            // Check if game is already active
            if (this.activeGames.has(roomId)) {
                return { success: false, message: 'Game is already in progress' };
            }

            // Update room state to starting
            room.gameState = GameState.STARTING;
            room.roundNumber = 0;

            // Emit game starting event
            this.emit('gameStarting', room);

            // Start the game after a short delay
            const startTimer = setTimeout(() => {
                this.initializeGame(roomId);
            }, this.config.gameStartDelay * 1000);

            // Track the timer for cleanup
            this.addGameTimer(roomId, startTimer);

            return { success: true, message: 'Game starting...' };
        } catch (_error) {
            const errorMessage = _error instanceof Error ? _error.message : 'Failed to start game';
            return { success: false, message: errorMessage };
        }
    }

    /**
     * Ends the current game in the specified room
     * @param roomId - ID of the room to end the game in
     * @returns Promise resolving to success status
     */
    async endGame(roomId: string): Promise<{ success: boolean; finalScores: Player[] }> {
        try {
            const room = this.roomManager.getRoomById(roomId);
            const activeGame = this.activeGames.get(roomId);

            if (!room || !activeGame) {
                return { success: false, finalScores: [] };
            }

            // Clear any active timers
            this.clearGameTimers(roomId);

            // Update room state
            room.gameState = GameState.GAME_END;
            room.currentDrawer = null;
            room.currentWord = null;

            // Calculate final scores
            const finalScores = this.calculateFinalScores(room);

            // Clean up active game
            this.activeGames.delete(roomId);
            this.wordService.clearRecentWords(roomId);

            // Emit game ended event
            this.emit('gameEnded', room, finalScores, activeGame.roundResults);

            // Reset room state after a delay
            setTimeout(() => {
                if (room.players.length > 0) {
                    room.gameState = GameState.WAITING;
                    room.roundNumber = 0;
                    this.emit('roomReset', room);
                }
            }, 10000); // 10 seconds to view results

            return { success: true, finalScores };
        } catch {
            return { success: false, finalScores: [] };
        }
    }

    /**
     * Processes a player's guess during a round
     * @param roomId - ID of the room
     * @param playerId - ID of the guessing player
     * @param guess - The player's guess
     * @returns Promise resolving to guess result
     */
    async processGuess(roomId: string, playerId: string, guess: string): Promise<{
        isCorrect: boolean;
        pointsAwarded: number;
        shouldEndRound: boolean;
    }> {
        try {
            const activeGame = this.activeGames.get(roomId);
            const room = this.roomManager.getRoomById(roomId);

            if (!activeGame || !room || room.gameState !== GameState.PLAYING) {
                return { isCorrect: false, pointsAwarded: 0, shouldEndRound: false };
            }

            // Don't allow the drawer to guess
            if (playerId === activeGame.currentDrawer) {
                return { isCorrect: false, pointsAwarded: 0, shouldEndRound: false };
            }

            // Don't allow players who already guessed correctly
            if (activeGame.playersWhoGuessed.has(playerId)) {
                return { isCorrect: false, pointsAwarded: 0, shouldEndRound: false };
            }

            // Validate the guess
            const isCorrect = this.wordService.validateGuess(guess, activeGame.currentWord);

            if (!isCorrect) {
                return { isCorrect: false, pointsAwarded: 0, shouldEndRound: false };
            }

            // Award points for correct guess
            const pointsAwarded = await this.awardPointsForGuess(room, playerId, activeGame);

            // Mark player as having guessed correctly
            activeGame.playersWhoGuessed.add(playerId);

            // Check if round should end (all players except drawer have guessed)
            const shouldEndRound = this.shouldEndRound(room, activeGame);

            // Emit correct guess event
            this.emit('correctGuess', room, playerId, guess, pointsAwarded);

            // End round if everyone has guessed
            if (shouldEndRound) {
                setTimeout(() => {
                    this.endCurrentRound(roomId);
                }, 1000); // Small delay to show the correct guess
            }

            return { isCorrect: true, pointsAwarded, shouldEndRound };
        } catch {
            return { isCorrect: false, pointsAwarded: 0, shouldEndRound: false };
        }
    }

    /**
     * Gets the current game state for a room
     * @param roomId - ID of the room
     * @returns Current game state information
     */
    getGameState(roomId: string): {
        room: Room | null;
        activeGame: ActiveGame | null;
        timeRemaining: number;
        canStart: boolean;
    } {
        const room = this.roomManager.getRoomById(roomId);
        const activeGame = this.activeGames.get(roomId) || null;
        
        let timeRemaining = 0;
        if (activeGame && activeGame.roundStartTime) {
            const elapsed = (Date.now() - activeGame.roundStartTime.getTime()) / 1000;
            timeRemaining = Math.max(0, this.config.roundDuration - elapsed);
        }

        const canStartResult = room ? this.canStartGame(room) : { canStart: false, reason: 'Room not found' };

        return {
            room,
            activeGame,
            timeRemaining,
            canStart: canStartResult.canStart
        };
    }

    /**
     * Forces the current round to end (admin function)
     * @param roomId - ID of the room
     * @returns Promise resolving to success status
     */
    async forceEndRound(roomId: string): Promise<boolean> {
        try {
            return await this.endCurrentRound(roomId);
        } catch {
            return false;
        }
    }

    /**
     * Gets game statistics for a room
     * @param roomId - ID of the room
     * @returns Game statistics
     */
    getGameStats(roomId: string): {
        totalRounds: number;
        currentRound: number;
        playersCount: number;
        gameState: GameState;
        roundHistory: RoundResults[];
    } {
        const room = this.roomManager.getRoomById(roomId);
        const activeGame = this.activeGames.get(roomId);

        if (!room) {
            return {
                totalRounds: 0,
                currentRound: 0,
                playersCount: 0,
                gameState: GameState.WAITING,
                roundHistory: []
            };
        }

        return {
            totalRounds: this.config.maxRounds,
            currentRound: activeGame?.currentRound || 0,
            playersCount: room.players.filter(p => p.isConnected).length,
            gameState: room.gameState,
            roundHistory: activeGame?.roundResults || []
        };
    }

    // Private helper methods

    /**
     * Initializes a new game after the start delay
     * @param roomId - ID of the room
     */
    private initializeGame(roomId: string): void {
        try {
            const room = this.roomManager.getRoomById(roomId);
            if (!room) {
                return;
            }

            // Create active game tracking
            const activeGame: ActiveGame = {
                roomId,
                currentRound: 0,
                currentDrawer: '',
                currentWord: '',
                roundStartTime: new Date(),
                roundTimer: null,
                gameState: GameState.PLAYING,
                playersWhoGuessed: new Set(),
                roundResults: []
            };

            this.activeGames.set(roomId, activeGame);

            // Update room state
            room.gameState = GameState.PLAYING;

            // Start the first round
            this.startNextRound(roomId);

            // Emit game started event
            this.emit('gameStarted', room);
        } catch {
            // Handle initialization error
            const room = this.roomManager.getRoomById(roomId);
            if (room) {
                room.gameState = GameState.WAITING;
            }
            this.activeGames.delete(roomId);
        }
    }

    /**
     * Starts the next round in the game
     * @param roomId - ID of the room
     */
    private startNextRound(roomId: string): void {
        try {
            const room = this.roomManager.getRoomById(roomId);
            const activeGame = this.activeGames.get(roomId);

            if (!room || !activeGame) {
                return;
            }

            // Increment round number
            activeGame.currentRound += 1;
            room.roundNumber = activeGame.currentRound;

            // Check if game should end
            if (activeGame.currentRound > this.config.maxRounds) {
                this.endGame(roomId);
                return;
            }

            // Get next drawer
            const nextDrawer = this.playerManager.getNextDrawer(roomId);
            if (!nextDrawer) {
                this.endGame(roomId);
                return;
            }

            // Get a word for this round
            const word = this.wordService.getRandomWord(roomId, { difficulty: 'mixed' });

            // Update active game state
            activeGame.currentDrawer = nextDrawer.id;
            activeGame.currentWord = word;
            activeGame.roundStartTime = new Date();
            activeGame.playersWhoGuessed.clear();

            // Update room state
            room.currentDrawer = nextDrawer.id;
            room.currentWord = word;

            // Start the drawer's turn
            this.playerManager.startDrawingRound(roomId, nextDrawer.id, word);

            // Set up round timer
            const roundTimer = setTimeout(() => {
                this.endCurrentRound(roomId);
            }, this.config.roundDuration * 1000);

            activeGame.roundTimer = roundTimer;
            this.addGameTimer(roomId, roundTimer);

            // Emit round started event
            this.emit('roundStarted', room, nextDrawer, word, activeGame.currentRound);

            // Start timer updates
            this.startTimerUpdates(roomId);
        } catch {
            // Handle round start error
            this.endGame(roomId);
        }
    }

    /**
     * Ends the current round and processes results
     * @param roomId - ID of the room
     * @returns Promise resolving to success status
     */
    private async endCurrentRound(roomId: string): Promise<boolean> {
        try {
            const room = this.roomManager.getRoomById(roomId);
            const activeGame = this.activeGames.get(roomId);

            if (!room || !activeGame) {
                return false;
            }

            // Clear round timer
            if (activeGame.roundTimer) {
                clearTimeout(activeGame.roundTimer);
                activeGame.roundTimer = null;
            }

            // End the drawing round through PlayerManager
            const roundResult = await this.playerManager.endDrawingRound(roomId);
            if (roundResult) {
                activeGame.roundResults.push(roundResult.roundResults);
            }

            // Update room state
            room.gameState = GameState.ROUND_END;

            // Emit round ended event
            this.emit('roundEnded', room, roundResult?.roundResults, activeGame.currentRound);

            // Start next round after delay
            const nextRoundTimer = setTimeout(() => {
                if (activeGame.currentRound < this.config.maxRounds) {
                    room.gameState = GameState.PLAYING;
                    this.startNextRound(roomId);
                } else {
                    this.endGame(roomId);
                }
            }, this.config.timeBetweenRounds * 1000);

            this.addGameTimer(roomId, nextRoundTimer);

            return true;
        } catch {
            return false;
        }
    }

    /**
     * Checks if a game can be started in a room
     * @param room - The room to check
     * @returns Whether the game can be started and reason if not
     */
    private canStartGame(room: Room): { canStart: boolean; reason: string } {
        if (room.gameState !== GameState.WAITING) {
            return { canStart: false, reason: 'Game is already in progress' };
        }

        const connectedPlayers = room.players.filter(p => p.isConnected);
        if (connectedPlayers.length < this.config.minPlayersToStart) {
            return { 
                canStart: false, 
                reason: `Need at least ${this.config.minPlayersToStart} players to start` 
            };
        }

        return { canStart: true, reason: '' };
    }

    /**
     * Awards points for a correct guess
     * @param room - The room where the guess occurred
     * @param playerId - ID of the player who guessed correctly
     * @param activeGame - Current active game state
     * @returns Points awarded
     */
    private async awardPointsForGuess(room: Room, playerId: string, activeGame: ActiveGame): Promise<number> {
        const player = room.players.find(p => p.id === playerId);
        const drawer = room.players.find(p => p.id === activeGame.currentDrawer);

        if (!player || !drawer) {
            return 0;
        }

        // Calculate points based on how quickly they guessed
        const roundDuration = (Date.now() - activeGame.roundStartTime.getTime()) / 1000;
        const timeBonus = Math.max(0, this.config.roundDuration - roundDuration);
        
        // Base points + time bonus
        const basePoints = 10;
        const bonusPoints = Math.floor(timeBonus / 10); // 1 bonus point per 10 seconds remaining
        const totalPoints = basePoints + bonusPoints;

        // Award points to guesser
        player.score += totalPoints;

        // Award points to drawer (fewer points)
        drawer.score += Math.floor(totalPoints * 0.5);

        return totalPoints;
    }

    /**
     * Checks if the current round should end
     * @param room - The room to check
     * @param activeGame - Current active game state
     * @returns Whether the round should end
     */
    private shouldEndRound(room: Room, activeGame: ActiveGame): boolean {
        const connectedPlayers = room.players.filter(p => p.isConnected);
        const playersWhoCanGuess = connectedPlayers.filter(p => p.id !== activeGame.currentDrawer);
        
        // End round if all players (except drawer) have guessed correctly
        return activeGame.playersWhoGuessed.size >= playersWhoCanGuess.length;
    }

    /**
     * Calculates final scores for the game
     * @param room - The room to calculate scores for
     * @returns Array of players sorted by score
     */
    private calculateFinalScores(room: Room): Player[] {
        return [...room.players]
            .filter(p => p.isConnected)
            .sort((a, b) => b.score - a.score);
    }

    /**
     * Starts timer updates for a room
     * @param roomId - ID of the room
     */
    private startTimerUpdates(roomId: string): void {
        const timerInterval = setInterval(() => {
            const activeGame = this.activeGames.get(roomId);
            if (!activeGame || !activeGame.roundStartTime) {
                clearInterval(timerInterval);
                return;
            }

            const elapsed = (Date.now() - activeGame.roundStartTime.getTime()) / 1000;
            const timeRemaining = Math.max(0, this.config.roundDuration - elapsed);

            // Emit timer update
            this.emit('timerUpdate', roomId, Math.ceil(timeRemaining));

            // Clear interval when time is up
            if (timeRemaining <= 0) {
                clearInterval(timerInterval);
            }
        }, 1000); // Update every second

        this.addGameTimer(roomId, timerInterval);
    }

    /**
     * Sets up event listeners for other services
     */
    private setupServiceEventListeners(): void {
        // Listen for room deletion to clean up games
        this.roomManager.on('roomDeleted', (room: Room) => {
            this.cleanupGame(room.id);
        });

        // Listen for player disconnections that might affect games
        this.playerManager.on('playerLeft', (room: Room, playerId: string) => {
            this.handlePlayerLeft(room, playerId);
        });
    }

    /**
     * Handles when a player leaves during a game
     * @param room - The room the player left
     * @param playerId - ID of the player who left
     */
    private handlePlayerLeft(room: Room, playerId: string): void {
        const activeGame = this.activeGames.get(room.id);
        if (!activeGame) {
            return;
        }

        // If the drawer left, end the current round
        if (playerId === activeGame.currentDrawer) {
            this.endCurrentRound(room.id);
            return;
        }

        // Check if we still have enough players to continue
        const connectedPlayers = room.players.filter(p => p.isConnected);
        if (connectedPlayers.length < this.config.minPlayersToStart) {
            this.endGame(room.id);
        }
    }

    /**
     * Adds a timer to the game timers tracking
     * @param roomId - ID of the room
     * @param timer - Timer to track
     */
    private addGameTimer(roomId: string, timer: NodeJS.Timeout): void {
        let timers = this.gameTimers.get(roomId);
        if (!timers) {
            timers = [];
            this.gameTimers.set(roomId, timers);
        }
        timers.push(timer);
    }

    /**
     * Clears all timers for a game
     * @param roomId - ID of the room
     */
    private clearGameTimers(roomId: string): void {
        const timers = this.gameTimers.get(roomId);
        if (timers) {
            timers.forEach(timer => clearTimeout(timer));
            this.gameTimers.delete(roomId);
        }
    }

    /**
     * Cleans up a game when room is deleted
     * @param roomId - ID of the room
     */
    private cleanupGame(roomId: string): void {
        this.clearGameTimers(roomId);
        this.activeGames.delete(roomId);
        this.wordService.clearRecentWords(roomId);
    }

    /**
     * Cleans up all resources when shutting down
     */
    public shutdown(): void {
        // Clear all active games and timers
        for (const roomId of this.activeGames.keys()) {
            this.cleanupGame(roomId);
        }
        
        this.activeGames.clear();
        this.gameTimers.clear();
        this.removeAllListeners();
    }
}