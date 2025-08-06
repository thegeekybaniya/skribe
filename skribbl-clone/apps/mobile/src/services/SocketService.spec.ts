/**
 * @fileoverview Unit tests for SocketService
 * Tests Socket.IO client functionality and event handling
 * Requirements: 6.7, 9.1, 9.5 - Socket.IO client for real-time communication
 */

import { SocketService } from './SocketService';
import { io } from 'socket.io-client';

// Mock Socket.IO
jest.mock('socket.io-client');
const mockIo = io as jest.MockedFunction<typeof io>;

describe('SocketService', () => {
  let socketService: SocketService;
  let mockSocket: any;

  beforeEach(() => {
    // Create mock socket
    mockSocket = {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
      connect: jest.fn(),
      disconnect: jest.fn(),
      removeAllListeners: jest.fn(),
      connected: false,
      id: 'mock-socket-id',
    };

    mockIo.mockReturnValue(mockSocket);
    socketService = new SocketService('http://localhost:3000');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Test SocketService initialization
   * This validates service creation with server URL
   */
  it('should initialize with server URL', () => {
    expect(socketService).toBeDefined();
    expect(socketService.isConnected).toBe(false);
  });

  /**
   * Test socket connection
   * This validates connection establishment
   */
  it('should connect to server', async () => {
    const connectPromise = socketService.connect();

    // Simulate successful connection
    const connectCallback = mockSocket.on.mock.calls.find(
      (call: any) => call[0] === 'connect'
    )[1];
    connectCallback();

    await expect(connectPromise).resolves.toBeUndefined();
    expect(mockIo).toHaveBeenCalledWith('http://localhost:3000', expect.any(Object));
  });

  /**
   * Test socket disconnection
   * This validates connection cleanup
   */
  it('should disconnect from server', () => {
    socketService.connect();
    socketService.disconnect();

    expect(mockSocket.disconnect).toHaveBeenCalled();
  });

  /**
   * Test connection status
   * This validates connection state tracking
   */
  it('should track connection status', () => {
    // Need to connect first to have a socket instance
    socketService.connect();
    
    mockSocket.connected = true;
    expect(socketService.isConnected).toBe(true);

    mockSocket.connected = false;
    expect(socketService.isConnected).toBe(false);
  });

  /**
   * Test socket ID access
   * This validates socket ID retrieval
   */
  it('should provide socket ID', () => {
    socketService.connect();
    expect(socketService.socketId).toBe('mock-socket-id');
  });

  /**
   * Test room creation
   * This validates room creation event emission
   */
  it('should emit room creation event', () => {
    socketService.connect();
    socketService.createRoom('TestPlayer');

    expect(mockSocket.emit).toHaveBeenCalledWith('room:create', 'TestPlayer');
  });

  /**
   * Test room joining
   * This validates room joining event emission
   */
  it('should emit room join event', () => {
    socketService.connect();
    socketService.joinRoom('ABC123', 'TestPlayer');

    expect(mockSocket.emit).toHaveBeenCalledWith('room:join', 'ABC123', 'TestPlayer');
  });

  /**
   * Test leaving room
   * This validates room leaving event emission
   */
  it('should emit room leave event', () => {
    socketService.connect();
    socketService.leaveRoom();

    expect(mockSocket.emit).toHaveBeenCalledWith('room:leave');
  });

  /**
   * Test game start
   * This validates game start event emission
   */
  it('should emit game start event', () => {
    socketService.connect();
    socketService.startGame();

    expect(mockSocket.emit).toHaveBeenCalledWith('game:start');
  });

  /**
   * Test drawing data emission
   * This validates drawing data transmission
   */
  it('should emit drawing data', () => {
    const drawingData = {
      x: 100,
      y: 200,
      color: '#000000',
      brushSize: 5,
      isDrawing: true,
      timestamp: Date.now(),
    };

    socketService.connect();
    socketService.sendDrawingData(drawingData);

    expect(mockSocket.emit).toHaveBeenCalledWith('drawing:stroke', drawingData);
  });

  /**
   * Test canvas clearing
   * This validates canvas clear event emission
   */
  it('should emit canvas clear event', () => {
    socketService.connect();
    socketService.clearCanvas();

    expect(mockSocket.emit).toHaveBeenCalledWith('drawing:clear');
  });

  /**
   * Test chat message sending
   * This validates chat message transmission
   */
  it('should emit chat message', () => {
    socketService.connect();
    socketService.sendChatMessage('Hello world!');

    expect(mockSocket.emit).toHaveBeenCalledWith('chat:message', 'Hello world!');
  });

  /**
   * Test event listener registration
   * This validates event listener setup
   */
  it('should register event listeners', () => {
    const callback = jest.fn();
    
    socketService.connect();
    socketService.onRoomCreated(callback);

    expect(mockSocket.on).toHaveBeenCalledWith('room:created', callback);
  });

  /**
   * Test event listener removal
   * This validates event listener cleanup
   */
  it('should remove event listeners', () => {
    const callback = jest.fn();
    
    socketService.connect();
    socketService.removeListener('room:created', callback);

    expect(mockSocket.off).toHaveBeenCalledWith('room:created', callback);
  });

  /**
   * Test removing all listeners
   * This validates complete event listener cleanup
   */
  it('should remove all event listeners', () => {
    socketService.connect();
    socketService.removeAllListeners();

    expect(mockSocket.removeAllListeners).toHaveBeenCalled();
  });

  /**
   * Test connection error handling
   * This validates error handling during connection
   */
  it('should handle connection errors', async () => {
    const connectPromise = socketService.connect();

    // Simulate connection error
    const errorCallback = mockSocket.on.mock.calls.find(
      (call: any) => call[0] === 'connect_error'
    )[1];
    
    // Trigger multiple errors to exceed retry limit
    for (let i = 0; i < 5; i++) {
      errorCallback(new Error('Connection failed'));
    }

    await expect(connectPromise).rejects.toThrow('Failed to connect to server after multiple attempts');
  });
});