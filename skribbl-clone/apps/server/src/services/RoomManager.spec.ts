/**
 * @fileoverview Unit tests for RoomManager service
 * 
 * This test suite provides comprehensive coverage for the RoomManager service,
 * testing all room management operations including:
 * - Room creation with unique codes
 * - Player joining and leaving
 * - Room capacity validation
 * - Cleanup of inactive rooms
 * - Error handling for edge cases
 * 
 * Requirements covered: 1.1, 1.2, 1.3, 1.4, 1.5, 9.2, 9.3, 7.1, 7.2, 7.3, 7.4, 7.5
 */

import { RoomManager } from './RoomManager';
import { GameState, PlayerStatus } from '@skribbl-clone/types';

describe('RoomManager', () => {
    let roomManager: RoomManager;

    beforeEach(() => {
        // Create a fresh RoomManager instance for each test
        roomManager = new RoomManager();
    });

    afterEach(() => {
        // Clean up after each test to prevent memory leaks
        roomManager.shutdown();
    });

    describe('Room Creation', () => {
        /**
         * Test that rooms are created successfully with valid player names
         * Requirement 1.1: Players can create new rooms
         */
        it('should create a room with valid player name', async () => {
            const playerName = 'TestPlayer';
            
            const room = await roomManager.createRoom(playerName);
            
            // Verify room properties
            expect(room).toBeDefined();
            expect(room.code).toHaveLength(6);
            expect(room.code).toMatch(/^[A-Z0-9]+$/); // Only uppercase letters and numbers
            expect(room.players).toHaveLength(1);
            expect(room.gameState).toBe(GameState.WAITING);
            expect(room.maxPlayers).toBe(8);
            expect(room.roundNumber).toBe(0);
            expect(room.currentDrawer).toBeNull();
            expect(room.currentWord).toBeNull();
            
            // Verify creator player properties
            const creator = room.players[0];
            expect(creator.name).toBe(playerName);
            expect(creator.score).toBe(0);
            expect(creator.isDrawing).toBe(false);
            expect(creator.isConnected).toBe(true);
            expect(creator.status).toBe(PlayerStatus.CONNECTED);
            expect(creator.joinedAt).toBeInstanceOf(Date);
        });

        /**
         * Test that room codes are unique across multiple room creations
         * Requirement 1.2: Each room has a unique 6-character code
         */
        it('should generate unique room codes', async () => {
            const roomCodes = new Set<string>();
            
            // Create multiple rooms and collect their codes
            for (let i = 0; i < 10; i++) {
                const room = await roomManager.createRoom(`Player${i}`);
                roomCodes.add(room.code);
            }
            
            // All codes should be unique
            expect(roomCodes.size).toBe(10);
        });

        /**
         * Test that room creation emits the correct event
         * Requirement 9.2: Event-driven architecture
         */
        it('should emit roomCreated event when room is created', async () => {
            const eventSpy = jest.fn();
            roomManager.on('roomCreated', eventSpy);
            
            const room = await roomManager.createRoom('TestPlayer');
            
            expect(eventSpy).toHaveBeenCalledWith(room);
        });
    });

    describe('Room Joining', () => {
        let existingRoom: any;
        
        beforeEach(async () => {
            // Create a room for joining tests
            existingRoom = await roomManager.createRoom('Creator');
        });

        /**
         * Test successful room joining with valid room code and player name
         * Requirement 1.3: Players can join existing rooms using room codes
         */
        it('should allow player to join existing room', async () => {
            const playerName = 'JoiningPlayer';
            
            // Add a small delay to ensure timestamp difference
            await new Promise(resolve => setTimeout(resolve, 1));
            
            const result = await roomManager.joinRoom(existingRoom.code, playerName);
            
            // Verify the result structure
            expect(result.room).toBeDefined();
            expect(result.player).toBeDefined();
            
            // Verify room now has 2 players
            expect(result.room.players).toHaveLength(2);
            
            // Verify the new player properties
            expect(result.player.name).toBe(playerName);
            expect(result.player.score).toBe(0);
            expect(result.player.isConnected).toBe(true);
            expect(result.player.status).toBe(PlayerStatus.CONNECTED);
            
            // Verify room's lastActivity was updated
            expect(result.room.lastActivity.getTime()).toBeGreaterThanOrEqual(existingRoom.lastActivity.getTime());
        });

        /**
         * Test room joining with case-insensitive room codes
         * Requirement 1.3: Room codes should work regardless of case
         */
        it('should handle case-insensitive room codes', async () => {
            const lowerCaseCode = existingRoom.code.toLowerCase();
            
            const result = await roomManager.joinRoom(lowerCaseCode, 'TestPlayer');
            
            expect(result.room.code).toBe(existingRoom.code);
            expect(result.room.players).toHaveLength(2);
        });

        /**
         * Test error when trying to join non-existent room
         * Requirement 1.4: Error handling for invalid room codes
         */
        it('should throw error for non-existent room code', async () => {
            await expect(roomManager.joinRoom('INVALID', 'TestPlayer'))
                .rejects.toThrow('Room not found');
        });

        /**
         * Test error when room is at maximum capacity
         * Requirement 1.5: Maximum 8 players per room
         */
        it('should throw error when room is full', async () => {
            // Fill the room to capacity (8 players total, 1 already exists)
            for (let i = 1; i < 8; i++) {
                await roomManager.joinRoom(existingRoom.code, `Player${i}`);
            }
            
            // Try to add one more player
            await expect(roomManager.joinRoom(existingRoom.code, 'ExtraPlayer'))
                .rejects.toThrow('Room is full');
        });

        /**
         * Test error when player name is already taken in room
         * Requirement 9.3: Input validation and error handling
         */
        it('should throw error for duplicate player names in same room', async () => {
            const duplicateName = existingRoom.players[0].name;
            
            await expect(roomManager.joinRoom(existingRoom.code, duplicateName))
                .rejects.toThrow('Player name already taken in this room');
        });

        /**
         * Test that playerJoined event is emitted
         * Requirement 9.2: Event-driven architecture
         */
        it('should emit playerJoined event when player joins', async () => {
            const eventSpy = jest.fn();
            roomManager.on('playerJoined', eventSpy);
            
            const result = await roomManager.joinRoom(existingRoom.code, 'NewPlayer');
            
            expect(eventSpy).toHaveBeenCalledWith(result.room, result.player);
        });
    });

    describe('Room Leaving', () => {
        let room: any;
        let player1: any;
        let player2: any;
        
        beforeEach(async () => {
            // Create a room with 2 players for leaving tests
            room = await roomManager.createRoom('Player1');
            player1 = room.players[0];
            
            const joinResult = await roomManager.joinRoom(room.code, 'Player2');
            room = joinResult.room;
            player2 = joinResult.player;
        });

        /**
         * Test successful player leaving
         * Requirement 1.4: Players can leave rooms
         */
        it('should allow player to leave room', async () => {
            // Add a small delay to ensure timestamp difference
            await new Promise(resolve => setTimeout(resolve, 1));
            
            const updatedRoom = await roomManager.leaveRoom(player2.id);
            
            expect(updatedRoom).toBeDefined();
            expect(updatedRoom!.players).toHaveLength(1);
            expect(updatedRoom!.players[0].id).toBe(player1.id);
            expect(updatedRoom!.lastActivity.getTime()).toBeGreaterThanOrEqual(room.lastActivity.getTime());
        });

        /**
         * Test room deletion when last player leaves
         * Requirement 9.2: Resource cleanup
         */
        it('should delete room when last player leaves', async () => {
            // Remove first player
            await roomManager.leaveRoom(player1.id);
            
            // Remove second (last) player
            const result = await roomManager.leaveRoom(player2.id);
            
            expect(result).toBeNull();
            expect(roomManager.getRoomById(room.id)).toBeNull();
            expect(roomManager.getRoomByCode(room.code)).toBeNull();
        });

        /**
         * Test error when trying to remove non-existent player
         * Requirement 9.3: Error handling
         */
        it('should throw error for non-existent player', async () => {
            await expect(roomManager.leaveRoom('invalid-player-id'))
                .rejects.toThrow('Player not found in any room');
        });

        /**
         * Test that playerLeft event is emitted
         * Requirement 9.2: Event-driven architecture
         */
        it('should emit playerLeft event when player leaves', async () => {
            const eventSpy = jest.fn();
            roomManager.on('playerLeft', eventSpy);
            
            const updatedRoom = await roomManager.leaveRoom(player2.id);
            
            expect(eventSpy).toHaveBeenCalledWith(updatedRoom, player2);
        });

        /**
         * Test that roomDeleted event is emitted when room is deleted
         * Requirement 9.2: Event-driven architecture
         */
        it('should emit roomDeleted event when room is deleted', async () => {
            const eventSpy = jest.fn();
            roomManager.on('roomDeleted', eventSpy);
            
            // Remove all players to trigger room deletion
            await roomManager.leaveRoom(player1.id);
            await roomManager.leaveRoom(player2.id);
            
            expect(eventSpy).toHaveBeenCalledWith(expect.objectContaining({
                id: room.id,
                code: room.code
            }));
        });
    });

    describe('Player Connection Management', () => {
        let room: any;
        let player: any;
        
        beforeEach(async () => {
            room = await roomManager.createRoom('TestPlayer');
            player = room.players[0];
        });

        /**
         * Test updating player connection status
         * Requirement 9.2: Connection state management
         */
        it('should update player connection status', async () => {
            const updatedRoom = await roomManager.updatePlayerConnection(player.id, false);
            
            expect(updatedRoom).toBeDefined();
            const updatedPlayer = updatedRoom!.players.find(p => p.id === player.id);
            expect(updatedPlayer!.isConnected).toBe(false);
            expect(updatedPlayer!.status).toBe(PlayerStatus.DISCONNECTED);
        });

        /**
         * Test that playerConnectionChanged event is emitted
         * Requirement 9.2: Event-driven architecture
         */
        it('should emit playerConnectionChanged event', async () => {
            const eventSpy = jest.fn();
            roomManager.on('playerConnectionChanged', eventSpy);
            
            await roomManager.updatePlayerConnection(player.id, false);
            
            expect(eventSpy).toHaveBeenCalledWith(
                expect.objectContaining({ id: room.id }),
                player.id,
                false
            );
        });

        /**
         * Test handling non-existent player connection update
         * Requirement 9.3: Error handling
         */
        it('should return null for non-existent player', async () => {
            const result = await roomManager.updatePlayerConnection('invalid-id', false);
            expect(result).toBeNull();
        });
    });

    describe('Room Retrieval', () => {
        let room: any;
        
        beforeEach(async () => {
            room = await roomManager.createRoom('TestPlayer');
        });

        /**
         * Test getting room by code
         * Requirement 1.3: Room lookup by code
         */
        it('should retrieve room by code', () => {
            const retrievedRoom = roomManager.getRoomByCode(room.code);
            
            expect(retrievedRoom).toBeDefined();
            expect(retrievedRoom!.id).toBe(room.id);
            expect(retrievedRoom!.code).toBe(room.code);
        });

        /**
         * Test getting room by ID
         * Requirement 9.2: Room lookup by ID
         */
        it('should retrieve room by ID', () => {
            const retrievedRoom = roomManager.getRoomById(room.id);
            
            expect(retrievedRoom).toBeDefined();
            expect(retrievedRoom!.id).toBe(room.id);
            expect(retrievedRoom!.code).toBe(room.code);
        });

        /**
         * Test returning null for non-existent room code
         * Requirement 9.3: Error handling
         */
        it('should return null for non-existent room code', () => {
            const result = roomManager.getRoomByCode('INVALID');
            expect(result).toBeNull();
        });

        /**
         * Test returning null for non-existent room ID
         * Requirement 9.3: Error handling
         */
        it('should return null for non-existent room ID', () => {
            const result = roomManager.getRoomById('invalid-id');
            expect(result).toBeNull();
        });
    });

    describe('Statistics and Monitoring', () => {
        /**
         * Test getting all rooms
         * Requirement 9.2: System monitoring
         */
        it('should return all active rooms', async () => {
            await roomManager.createRoom('Player1');
            await roomManager.createRoom('Player2');
            await roomManager.createRoom('Player3');
            
            const allRooms = roomManager.getAllRooms();
            expect(allRooms).toHaveLength(3);
        });

        /**
         * Test getting room count
         * Requirement 9.2: System monitoring
         */
        it('should return correct room count', async () => {
            expect(roomManager.getRoomCount()).toBe(0);
            
            await roomManager.createRoom('Player1');
            expect(roomManager.getRoomCount()).toBe(1);
            
            await roomManager.createRoom('Player2');
            expect(roomManager.getRoomCount()).toBe(2);
        });

        /**
         * Test getting total player count
         * Requirement 9.2: System monitoring
         */
        it('should return correct total player count', async () => {
            expect(roomManager.getTotalPlayerCount()).toBe(0);
            
            const room1 = await roomManager.createRoom('Player1');
            expect(roomManager.getTotalPlayerCount()).toBe(1);
            
            await roomManager.joinRoom(room1.code, 'Player2');
            expect(roomManager.getTotalPlayerCount()).toBe(2);
            
            const room2 = await roomManager.createRoom('Player3');
            expect(roomManager.getTotalPlayerCount()).toBe(3);
        });

        /**
         * Test that disconnected players are not counted
         * Requirement 9.2: Accurate connection tracking
         */
        it('should not count disconnected players in total', async () => {
            const room = await roomManager.createRoom('Player1');
            const player = room.players[0];
            
            expect(roomManager.getTotalPlayerCount()).toBe(1);
            
            await roomManager.updatePlayerConnection(player.id, false);
            expect(roomManager.getTotalPlayerCount()).toBe(0);
        });
    });

    describe('Room Cleanup', () => {
        /**
         * Test manual cleanup trigger
         * Requirement 9.2: Resource management
         */
        it('should clean up inactive rooms', async () => {
            const room = await roomManager.createRoom('TestPlayer');
            
            // Manually set lastActivity to an old date
            room.lastActivity = new Date(Date.now() - 31 * 60 * 1000); // 31 minutes ago
            
            // Trigger cleanup manually (we'll access the private method for testing)
            (roomManager as any).cleanupInactiveRooms();
            
            // Room should be deleted
            expect(roomManager.getRoomById(room.id)).toBeNull();
        });

        /**
         * Test that active rooms are not cleaned up
         * Requirement 9.2: Resource management
         */
        it('should not clean up active rooms', async () => {
            const room = await roomManager.createRoom('TestPlayer');
            
            // Trigger cleanup
            (roomManager as any).cleanupInactiveRooms();
            
            // Room should still exist
            expect(roomManager.getRoomById(room.id)).toBeDefined();
        });

        /**
         * Test cleanup timer management
         * Requirement 9.2: Resource management
         */
        it('should start and stop cleanup timer', () => {
            // Timer should be running after construction
            expect((roomManager as any).cleanupTimer).toBeDefined();
            
            roomManager.stopCleanupTimer();
            expect((roomManager as any).cleanupTimer).toBeNull();
        });
    });

    describe('Shutdown and Resource Cleanup', () => {
        /**
         * Test proper shutdown cleanup
         * Requirement 9.2: Resource management
         */
        it('should clean up all resources on shutdown', async () => {
            await roomManager.createRoom('Player1');
            await roomManager.createRoom('Player2');
            
            expect(roomManager.getRoomCount()).toBe(2);
            
            roomManager.shutdown();
            
            expect(roomManager.getRoomCount()).toBe(0);
            expect((roomManager as any).cleanupTimer).toBeNull();
        });
    });

    describe('Edge Cases and Error Handling', () => {
        /**
         * Test handling of room code generation collision (theoretical)
         * Requirement 7.4: Edge case testing
         */
        it('should handle room code generation edge cases', async () => {
            // Create many rooms to test uniqueness under stress
            const rooms = [];
            for (let i = 0; i < 50; i++) {
                const room = await roomManager.createRoom(`Player${i}`);
                rooms.push(room);
            }
            
            // All room codes should be unique
            const codes = rooms.map(r => r.code);
            const uniqueCodes = new Set(codes);
            expect(uniqueCodes.size).toBe(codes.length);
        });

        /**
         * Test concurrent room operations
         * Requirement 7.5: Concurrent operation testing
         */
        it('should handle concurrent room creation', async () => {
            const promises = [];
            for (let i = 0; i < 10; i++) {
                promises.push(roomManager.createRoom(`Player${i}`));
            }
            
            const rooms = await Promise.all(promises);
            
            expect(rooms).toHaveLength(10);
            expect(roomManager.getRoomCount()).toBe(10);
            
            // All rooms should have unique codes
            const codes = rooms.map(r => r.code);
            const uniqueCodes = new Set(codes);
            expect(uniqueCodes.size).toBe(10);
        });

        /**
         * Test memory cleanup after many operations
         * Requirement 9.2: Memory management
         */
        it('should properly clean up memory after many operations', async () => {
            // Create and delete many rooms
            for (let i = 0; i < 100; i++) {
                const room = await roomManager.createRoom(`Player${i}`);
                await roomManager.leaveRoom(room.players[0].id);
            }
            
            // All rooms should be cleaned up
            expect(roomManager.getRoomCount()).toBe(0);
            expect(roomManager.getTotalPlayerCount()).toBe(0);
        });
    });
});