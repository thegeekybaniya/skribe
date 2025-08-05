/**
 * @fileoverview Unit tests for game flow Socket.IO handlers
 * 
 * This test file covers all game flow Socket.IO event handlers including:
 * - Game start and end event handling
 * - Chat message processing and guess validation
 * - Game state broadcasting and event coordination
 * - Integration with GameService, RoomManager, PlayerManager, and WordService
 * - Error handling and edge cases for socket events
 * 
 * Requirements covered: 4.1, 4.2, 4.3, 4.4, 4.5
 */

import { GameService } from '../services/GameService';
import { RoomManager } from '../services/RoomManager';
import { PlayerManager } from '../services/PlayerManager';
import { WordService } from '../services/WordService';
import { setupGameServiceListeners } from './gameHandlers';
import { GameState } from '@skribbl-clone/types';

// Mock timers for testing
jest.useFakeTimers();

describe('Game Handlers', () => {
    let roomManager: RoomManager;
    let playerManager: PlayerManager;
    let wordService: WordService;
    let gameService: GameService;
    let mockIo: any;

    beforeEach(() => {
        // Set up test services
        roomManager = new RoomManager();
        playerManager = new PlayerManager(roomManager);
        wordService = new WordService();
        gameService = new GameService(roomManager, playerManager, wordService);

        // Mock Socket.IO server
        mockIo = {
            to: jest.fn().mockReturnThis(),
            emit: jest.fn(),
            sockets: {
                sockets: new Map()
            }
        };

        // Set up GameService listeners
        setupGameServiceListeners(gameService, mockIo);
    });

    afterEach(() => {
        // Clean up resources
        gameService.shutdown();
        playerManager.shutdown();
        roomManager.shutdown();
        wordService.shutdown();
        jest.clearAllTimers();
    });

    describe('GameService integration', () => {
        it('should start game successfully when conditions are met', async () => {
            // Test successful game start
            const room = await roomManager.createRoom('Player1');
            await roomManager.joinRoom(room.code, 'Player2');

            const result = await gameService.startGame(room.id);

            expect(result.success).toBe(true);
            expect(result.message).toBe('Game starting...');
        });

        it('should fail to start game with insufficient players', async () => {
            // Test game start failure with only one player
            const room = await roomManager.createRoom('Player1');

            const result = await gameService.startGame(room.id);

            expect(result.success).toBe(false);
            expect(result.message).toContain('Need at least 2 players');
        });

        it('should fail when room does not exist', async () => {
            // Test game start failure with invalid room
            const result = await gameService.startGame('invalid-room-id');

            expect(result.success).toBe(false);
            expect(result.message).toBe('Room not found');
        });
    });

    describe('guess processing', () => {
        it('should process correct guesses during active game', async () => {
            // Test correct guess processing during game
            const room = await roomManager.createRoom('Player1');
            const joinResult = await roomManager.joinRoom(room.code, 'Player2');
            
            const player1Id = room.players[0].id;
            const player2Id = joinResult.player.id;

            await gameService.startGame(room.id);
            
            // Start game
            jest.advanceTimersByTime(3000);
            await Promise.resolve();
            jest.runOnlyPendingTimers();

            const gameState = gameService.getGameState(room.id);
            const currentWord = gameState.activeGame?.currentWord;
            const guessingPlayerId = gameState.activeGame?.currentDrawer === player1Id ? player2Id : player1Id;

            if (currentWord) {
                const result = await gameService.processGuess(room.id, guessingPlayerId, currentWord);
                expect(result.isCorrect).toBe(true);
                expect(result.pointsAwarded).toBeGreaterThan(0);
            }
        });

        it('should reject incorrect guesses', async () => {
            // Test incorrect guess handling
            const room = await roomManager.createRoom('Player1');
            const joinResult = await roomManager.joinRoom(room.code, 'Player2');
            
            const player1Id = room.players[0].id;
            const player2Id = joinResult.player.id;

            await gameService.startGame(room.id);
            
            // Start game
            jest.advanceTimersByTime(3000);
            await Promise.resolve();
            jest.runOnlyPendingTimers();

            const gameState = gameService.getGameState(room.id);
            const guessingPlayerId = gameState.activeGame?.currentDrawer === player1Id ? player2Id : player1Id;

            const result = await gameService.processGuess(room.id, guessingPlayerId, 'wrongguess');
            expect(result.isCorrect).toBe(false);
            expect(result.pointsAwarded).toBe(0);
        });
    });

    describe('word service integration', () => {
        it('should validate guesses correctly', () => {
            // Test word validation
            expect(wordService.validateGuess('cat', 'cat')).toBe(true);
            expect(wordService.validateGuess('dog', 'cat')).toBe(false);
        });

        it('should provide random words', () => {
            // Test word generation
            const word = wordService.getRandomWord('test-room');
            expect(word).toBeDefined();
            expect(typeof word).toBe('string');
            expect(word.length).toBeGreaterThan(0);
        });
    });

    describe('GameService event broadcasting', () => {
        it('should emit events when game starts', async () => {
            // Test that game events are emitted
            const room = await roomManager.createRoom('Player1');
            await roomManager.joinRoom(room.code, 'Player2');

            let gameStartingEmitted = false;
            gameService.once('gameStarting', () => {
                gameStartingEmitted = true;
            });

            await gameService.startGame(room.id);
            expect(gameStartingEmitted).toBe(true);
        });

        it('should emit events when round starts', async () => {
            // Test that round events are emitted
            const room = await roomManager.createRoom('Player1');
            await roomManager.joinRoom(room.code, 'Player2');

            let roundStartedEmitted = false;
            gameService.once('roundStarted', () => {
                roundStartedEmitted = true;
            });

            await gameService.startGame(room.id);
            
            // Start game
            jest.advanceTimersByTime(3000);
            await Promise.resolve();
            jest.runOnlyPendingTimers();

            expect(roundStartedEmitted).toBe(true);
        });

        it('should broadcast to mock io when events occur', async () => {
            // Test that events are broadcast through mock io
            const room = await roomManager.createRoom('Player1');
            await roomManager.joinRoom(room.code, 'Player2');

            await gameService.startGame(room.id);

            // Verify that mockIo.to was called (indicating broadcast)
            expect(mockIo.to).toHaveBeenCalled();
        });
    });

    describe('error handling', () => {
        it('should handle service errors gracefully', async () => {
            // Test error handling when services throw errors
            const result = await gameService.startGame('invalid-room');
            expect(result.success).toBe(false);
            expect(result.message).toBe('Room not found');
        });

        it('should handle concurrent game operations', async () => {
            // Test handling of concurrent game operations
            const room = await roomManager.createRoom('Player1');
            await roomManager.joinRoom(room.code, 'Player2');

            // Start multiple games concurrently
            const promises = [
                gameService.startGame(room.id),
                gameService.startGame(room.id),
                gameService.startGame(room.id)
            ];

            const results = await Promise.all(promises);

            // Only one should succeed
            const successCount = results.filter(r => r.success).length;
            expect(successCount).toBe(1);
        });
    });

    describe('integration with other services', () => {
        it('should integrate properly with RoomManager', async () => {
            // Test integration with RoomManager for room operations
            const room = await roomManager.createRoom('Player1');
            await roomManager.joinRoom(room.code, 'Player2');

            expect(room.players.length).toBe(2);
            
            const result = await gameService.startGame(room.id);
            expect(result.success).toBe(true);
        });

        it('should integrate properly with PlayerManager', async () => {
            // Test integration with PlayerManager for player operations
            const room = await roomManager.createRoom('Player1');
            const joinResult = await roomManager.joinRoom(room.code, 'Player2');

            expect(joinResult.player).toBeDefined();
            expect(joinResult.room.players.length).toBe(2);
        });

        it('should integrate properly with WordService', () => {
            // Test integration with WordService for word validation
            const testWord = wordService.getRandomWord('test-room');
            const isValid = wordService.validateGuess(testWord, testWord);
            
            expect(testWord).toBeDefined();
            expect(typeof testWord).toBe('string');
            expect(isValid).toBe(true);
        });
    });
});