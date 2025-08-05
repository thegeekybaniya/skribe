/**
 * @fileoverview Socket.IO event handlers for game flow management
 * 
 * This module provides Socket.IO event handlers for all game flow operations:
 * - Starting and ending games
 * - Managing round transitions and timers
 * - Handling drawing turns and word assignments
 * - Processing chat messages and guesses
 * - Broadcasting game state changes to all players
 * 
 * Requirements covered: 4.1, 4.2, 4.3, 4.4, 4.5
 */

import { Socket } from 'socket.io';
import { GameService } from '../services/GameService';
import { RoomManager } from '../services/RoomManager';
import { PlayerManager } from '../services/PlayerManager';
import { WordService } from '../services/WordService';
import logger from '../utils/logger';
import { ClientToServerEvents, ServerToClientEvents, SocketData, GameState, ChatMessage } from '@skribbl-clone/types';

/**
 * Registers all game flow related Socket.IO event handlers
 * @param socket - The Socket.IO socket instance
 * @param gameService - The GameService instance
 * @param roomManager - The RoomManager instance
 * @param playerManager - The PlayerManager instance
 * @param wordService - The WordService instance
 */
export function registerGameHandlers(
    socket: Socket<ClientToServerEvents, ServerToClientEvents, {}, SocketData>,
    gameService: GameService,
    roomManager: RoomManager,
    playerManager: PlayerManager,
    wordService: WordService
): void {

    /**
     * Handler for 'game:start' event
     * Starts a new game in the player's current room
     * 
     * Flow:
     * 1. Validate that player is in a room
     * 2. Check if player has permission to start game (room creator or admin)
     * 3. Start the game using GameService
     * 4. Broadcast game start to all players in room
     */
    socket.on('game:start', async () => {
        try {
            const roomId = socket.data.roomId;
            const playerId = socket.data.playerId;

            if (!roomId || !playerId) {
                socket.emit('room:error', 'You must be in a room to start a game');
                return;
            }

            logger.info(`Player ${playerId} attempting to start game in room ${roomId}`);

            // Get room information
            const room = roomManager.getRoomById(roomId);
            if (!room) {
                socket.emit('room:error', 'Room not found');
                return;
            }

            // For now, any player can start the game
            // In the future, we might want to restrict this to room creator
            const result = await gameService.startGame(roomId);

            if (!result.success) {
                socket.emit('room:error', result.message);
                return;
            }

            logger.info(`Game started successfully in room ${roomId}`);

            // The GameService will emit events that we listen to and broadcast
            // No need to manually broadcast here as the service events handle it

        } catch (error) {
            logger.error(`Error starting game in room ${socket.data.roomId}:`, error);
            socket.emit('room:error', 'Failed to start game');
        }
    });

    /**
     * Handler for 'chat:message' event
     * Processes chat messages and checks for correct guesses
     * 
     * Flow:
     * 1. Validate that player is in a room and game is active
     * 2. Process the message as a potential guess
     * 3. If it's a correct guess, award points and notify players
     * 4. If it's a regular chat message, broadcast to all players
     * 5. Handle special cases (drawer trying to chat, etc.)
     */
    socket.on('chat:message', async (message: string) => {
        try {
            const roomId = socket.data.roomId;
            const playerId = socket.data.playerId;
            const playerName = socket.data.playerName;

            if (!roomId || !playerId || !playerName) {
                socket.emit('room:error', 'You must be in a room to send messages');
                return;
            }

            // Validate message
            if (!message || message.trim().length === 0) {
                return;
            }

            if (message.trim().length > 100) {
                socket.emit('room:error', 'Message too long (max 100 characters)');
                return;
            }

            const room = roomManager.getRoomById(roomId);
            if (!room) {
                socket.emit('room:error', 'Room not found');
                return;
            }

            logger.info(`Chat message from ${playerName} in room ${roomId}: ${message}`);

            // Check if this is during an active game
            const gameState = gameService.getGameState(roomId);
            
            if (gameState.room?.gameState === GameState.PLAYING && gameState.activeGame) {
                // Don't allow the drawer to send chat messages (to prevent giving hints)
                if (playerId === gameState.activeGame.currentDrawer) {
                    socket.emit('room:error', 'You cannot send messages while drawing');
                    return;
                }

                // Process as a potential guess
                const guessResult = await gameService.processGuess(roomId, playerId, message.trim());

                if (guessResult.isCorrect) {
                    // Create correct guess message
                    const correctGuessMessage: ChatMessage = {
                        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        playerId,
                        playerName,
                        message: message.trim(),
                        isCorrectGuess: true,
                        timestamp: new Date()
                    };

                    // Broadcast correct guess to all players
                    socket.to(roomId).emit('chat:message', correctGuessMessage);
                    socket.emit('chat:message', correctGuessMessage);

                    // Notify about correct guess with points
                    socket.to(roomId).emit('chat:correct_guess', playerId, playerName);
                    socket.emit('chat:correct_guess', playerId, playerName);

                    // Update player score for all clients
                    const updatedRoom = roomManager.getRoomById(roomId);
                    if (updatedRoom) {
                        const player = updatedRoom.players.find(p => p.id === playerId);
                        if (player) {
                            socket.to(roomId).emit('player:score_updated', playerId, player.score);
                            socket.emit('player:score_updated', playerId, player.score);
                        }
                    }

                    logger.info(`Correct guess by ${playerName} in room ${roomId}: ${message} (+${guessResult.pointsAwarded} points)`);
                    return;
                }
            }

            // Regular chat message
            const chatMessage: ChatMessage = {
                id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                playerId,
                playerName,
                message: message.trim(),
                isCorrectGuess: false,
                timestamp: new Date()
            };

            // Broadcast to all players in the room
            socket.to(roomId).emit('chat:message', chatMessage);
            socket.emit('chat:message', chatMessage);

        } catch (error) {
            logger.error(`Error processing chat message from ${socket.data.playerId}:`, error);
            socket.emit('room:error', 'Failed to send message');
        }
    });

    /**
     * Handler for 'game:ready' event
     * Indicates that a player is ready for the next round
     * This could be used for ready-check systems in the future
     */
    socket.on('game:ready', async () => {
        try {
            const roomId = socket.data.roomId;
            const playerId = socket.data.playerId;

            if (!roomId || !playerId) {
                return;
            }

            logger.info(`Player ${playerId} is ready in room ${roomId}`);

            // For now, this is just logged
            // In the future, we might implement a ready-check system
            // where all players need to be ready before starting the next round

        } catch (error) {
            logger.error(`Error handling ready event from ${socket.data.playerId}:`, error);
        }
    });
}

