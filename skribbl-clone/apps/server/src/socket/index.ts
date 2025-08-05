/**
 * @fileoverview Socket.IO server configuration for the Skribbl.io clone
 * This module sets up the Socket.IO server with proper CORS configuration
 * and connection handling. It provides the foundation for real-time
 * communication between clients and the server.
 * 
 * Requirements coverage: 9.2 (Socket.IO server setup), 9.4 (CORS configuration)
 */

import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import config from '../config';
import logger from '../utils/logger';
import { RoomManager } from '../services/RoomManager';
import { PlayerManager } from '../services/PlayerManager';
import { registerRoomHandlers } from './roomHandlers';
import { registerPlayerHandlers } from './playerHandlers';
import { ClientToServerEvents, ServerToClientEvents, SocketData } from '@skribbl-clone/types';

/**
 * Initialize and configure the Socket.IO server
 * This function sets up Socket.IO with proper CORS settings and basic connection handling
 * 
 * @param httpServer - The HTTP server instance to attach Socket.IO to
 * @returns Configured Socket.IO server instance and RoomManager
 */
export function initializeSocket(httpServer: HttpServer): { io: SocketIOServer; roomManager: RoomManager; playerManager: PlayerManager } {
  logger.info('Initializing Socket.IO server...');

  // Create Socket.IO server with CORS configuration and typed events
  const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents, {}, SocketData>(httpServer, {
    cors: {
      origin: config.socketCorsOrigin,
      methods: ['GET', 'POST'],
      credentials: true
    },
    // Configure connection settings
    pingTimeout: 60000, // 60 seconds
    pingInterval: 25000, // 25 seconds
  });

  // Create RoomManager instance for managing game rooms
  const roomManager = new RoomManager();
  
  // Create PlayerManager instance for managing player sessions
  const playerManager = new PlayerManager(roomManager);

  // Handle client connections
  io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}`);

    // Register room-related event handlers
    registerRoomHandlers(socket, roomManager, playerManager);
    
    // Register player-related event handlers
    registerPlayerHandlers(socket, playerManager, roomManager);

    // Handle client disconnection
    socket.on('disconnect', (reason) => {
      logger.info(`Client disconnected: ${socket.id}, reason: ${reason}`);
    });

    // Handle connection errors
    socket.on('error', (error) => {
      logger.error(`Socket error for client ${socket.id}:`, error);
    });

    // Basic connection acknowledgment
    socket.emit('connected', {
      message: 'Successfully connected to Skribbl.io Clone server',
      socketId: socket.id,
      timestamp: new Date().toISOString()
    });
  });

  // Handle server-level Socket.IO errors
  io.engine.on('connection_error', (err) => {
    logger.error('Socket.IO connection error:', {
      message: err.message,
      description: err.description,
      context: err.context,
      type: err.type
    });
  });

  logger.info('Socket.IO server initialized successfully');
  return { io, roomManager, playerManager };
}