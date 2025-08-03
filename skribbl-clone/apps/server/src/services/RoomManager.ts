/**
 * @fileoverview RoomManager service for creating and managing game rooms
 * 
 * This service handles all room-related operations including:
 * - Creating new game rooms with unique codes
 * - Managing room capacity and player limits
 * - Cleaning up inactive rooms and disconnected players
 * - Validating room operations and maintaining room state
 * 
 * Requirements covered: 1.1, 1.2, 1.3, 1.4, 1.5, 9.2, 9.3
 */

import { Room, Player, GameState, PlayerStatus } from '@skribbl-clone/types';
import { EventEmitter } from 'events';

/**
 * RoomManager handles all room lifecycle operations
 * Uses an in-memory Map for fast room lookups and management
 * Extends EventEmitter to notify other services of room changes
 */
export class RoomManager extends EventEmitter {
    // In-memory storage for active rooms - Map provides O(1) lookups
    private rooms: Map<string, Room> = new Map();

    // Map room codes to room IDs for quick code-based lookups
    private roomCodes: Map<string, string> = new Map();

    // Configuration constants
    private readonly MAX_PLAYERS_PER_ROOM = 8;
    private readonly ROOM_CODE_LENGTH = 6;
    private readonly ROOM_CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
    private readonly ROOM_INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

    // Cleanup timer reference
    private cleanupTimer: NodeJS.Timeout | null = null;

    constructor() {
        super();
        // Start the periodic cleanup process when RoomManager is created
        this.startCleanupTimer();
    }

    /**
     * Creates a new game room with a unique code
     * @param creatorName - Name of the player creating the room
     * @returns Promise resolving to the created room
     */
    async createRoom(creatorName: string): Promise<Room> {
        // Generate a unique room code that doesn't already exist
        const roomCode = this.generateUniqueRoomCode();

        // Create unique room ID using timestamp and random string
        const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Create the initial player (room creator)
        const creator: Player = {
            id: `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: creatorName,
            score: 0,
            isDrawing: false,
            isConnected: true,
            status: PlayerStatus.CONNECTED,
            joinedAt: new Date()
        };

        // Create the new room with initial state
        const room: Room = {
            id: roomId,
            code: roomCode,
            players: [creator],
            currentDrawer: null,
            currentWord: null,
            roundNumber: 0,
            maxRounds: 3, // Default to 3 rounds per game
            gameState: GameState.WAITING,
            createdAt: new Date(),
            lastActivity: new Date(),
            maxPlayers: this.MAX_PLAYERS_PER_ROOM
        };

        // Store the room in our maps for quick access
        this.rooms.set(roomId, room);
        this.roomCodes.set(roomCode, roomId);

        // Emit event to notify other services that a room was created
        this.emit('roomCreated', room);

        return room;
    }

    /**
     * Adds a player to an existing room
     * @param roomCode - The 6-character room code
     * @param playerName - Name of the player joining
     * @returns Promise resolving to the updated room and new player
     */
    async joinRoom(roomCode: string, playerName: string): Promise<{ room: Room; player: Player }> {
        // Find the room by code
        const roomId = this.roomCodes.get(roomCode.toUpperCase());
        if (!roomId) {
            throw new Error('Room not found');
        }

        const room = this.rooms.get(roomId);
        if (!room) {
            // This shouldn't happen, but handle the edge case
            this.roomCodes.delete(roomCode.toUpperCase());
            throw new Error('Room not found');
        }

        // Check if room is at capacity
        if (room.players.length >= this.MAX_PLAYERS_PER_ROOM) {
            throw new Error('Room is full');
        }

        // Check if player name is already taken in this room
        const existingPlayer = room.players.find(p => p.name.toLowerCase() === playerName.toLowerCase());
        if (existingPlayer) {
            throw new Error('Player name already taken in this room');
        }

        // Create the new player
        const newPlayer: Player = {
            id: `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: playerName,
            score: 0,
            isDrawing: false,
            isConnected: true,
            status: PlayerStatus.CONNECTED,
            joinedAt: new Date()
        };

        // Add player to room and update activity timestamp
        room.players.push(newPlayer);
        room.lastActivity = new Date();

        // Emit event to notify other services that a player joined
        this.emit('playerJoined', room, newPlayer);

        return { room, player: newPlayer };
    }

    /**
     * Removes a player from a room
     * @param playerId - ID of the player to remove
     * @returns Promise resolving to the updated room or null if room was deleted
     */
    async leaveRoom(playerId: string): Promise<Room | null> {
        // Find which room contains this player
        let targetRoom: Room | null = null;
        for (const room of this.rooms.values()) {
            if (room.players.some(p => p.id === playerId)) {
                targetRoom = room;
                break;
            }
        }

        if (!targetRoom) {
            throw new Error('Player not found in any room');
        }

        // Remove the player from the room
        const playerIndex = targetRoom.players.findIndex(p => p.id === playerId);
        if (playerIndex === -1) {
            throw new Error('Player not found in room');
        }

        const removedPlayer = targetRoom.players[playerIndex];
        targetRoom.players.splice(playerIndex, 1);
        targetRoom.lastActivity = new Date();

        // If this was the last player, delete the room
        if (targetRoom.players.length === 0) {
            this.deleteRoom(targetRoom.id);
            return null;
        }

        // If the leaving player was the current drawer, reset drawing state
        if (targetRoom.currentDrawer === playerId) {
            targetRoom.currentDrawer = null;
            targetRoom.currentWord = null;
            // If game was in progress, we might need to handle turn transition
            // This will be handled by the GameService in a later task
        }

        // Emit event to notify other services that a player left
        this.emit('playerLeft', targetRoom, removedPlayer);

        return targetRoom;
    }