/**
 * Sets up GameService event listeners to broadcast game events to clients
 * @param gameService - The GameService instance
 * @param io - The Socket.IO server instance
 */
export function setupGameServiceListeners(gameService: GameService, io: any): void {
    
    /**
     * Broadcasts when a game is starting
     */
    gameService.on('gameStarting', (room) => {
        logger.info(`Broadcasting game starting for room ${room.id}`);
        io.to(room.id).emit('room:updated', room);
    });

    /**
     * Broadcasts when a game has started
     */
    gameService.on('gameStarted', (room) => {
        logger.info(`Broadcasting game started for room ${room.id}`);
        io.to(room.id).emit('room:updated', room);
    });

    /**
     * Broadcasts when a new round starts
     */
    gameService.on('roundStarted', (room, drawer, word, roundNumber) => {
        logger.info(`Broadcasting round ${roundNumber} started in room ${room.id}, drawer: ${drawer.name}`);
        
        // Send the word only to the drawer
        const drawerSocket = Array.from(io.sockets.sockets.values())
            .find((s: any) => s.data.playerId === drawer.id) as any;
        
        if (drawerSocket) {
            drawerSocket.emit('game:started', drawer, word);
        }

        // Send round start info to all players (without the word)
        io.to(room.id).emit('game:round_started', drawer, roundNumber);
        io.to(room.id).emit('room:updated', room);
    });

    /**
     * Broadcasts when a round ends
     */
    gameService.on('roundEnded', (room, roundResults, roundNumber) => {
        logger.info(`Broadcasting round ${roundNumber} ended in room ${room.id}`);
        
        io.to(room.id).emit('game:round_end', roundResults);
        io.to(room.id).emit('room:updated', room);
    });

    /**
     * Broadcasts when a game ends
     */
    gameService.on('gameEnded', (room, finalScores, roundHistory) => {
        logger.info(`Broadcasting game ended in room ${room.id}`);
        
        io.to(room.id).emit('game:end', finalScores);
        io.to(room.id).emit('room:updated', room);
    });

    /**
     * Broadcasts timer updates
     */
    gameService.on('timerUpdate', (roomId, timeRemaining) => {
        io.to(roomId).emit('game:timer_update', timeRemaining);
    });

    /**
     * Broadcasts when a player makes a correct guess
     */
    gameService.on('correctGuess', (room, playerId, guess, pointsAwarded) => {
        logger.info(`Player ${playerId} made correct guess in room ${room.id}: ${guess} (+${pointsAwarded} points)`);
        
        // Room update is handled by the chat message handler
        // This event is mainly for logging and potential future features
    });

    /**
     * Broadcasts when room is reset after game
     */
    gameService.on('roomReset', (room) => {
        logger.info(`Broadcasting room reset for room ${room.id}`);
        io.to(room.id).emit('room:updated', room);
    });
}

/**
 * Utility function to get game information for a socket
 * @param socket - The Socket.IO socket instance
 * @param gameService - The GameService instance
 * @returns Game information if player is in an active game, null otherwise
 */
export function getSocketGameInfo(
    socket: Socket<ClientToServerEvents, ServerToClientEvents, {}, SocketData>,
    gameService: GameService
): any {
    const roomId = socket.data.roomId;
    const playerId = socket.data.playerId;
    
    if (!roomId || !playerId) {
        return null;
    }
    
    return gameService.getGameState(roomId);
}