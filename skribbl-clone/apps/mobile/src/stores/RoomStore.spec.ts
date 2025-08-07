/**
 * @fileoverview Unit tests for RoomStore
 * Tests room management, player lists, and room state tracking
 * Requirements: 6.7 - MobX for reactive state management
 */

import { RoomStore } from './RoomStore';
import { RootStore } from './RootStore';
import { Room, Player, GameState } from '@skribbl-clone/types';

describe('RoomStore', () => {
  let roomStore: RoomStore;
  let rootStore: RootStore;

  beforeEach(() => {
    rootStore = new RootStore();
    roomStore = rootStore.roomStore;
  });

  /**
   * Test initial state of RoomStore
   * This validates default values are set correctly
   */
  it('should initialize with correct default values', () => {
    expect(roomStore.currentRoom).toBeNull();
    expect(roomStore.players).toEqual([]);
    expect(roomStore.roomCode).toBe('');
    expect(roomStore.isRoomFull).toBe(false);
  });

  /**
   * Test setting current room data
   * This validates room data assignment and player list sync
   */
  it('should set current room correctly', () => {
    const mockPlayers: Player[] = [
      {
        id: 'player1',
        name: 'Player1',
        score: 0,
        isDrawing: false,
        isConnected: true,
        joinedAt: new Date(),
      },
      {
        id: 'player2',
        name: 'Player2',
        score: 50,
        isDrawing: false,
        isConnected: true,
        joinedAt: new Date(),
      },
    ];

    const mockRoom: Room = {
      id: 'room123',
      code: 'ABC123',
      players: mockPlayers,
      currentDrawer: null,
      currentWord: null,
      roundNumber: 1,
      maxRounds: 3,
      gameState: GameState.WAITING,
      createdAt: new Date(),
      lastActivity: new Date(),
    };

    roomStore.setCurrentRoom(mockRoom);

    expect(roomStore.currentRoom).toStrictEqual(mockRoom);
    expect(roomStore.roomCode).toBe('ABC123');
    expect(roomStore.players).toEqual(mockPlayers);
    expect(roomStore.isRoomFull).toBe(false);
  });

  /**
   * Test room full detection
   * This validates maximum capacity handling
   */
  it('should detect when room is full (8 players)', () => {
    const mockPlayers: Player[] = Array.from({ length: 8 }, (_, i) => ({
      id: `player${i + 1}`,
      name: `Player${i + 1}`,
      score: 0,
      isDrawing: false,
      isConnected: true,
      joinedAt: new Date(),
    }));

    const mockRoom: Room = {
      id: 'room123',
      code: 'ABC123',
      players: mockPlayers,
      currentDrawer: null,
      currentWord: null,
      roundNumber: 1,
      maxRounds: 3,
      gameState: GameState.WAITING,
      createdAt: new Date(),
      lastActivity: new Date(),
    };

    roomStore.setCurrentRoom(mockRoom);

    expect(roomStore.isRoomFull).toBe(true);
    expect(roomStore.playerCount).toBe(8);
  });

  /**
   * Test setting room code
   * This validates room code formatting and trimming
   */
  it('should set room code with uppercase and trimming', () => {
    roomStore.setRoomCode('  abc123  ');
    expect(roomStore.roomCode).toBe('ABC123');

    roomStore.setRoomCode('xyz789');
    expect(roomStore.roomCode).toBe('XYZ789');
  });

  /**
   * Test adding new players
   * This validates player addition and room capacity updates
   */
  it('should add new players correctly', () => {
    const player1: Player = {
      id: 'player1',
      name: 'Player1',
      score: 0,
      isDrawing: false,
      isConnected: true,
      joinedAt: new Date(),
    };

    const player2: Player = {
      id: 'player2',
      name: 'Player2',
      score: 25,
      isDrawing: false,
      isConnected: true,
      joinedAt: new Date(),
    };

    roomStore.addPlayer(player1);
    expect(roomStore.players).toContainEqual(player1);
    expect(roomStore.playerCount).toBe(1);

    roomStore.addPlayer(player2);
    expect(roomStore.players).toContainEqual(player2);
    expect(roomStore.playerCount).toBe(2);
  });

  /**
   * Test updating existing players
   * This validates player data updates without duplicates
   */
  it('should update existing players instead of adding duplicates', () => {
    const player: Player = {
      id: 'player1',
      name: 'Player1',
      score: 0,
      isDrawing: false,
      isConnected: true,
      joinedAt: new Date(),
    };

    roomStore.addPlayer(player);
    expect(roomStore.playerCount).toBe(1);

    // Update the same player with new data
    const updatedPlayer: Player = {
      ...player,
      score: 100,
      isDrawing: true,
    };

    roomStore.addPlayer(updatedPlayer);
    expect(roomStore.playerCount).toBe(1); // Should not increase
    expect(roomStore.players[0].score).toBe(100);
    expect(roomStore.players[0].isDrawing).toBe(true);
  });

  /**
   * Test removing players
   * This validates player removal and capacity updates
   */
  it('should remove players correctly', () => {
    const player1: Player = {
      id: 'player1',
      name: 'Player1',
      score: 0,
      isDrawing: false,
      isConnected: true,
      joinedAt: new Date(),
    };

    const player2: Player = {
      id: 'player2',
      name: 'Player2',
      score: 25,
      isDrawing: false,
      isConnected: true,
      joinedAt: new Date(),
    };

    roomStore.addPlayer(player1);
    roomStore.addPlayer(player2);
    expect(roomStore.playerCount).toBe(2);

    roomStore.removePlayer('player1');
    expect(roomStore.playerCount).toBe(1);
    expect(roomStore.players.find(p => p.id === 'player1')).toBeUndefined();
    expect(roomStore.players.find(p => p.id === 'player2')).toBeDefined();

    roomStore.removePlayer('player2');
    expect(roomStore.playerCount).toBe(0);
    expect(roomStore.players).toEqual([]);
  });

  /**
   * Test room full status after player removal
   * This validates capacity status updates
   */
  it('should update room full status when players are removed', () => {
    // Fill room to capacity
    const mockPlayers: Player[] = Array.from({ length: 8 }, (_, i) => ({
      id: `player${i + 1}`,
      name: `Player${i + 1}`,
      score: 0,
      isDrawing: false,
      isConnected: true,
      joinedAt: new Date(),
    }));

    mockPlayers.forEach(player => roomStore.addPlayer(player));
    expect(roomStore.isRoomFull).toBe(true);

    // Remove one player
    roomStore.removePlayer('player1');
    expect(roomStore.isRoomFull).toBe(false);
    expect(roomStore.playerCount).toBe(7);
  });

  /**
   * Test updating specific player data
   * This validates individual player updates
   */
  it('should update specific player data correctly', () => {
    const player: Player = {
      id: 'player1',
      name: 'Player1',
      score: 0,
      isDrawing: false,
      isConnected: true,
      joinedAt: new Date(),
    };

    roomStore.addPlayer(player);

    const updatedPlayer: Player = {
      ...player,
      score: 150,
      isDrawing: true,
    };

    roomStore.updatePlayer(updatedPlayer);

    const foundPlayer = roomStore.players.find(p => p.id === 'player1');
    expect(foundPlayer?.score).toBe(150);
    expect(foundPlayer?.isDrawing).toBe(true);
  });

  /**
   * Test updating non-existent player
   * This validates graceful handling of invalid player updates
   */
  it('should handle updating non-existent player gracefully', () => {
    const player: Player = {
      id: 'nonexistent',
      name: 'Ghost',
      score: 100,
      isDrawing: false,
      isConnected: true,
      joinedAt: new Date(),
    };

    expect(() => {
      roomStore.updatePlayer(player);
    }).not.toThrow();

    expect(roomStore.playerCount).toBe(0);
  });

  /**
   * Test room code validation
   * This validates room code format requirements
   */
  it('should validate room code format correctly', () => {
    roomStore.setRoomCode('ABC12');
    expect(roomStore.isRoomCodeValid).toBe(false);

    roomStore.setRoomCode('ABC123');
    expect(roomStore.isRoomCodeValid).toBe(true);

    roomStore.setRoomCode('ABCD123');
    expect(roomStore.isRoomCodeValid).toBe(false);

    roomStore.setRoomCode('');
    expect(roomStore.isRoomCodeValid).toBe(false);
  });

  /**
   * Test players sorted by score
   * This validates leaderboard functionality
   */
  it('should return players sorted by score (highest first)', () => {
    const players: Player[] = [
      {
        id: 'player1',
        name: 'Player1',
        score: 50,
        isDrawing: false,
        isConnected: true,
        joinedAt: new Date(),
      },
      {
        id: 'player2',
        name: 'Player2',
        score: 150,
        isDrawing: false,
        isConnected: true,
        joinedAt: new Date(),
      },
      {
        id: 'player3',
        name: 'Player3',
        score: 100,
        isDrawing: false,
        isConnected: true,
        joinedAt: new Date(),
      },
    ];

    players.forEach(player => roomStore.addPlayer(player));

    const sortedPlayers = roomStore.playersByScore;
    expect(sortedPlayers[0].score).toBe(150);
    expect(sortedPlayers[1].score).toBe(100);
    expect(sortedPlayers[2].score).toBe(50);
  });

  /**
   * Test room membership check
   * This validates room membership detection
   */
  it('should correctly identify if player is in room', () => {
    expect(roomStore.isInRoom).toBe(false);

    const mockRoom: Room = {
      id: 'room123',
      code: 'ABC123',
      players: [],
      currentDrawer: null,
      currentWord: null,
      roundNumber: 1,
      maxRounds: 3,
      gameState: GameState.WAITING,
      createdAt: new Date(),
      lastActivity: new Date(),
    };

    roomStore.setCurrentRoom(mockRoom);
    expect(roomStore.isInRoom).toBe(true);
  });

  /**
   * Test current room code getter
   * This validates room code retrieval with fallback
   */
  it('should return current room code or empty string', () => {
    expect(roomStore.currentRoomCode).toBe('');

    const mockRoom: Room = {
      id: 'room123',
      code: 'XYZ789',
      players: [],
      currentDrawer: null,
      currentWord: null,
      roundNumber: 1,
      maxRounds: 3,
      gameState: GameState.WAITING,
      createdAt: new Date(),
      lastActivity: new Date(),
    };

    roomStore.setCurrentRoom(mockRoom);
    expect(roomStore.currentRoomCode).toBe('XYZ789');
  });

  /**
   * Test game start capability check
   * This validates minimum player requirements
   */
  it('should correctly identify if game can start', () => {
    expect(roomStore.canStartGame).toBe(false);

    // Add one player - still can't start
    const player1: Player = {
      id: 'player1',
      name: 'Player1',
      score: 0,
      isDrawing: false,
      isConnected: true,
      joinedAt: new Date(),
    };
    roomStore.addPlayer(player1);
    expect(roomStore.canStartGame).toBe(false);

    // Add second player - now can start
    const player2: Player = {
      id: 'player2',
      name: 'Player2',
      score: 0,
      isDrawing: false,
      isConnected: true,
      joinedAt: new Date(),
    };
    roomStore.addPlayer(player2);
    expect(roomStore.canStartGame).toBe(true);
  });

  /**
   * Test store reset functionality
   * This validates cleanup when leaving room
   */
  it('should reset to initial state when reset is called', () => {
    // Set up some state
    const mockRoom: Room = {
      id: 'room123',
      code: 'ABC123',
      players: [],
      currentDrawer: null,
      currentWord: null,
      roundNumber: 1,
      maxRounds: 3,
      gameState: GameState.WAITING,
      createdAt: new Date(),
      lastActivity: new Date(),
    };

    roomStore.setCurrentRoom(mockRoom);
    roomStore.setRoomCode('XYZ789');

    const player: Player = {
      id: 'player1',
      name: 'Player1',
      score: 100,
      isDrawing: false,
      isConnected: true,
      joinedAt: new Date(),
    };
    roomStore.addPlayer(player);

    // Reset
    roomStore.reset();

    // Verify reset to initial state
    expect(roomStore.currentRoom).toBeNull();
    expect(roomStore.players).toEqual([]);
    expect(roomStore.roomCode).toBe('');
    expect(roomStore.isRoomFull).toBe(false);
  });
});