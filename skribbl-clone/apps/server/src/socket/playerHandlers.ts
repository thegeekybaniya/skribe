/**
 * @fileoverview Socket.IO event handlers for player management
 * 
 * This module provides Socket.IO event handlers for all player-related operations:
 * - Managing player connection states and sessions
 * - Handling player scoring and turn rotation
 * - Processing player disconnections and reconnections
 * - Coordinating with PlayerManager for player lifecycle events
 * 
 * All handlers include proper input validation and comprehensive error handling
 * with user-friendly error messages.
 * 
 * Requirements covered: 1.1, 1.3, 1.4, 1.5, 5.1, 5.2, 9.1
 */

import { Socket } from 'socket.io';
import { PlayerManager } from '../services/PlayerManager';
import { RoomManager } from '../services/RoomManager';
import logger from '../utils/logger';
import { ClientToServerEvents, ServerToClientEvents, SocketData, Player } from '@skribbl-clone/types';

/**
 * Registers all player-related Socket.IO event handlers
 * @param socket - The Socket.IO socket instance
 * @param playerManager - The PlayerManager service instance
 * @param roomManager - The RoomManager service instance
 */
export function registerPlayerHandlers(
    socket: Socket<ClientToServerEvents, ServerToClientEvents, {}, SocketData>,
    playerManager: PlayerManager,
    roomManager: RoomManager
): void {

    /**
     * Handler for player disconnection with proper cleanup
     * This is called automatically when a socket disconnects
     * 
     * Flow:
     * 1. Check if player is in a room
     * 2. Update player connection status through PlayerManager
     * 3. Handle any ongoing game state (if player was drawing)
     * 4. Notify other players in the room
     * 5. Clean up socket data
     */
    socket.on('disconnect', async (reason) => {
        try {
            const playerId = socket.data.playerId;
            const roomId = socket.data.roomId;
            const playerName = socket.data.playerName;

            if (!playerId || !roomId) {
                logger.info(`Socket disconnected with no player data: ${socket.id}, reason: ${reason}`);
                return;
            }

            logger.info(`Player disconnecting: ${playerName} (${playerId}) from room ${roomId}, reason: ${reason}`);

            // Update player connection status through PlayerManager
            const updatedRoom = await playerManager.updatePlayerConnection(playerId, false);

            if (updatedRoom) {
                // Notify other players in the room about the disconnection
                socket.to(roomId).emit('player:status_changed', playerId, 'disconnected');
                socket.to(roomId).emit('room:updated', updatedRoom);

                // Check if the disconnected player was drawing
                const disconnectedPlayer = updatedRoom.players.find(p => p.id === playerId);
                if (disconnectedPlayer && disconnectedPlayer.isDrawing) {
                    logger.info(`Drawer disconnected: ${playerName}, handling round transition`);
                    
                    // End the current round due to drawer disconnection
                    const roundResult = await playerManager.endDrawingRound(roomId);
                    if (roundResult) {
                        socket.to(roomId).emit('game:round_end', roundResult.roundResults);
                    }
                }
            }

            logger.info(`Player disconnect handled successfully: ${playerId}`);

        } catch (error) {
            logger.error(`Error handling player disconnect for ${socket.data.playerId}:`, error);
        }
    });

    /**
     * Handler for explicit player disconnect event
     * This allows players to explicitly disconnect before closing the app
     */
    socket.on('player:disconnect', async () => {
        try {
            const playerId = socket.data.playerId;
            const roomId = socket.data.roomId;

            if (!playerId || !roomId) {
                logger.warn(`Player attempted explicit disconnect but no player data found (socket: ${socket.id})`);
                return;
            }

            logger.info(`Player explicitly disconnecting: ${socket.data.playerName} (${playerId})`);

            // Remove player from room completely
            const updatedRoom = await playerManager.leaveRoom(playerId);

            // Leave the socket room
            await socket.leave(roomId);

            // Notify remaining players if room still exists
            if (updatedRoom) {
                socket.to(roomId).emit('room:player_left', playerId);
                socket.to(roomId).emit('room:updated', updatedRoom);
            }

            // Clean up socket data
            delete socket.data.playerId;
            delete socket.data.playerName;
            delete socket.data.roomId;

            logger.info(`Player explicit disconnect completed: ${playerId}`);

        } catch (error) {
            logger.error(`Error handling explicit player disconnect for ${socket.data.playerId}:`, error);
            
            const errorMessage = error instanceof Error ? error.message : 'Failed to disconnect';
            socket.emit('connection:error', errorMessage);
        }
    });

    // Note: Connection handling is done in the main socket index.ts file
    // The 'connect' event is handled at the server level, not per-socket

    /**
     * Setup PlayerManager event listeners to emit socket events
     * This allows the PlayerManager to communicate with clients through socket events
     */
    setupPlayerManagerEventListeners(socket, playerManager, roomManager);
}

/**
 * Sets up event listeners for PlayerManager events to emit corresponding socket events
 * @param socket - The Socket.IO socket instance
 * @param playerManager - The PlayerManager service instance
 * @param roomManager - The RoomManager service instance
 */
