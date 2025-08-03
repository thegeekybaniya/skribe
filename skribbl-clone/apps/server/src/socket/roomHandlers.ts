/**
 * @fileoverview Socket.IO event handlers for room management
 * 
 * This module provides Socket.IO event handlers for all room-related operations:
 * - Creating new game rooms
 * - Joining existing rooms
 * - Leaving rooms
 * - Handling player disconnections
 * 
 * All handlers include proper input validation using Zod schemas and
 * comprehensive error handling with user-friendly error messages.
 * 
 * Requirements covered: 1.1, 1.2, 1.3, 1.4, 1.5, 9.2, 9.3
 */

import { Socket } from 'socket.io';
import { RoomManager } from '../services/RoomManager';
import {
    safeValidate,
    CreateRoomRequestSchema,
    JoinRoomRequestSchema
} from '../validation/roomValidation';
import logger from '../utils/logger';
import { ClientToServerEvents, ServerToClientEvents, SocketData } from '@skribbl-clone/types';

/**
 * Registers all room-related Socket.IO event handlers
 * @param socket - The Socket.IO socket instance
 * @param roomManager - The RoomManager service instance
 */
export function registerRoomHandlers(
    socket: Socket<ClientToServerEvents, ServerToClientEvents, {}, SocketData>,
    roomManager: RoomManager
): void {
    
    /**
     * Handler for 'room:create' event
     * Creates a new game room with the requesting player as the creator
     * 
     * Flow:
     * 1. Validate the player name using Zod schema
     * 2. Create a new room using RoomManager
     * 3. Store player and room info in socket data
     * 4. Join the socket to the room for broadcasting
     * 5. Emit success response with room details
     */
    socket.on('room:create', async (playerName: string) => {
        try {
            logger.info(`Player attempting to create room: ${playerName} (socket: ${socket.id})`);

            // Validate the player name using our Zod schema
            const validation = safeValidate(CreateRoomRequestSchema, { playerName });
            if (!validation.success) {
                logger.warn(`Room creation failed - invalid player name: ${validation.error}`);
                socket.emit('room:error', validation.error);
                return;
            }

            const { playerName: validatedPlayerName } = validation.data;

            // Create the room using RoomManager
            const room = await roomManager.createRoom(validatedPlayerName);
            
            // Find the creator player (first player in the room)
            const creator = room.players[0];
            
            // Store player and room information in socket data for future reference
            socket.data.playerId = creator.id;
            socket.data.playerName = creator.name;
            socket.data.roomId = room.id;

            // Join the socket to the room for broadcasting
            await socket.join(room.id);

            logger.info(`Room created successfully: ${room.code} by ${creator.name}`);

            // Emit success response to the creator
            socket.emit('room:created', room);

        } catch (error) {
            logger.error(`Error creating room for player ${playerName}:`, error);
            
            // Send user-friendly error message
            const errorMessage = error instanceof Error ? error.message : 'Failed to create room';
            socket.emit('room:error', errorMessage);
        }
    });

    /**
     * Handler for 'room:join' event
     * Adds a player to an existing room using the room code
     * 
     * Flow:
     * 1. Validate room code and player name using Zod schema
     * 2. Join the room using RoomManager
     * 3. Store player and room info in socket data
     * 4. Join the socket to the room for broadcasting
     * 5. Notify all players in the room about the new player
     * 6. Emit success response with room details
     */
    socket.on('room:join', async (roomCode: string, playerName: string) => {
        try {
            logger.info(`Player attempting to join room: ${playerName} -> ${roomCode} (socket: ${socket.id})`);

            // Validate the room code and player name using our Zod schema
            const validation = safeValidate(JoinRoomRequestSchema, { roomCode, playerName });
            if (!validation.success) {
                logger.warn(`Room join failed - validation error: ${validation.error}`);
                socket.emit('room:error', validation.error);
                return;
            }

            const { roomCode: validatedRoomCode, playerName: validatedPlayerName } = validation.data;

            // Join the room using RoomManager
            const { room, player } = await roomManager.joinRoom(validatedRoomCode, validatedPlayerName);
            
            // Store player and room information in socket data
            socket.data.playerId = player.id;
            socket.data.playerName = player.name;
            socket.data.roomId = room.id;

            // Join the socket to the room for broadcasting
            await socket.join(room.id);

            logger.info(`Player joined room successfully: ${player.name} joined ${room.code}`);

            // Notify all other players in the room about the new player
            socket.to(room.id).emit('room:player_joined', player);

            // Send the updated room state to all players (including the new player)
            socket.to(room.id).emit('room:updated', room);
            
            // Send success response to the joining player
            socket.emit('room:joined', room, player);

        } catch (error) {
            logger.error(`Error joining room ${roomCode} for player ${playerName}:`, error);
            
            // Send user-friendly error message
            let errorMessage = 'Failed to join room';
            if (error instanceof Error) {
                // Map specific error messages to user-friendly versions
                switch (error.message) {
                    case 'Room not found':
                        errorMessage = 'Room not found. Please check the room code and try again.';
                        break;
                    case 'Room is full':
                        errorMessage = 'This room is full. Please try joining a different room.';
                        break;
                    case 'Player name already taken in this room':
                        errorMessage = 'This name is already taken in this room. Please choose a different name.';
                        break;
                    default:
                        errorMessage = error.message;
                }
            }
            
            socket.emit('room:error', errorMessage);
        }
    });

    /**
     * Handler for 'room:leave' event
     * Removes a player from their current room
     * 
     * Flow:
     * 1. Check if player is in a room
     * 2. Remove player from room using RoomManager
     * 3. Leave the socket room
     * 4. Notify remaining players about the departure
     * 5. Clean up socket data
     */
    socket.on('room:leave', async () => {
        try {
            const playerId = socket.data.playerId;
            const roomId = socket.data.roomId;
            
            if (!playerId || !roomId) {
                logger.warn(`Player attempted to leave room but no room data found (socket: ${socket.id})`);
                socket.emit('room:error', 'You are not currently in a room');
                return;
            }

            logger.info(`Player leaving room: ${socket.data.playerName} leaving room ${roomId}`);

            // Remove player from room using RoomManager
            const updatedRoom = await roomManager.leaveRoom(playerId);
            
            // Leave the socket room
            await socket.leave(roomId);

            // If room still exists, notify remaining players
            if (updatedRoom) {
                socket.to(roomId).emit('room:player_left', playerId);
                socket.to(roomId).emit('room:updated', updatedRoom);
            }

            // Clean up socket data
            delete socket.data.playerId;
            delete socket.data.playerName;
            delete socket.data.roomId;

            logger.info(`Player left room successfully: ${playerId}`);

        } catch (error) {
            logger.error(`Error leaving room for player ${socket.data.playerId}:`, error);
            
            const errorMessage = error instanceof Error ? error.message : 'Failed to leave room';
            socket.emit('room:error', errorMessage);
        }
    });

    /**
     * Handler for socket disconnection
     * Automatically handles player leaving when they disconnect
     * This ensures proper cleanup when players close the app or lose connection
     */
    socket.on('disconnect', async (reason) => {
        try {
            const playerId = socket.data.playerId;
            const roomId = socket.data.roomId;
            const playerName = socket.data.playerName;

            if (playerId && roomId) {
                logger.info(`Player disconnected, cleaning up: ${playerName} (${playerId}) from room ${roomId}, reason: ${reason}`);

                // Update player connection status first
                await roomManager.updatePlayerConnection(playerId, false);

                // If it's a temporary disconnect, we might want to keep the player in the room
                // For now, we'll remove them completely
                const updatedRoom = await roomManager.leaveRoom(playerId);

                // Notify remaining players if room still exists
                if (updatedRoom) {
                    socket.to(roomId).emit('room:player_left', playerId);
                    socket.to(roomId).emit('room:updated', updatedRoom);
                }

                logger.info(`Disconnected player cleaned up successfully: ${playerId}`);
            }
        } catch (error) {
            logger.error(`Error handling disconnect for player ${socket.data.playerId}:`, error);
        }
    });
}

/**
 * Utility function to get room information for a socket
 * @param socket - The Socket.IO socket instance
 * @param roomManager - The RoomManager service instance
 * @returns Room information if player is in a room, null otherwise
 */
export function getSocketRoomInfo(
    socket: Socket<ClientToServerEvents, ServerToClientEvents, {}, SocketData>,
    roomManager: RoomManager
) {
    const roomId = socket.data.roomId;
    const playerId = socket.data.playerId;
    
    if (!roomId || !playerId) {
        return null;
    }
    
    const room = roomManager.getRoomById(roomId);
    if (!room) {
        return null;
    }
    
    const player = room.players.find(p => p.id === playerId);
    if (!player) {
        return null;
    }
    
    return { room, player };
}