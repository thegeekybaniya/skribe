/**
 * @fileoverview Unit tests for PlayerManager service
 * 
 * This test suite provides comprehensive coverage for the PlayerManager service,
 * testing all player management operations including:
 * - Player session management and lifecycle
 * - Player joining and leaving room functionality
 * - Connection state tracking and cleanup on disconnect
 * - Turn rotation logic for drawing rounds
 * - Player scoring system with point calculations
 * - Integration with RoomManager for coordinated operations
 * - Event emission for other services
 * 
 * Requirements covered: 1.1, 1.3, 1.4, 1.5, 5.1, 5.2, 9.1, 7.1, 7.2, 7.3, 7.4, 7.5
 */

import { PlayerManager } from './PlayerManager';
import { RoomManager } from './RoomManager';
import { PlayerStatus } from '@skribbl-clone/types';
// import { GameState } from '@skribbl-clone/types'; // Will be used in future tests

describe('PlayerManager', () => {
    let playerManager: PlayerManager;
    let roomManager: RoomManager;

    beforeEach(() => {
        // Create fresh instances for each test
        roomManager = new RoomManager();
        playerManager = new PlayerManager(roomManager);
    });

    afterEach(() => {
        // Clean up after each test to prevent memory leaks
        playerManager.shutdown();
        roomManager.shutdown();
    });

    describe('Player Session Management', () => {
        /**
         * Test successful player joining through PlayerManager
         * Requirement 1.1: Players can join rooms with session management
         */
        it('should handle player joining with session initialization', async () => {
            // Create a room first
            const room = await roomManager.createRoom('Creator');
            
            // Join through PlayerManager
            const result = await playerManager.joinRoom(room.code, 'JoiningPlayer', 'socket123');
            
            // Verify the result structure
            expect(result.room).toBeDefined();
            expect(result.player).toBeDefined();
            expect(result.room.players).toHaveLength(2);
            
            // Verify player session initialization
            const joinedPlayer = result.player;
            expect(joinedPlayer.name).toBe('JoiningPlayer');
            expect(joinedPlayer.status).toBe(PlayerStatus.CONNECTED);
            expect(joinedPlayer.isConnected).toBe(true);
            expect(joinedPlayer.score).toBe(0);
            expect(joinedPlayer.isDrawing).toBe(false);
        });

        /**
         * Test that playerJoined event is emitted
         * Requirement 9.1: Event-driven architecture for player management
         */
        it('should emit playerJoined event when player joins', async () => {
            const eventSpy = jest.fn();
            playerManager.on('playerJoined', eventSpy);
            
            const room = await roomManager.createRoom('Creator');
            const result = await playerManager.joinRoom(room.code, 'JoiningPlayer', 'socket123');
            
            expect(eventSpy).toHaveBeenCalledWith(result.room, result.player);
        });

        /**
         * Test error handling for invalid room codes
         * Requirement 1.4: Error handling for room operations
         */
        it('should throw error for invalid room code', async () => {
            await expect(playerManager.joinRoom('INVALID', 'TestPlayer', 'socket123'))
                .rejects.toThrow('Failed to join room: Room not found');
        });

        /**
         * Test player leaving through PlayerManager
         * Requirement 1.3: Players can leave rooms with proper cleanup
         */
        it('should handle player leaving with session cleanup', async () => {
            // Create room and add players
            const room = await roomManager.createRoom('Player1');
            const player1 = room.players[0];
            
            const joinResult = await playerManager.joinRoom(room.code, 'Player2', 'socket123');
            const player2 = joinResult.player;
            
            // Player2 leaves
            const updatedRoom = await playerManager.leaveRoom(player2.id);
            
            expect(updatedRoom).toBeDefined();
            expect(updatedRoom!.players).toHaveLength(1);
            expect(updatedRoom!.players[0].id).toBe(player1.id);
        });

        /**
         * Test that playerLeft event is emitted
         * Requirement 9.1: Event-driven architecture for player management
         */
        it('should emit playerLeft event when player leaves', async () => {
            const eventSpy = jest.fn();
            playerManager.on('playerLeft', eventSpy);
            
            const room = await roomManager.createRoom('Player1');
            const joinResult = await playerManager.joinRoom(room.code, 'Player2', 'socket123');
            
            await playerManager.leaveRoom(joinResult.player.id);
            
            expect(eventSpy).toHaveBeenCalledWith(
                expect.objectContaining({ id: room.id }),
                joinResult.player.id
            );
        });
    });

    describe('Connection State Management', () => {
        let room: any;
        let player: any;
        
        beforeEach(async () => {
            room = await roomManager.createRoom('TestPlayer');
            player = room.players[0];
        });

        /**
         * Test updating player connection status
         * Requirement 5.1: Connection state tracking
         */
        it('should update player connection status', async () => {
            const updatedRoom = await playerManager.updatePlayerConnection(player.id, false);
            
            expect(updatedRoom).toBeDefined();
            const updatedPlayer = updatedRoom!.players.find(p => p.id === player.id);
            expect(updatedPlayer!.isConnected).toBe(false);
            expect(updatedPlayer!.status).toBe(PlayerStatus.DISCONNECTED);
        });

        /**
         * Test player reconnection handling
         * Requirement 5.1: Reconnection logic
         */
        it('should handle player reconnection', async () => {
            // Disconnect first
            await playerManager.updatePlayerConnection(player.id, false);
            
            // Reconnect with new socket ID
            const updatedRoom = await playerManager.updatePlayerConnection(player.id, true, 'newSocket456');
            
            expect(updatedRoom).toBeDefined();
            const reconnectedPlayer = updatedRoom!.players.find(p => p.id === player.id);
            expect(reconnectedPlayer!.isConnected).toBe(true);
            expect(reconnectedPlayer!.status).toBe(PlayerStatus.CONNECTED);
        });

        /**
         * Test that playerConnectionChanged event is emitted
         * Requirement 9.1: Event-driven architecture
         */
        it('should emit playerConnectionChanged event', async () => {
            const eventSpy = jest.fn();
            playerManager.on('playerConnectionChanged', eventSpy);
            
            await playerManager.updatePlayerConnection(player.id, false);
            
            expect(eventSpy).toHaveBeenCalledWith(
                expect.objectContaining({ id: room.id }),
                expect.objectContaining({ id: player.id }),
                false
            );
        });

        /**
         * Test handling non-existent player connection update
         * Requirement 9.1: Error handling
         */
        it('should return null for non-existent player connection update', async () => {
            const result = await playerManager.updatePlayerConnection('invalid-id', false);
            expect(result).toBeNull();
        });
    });

    describe('Turn Rotation Logic', () => {
        let room: any;
        let players: any[];
        
        beforeEach(async () => {
            // Create room with multiple players for turn rotation tests
            room = await roomManager.createRoom('Player1');
            players = [room.players[0]];
            
            // Add more players
            for (let i = 2; i <= 4; i++) {
                const joinResult = await playerManager.joinRoom(room.code, `Player${i}`, `socket${i}`);
                players.push(joinResult.player);
                room = joinResult.room;
            }
        });

        /**
         * Test getting next drawer when no current drawer
         * Requirement 5.2: Turn-based gameplay management
         */
        it('should return first player as next drawer when no current drawer', () => {
            const nextDrawer = playerManager.getNextDrawer(room.id);
            
            expect(nextDrawer).toBeDefined();
            expect(nextDrawer!.id).toBe(players[0].id);
        });

        /**
         * Test turn rotation through all players
         * Requirement 5.2: Fair turn rotation
         */
        it('should rotate turns through all connected players', async () => {
            // Start with first player
            await playerManager.startDrawingRound(room.id, players[0].id, 'testword');
            
            // Get next drawer should be second player
            let nextDrawer = playerManager.getNextDrawer(room.id);
            expect(nextDrawer!.id).toBe(players[1].id);
            
            // Start round with second player
            await playerManager.endDrawingRound(room.id);
            await playerManager.startDrawingRound(room.id, players[1].id, 'testword2');
            
            // Next should be third player
            nextDrawer = playerManager.getNextDrawer(room.id);
            expect(nextDrawer!.id).toBe(players[2].id);
        });

        /**
         * Test turn rotation wraps around to first player
         * Requirement 5.2: Circular turn rotation
         */
        it('should wrap around to first player after last player', async () => {
            // Set last player as current drawer
            const lastPlayerIndex = players.length - 1;
            await playerManager.startDrawingRound(room.id, players[lastPlayerIndex].id, 'testword');
            
            // Next drawer should wrap to first player
            const nextDrawer = playerManager.getNextDrawer(room.id);
            expect(nextDrawer!.id).toBe(players[0].id);
        });

        /**
         * Test that disconnected players are skipped in rotation
         * Requirement 5.2: Skip disconnected players
         */
        it('should skip disconnected players in turn rotation', async () => {
            // Disconnect second player
            await playerManager.updatePlayerConnection(players[1].id, false);
            
            // Start with first player
            await playerManager.startDrawingRound(room.id, players[0].id, 'testword');
            
            // Next drawer should skip disconnected player and go to third
            const nextDrawer = playerManager.getNextDrawer(room.id);
            expect(nextDrawer!.id).toBe(players[2].id);
        });

        /**
         * Test minimum players required for game
         * Requirement 5.2: Minimum player validation
         */
        it('should return null when insufficient players for game', () => {
            // Create room with only one player
            const singlePlayerRoom = roomManager.createRoom('OnlyPlayer');
            
            const nextDrawer = playerManager.getNextDrawer((singlePlayerRoom as any).id);
            expect(nextDrawer).toBeNull();
        });
    });

    describe('Drawing Round Management', () => {
        let room: any;
        let players: any[];
        
        beforeEach(async () => {
            room = await roomManager.createRoom('Player1');
            players = [room.players[0]];
            
            const joinResult = await playerManager.joinRoom(room.code, 'Player2', 'socket2');
            players.push(joinResult.player);
            room = joinResult.room;
        });

        /**
         * Test starting a drawing round
         * Requirement 5.2: Round management
         */
        it('should start drawing round successfully', async () => {
            const success = await playerManager.startDrawingRound(room.id, players[0].id, 'testword');
            
            expect(success).toBe(true);
            
            // Verify room state
            const updatedRoom = roomManager.getRoomById(room.id);
            expect(updatedRoom!.currentDrawer).toBe(players[0].id);
            expect(updatedRoom!.currentWord).toBe('testword');
            expect(updatedRoom!.roundNumber).toBe(1);
            
            // Verify player statuses
            const drawer = updatedRoom!.players.find(p => p.id === players[0].id);
            const guesser = updatedRoom!.players.find(p => p.id === players[1].id);
            
            expect(drawer!.isDrawing).toBe(true);
            expect(drawer!.status).toBe(PlayerStatus.DRAWING);
            expect(guesser!.isDrawing).toBe(false);
            expect(guesser!.status).toBe(PlayerStatus.GUESSING);
        });

        /**
         * Test that roundStarted event is emitted
         * Requirement 9.1: Event-driven architecture
         */
        it('should emit roundStarted event when round starts', async () => {
            const eventSpy = jest.fn();
            playerManager.on('roundStarted', eventSpy);
            
            await playerManager.startDrawingRound(room.id, players[0].id, 'testword');
            
            expect(eventSpy).toHaveBeenCalledWith(
                expect.objectContaining({ id: room.id }),
                expect.objectContaining({ id: players[0].id }),
                'testword'
            );
        });

        /**
         * Test ending a drawing round
         * Requirement 5.2: Round completion
         */
        it('should end drawing round successfully', async () => {
            // Start a round first
            await playerManager.startDrawingRound(room.id, players[0].id, 'testword');
            
            // End the round
            const result = await playerManager.endDrawingRound(room.id);
            
            expect(result).toBeDefined();
            expect(result!.room).toBeDefined();
            expect(result!.roundResults).toBeDefined();
            
            // Verify room state is reset
            const updatedRoom = result!.room;
            expect(updatedRoom.currentDrawer).toBeNull();
            expect(updatedRoom.currentWord).toBeNull();
            
            // Verify player statuses are reset
            updatedRoom.players.forEach(player => {
                expect(player.isDrawing).toBe(false);
                expect(player.status).toBe(PlayerStatus.CONNECTED);
            });
        });

        /**
         * Test that roundEnded event is emitted
         * Requirement 9.1: Event-driven architecture
         */
        it('should emit roundEnded event when round ends', async () => {
            const eventSpy = jest.fn();
            playerManager.on('roundEnded', eventSpy);
            
            await playerManager.startDrawingRound(room.id, players[0].id, 'testword');
            const result = await playerManager.endDrawingRound(room.id);
            
            expect(eventSpy).toHaveBeenCalledWith(result!.room, result!.roundResults);
        });

        /**
         * Test error handling for invalid room in round operations
         * Requirement 9.1: Error handling
         */
        it('should throw error for invalid room in round operations', async () => {
            await expect(playerManager.startDrawingRound('invalid-room', players[0].id, 'testword'))
                .rejects.toThrow('Failed to start drawing round: Room not found');
        });

        /**
         * Test error handling for invalid drawer in round operations
         * Requirement 9.1: Error handling
         */
        it('should throw error for invalid drawer in round operations', async () => {
            await expect(playerManager.startDrawingRound(room.id, 'invalid-player', 'testword'))
                .rejects.toThrow('Failed to start drawing round: Drawer not found in room');
        });
    });

    describe('Scoring System', () => {
        let room: any;
        let drawer: any;
        let guesser: any;
        
        beforeEach(async () => {
            room = await roomManager.createRoom('Drawer');
            drawer = room.players[0];
            
            const joinResult = await playerManager.joinRoom(room.code, 'Guesser', 'socket2');
            guesser = joinResult.player;
            room = joinResult.room;
            
            // Start a drawing round
            await playerManager.startDrawingRound(room.id, drawer.id, 'testword');
        });

        /**
         * Test correct guess processing and scoring
         * Requirement 5.1: Scoring system for correct guesses
         */
        it('should process correct guess and award points', async () => {
            const result = await playerManager.processGuess(guesser.id, 'testword');
            
            expect(result.isCorrect).toBe(true);
            expect(result.pointsAwarded).toBeGreaterThan(0);
            expect(result.room).toBeDefined();
            
            // Verify scores were updated
            const updatedRoom = result.room!;
            const updatedGuesser = updatedRoom.players.find(p => p.id === guesser.id);
            const updatedDrawer = updatedRoom.players.find(p => p.id === drawer.id);
            
            expect(updatedGuesser!.score).toBeGreaterThan(0);
            expect(updatedDrawer!.score).toBeGreaterThan(0);
        });

        /**
         * Test case-insensitive guess processing
         * Requirement 5.1: Case-insensitive guess validation
         */
        it('should handle case-insensitive guesses', async () => {
            const result = await playerManager.processGuess(guesser.id, 'TESTWORD');
            
            expect(result.isCorrect).toBe(true);
            expect(result.pointsAwarded).toBeGreaterThan(0);
        });

        /**
         * Test incorrect guess processing
         * Requirement 5.1: Incorrect guess handling
         */
        it('should handle incorrect guesses', async () => {
            const result = await playerManager.processGuess(guesser.id, 'wrongword');
            
            expect(result.isCorrect).toBe(false);
            expect(result.pointsAwarded).toBe(0);
            
            // Scores should remain unchanged
            const updatedRoom = result.room!;
            const updatedGuesser = updatedRoom.players.find(p => p.id === guesser.id);
            expect(updatedGuesser!.score).toBe(0);
        });

        /**
         * Test that drawer cannot guess
         * Requirement 5.1: Drawer cannot guess their own word
         */
        it('should prevent drawer from guessing', async () => {
            const result = await playerManager.processGuess(drawer.id, 'testword');
            
            expect(result.isCorrect).toBe(false);
            expect(result.pointsAwarded).toBe(0);
        });

        /**
         * Test that players cannot guess twice
         * Requirement 5.1: Prevent duplicate correct guesses
         */
        it('should prevent duplicate correct guesses', async () => {
            // First correct guess
            await playerManager.processGuess(guesser.id, 'testword');
            
            // Second attempt should not award points
            const result = await playerManager.processGuess(guesser.id, 'testword');
            
            expect(result.isCorrect).toBe(false);
            expect(result.pointsAwarded).toBe(0);
        });

        /**
         * Test speed bonus for quick guesses
         * Requirement 5.1: Speed bonus scoring
         */
        it('should award speed bonus for quick guesses', async () => {
            // Process guess immediately (should get speed bonus)
            const result = await playerManager.processGuess(guesser.id, 'testword');
            
            // Should get base points + speed bonus
            expect(result.pointsAwarded).toBe(15); // 10 base + 5 speed bonus
        });

        /**
         * Test that correctGuess event is emitted
         * Requirement 9.1: Event-driven architecture
         */
        it('should emit correctGuess event for correct guesses', async () => {
            const eventSpy = jest.fn();
            playerManager.on('correctGuess', eventSpy);
            
            await playerManager.processGuess(guesser.id, 'testword');
            
            expect(eventSpy).toHaveBeenCalledWith(
                expect.objectContaining({ id: room.id }),
                guesser.id,
                'testword',
                expect.any(Number)
            );
        });

        /**
         * Test that pointsAwarded event is emitted
         * Requirement 9.1: Event-driven architecture
         */
        it('should emit pointsAwarded events for both guesser and drawer', async () => {
            const eventSpy = jest.fn();
            playerManager.on('pointsAwarded', eventSpy);
            
            await playerManager.processGuess(guesser.id, 'testword');
            
            // Should be called twice: once for guesser, once for drawer
            expect(eventSpy).toHaveBeenCalledTimes(2);
            expect(eventSpy).toHaveBeenCalledWith(
                expect.objectContaining({ id: room.id }),
                expect.objectContaining({ id: guesser.id }),
                expect.any(Number)
            );
            expect(eventSpy).toHaveBeenCalledWith(
                expect.objectContaining({ id: room.id }),
                expect.objectContaining({ id: drawer.id }),
                expect.any(Number)
            );
        });
    });

    describe('Game Statistics and Utilities', () => {
        let room: any;
        let players: any[];
        
        beforeEach(async () => {
            room = await roomManager.createRoom('Player1');
            players = [room.players[0]];
            
            const joinResult = await playerManager.joinRoom(room.code, 'Player2', 'socket2');
            players.push(joinResult.player);
            room = joinResult.room;
        });

        /**
         * Test getting game statistics
         * Requirement 5.2: Game state monitoring
         */
        it('should return game statistics', () => {
            const stats = playerManager.getGameStats(room.id);
            
            expect(stats).toBeDefined();
            expect(stats!.room).toBeDefined();
            expect(stats!.activeRound).toBeNull();
            expect(stats!.correctGuessers).toEqual([]);
        });

        /**
         * Test game statistics during active round
         * Requirement 5.2: Active round monitoring
         */
        it('should return active round statistics', async () => {
            await playerManager.startDrawingRound(room.id, players[0].id, 'testword');
            
            const stats = playerManager.getGameStats(room.id);
            
            expect(stats!.activeRound).toBeDefined();
            expect(stats!.activeRound.word).toBe('testword');
            expect(stats!.activeRound.drawer).toBe(players[0].id);
        });

        /**
         * Test can start game validation
         * Requirement 5.2: Game start validation
         */
        it('should validate if game can be started', () => {
            // With 2 players, game can start
            expect(playerManager.canStartGame(room.id)).toBe(true);
            
            // With 1 player, game cannot start
            const singlePlayerRoom = roomManager.createRoom('OnlyPlayer');
            expect(playerManager.canStartGame((singlePlayerRoom as any).id)).toBe(false);
        });

        /**
         * Test leaderboard generation
         * Requirement 5.2: Player ranking
         */
        it('should generate leaderboard sorted by score', async () => {
            // Give players different scores
            players[0].score = 25;
            players[1].score = 15;
            
            const leaderboard = playerManager.getLeaderboard(room.id);
            
            expect(leaderboard).toHaveLength(2);
            expect(leaderboard[0].score).toBe(25);
            expect(leaderboard[1].score).toBe(15);
            expect(leaderboard[0].id).toBe(players[0].id);
        });

        /**
         * Test statistics for non-existent room
         * Requirement 9.1: Error handling
         */
        it('should return null for non-existent room statistics', () => {
            const stats = playerManager.getGameStats('invalid-room');
            expect(stats).toBeNull();
            
            const canStart = playerManager.canStartGame('invalid-room');
            expect(canStart).toBe(false);
            
            const leaderboard = playerManager.getLeaderboard('invalid-room');
            expect(leaderboard).toEqual([]);
        });
    });

    describe('Session Cleanup and Edge Cases', () => {
        let room: any;
        let drawer: any;
        let guesser: any;
        
        beforeEach(async () => {
            room = await roomManager.createRoom('Drawer');
            drawer = room.players[0];
            
            const joinResult = await playerManager.joinRoom(room.code, 'Guesser', 'socket2');
            guesser = joinResult.player;
            room = joinResult.room;
        });

        /**
         * Test cleanup when drawer leaves during active round
         * Requirement 5.2: Handle drawer disconnection
         */
        it('should end round when drawer leaves', async () => {
            // Start round with drawer
            await playerManager.startDrawingRound(room.id, drawer.id, 'testword');
            
            // Drawer leaves
            const updatedRoom = await playerManager.leaveRoom(drawer.id);
            
            // Round should be ended
            expect(updatedRoom!.currentDrawer).toBeNull();
            expect(updatedRoom!.currentWord).toBeNull();
        });

        /**
         * Test cleanup of correct guessers when player leaves
         * Requirement 5.2: Session cleanup
         */
        it('should clean up correct guessers when player leaves', async () => {
            // Start round and make correct guess
            await playerManager.startDrawingRound(room.id, drawer.id, 'testword');
            await playerManager.processGuess(guesser.id, 'testword');
            
            // Verify guesser is in correct guessers
            let stats = playerManager.getGameStats(room.id);
            expect(stats!.correctGuessers).toContain(guesser.id);
            
            // Guesser leaves
            await playerManager.leaveRoom(guesser.id);
            
            // Correct guessers should be cleaned up
            stats = playerManager.getGameStats(room.id);
            expect(stats!.correctGuessers).not.toContain(guesser.id);
        });

        /**
         * Test reconnection during active drawing round
         * Requirement 5.1: Reconnection during gameplay
         */
        it('should restore drawing status on reconnection', async () => {
            // Start round with drawer
            await playerManager.startDrawingRound(room.id, drawer.id, 'testword');
            
            // Drawer disconnects
            await playerManager.updatePlayerConnection(drawer.id, false);
            
            // Drawer reconnects
            const updatedRoom = await playerManager.updatePlayerConnection(drawer.id, true, 'newSocket');
            
            // Drawing status should be restored
            const reconnectedDrawer = updatedRoom!.players.find(p => p.id === drawer.id);
            expect(reconnectedDrawer!.isDrawing).toBe(true);
            expect(reconnectedDrawer!.status).toBe(PlayerStatus.DRAWING);
        });

        /**
         * Test room cleanup event handling
         * Requirement 9.1: Event-driven cleanup
         */
        it('should handle room deletion events', async () => {
            // Start a round to create internal data
            await playerManager.startDrawingRound(room.id, drawer.id, 'testword');
            
            // Verify internal data exists
            expect((playerManager as any).activeRounds.has(room.id)).toBe(true);
            expect((playerManager as any).correctGuessers.has(room.id)).toBe(true);
            
            // Trigger room deletion event
            roomManager.emit('roomDeleted', room);
            
            // PlayerManager should clean up its internal data
            expect((playerManager as any).activeRounds.has(room.id)).toBe(false);
            expect((playerManager as any).correctGuessers.has(room.id)).toBe(false);
        });
    });

    describe('Concurrent Operations and Stress Testing', () => {
        /**
         * Test concurrent player joining
         * Requirement 7.5: Concurrent operation testing
         */
        it('should handle concurrent player joining', async () => {
            const room = await roomManager.createRoom('Creator');
            
            // Multiple players join concurrently
            const joinPromises = [];
            for (let i = 1; i <= 5; i++) {
                joinPromises.push(playerManager.joinRoom(room.code, `Player${i}`, `socket${i}`));
            }
            
            const results = await Promise.all(joinPromises);
            
            // All joins should succeed
            expect(results).toHaveLength(5);
            results.forEach(result => {
                expect(result.room).toBeDefined();
                expect(result.player).toBeDefined();
            });
            
            // Final room should have 6 players (creator + 5 joined)
            const finalRoom = roomManager.getRoomById(room.id);
            expect(finalRoom!.players).toHaveLength(6);
        });

        /**
         * Test concurrent guess processing
         * Requirement 7.5: Concurrent guess handling
         */
        it('should handle concurrent guess processing', async () => {
            // Create room with multiple players
            const room = await roomManager.createRoom('Drawer');
            const drawer = room.players[0];
            
            const players = [drawer];
            for (let i = 1; i <= 3; i++) {
                const joinResult = await playerManager.joinRoom(room.code, `Guesser${i}`, `socket${i}`);
                players.push(joinResult.player);
            }
            
            // Start drawing round
            await playerManager.startDrawingRound(room.id, drawer.id, 'testword');
            
            // Multiple players guess concurrently
            const guessPromises = [];
            for (let i = 1; i < players.length; i++) {
                guessPromises.push(playerManager.processGuess(players[i].id, 'testword'));
            }
            
            const results = await Promise.all(guessPromises);
            
            // All guesses should be processed correctly
            results.forEach(result => {
                expect(result.isCorrect).toBe(true);
                expect(result.pointsAwarded).toBeGreaterThan(0);
            });
        });

        /**
         * Test memory cleanup after many operations
         * Requirement 9.1: Memory management
         */
        it('should properly clean up memory after many operations', async () => {
            // Create and manage many player sessions
            for (let i = 0; i < 50; i++) {
                const room = await roomManager.createRoom(`Creator${i}`);
                const joinResult = await playerManager.joinRoom(room.code, `Player${i}`, `socket${i}`);
                
                // Start and end rounds
                await playerManager.startDrawingRound(room.id, room.players[0].id, `word${i}`);
                await playerManager.processGuess(joinResult.player.id, `word${i}`);
                await playerManager.endDrawingRound(room.id);
                
                // Clean up
                await playerManager.leaveRoom(joinResult.player.id);
                await playerManager.leaveRoom(room.players[0].id);
            }
            
            // All rooms should be cleaned up
            expect(roomManager.getRoomCount()).toBe(0);
        });
    });

    describe('Error Handling and Edge Cases', () => {
        /**
         * Test error handling for invalid player operations
         * Requirement 9.1: Comprehensive error handling
         */
        it('should handle invalid player operations gracefully', async () => {
            // Test operations on non-existent players
            await expect(playerManager.leaveRoom('invalid-player'))
                .rejects.toThrow('Failed to leave room: Player not found in any room');
            
            const guessResult = await playerManager.processGuess('invalid-player', 'word');
            expect(guessResult.isCorrect).toBe(false);
            expect(guessResult.room).toBeNull();
        });

        /**
         * Test operations on rooms without active rounds
         * Requirement 9.1: State validation
         */
        it('should handle operations without active rounds', async () => {
            const room = await roomManager.createRoom('Player1');
            const joinResult = await playerManager.joinRoom(room.code, 'Player2', 'socket2');
            
            // Try to process guess without active round
            const guessResult = await playerManager.processGuess(joinResult.player.id, 'word');
            expect(guessResult.isCorrect).toBe(false);
            expect(guessResult.pointsAwarded).toBe(0);
            
            // Try to end round without active round
            const endResult = await playerManager.endDrawingRound(room.id);
            expect(endResult).toBeNull();
        });

        /**
         * Test whitespace handling in guesses
         * Requirement 5.1: Input sanitization
         */
        it('should handle whitespace in guesses correctly', async () => {
            const room = await roomManager.createRoom('Drawer');
            const drawer = room.players[0];
            const joinResult = await playerManager.joinRoom(room.code, 'Guesser', 'socket2');
            const guesser = joinResult.player;
            
            await playerManager.startDrawingRound(room.id, drawer.id, 'test word');
            
            // Guess with extra whitespace should work
            const result = await playerManager.processGuess(guesser.id, '  test word  ');
            expect(result.isCorrect).toBe(true);
        });
    });

    describe('Shutdown and Resource Management', () => {
        /**
         * Test proper shutdown cleanup
         * Requirement 9.1: Resource management
         */
        it('should clean up all resources on shutdown', async () => {
            // Create some player sessions
            const room = await roomManager.createRoom('Player1');
            await playerManager.joinRoom(room.code, 'Player2', 'socket2');
            await playerManager.startDrawingRound(room.id, room.players[0].id, 'testword');
            
            // Shutdown should clean up everything
            playerManager.shutdown();
            
            // Verify cleanup (accessing private members for testing)
            expect((playerManager as any).activeRounds.size).toBe(0);
            expect((playerManager as any).correctGuessers.size).toBe(0);
        });
    });
});