function setupPlayerManagerEventListeners(
    socket: Socket<ClientToServerEvents, ServerToClientEvents, {}, SocketData>,
    playerManager: PlayerManager,
    roomManager: RoomManager
): void {

    /**
     * Handle player joining events from PlayerManager
     */
    playerManager.on('playerJoined', (room, player) => {
        // Only emit to the specific room
        if (socket.data.roomId === room.id) {
            socket.to(room.id).emit('room:player_joined', player);
            socket.to(room.id).emit('room:updated', room);
        }
    });

    /**
     * Handle player leaving events from PlayerManager
     */
    playerManager.on('playerLeft', (room, playerId) => {
        // Only emit to the specific room
        if (socket.data.roomId === room.id) {
            socket.to(room.id).emit('room:player_left', playerId);
            socket.to(room.id).emit('room:updated', room);
        }
    });

    /**
     * Handle player connection status changes from PlayerManager
     */
    playerManager.on('playerConnectionChanged', (room, player, isConnected) => {
        // Only emit to the specific room
        if (socket.data.roomId === room.id) {
            const status = isConnected ? 'connected' : 'disconnected';
            socket.to(room.id).emit('player:status_changed', player.id, status);
            socket.to(room.id).emit('room:updated', room);
        }
    });

    /**
     * Handle round started events from PlayerManager
     */
    playerManager.on('roundStarted', (room, drawer, word) => {
        // Only emit to the specific room
        if (socket.data.roomId === room.id) {
            // Send different information to drawer vs other players
            if (socket.data.playerId === drawer.id) {
                // Drawer gets the actual word
                socket.emit('game:round_started', drawer, room.roundNumber);
                socket.emit('game:started', drawer, word);
            } else {
                // Other players don't get the word
                socket.to(room.id).emit('game:round_started', drawer, room.roundNumber);
            }
        }
    });

    /**
     * Handle round ended events from PlayerManager
     */
    playerManager.on('roundEnded', (room, roundResults) => {
        // Only emit to the specific room
        if (socket.data.roomId === room.id) {
            socket.to(room.id).emit('game:round_end', roundResults);
            socket.emit('game:round_end', roundResults);
        }
    });

    /**
     * Handle correct guess events from PlayerManager
     */
    playerManager.on('correctGuess', (room, playerId, guess, pointsAwarded) => {
        // Only emit to the specific room
        if (socket.data.roomId === room.id) {
            const player = room.players.find((p: Player) => p.id === playerId);
            if (player) {
                socket.to(room.id).emit('chat:correct_guess', playerId, player.name);
                socket.to(room.id).emit('player:score_updated', playerId, player.score);
                socket.emit('chat:correct_guess', playerId, player.name);
                socket.emit('player:score_updated', playerId, player.score);
            }
        }
    });

    /**
     * Handle points awarded events from PlayerManager
     */
    playerManager.on('pointsAwarded', (room, player, pointsAwarded) => {
        // Only emit to the specific room
        if (socket.data.roomId === room.id) {
            socket.to(room.id).emit('player:score_updated', player.id, player.score);
            
            // If this is the current socket's player, also emit to them
            if (socket.data.playerId === player.id) {
                socket.emit('player:score_updated', player.id, player.score);
            }
        }
    });
}

/**
 * Utility function to get player information for a socket
 * @param socket - The Socket.IO socket instance
 * @param playerManager - The PlayerManager service instance
 * @returns Player and room information if available
 */
export function getSocketPlayerInfo(
    socket: Socket<ClientToServerEvents, ServerToClientEvents, {}, SocketData>,
    playerManager: PlayerManager
) {
    const roomId = socket.data.roomId;
    const playerId = socket.data.playerId;
    
    if (!roomId || !playerId) {
        return null;
    }
    
    const gameStats = playerManager.getGameStats(roomId);
    if (!gameStats) {
        return null;
    }
    
    const player = gameStats.room.players.find(p => p.id === playerId);
    if (!player) {
        return null;
    }
    
    return {
        room: gameStats.room,
        player,
        activeRound: gameStats.activeRound,
        correctGuessers: gameStats.correctGuessers
    };
}

/**
 * Utility function to check if a player can perform a specific action
 * @param socket - The Socket.IO socket instance
 * @param playerManager - The PlayerManager service instance
 * @param action - The action to check ('draw', 'guess', 'start_game', etc.)
 * @returns Whether the player can perform the action
 */
export function canPlayerPerformAction(
    socket: Socket<ClientToServerEvents, ServerToClientEvents, {}, SocketData>,
    playerManager: PlayerManager,
    action: string
): boolean {
    const playerInfo = getSocketPlayerInfo(socket, playerManager);
    if (!playerInfo) {
        return false;
    }

    const { room, player, activeRound } = playerInfo;

    switch (action) {
        case 'draw':
            return player.isDrawing && activeRound !== null;
        
        case 'guess':
            return !player.isDrawing && activeRound !== null;
        
        case 'start_game':
            return playerManager.canStartGame(room.id) && !activeRound;
        
        default:
            return false;
    }
}