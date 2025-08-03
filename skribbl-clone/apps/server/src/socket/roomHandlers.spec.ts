/**
 * @fileoverview Unit tests for room Socket.IO handlers
 * 
 * This test suite provides comprehensive coverage for Socket.IO room handlers:
 * - Room creation event handling
 * - Room joining event handling
 * - Room leaving event handling
 * - Player disconnection handling
 * - Input validation integration
 * - Error handling and user-friendly messages
 * 
 * Requirements covered: 1.1, 1.2, 1.3, 1.4, 1.5, 9.2, 9.3
 */

import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import { Socket as ClientSocket, io as ClientIO } from 'socket.io-client';
import { RoomManager } from '../services/RoomManager';
import { registerRoomHandlers } from './roomHandlers';
import { ClientToServerEvents, ServerToClientEvents, SocketData } from '@skribbl-clone/types';

describe('Room Socket.IO Handlers', () => {
    let httpServer: any;
    let io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, {}, SocketData>;
    let roomManager: RoomManager;
    let clientSocket: ClientSocket<ServerToClientEvents, ClientToServerEvents>;
    let serverPort: number;

    beforeEach((done) => {
        // Create HTTP server and Socket.IO server
        httpServer = createServer();
        io = new SocketIOServer(httpServer, {
            cors: {
                origin: '*',
                methods: ['GET', 'POST']
            }
        });

        // Create RoomManager instance
        roomManager = new RoomManager();

        // Register room handlers for each connection
        io.on('connection', (socket) => {
            registerRoomHandlers(socket, roomManager);
        });

        // Start server on random port
        httpServer.listen(0, () => {
            const address = httpServer.address();
            serverPort = typeof address === 'object' && address ? address.port : 3000;
            done();
        });
    });

    afterEach((done) => {
        // Clean up client connection
        if (clientSocket && clientSocket.connected) {
            clientSocket.disconnect();
        }

        // Clean up room manager
        roomManager.shutdown();

        // Close server
        io.close();
        httpServer.close(done);
    });

    describe('Room Creation', () => {
        /**
         * Test successful room creation with valid player name
         * Requirement 1.1: Players can create new rooms
         */
        it('should create room successfully with valid player name', (done) => {
            clientSocket = ClientIO(`http://localhost:${serverPort}`);

            clientSocket.on('room:created', (room) => {
                expect(room).toBeDefined();
                expect(room.code).toHaveLength(6);
                expect(room.players).toHaveLength(1);
                expect(room.players[0].name).toBe('TestPlayer');
                done();
            });

            clientSocket.on('connect', () => {
                clientSocket.emit('room:create', 'TestPlayer');
            });
        });

        /**
         * Test room creation failure with invalid player name
         * Requirement 9.3: Input validation and error handling
         */
        it('should reject room creation with invalid player name', (done) => {
            clientSocket = ClientIO(`http://localhost:${serverPort}`);

            clientSocket.on('room:error', (error) => {
                expect(error).toContain('Player name must be at least 2 characters long');
                done();
            });

            clientSocket.on('connect', () => {
                clientSocket.emit('room:create', 'A'); // Too short
            });
        });

        /**
         * Test room creation with offensive player name
         * Requirement 9.3: Content filtering
         */
        it('should reject room creation with offensive player name', (done) => {
            clientSocket = ClientIO(`http://localhost:${serverPort}`);

            clientSocket.on('room:error', (error) => {
                expect(error).toContain('Player name contains inappropriate content');
                done();
            });

            clientSocket.on('connect', () => {
                clientSocket.emit('room:create', 'admin');
            });
        });
    });

    describe('Room Joining', () => {
        let roomCode: string;
        let creatorSocket: ClientSocket<ServerToClientEvents, ClientToServerEvents>;

        beforeEach((done) => {
            // Create a room first and keep creator connected
            creatorSocket = ClientIO(`http://localhost:${serverPort}`);
            
            creatorSocket.on('room:created', (room) => {
                roomCode = room.code;
                done();
            });

            creatorSocket.on('connect', () => {
                creatorSocket.emit('room:create', 'Creator');
            });
        });

        afterEach(() => {
            if (creatorSocket && creatorSocket.connected) {
                creatorSocket.disconnect();
            }
        });

        /**
         * Test successful room joining with valid data
         * Requirement 1.3: Players can join existing rooms using room codes
         */
        it('should join room successfully with valid data', (done) => {
            clientSocket = ClientIO(`http://localhost:${serverPort}`);

            clientSocket.on('room:joined', (room, player) => {
                expect(room).toBeDefined();
                expect(room.code).toBe(roomCode);
                expect(room.players).toHaveLength(2);
                expect(player.name).toBe('JoiningPlayer');
                done();
            });

            clientSocket.on('connect', () => {
                clientSocket.emit('room:join', roomCode, 'JoiningPlayer');
            });
        });

        /**
         * Test room joining with case-insensitive room code
         * Requirement 1.3: Room codes should work regardless of case
         */
        it('should join room with case-insensitive room code', (done) => {
            clientSocket = ClientIO(`http://localhost:${serverPort}`);

            clientSocket.on('room:joined', (room, player) => {
                expect(room.code).toBe(roomCode);
                expect(player.name).toBe('TestPlayer');
                done();
            });

            clientSocket.on('connect', () => {
                clientSocket.emit('room:join', roomCode.toLowerCase(), 'TestPlayer');
            });
        });

        /**
         * Test room joining failure with invalid room code
         * Requirement 1.4: Error handling for invalid room codes
         */
        it('should reject joining with invalid room code', (done) => {
            clientSocket = ClientIO(`http://localhost:${serverPort}`);

            clientSocket.on('room:error', (error) => {
                // The validation will catch the invalid format first
                expect(error).toContain('Room code must be exactly 6 characters long');
                done();
            });

            clientSocket.on('connect', () => {
                clientSocket.emit('room:join', 'INVALID', 'TestPlayer');
            });
        });

        /**
         * Test room joining failure with invalid player name
         * Requirement 9.3: Input validation
         */
        it('should reject joining with invalid player name', (done) => {
            clientSocket = ClientIO(`http://localhost:${serverPort}`);

            clientSocket.on('room:error', (error) => {
                expect(error).toContain('Player name must be at least 2 characters long');
                done();
            });

            clientSocket.on('connect', () => {
                clientSocket.emit('room:join', roomCode, 'A');
            });
        });
    });

    describe('Room Leaving', () => {
        let roomCode: string;

        beforeEach((done) => {
            // Create a room and join it
            clientSocket = ClientIO(`http://localhost:${serverPort}`);
            
            clientSocket.on('room:created', (room) => {
                roomCode = room.code;
                done();
            });

            clientSocket.on('connect', () => {
                clientSocket.emit('room:create', 'TestPlayer');
            });
        });

        /**
         * Test successful room leaving
         * Requirement 1.4: Players can leave rooms
         */
        it('should leave room successfully', (done) => {
            // Since leaving doesn't emit a success event to the leaving player,
            // we'll test by checking that the room is cleaned up
            clientSocket.emit('room:leave');
            
            // Give some time for the operation to complete
            setTimeout(() => {
                expect(roomManager.getRoomByCode(roomCode)).toBeNull();
                done();
            }, 100);
        });

        /**
         * Test leaving room when not in a room
         * Requirement 9.3: Error handling
         */
        it('should handle leaving when not in a room', (done) => {
            const newSocket = ClientIO(`http://localhost:${serverPort}`);

            newSocket.on('room:error', (error) => {
                expect(error).toContain('You are not currently in a room');
                newSocket.disconnect();
                done();
            });

            newSocket.on('connect', () => {
                newSocket.emit('room:leave');
            });
        });
    });

    describe('Player Disconnection', () => {
        let roomCode: string;
        let secondSocket: ClientSocket<ServerToClientEvents, ClientToServerEvents>;

        beforeEach((done) => {
            // Create a room with two players
            clientSocket = ClientIO(`http://localhost:${serverPort}`);
            
            clientSocket.on('room:created', (room) => {
                roomCode = room.code;
                
                // Add second player
                secondSocket = ClientIO(`http://localhost:${serverPort}`);
                secondSocket.on('room:joined', () => {
                    done();
                });
                secondSocket.on('connect', () => {
                    secondSocket.emit('room:join', roomCode, 'SecondPlayer');
                });
            });

            clientSocket.on('connect', () => {
                clientSocket.emit('room:create', 'FirstPlayer');
            });
        });

        afterEach(() => {
            if (secondSocket && secondSocket.connected) {
                secondSocket.disconnect();
            }
        });

        /**
         * Test automatic cleanup on player disconnection
         * Requirement 9.2: Resource cleanup on disconnection
         */
        it('should clean up player on disconnection', (done) => {
            // Listen for player left event on the remaining socket
            clientSocket.on('room:player_left', (playerId) => {
                expect(playerId).toBeDefined();
                
                // Verify room still exists with one player
                const room = roomManager.getRoomByCode(roomCode);
                expect(room).toBeDefined();
                expect(room!.players).toHaveLength(1);
                done();
            });

            // Disconnect the second player
            secondSocket.disconnect();
        });
    });

    describe('Error Handling and Edge Cases', () => {
        /**
         * Test handling of malformed data
         * Requirement 9.3: Robust error handling
         */
        it('should handle malformed room creation data', (done) => {
            clientSocket = ClientIO(`http://localhost:${serverPort}`);

            clientSocket.on('room:error', (error) => {
                expect(error).toBeDefined();
                done();
            });

            clientSocket.on('connect', () => {
                // Send malformed data (should be string, sending object)
                (clientSocket as any).emit('room:create', { invalid: 'data' });
            });
        });

        /**
         * Test handling of missing data
         * Requirement 9.3: Input validation
         */
        it('should handle missing room join data', (done) => {
            clientSocket = ClientIO(`http://localhost:${serverPort}`);

            clientSocket.on('room:error', (error) => {
                expect(error).toBeDefined();
                done();
            });

            clientSocket.on('connect', () => {
                // Send incomplete data
                (clientSocket as any).emit('room:join', 'ABC123'); // Missing player name
            });
        });
    });

    describe('Room State Broadcasting', () => {
        /**
         * Test that room updates are broadcast to all players
         * Requirement 9.2: Real-time state synchronization
         */
        it('should broadcast room updates to all players', (done) => {
            let roomCode: string;
            const firstSocket = ClientIO(`http://localhost:${serverPort}`);
            
            firstSocket.on('room:created', (room) => {
                roomCode = room.code;
                
                // Create second socket to join the room
                const secondSocket = ClientIO(`http://localhost:${serverPort}`);
                
                // First socket should receive player joined notification
                firstSocket.on('room:player_joined', (player) => {
                    expect(player.name).toBe('SecondPlayer');
                    firstSocket.disconnect();
                    secondSocket.disconnect();
                    done();
                });
                
                secondSocket.on('connect', () => {
                    secondSocket.emit('room:join', roomCode, 'SecondPlayer');
                });
            });

            firstSocket.on('connect', () => {
                firstSocket.emit('room:create', 'FirstPlayer');
            });
        });
    });
});