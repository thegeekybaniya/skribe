/**
 * @fileoverview Unit tests for player Socket.IO handlers
 * 
 * This test suite provides comprehensive coverage for the player Socket.IO event handlers,
 * testing all player-related socket operations including:
 * - Player connection and disconnection handling
 * - Socket event registration and emission
 * - Integration with PlayerManager and RoomManager
 * - Event listener setup and cleanup
 * - Utility functions for player information retrieval
 * 
 * Requirements covered: 1.1, 1.3, 1.4, 1.5, 5.1, 5.2, 9.1, 7.1, 7.2, 7.3, 7.4, 7.5
 */

import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import { AddressInfo } from 'net';
import { io as ClientIO, Socket as ClientSocket } from 'socket.io-client';
import { PlayerManager } from '../services/PlayerManager';
import { RoomManager } from '../services/RoomManager';
import { registerPlayerHandlers, getSocketPlayerInfo, canPlayerPerformAction } from './playerHandlers';
import { ClientToServerEvents, ServerToClientEvents, SocketData } from '@skribbl-clone/types';

describe('PlayerHandlers', () => {
    let httpServer: any;
    let io: SocketIOServer;
    let serverSocket: any;
    let clientSocket: ClientSocket;
    let roomManager: RoomManager;
    let playerManager: PlayerManager;
    let port: number;

    beforeEach((done) => {
        // Create HTTP server and Socket.IO server
        httpServer = createServer();
        io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents, {}, SocketData>(httpServer);
        
        // Create service instances
        roomManager = new RoomManager();
        playerManager = new PlayerManager(roomManager);

        // Start server on random port
        httpServer.listen(() => {
            port = (httpServer.address() as AddressInfo).port;
            
            // Create client connection
            clientSocket = ClientIO(`http://localhost:${port}`);
            
            // Set up server-side socket handling
            io.on('connection', (socket) => {
                serverSocket = socket;
                registerPlayerHandlers(socket, playerManager, roomManager);
            });
            
            clientSocket.on('connect', done);
        });
    });

    afterEach((done) => {
        // Clean up resources
        playerManager.shutdown();
        roomManager.shutdown();
        
        if (clientSocket.connected) {
            clientSocket.disconnect();
        }
        
        io.close();
        httpServer.close(done);
    });

    describe('Connection Handling', () => {
        /**
         * Test basic connection establishment
         * Requirement 9.1: Socket connection management
         */
        it('should handle client connection', (done) => {
            // The connection event should already have been emitted during setup
            // Let's verify the socket is connected
            expect(clientSocket.connected).toBe(true);
            done();
        });

        /**
         * Test player disconnection handling
         * Requirement 5.1: Connection state tracking and cleanup
         */
        it('should handle player disconnection with cleanup', async () => {
            // Set up player in room
            const room = await roomManager.createRoom('TestPlayer');
            const player = room.players[0];
            
            // Simulate socket data
            serverSocket.data.playerId = player.id;
            serverSocket.data.roomId = room.id;
            serverSocket.data.playerName = player.name;
            
            // Mock the room update emission
            const emitSpy = jest.spyOn(serverSocket, 'to').mockReturnValue({
                emit: jest.fn()
            });
            
            // Manually call the disconnect handler instead of emitting the event
            const disconnectHandler = serverSocket.listeners('disconnect')[0];
            if (disconnectHandler) {
                await disconnectHandler('client namespace disconnect');
            }
            
            // Verify player connection was updated
            const updatedRoom = roomManager.getRoomById(room.id);
            const updatedPlayer = updatedRoom!.players.find(p => p.id === player.id);
            expect(updatedPlayer!.isConnected).toBe(false);
        });

        /**
         * Test explicit player disconnect
         * Requirement 5.1: Explicit disconnection handling
         */
        it('should handle explicit player disconnect', async () => {
            // Set up player in room
            const room = await roomManager.createRoom('TestPlayer');
            const player = room.players[0];
            
            // Simulate socket data
            serverSocket.data.playerId = player.id;
            serverSocket.data.roomId = room.id;
            serverSocket.data.playerName = player.name;
            
            // Mock socket methods
            const leaveSpy = jest.spyOn(serverSocket, 'leave').mockResolvedValue();
            const emitSpy = jest.spyOn(serverSocket, 'to').mockReturnValue({
                emit: jest.fn()
            });
            
            // Manually call the player:disconnect handler
            const disconnectHandler = serverSocket.listeners('player:disconnect')[0];
            if (disconnectHandler) {
                await disconnectHandler();
            }
            
            // Wait for async operations
            await new Promise(resolve => setTimeout(resolve, 10));
            
            // Verify socket left room
            expect(leaveSpy).toHaveBeenCalledWith(room.id);
            
            // Verify socket data was cleaned up
            expect(serverSocket.data.playerId).toBeUndefined();
            expect(serverSocket.data.roomId).toBeUndefined();
            expect(serverSocket.data.playerName).toBeUndefined();
        });

        /**
         * Test disconnection without player data
         * Requirement 9.1: Error handling for edge cases
         */
        it('should handle disconnection without player data gracefully', async () => {
            // Manually call the disconnect handler without setting socket data
            const disconnectHandler = serverSocket.listeners('disconnect')[0];
            if (disconnectHandler) {
                await disconnectHandler('client namespace disconnect');
            }
            
            // Should not throw errors
            await new Promise(resolve => setTimeout(resolve, 10));
            
            // Test should complete without errors
            expect(true).toBe(true);
        });
    });

    describe('PlayerManager Event Integration', () => {
        let room: any;
        let player1: any;
        let player2: any;

        beforeEach(async () => {
            // Set up room with players
            room = await roomManager.createRoom('Player1');
            player1 = room.players[0];
            
            const joinResult = await playerManager.joinRoom(room.code, 'Player2', 'socket2');
            player2 = joinResult.player;
            room = joinResult.room;
            
            // Set socket data for player1
            serverSocket.data.playerId = player1.id;
            serverSocket.data.roomId = room.id;
            serverSocket.data.playerName = player1.name;
        });

        /**
         * Test playerJoined event handling
         * Requirement 9.1: Event-driven architecture
         */
        it('should handle playerJoined events from PlayerManager', (done) => {
            // Mock socket emission
            const emitSpy = jest.spyOn(serverSocket, 'to').mockReturnValue({
                emit: jest.fn((event, data) => {
                    if (event === 'room:player_joined') {
                        expect(data.id).toBe(player2.id);
                        done();
                    }
                })
            });
            
            // Emit playerJoined event from PlayerManager
            playerManager.emit('playerJoined', room, player2);
        });

        /**
         * Test playerLeft event handling
         * Requirement 9.1: Event-driven architecture
         */
        it('should handle playerLeft events from PlayerManager', (done) => {
            // Mock socket emission
            const emitSpy = jest.spyOn(serverSocket, 'to').mockReturnValue({
                emit: jest.fn((event, data) => {
                    if (event === 'room:player_left') {
                        expect(data).toBe(player2.id);
                        done();
                    }
                })
            });
            
            // Emit playerLeft event from PlayerManager
            playerManager.emit('playerLeft', room, player2.id);
        });

        /**
         * Test playerConnectionChanged event handling
         * Requirement 5.1: Connection state change notifications
         */
        it('should handle playerConnectionChanged events from PlayerManager', (done) => {
            // Mock socket emission
            const emitSpy = jest.spyOn(serverSocket, 'to').mockReturnValue({
                emit: jest.fn((event, playerId, status) => {
                    if (event === 'player:status_changed') {
                        expect(playerId).toBe(player2.id);
                        expect(status).toBe('disconnected');
                        done();
                    }
                })
            });
            
            // Emit playerConnectionChanged event from PlayerManager
            playerManager.emit('playerConnectionChanged', room, player2, false);
        });

        /**
         * Test roundStarted event handling
         * Requirement 5.2: Round management notifications
         */
        it('should handle roundStarted events from PlayerManager', (done) => {
            let emitCount = 0;
            
            // Mock socket emission
            const emitSpy = jest.spyOn(serverSocket, 'emit').mockImplementation((event, ...args) => {
                if (event === 'game:round_started') {
                    emitCount++;
                    expect(args[0].id).toBe(player1.id); // drawer
                    expect(args[1]).toBe(1); // round number
                }
                if (event === 'game:started') {
                    emitCount++;
                    expect(args[1]).toBe('testword'); // word for drawer
                    
                    if (emitCount === 2) {
                        done();
                    }
                }
            });
            
            // Set socket as drawer
            serverSocket.data.playerId = player1.id;
            
            // Update room round number to simulate what happens in startDrawingRound
            room.roundNumber = 1;
            
            // Emit roundStarted event from PlayerManager
            playerManager.emit('roundStarted', room, player1, 'testword');
        });

        /**
         * Test correctGuess event handling
         * Requirement 5.1: Correct guess notifications
         */
        it('should handle correctGuess events from PlayerManager', (done) => {
            let emitCount = 0;
            
            // Mock socket emission
            const emitSpy = jest.spyOn(serverSocket, 'to').mockReturnValue({
                emit: jest.fn((event, playerId, playerName) => {
                    if (event === 'chat:correct_guess') {
                        emitCount++;
                        expect(playerId).toBe(player2.id);
                        expect(playerName).toBe(player2.name);
                        
                        if (emitCount === 1) {
                            done();
                        }
                    }
                })
            });
            
            // Also mock direct emit to socket
            jest.spyOn(serverSocket, 'emit').mockImplementation(() => {});
            
            // Emit correctGuess event from PlayerManager
            playerManager.emit('correctGuess', room, player2.id, 'testword', 15);
        });

        /**
         * Test pointsAwarded event handling
         * Requirement 5.1: Score update notifications
         */
        it('should handle pointsAwarded events from PlayerManager', (done) => {
            // Mock socket emission
            const emitSpy = jest.spyOn(serverSocket, 'to').mockReturnValue({
                emit: jest.fn((event, playerId, newScore) => {
                    if (event === 'player:score_updated') {
                        expect(playerId).toBe(player2.id);
                        expect(newScore).toBe(15);
                        done();
                    }
                })
            });
            
            // Set player score
            player2.score = 15;
            
            // Emit pointsAwarded event from PlayerManager
            playerManager.emit('pointsAwarded', room, player2, 15);
        });
    });

    describe('Utility Functions', () => {
        let room: any;
        let player: any;

        beforeEach(async () => {
            room = await roomManager.createRoom('TestPlayer');
            player = room.players[0];
            
            // Set socket data
            serverSocket.data.playerId = player.id;
            serverSocket.data.roomId = room.id;
            serverSocket.data.playerName = player.name;
        });

        /**
         * Test getSocketPlayerInfo utility function
         * Requirement 9.1: Player information retrieval
         */
        it('should retrieve socket player information', () => {
            const playerInfo = getSocketPlayerInfo(serverSocket, playerManager);
            
            expect(playerInfo).toBeDefined();
            expect(playerInfo!.room.id).toBe(room.id);
            expect(playerInfo!.player.id).toBe(player.id);
            expect(playerInfo!.activeRound).toBeNull();
            expect(playerInfo!.correctGuessers).toEqual([]);
        });

        /**
         * Test getSocketPlayerInfo with active round
         * Requirement 5.2: Active round information retrieval
         */
        it('should retrieve player info with active round data', async () => {
            // Start a drawing round
            await playerManager.startDrawingRound(room.id, player.id, 'testword');
            
            const playerInfo = getSocketPlayerInfo(serverSocket, playerManager);
            
            expect(playerInfo!.activeRound).toBeDefined();
            expect(playerInfo!.activeRound.word).toBe('testword');
            expect(playerInfo!.activeRound.drawer).toBe(player.id);
        });

        /**
         * Test getSocketPlayerInfo without socket data
         * Requirement 9.1: Error handling for missing data
         */
        it('should return null for socket without player data', () => {
            // Clear socket data
            delete serverSocket.data.playerId;
            delete serverSocket.data.roomId;
            
            const playerInfo = getSocketPlayerInfo(serverSocket, playerManager);
            expect(playerInfo).toBeNull();
        });

        /**
         * Test canPlayerPerformAction utility function
         * Requirement 5.2: Action permission validation
         */
        it('should validate player action permissions', async () => {
            // Test drawing permission (player is not drawing)
            expect(canPlayerPerformAction(serverSocket, playerManager, 'draw')).toBe(false);
            
            // Test guessing permission (no active round)
            expect(canPlayerPerformAction(serverSocket, playerManager, 'guess')).toBe(false);
            
            // Test game start permission (can start with 1 player for testing)
            expect(canPlayerPerformAction(serverSocket, playerManager, 'start_game')).toBe(false);
            
            // Add another player and test game start
            await playerManager.joinRoom(room.code, 'Player2', 'socket2');
            expect(canPlayerPerformAction(serverSocket, playerManager, 'start_game')).toBe(true);
        });

        /**
         * Test action permissions during active round
         * Requirement 5.2: Round-specific action validation
         */
        it('should validate actions during active round', async () => {
            // Add another player
            const joinResult = await playerManager.joinRoom(room.code, 'Player2', 'socket2');
            
            // Start drawing round with current player as drawer
            await playerManager.startDrawingRound(room.id, player.id, 'testword');
            
            // Player should be able to draw
            expect(canPlayerPerformAction(serverSocket, playerManager, 'draw')).toBe(true);
            
            // Player should not be able to guess (they're drawing)
            expect(canPlayerPerformAction(serverSocket, playerManager, 'guess')).toBe(false);
            
            // Cannot start game during active round
            expect(canPlayerPerformAction(serverSocket, playerManager, 'start_game')).toBe(false);
        });

        /**
         * Test action permissions for invalid actions
         * Requirement 9.1: Invalid action handling
         */
        it('should return false for invalid actions', () => {
            expect(canPlayerPerformAction(serverSocket, playerManager, 'invalid_action')).toBe(false);
            expect(canPlayerPerformAction(serverSocket, playerManager, '')).toBe(false);
        });
    });

    describe('Error Handling and Edge Cases', () => {
        /**
         * Test handling of PlayerManager events for different rooms
         * Requirement 9.1: Event filtering by room
         */
        it('should only handle events for current room', async () => {
            // Create two rooms
            const room1 = await roomManager.createRoom('Player1');
            const room2 = await roomManager.createRoom('Player2');
            
            // Set socket to room1
            serverSocket.data.roomId = room1.id;
            
            // Mock socket emission
            const emitSpy = jest.spyOn(serverSocket, 'to').mockReturnValue({
                emit: jest.fn()
            });
            
            // Emit event for room2 (should not trigger emission)
            playerManager.emit('playerJoined', room2, room2.players[0]);
            
            // Should not have emitted anything
            expect(emitSpy).not.toHaveBeenCalled();
            
            // Emit event for room1 (should trigger emission)
            playerManager.emit('playerJoined', room1, room1.players[0]);
            
            // Should have emitted for room1
            expect(emitSpy).toHaveBeenCalled();
        });

        /**
         * Test drawer disconnection during active round
         * Requirement 5.2: Handle drawer disconnection gracefully
         */
        it('should handle drawer disconnection during round', async () => {
            // Set up room with drawer
            const room = await roomManager.createRoom('Drawer');
            const drawer = room.players[0];
            
            const joinResult = await playerManager.joinRoom(room.code, 'Guesser', 'socket2');
            
            // Start drawing round
            await playerManager.startDrawingRound(room.id, drawer.id, 'testword');
            
            // Set socket as drawer
            serverSocket.data.playerId = drawer.id;
            serverSocket.data.roomId = room.id;
            serverSocket.data.playerName = drawer.name;
            
            // Mock socket emission
            const emitSpy = jest.spyOn(serverSocket, 'to').mockReturnValue({
                emit: jest.fn()
            });
            
            // Manually call the disconnect handler
            const disconnectHandler = serverSocket.listeners('disconnect')[0];
            if (disconnectHandler) {
                await disconnectHandler('client namespace disconnect');
            }
            
            // Wait for async operations
            await new Promise(resolve => setTimeout(resolve, 10));
            
            // Round should be ended
            const updatedRoom = roomManager.getRoomById(room.id);
            expect(updatedRoom!.currentDrawer).toBeNull();
            expect(updatedRoom!.currentWord).toBeNull();
        });

        /**
         * Test explicit disconnect without room data
         * Requirement 9.1: Handle missing data gracefully
         */
        it('should handle explicit disconnect without room data', async () => {
            // Mock socket emission
            const emitSpy = jest.spyOn(serverSocket, 'emit').mockImplementation(() => {});
            
            // Manually call the player:disconnect handler without socket data
            const disconnectHandler = serverSocket.listeners('player:disconnect')[0];
            if (disconnectHandler) {
                await disconnectHandler();
            }
            
            // Wait for async operations
            await new Promise(resolve => setTimeout(resolve, 10));
            
            // Should not emit anything (handler returns early)
            expect(emitSpy).not.toHaveBeenCalled();
        });

        /**
         * Test utility functions with invalid socket data
         * Requirement 9.1: Robust error handling
         */
        it('should handle utility functions with invalid data', () => {
            // Test with completely empty socket data
            const emptySocket = { data: {} } as any;
            
            expect(getSocketPlayerInfo(emptySocket, playerManager)).toBeNull();
            expect(canPlayerPerformAction(emptySocket, playerManager, 'draw')).toBe(false);
            
            // Test with partial socket data
            const partialSocket = { data: { playerId: 'invalid' } } as any;
            
            expect(getSocketPlayerInfo(partialSocket, playerManager)).toBeNull();
            expect(canPlayerPerformAction(partialSocket, playerManager, 'draw')).toBe(false);
        });
    });

    describe('Integration Testing', () => {
        /**
         * Test complete player lifecycle through socket events
         * Requirement 7.5: End-to-end integration testing
         */
        it('should handle complete player lifecycle', async () => {
            // Create room
            const room = await roomManager.createRoom('Player1');
            const player1 = room.players[0];
            
            // Join second player through PlayerManager
            const joinResult = await playerManager.joinRoom(room.code, 'Player2', 'socket2');
            const player2 = joinResult.player;
            
            // Set socket data for player1
            serverSocket.data.playerId = player1.id;
            serverSocket.data.roomId = room.id;
            serverSocket.data.playerName = player1.name;
            
            // Start drawing round
            await playerManager.startDrawingRound(room.id, player1.id, 'testword');
            
            // Process correct guess
            await playerManager.processGuess(player2.id, 'testword');
            
            // End round
            await playerManager.endDrawingRound(room.id);
            
            // Verify final state
            const finalRoom = roomManager.getRoomById(room.id);
            expect(finalRoom!.players).toHaveLength(2);
            expect(finalRoom!.currentDrawer).toBeNull();
            expect(finalRoom!.currentWord).toBeNull();
            
            // Verify scores were updated
            const updatedPlayer1 = finalRoom!.players.find(p => p.id === player1.id);
            const updatedPlayer2 = finalRoom!.players.find(p => p.id === player2.id);
            
            expect(updatedPlayer1!.score).toBeGreaterThan(0);
            expect(updatedPlayer2!.score).toBeGreaterThan(0);
        });

        /**
         * Test concurrent socket operations
         * Requirement 7.5: Concurrent operation handling
         */
        it('should handle concurrent socket operations', async () => {
            // Create room with multiple players
            const room = await roomManager.createRoom('Player1');
            const players = [room.players[0]];
            
            // Add multiple players concurrently
            const joinPromises = [];
            for (let i = 2; i <= 4; i++) {
                joinPromises.push(playerManager.joinRoom(room.code, `Player${i}`, `socket${i}`));
            }
            
            const joinResults = await Promise.all(joinPromises);
            joinResults.forEach(result => players.push(result.player));
            
            // Start drawing round
            await playerManager.startDrawingRound(room.id, players[0].id, 'testword');
            
            // Process multiple guesses concurrently
            const guessPromises = [];
            for (let i = 1; i < players.length; i++) {
                guessPromises.push(playerManager.processGuess(players[i].id, 'testword'));
            }
            
            const guessResults = await Promise.all(guessPromises);
            
            // All guesses should be processed correctly
            guessResults.forEach(result => {
                expect(result.isCorrect).toBe(true);
                expect(result.pointsAwarded).toBeGreaterThan(0);
            });
        });
    });
});