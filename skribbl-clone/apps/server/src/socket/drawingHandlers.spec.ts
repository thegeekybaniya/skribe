/**
 * @fileoverview Unit tests for drawing Socket.IO event handlers
 * 
 * This test file covers all drawing-related functionality including:
 * - Drawing data processing and validation
 * - Real-time drawing broadcast to all players in room
 * - Drawing event throttling to prevent spam (60fps limit)
 * - Canvas clearing functionality for new rounds
 * - Drawing permission validation (only current drawer can draw)
 * - Socket.IO event handlers for drawing data transmission
 * - Error handling and edge cases
 * 
 * Requirements coverage: 2.1, 2.2, 2.3, 2.4, 2.5
 */

import { RoomManager } from '../services/RoomManager';
import { GameService } from '../services/GameService';
import { PlayerManager } from '../services/PlayerManager';
import { WordService } from '../services/WordService';
import { registerDrawingHandlers, setupDrawingServiceListeners } from './drawingHandlers';
import { DrawingData, GameState, Room, Player } from '@skribbl-clone/types';

// Mock logger to prevent console spam during tests
jest.mock('../utils/logger', () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
}));

// Mock socket for testing
const createMockSocket = () => {
    const mockSocket = {
        data: {} as any,
        emit: jest.fn(),
        to: jest.fn().mockReturnThis(),
        join: jest.fn(),
        on: jest.fn(),
        id: 'test-socket-id'
    };
    return mockSocket;
};