    /**
     * Gets a room by its code
     * @param roomCode - The 6-character room code
     * @returns The room if found, null otherwise
     */
    getRoomByCode(roomCode: string): Room | null {
        const roomId = this.roomCodes.get(roomCode.toUpperCase());
        if (!roomId) {
            return null;
        }
        return this.rooms.get(roomId) || null;
    }

    /**
     * Gets a room by its ID
     * @param roomId - The unique room ID
     * @returns The room if found, null otherwise
     */
    getRoomById(roomId: string): Room | null {
        return this.rooms.get(roomId) || null;
    }

    /**
     * Updates a player's connection status
     * @param playerId - ID of the player
     * @param isConnected - New connection status
     * @returns Promise resolving to the updated room
     */
    async updatePlayerConnection(playerId: string, isConnected: boolean): Promise<Room | null> {
        // Find the room containing this player
        let targetRoom: Room | null = null;
        for (const room of this.rooms.values()) {
            const player = room.players.find(p => p.id === playerId);
            if (player) {
                player.isConnected = isConnected;
                player.status = isConnected ? PlayerStatus.CONNECTED : PlayerStatus.DISCONNECTED;
                room.lastActivity = new Date();
                targetRoom = room;
                break;
            }
        }

        if (targetRoom) {
            // Emit event to notify other services of connection change
            this.emit('playerConnectionChanged', targetRoom, playerId, isConnected);
        }

        return targetRoom;
    }

    /**
     * Gets all active rooms (for admin/debugging purposes)
     * @returns Array of all active rooms
     */
    getAllRooms(): Room[] {
        return Array.from(this.rooms.values());
    }

    /**
     * Gets the total number of active rooms
     * @returns Number of active rooms
     */
    getRoomCount(): number {
        return this.rooms.size;
    }

    /**
     * Gets the total number of connected players across all rooms
     * @returns Number of connected players
     */
    getTotalPlayerCount(): number {
        let count = 0;
        for (const room of this.rooms.values()) {
            count += room.players.filter(p => p.isConnected).length;
        }
        return count;
    }

    /**
     * Generates a unique 6-character room code
     * Uses uppercase letters and numbers, excludes confusing characters (0, O, I, 1)
     * @returns A unique room code
     */
    private generateUniqueRoomCode(): string {
        // Character set excluding confusing characters
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code: string;

        // Keep generating codes until we find one that's not in use
        do {
            code = '';
            for (let i = 0; i < this.ROOM_CODE_LENGTH; i++) {
                code += chars.charAt(Math.floor(Math.random() * chars.length));
            }
        } while (this.roomCodes.has(code));

        return code;
    }

    /**
     * Deletes a room and cleans up all references
     * @param roomId - ID of the room to delete
     */
    private deleteRoom(roomId: string): void {
        const room = this.rooms.get(roomId);
        if (room) {
            // Remove from both maps
            this.rooms.delete(roomId);
            this.roomCodes.delete(room.code);

            // Emit event to notify other services that room was deleted
            this.emit('roomDeleted', room);
        }
    }

    /**
     * Starts the periodic cleanup timer
     * Runs every 5 minutes to clean up inactive rooms
     */
    private startCleanupTimer(): void {
        this.cleanupTimer = setInterval(() => {
            this.cleanupInactiveRooms();
        }, this.ROOM_CLEANUP_INTERVAL);

        // Prevent the timer from keeping the process alive during tests
        this.cleanupTimer.unref();
    }

    /**
     * Cleans up rooms that have been inactive for too long
     * A room is considered inactive if:
     * - No players are connected, OR
     * - Last activity was more than 30 minutes ago
     */
    private cleanupInactiveRooms(): void {
        const now = new Date();
        const roomsToDelete: string[] = [];

        for (const [roomId, room] of this.rooms.entries()) {
            const connectedPlayers = room.players.filter(p => p.isConnected);
            const timeSinceActivity = now.getTime() - room.lastActivity.getTime();

            // Mark room for deletion if no connected players or inactive too long
            if (connectedPlayers.length === 0 || timeSinceActivity > this.ROOM_INACTIVITY_TIMEOUT) {
                roomsToDelete.push(roomId);
            }
        }

        // Delete inactive rooms
        for (const roomId of roomsToDelete) {
            this.deleteRoom(roomId);
        }

        // Log cleanup results if any rooms were cleaned up
        if (roomsToDelete.length > 0) {
            console.log(`Cleaned up ${roomsToDelete.length} inactive rooms`);
        }
    }

    /**
     * Stops the cleanup timer (for testing or shutdown)
     */
    public stopCleanupTimer(): void {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = null;
        }
    }

    /**
     * Cleans up all resources when shutting down
     */
    public shutdown(): void {
        this.stopCleanupTimer();
        this.rooms.clear();
        this.roomCodes.clear();
        this.removeAllListeners();
    }
}