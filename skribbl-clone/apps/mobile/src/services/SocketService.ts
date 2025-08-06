/**
 * @fileoverview Socket.IO client service for real-time communication
 * Handles connection to backend server and event management
 * Requirements: 6.7, 9.1, 9.5 - Socket.IO client for real-time communication
 */

import { io, Socket } from 'socket.io-client';
import { 
  ClientToServerEvents, 
  ServerToClientEvents,
  DrawingData,
  ChatMessage,
  Player,
  Room
} from '@skribbl-clone/types';

/**
 * SocketService manages the Socket.IO connection and event handling
 * This service provides a clean interface for real-time communication with the backend
 */
export class SocketService {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
  private serverUrl: string;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;

  constructor(serverUrl: string = 'http://localhost:3000') {
    this.serverUrl = serverUrl;
  }

  /**
   * Connect to the Socket.IO server
   * Establishes connection with automatic reconnection handling
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(this.serverUrl, {
          transports: ['websocket', 'polling'],
          timeout: 5000,
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
        });

        // Handle successful connection
        this.socket.on('connect', () => {
          console.log('Connected to server:', this.socket?.id);
          this.reconnectAttempts = 0;
          resolve();
        });

        // Handle connection errors
        this.socket.on('connect_error', (error) => {
          console.error('Connection error:', error);
          this.reconnectAttempts++;
          
          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            reject(new Error('Failed to connect to server after multiple attempts'));
          }
        });

        // Handle disconnection
        this.socket.on('disconnect', (reason) => {
          console.log('Disconnected from server:', reason);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from the Socket.IO server
   * Cleanly closes the connection
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Check if the socket is connected
   * Used for displaying connection status
   */
  get isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Get the current socket ID
   * Used for identifying the client
   */
  get socketId(): string | undefined {
    return this.socket?.id;
  }

  // Room Management Events

  /**
   * Create a new room
   * Emits room:create event with player name
   */
  createRoom(playerName: string): void {
    this.socket?.emit('room:create', playerName);
  }

  /**
   * Join an existing room
   * Emits room:join event with room code and player name
   */
  joinRoom(roomCode: string, playerName: string): void {
    this.socket?.emit('room:join', roomCode, playerName);
  }

  /**
   * Leave the current room
   * Emits room:leave event
   */
  leaveRoom(): void {
    this.socket?.emit('room:leave');
  }

  // Game Events

  /**
   * Start the game
   * Emits game:start event (only room creator can start)
   */
  startGame(): void {
    this.socket?.emit('game:start');
  }

  // Drawing Events

  /**
   * Send drawing data to other players
   * Emits drawing:stroke event with drawing coordinates
   */
  sendDrawingData(drawingData: DrawingData): void {
    this.socket?.emit('drawing:stroke', drawingData);
  }

  /**
   * Clear the drawing canvas
   * Emits drawing:clear event
   */
  clearCanvas(): void {
    this.socket?.emit('drawing:clear');
  }

  // Chat Events

  /**
   * Send a chat message
   * Emits chat:message event with message text
   */
  sendChatMessage(message: string): void {
    this.socket?.emit('chat:message', message);
  }

  // Event Listeners

  /**
   * Listen for room created event
   * Called when successfully creating a room
   */
  onRoomCreated(callback: (room: Room) => void): void {
    this.socket?.on('room:created', callback);
  }

  /**
   * Listen for room joined event
   * Called when successfully joining a room
   */
  onRoomJoined(callback: (room: Room) => void): void {
    this.socket?.on('room:joined', callback);
  }

  /**
   * Listen for room updated event
   * Called when room state changes (players join/leave, etc.)
   */
  onRoomUpdated(callback: (room: Room) => void): void {
    this.socket?.on('room:updated', callback);
  }

  /**
   * Listen for room error event
   * Called when room operations fail
   */
  onRoomError(callback: (error: string) => void): void {
    this.socket?.on('room:error', callback);
  }

  /**
   * Listen for game started event
   * Called when the game begins
   */
  onGameStarted(callback: (currentDrawer: Player, word: string) => void): void {
    this.socket?.on('game:started', callback);
  }

  /**
   * Listen for game round end event
   * Called when a drawing round ends
   */
  onGameRoundEnd(callback: (results: any) => void): void {
    this.socket?.on('game:round_end', callback);
  }

  /**
   * Listen for game end event
   * Called when the entire game ends
   */
  onGameEnd(callback: (finalScores: Player[]) => void): void {
    this.socket?.on('game:end', callback);
  }

  /**
   * Listen for drawing update event
   * Called when receiving drawing data from other players
   */
  onDrawingUpdate(callback: (drawingData: DrawingData) => void): void {
    this.socket?.on('drawing:update', callback);
  }

  /**
   * Listen for drawing cleared event
   * Called when the canvas is cleared
   */
  onDrawingCleared(callback: () => void): void {
    this.socket?.on('drawing:cleared', callback);
  }

  /**
   * Listen for chat message event
   * Called when receiving chat messages
   */
  onChatMessage(callback: (message: ChatMessage) => void): void {
    this.socket?.on('chat:message', callback);
  }

  /**
   * Listen for player joined event
   * Called when a new player joins the room
   */
  onPlayerJoined(callback: (player: Player) => void): void {
    this.socket?.on('player:joined' as any, callback);
  }

  /**
   * Listen for player left event
   * Called when a player leaves the room
   */
  onPlayerLeft(callback: (playerId: string) => void): void {
    this.socket?.on('player:left' as any, callback);
  }

  /**
   * Remove all event listeners
   * Called when cleaning up the service
   */
  removeAllListeners(): void {
    this.socket?.removeAllListeners();
  }

  /**
   * Remove specific event listener
   * Called when component unmounts or no longer needs specific events
   */
  removeListener(event: string, callback?: Function): void {
    if (callback) {
      this.socket?.off(event as any, callback as any);
    } else {
      this.socket?.off(event as any);
    }
  }
}