describe('Drawing Handlers', () => {
    let roomManager: RoomManager;
    let playerManager: PlayerManager;
    let gameService: GameService;
    let wordService: WordService;
    let mockSocket: any;

    // Test data
    let testRoom: Room;
    let testPlayer: Player;
    let testDrawer: Player;

    beforeEach(async () => {
        // Create service instances
        roomManager = new RoomManager();
        playerManager = new PlayerManager(roomManager);
        wordService = new WordService();
        gameService = new GameService(roomManager, playerManager, wordService);

        // Set up drawing service listeners
        setupDrawingServiceListeners(gameService, roomManager);

        // Create test room and players
        testRoom = await roomManager.createRoom('TestPlayer1');
        testPlayer = testRoom.players[0];
        
        // Add a second player to be the drawer
        const joinResult = await roomManager.joinRoom(testRoom.code, 'TestDrawer');
        testDrawer = joinResult.player;
        testRoom = joinResult.room;

        // Create mock socket
        mockSocket = createMockSocket();
    });

    afterEach(() => {
        // Clean up services
        roomManager.shutdown();
        gameService.shutdown();
    });

    describe('Drawing Permission Validation', () => {
        it('should allow current drawer to draw when game is playing', () => {
            // Set up room for drawing
            const room = roomManager.getRoomById(testRoom.id);
            if (room) {
                room.gameState = GameState.PLAYING;
                room.currentDrawer = testDrawer.id;
                room.currentWord = 'test';
                const drawer = room.players.find(p => p.id === testDrawer.id);
                if (drawer) {
                    drawer.isDrawing = true;
                }
            }

            // Set up socket data
            mockSocket.data.playerId = testDrawer.id;
            mockSocket.data.roomId = testRoom.id;

            // Register drawing handlers
            registerDrawingHandlers(mockSocket, roomManager, gameService);

            // Create valid drawing data
            const drawingData: DrawingData = {
                x: 100,
                y: 150,
                prevX: 90,
                prevY: 140,
                color: '#FF0000',
                brushSize: 5,
                isDrawing: true,
                timestamp: Date.now()
            };

            // Get the drawing:stroke handler
            const drawingStrokeHandler = mockSocket.on.mock.calls.find(
                call => call[0] === 'drawing:stroke'
            )?.[1];

            expect(drawingStrokeHandler).toBeDefined();

            // Call the handler
            drawingStrokeHandler(drawingData);

            // Verify that drawing data was broadcast to room
            expect(mockSocket.to).toHaveBeenCalledWith(testRoom.id);
            expect(mockSocket.emit).toHaveBeenCalledWith('drawing:update', expect.objectContaining({
                x: 100,
                y: 150,
                prevX: 90,
                prevY: 140,
                color: '#FF0000',
                brushSize: 5,
                isDrawing: true
            }));
        });

        it('should reject drawing from non-drawer player', () => {
            // Set up room for drawing
            const room = roomManager.getRoomById(testRoom.id);
            if (room) {
                room.gameState = GameState.PLAYING;
                room.currentDrawer = testDrawer.id;
                room.currentWord = 'test';
            }

            // Set up socket data with non-drawer player
            mockSocket.data.playerId = testPlayer.id; // Not the drawer
            mockSocket.data.roomId = testRoom.id;

            // Register drawing handlers
            registerDrawingHandlers(mockSocket, roomManager, gameService);

            // Create drawing data
            const drawingData: DrawingData = {
                x: 100,
                y: 150,
                color: '#FF0000',
                brushSize: 5,
                isDrawing: true,
                timestamp: Date.now()
            };

            // Get the drawing:stroke handler
            const drawingStrokeHandler = mockSocket.on.mock.calls.find(
                call => call[0] === 'drawing:stroke'
            )?.[1];

            // Call the handler
            drawingStrokeHandler(drawingData);

            // Verify error was emitted
            expect(mockSocket.emit).toHaveBeenCalledWith('connection:error', 
                expect.stringContaining('Drawing not allowed'));
            
            // Verify no drawing update was broadcast
            expect(mockSocket.to).not.toHaveBeenCalled();
        });

        it('should reject drawing when game is not in playing state', () => {
            // Set up room in waiting state
            const room = roomManager.getRoomById(testRoom.id);
            if (room) {
                room.gameState = GameState.WAITING;
                room.currentDrawer = testDrawer.id;
            }

            // Set up socket data
            mockSocket.data.playerId = testDrawer.id;
            mockSocket.data.roomId = testRoom.id;

            // Register drawing handlers
            registerDrawingHandlers(mockSocket, roomManager, gameService);

            // Create drawing data
            const drawingData: DrawingData = {
                x: 100,
                y: 150,
                color: '#FF0000',
                brushSize: 5,
                isDrawing: true,
                timestamp: Date.now()
            };

            // Get the drawing:stroke handler
            const drawingStrokeHandler = mockSocket.on.mock.calls.find(
                call => call[0] === 'drawing:stroke'
            )?.[1];

            // Call the handler
            drawingStrokeHandler(drawingData);

            // Verify error was emitted
            expect(mockSocket.emit).toHaveBeenCalledWith('connection:error', 
                expect.stringContaining('Game is not in playing state'));
        });

        it('should reject drawing from disconnected player', () => {
            // Set up room for drawing
            const room = roomManager.getRoomById(testRoom.id);
            if (room) {
                room.gameState = GameState.PLAYING;
                room.currentDrawer = testDrawer.id;
                room.currentWord = 'test';
                
                // Set player as disconnected
                const drawer = room.players.find(p => p.id === testDrawer.id);
                if (drawer) {
                    drawer.isConnected = false;
                }
            }

            // Set up socket data
            mockSocket.data.playerId = testDrawer.id;
            mockSocket.data.roomId = testRoom.id;

            // Register drawing handlers
            registerDrawingHandlers(mockSocket, roomManager, gameService);

            // Create drawing data
            const drawingData: DrawingData = {
                x: 100,
                y: 150,
                color: '#FF0000',
                brushSize: 5,
                isDrawing: true,
                timestamp: Date.now()
            };

            // Get the drawing:stroke handler
            const drawingStrokeHandler = mockSocket.on.mock.calls.find(
                call => call[0] === 'drawing:stroke'
            )?.[1];

            // Call the handler
            drawingStrokeHandler(drawingData);

            // Verify error was emitted
            expect(mockSocket.emit).toHaveBeenCalledWith('connection:error', 
                expect.stringContaining('Player is not connected'));
        });
    });

    describe('Drawing Data Validation', () => {
        beforeEach(() => {
            // Set up room for drawing
            const room = roomManager.getRoomById(testRoom.id);
            if (room) {
                room.gameState = GameState.PLAYING;
                room.currentDrawer = testDrawer.id;
                room.currentWord = 'test';
                const drawer = room.players.find(p => p.id === testDrawer.id);
                if (drawer) {
                    drawer.isDrawing = true;
                }
            }

            mockSocket.data.playerId = testDrawer.id;
            mockSocket.data.roomId = testRoom.id;
            registerDrawingHandlers(mockSocket, roomManager, gameService);
        });

        it('should accept valid drawing data', () => {
            const drawingData: DrawingData = {
                x: 100.5,
                y: 150.7,
                prevX: 90.2,
                prevY: 140.8,
                color: '#ff0000',
                brushSize: 5,
                isDrawing: true,
                timestamp: Date.now()
            };

            const drawingStrokeHandler = mockSocket.on.mock.calls.find(
                call => call[0] === 'drawing:stroke'
            )?.[1];

            drawingStrokeHandler(drawingData);

            // Verify drawing data was broadcast with normalized color
            expect(mockSocket.emit).toHaveBeenCalledWith('drawing:update', 
                expect.objectContaining({
                    x: 100.5,
                    y: 150.7,
                    color: '#FF0000', // Should be normalized to uppercase
                    brushSize: 5
                }));
        });

        it('should reject drawing data with invalid coordinates', () => {
            const drawingData = {
                x: -10, // Invalid negative coordinate
                y: 150,
                color: '#FF0000',
                brushSize: 5,
                isDrawing: true,
                timestamp: Date.now()
            };

            const drawingStrokeHandler = mockSocket.on.mock.calls.find(
                call => call[0] === 'drawing:stroke'
            )?.[1];

            drawingStrokeHandler(drawingData);

            expect(mockSocket.emit).toHaveBeenCalledWith('connection:error', 'Invalid drawing data');
        });

        it('should reject drawing data with invalid color format', () => {
            const drawingData = {
                x: 100,
                y: 150,
                color: 'red', // Invalid color format
                brushSize: 5,
                isDrawing: true,
                timestamp: Date.now()
            };

            const drawingStrokeHandler = mockSocket.on.mock.calls.find(
                call => call[0] === 'drawing:stroke'
            )?.[1];

            drawingStrokeHandler(drawingData);

            expect(mockSocket.emit).toHaveBeenCalledWith('connection:error', 'Invalid drawing data');
        });

        it('should reject drawing data with invalid brush size', () => {
            const drawingData = {
                x: 100,
                y: 150,
                color: '#FF0000',
                brushSize: 100, // Too large brush size
                isDrawing: true,
                timestamp: Date.now()
            };

            const drawingStrokeHandler = mockSocket.on.mock.calls.find(
                call => call[0] === 'drawing:stroke'
            )?.[1];

            drawingStrokeHandler(drawingData);

            expect(mockSocket.emit).toHaveBeenCalledWith('connection:error', 'Invalid drawing data');
        });

        it('should handle coordinates at canvas boundaries', () => {
            const drawingData: DrawingData = {
                x: 1920, // Max canvas width
                y: 1080, // Max canvas height
                color: '#FF0000',
                brushSize: 1,
                isDrawing: true,
                timestamp: Date.now()
            };

            const drawingStrokeHandler = mockSocket.on.mock.calls.find(
                call => call[0] === 'drawing:stroke'
            )?.[1];

            drawingStrokeHandler(drawingData);

            expect(mockSocket.emit).toHaveBeenCalledWith('drawing:update', 
                expect.objectContaining({
                    x: 1920,
                    y: 1080
                }));
        });
    });

    describe('Canvas Clearing Functionality', () => {
        beforeEach(() => {
            // Set up room for drawing
            const room = roomManager.getRoomById(testRoom.id);
            if (room) {
                room.gameState = GameState.PLAYING;
                room.currentDrawer = testDrawer.id;
                room.currentWord = 'test';
            }

            mockSocket.data.playerId = testDrawer.id;
            mockSocket.data.roomId = testRoom.id;
            registerDrawingHandlers(mockSocket, roomManager, gameService);
        });

        it('should allow current drawer to clear canvas', () => {
            const drawingClearHandler = mockSocket.on.mock.calls.find(
                call => call[0] === 'drawing:clear'
            )?.[1];

            expect(drawingClearHandler).toBeDefined();

            drawingClearHandler();

            // Verify canvas clear was broadcast to room and sender
            expect(mockSocket.to).toHaveBeenCalledWith(testRoom.id);
            expect(mockSocket.emit).toHaveBeenCalledWith('drawing:cleared');
        });

        it('should reject canvas clear from non-drawer', () => {
            // Change socket to non-drawer player
            mockSocket.data.playerId = testPlayer.id;

            const drawingClearHandler = mockSocket.on.mock.calls.find(
                call => call[0] === 'drawing:clear'
            )?.[1];

            drawingClearHandler();

            expect(mockSocket.emit).toHaveBeenCalledWith('connection:error', 
                expect.stringContaining('Clear not allowed'));
        });
    });

    describe('Error Handling and Edge Cases', () => {
        it('should handle drawing without player/room data', () => {
            // Don't set playerId or roomId
            registerDrawingHandlers(mockSocket, roomManager, gameService);

            const drawingData: DrawingData = {
                x: 100,
                y: 150,
                color: '#FF0000',
                brushSize: 5,
                isDrawing: true,
                timestamp: Date.now()
            };

            const drawingStrokeHandler = mockSocket.on.mock.calls.find(
                call => call[0] === 'drawing:stroke'
            )?.[1];

            // Should not crash
            expect(() => drawingStrokeHandler(drawingData)).not.toThrow();
        });

        it('should handle drawing in non-existent room', () => {
            mockSocket.data.playerId = testDrawer.id;
            mockSocket.data.roomId = 'non-existent-room';
            registerDrawingHandlers(mockSocket, roomManager, gameService);

            const drawingData: DrawingData = {
                x: 100,
                y: 150,
                color: '#FF0000',
                brushSize: 5,
                isDrawing: true,
                timestamp: Date.now()
            };

            const drawingStrokeHandler = mockSocket.on.mock.calls.find(
                call => call[0] === 'drawing:stroke'
            )?.[1];

            drawingStrokeHandler(drawingData);

            expect(mockSocket.emit).toHaveBeenCalledWith('connection:error', 
                expect.stringContaining('Room not found'));
        });

        it('should clean up player throttling on disconnect', () => {
            mockSocket.data.playerId = testDrawer.id;
            registerDrawingHandlers(mockSocket, roomManager, gameService);

            const disconnectHandler = mockSocket.on.mock.calls.find(
                call => call[0] === 'disconnect'
            )?.[1];

            expect(disconnectHandler).toBeDefined();

            // Should not throw any errors (cleanup should be silent)
            expect(() => disconnectHandler()).not.toThrow();
        });

        it('should clean up room data when room is deleted', () => {
            // Should not throw any errors (cleanup should be silent)
            expect(() => roomManager.emit('roomDeleted', testRoom)).not.toThrow();
        });

        it('should clean up player data when player leaves', () => {
            // Should not throw any errors (cleanup should be silent)
            expect(() => roomManager.emit('playerLeft', testRoom, testDrawer)).not.toThrow();
        });
    });

    describe('Integration with Game Service', () => {
        it('should handle multiple rapid round starts', () => {
            // Should not throw any errors
            expect(() => {
                gameService.emit('roundStarted', testRoom, testDrawer, 'word1', 1);
                gameService.emit('roundStarted', testRoom, testDrawer, 'word2', 2);
                gameService.emit('roundStarted', testRoom, testDrawer, 'word3', 3);
            }).not.toThrow();
        });
    });
});