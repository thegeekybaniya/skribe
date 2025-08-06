/**
 * @fileoverview Socket.IO event handlers for real-time drawing functionality
 * 
 * This module handles all drawing-related Socket.IO events including:
 * - Processing and validating drawing data from clients
 * - Broadcasting drawing strokes to all players in real-time
 * - Implementing drawing event throttling to prevent spam (60fps limit)
 * - Managing canvas clearing functionality for new rounds
 * - Validating drawing permissions (only current drawer can draw)
 * - Coordinating with RoomManager and GameService for drawing state
 * 
 * Requirements covered: 2.1, 2.2, 2.3, 2.4, 2.5
 */

import { Socket } from 'socket.io';
import { DrawingData, ClientToServerEvents, ServerToClientEvents, SocketData } from '@skribbl-clone/types';
import { RoomManager } from '../services/RoomManager';
import { GameService } from '../services/GameService';
import logger from '../utils/logger';

// Type for our Socket with proper event typing
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, {}, SocketData>;

/**
 * Interface for tracking drawing throttling per player
 */
interface DrawingThrottle {
    lastDrawTime: number;
    drawingCount: number;
    windowStart: number;
}

/**
 * Drawing service class to handle drawing logic and throttling
 */
class DrawingService {
    // Throttling configuration - 60fps limit means max 60 events per second
    private readonly MAX_DRAWING_EVENTS_PER_SECOND = 60;
    private readonly THROTTLE_WINDOW_MS = 1000; // 1 second window
    private readonly MIN_TIME_BETWEEN_DRAWS = 1000 / this.MAX_DRAWING_EVENTS_PER_SECOND; // ~16.67ms

    // Track throttling per player
    private playerThrottles: Map<string, DrawingThrottle> = new Map();

    // Track canvas state per room for clearing functionality
    private roomCanvasStates: Map<string, { lastClearTime: number; strokeCount: number }> = new Map();

    constructor(
        private roomManager: RoomManager
    ) {}

    /**
     * Validates if a player is allowed to draw
     * @param playerId - ID of the player attempting to draw
     * @param roomId - ID of the room
     * @returns Validation result with reason if not allowed
     */
    validateDrawingPermission(playerId: string, roomId: string): { allowed: boolean; reason?: string } {
        try {
            // Get room and game state
            const room = this.roomManager.getRoomById(roomId);
            if (!room) {
                return { allowed: false, reason: 'Room not found' };
            }

            // Check if game is in playing state
            if (room.gameState !== 'playing') {
                return { allowed: false, reason: 'Game is not in playing state' };
            }

            // Check if player is the current drawer
            if (room.currentDrawer !== playerId) {
                return { allowed: false, reason: 'Only the current drawer can draw' };
            }

            // Check if player exists and is connected
            const player = room.players.find(p => p.id === playerId);
            if (!player) {
                return { allowed: false, reason: 'Player not found in room' };
            }

            if (!player.isConnected) {
                return { allowed: false, reason: 'Player is not connected' };
            }

            return { allowed: true };
        } catch (error) {
            logger.error('Error validating drawing permission:', error);
            return { allowed: false, reason: 'Internal error' };
        }
    }

    /**
     * Validates and sanitizes drawing data
     * @param drawingData - Raw drawing data from client
     * @returns Validated and sanitized drawing data or null if invalid
     */
    validateDrawingData(drawingData: any): DrawingData | null {
        try {
            // Check if all required fields are present and valid
            if (typeof drawingData !== 'object' || drawingData === null) {
                return null;
            }

            const { x, y, prevX, prevY, color, brushSize, isDrawing, timestamp } = drawingData;

            // Validate coordinates
            if (typeof x !== 'number' || typeof y !== 'number' || 
                isNaN(x) || isNaN(y) || 
                x < 0 || y < 0 || x > 1920 || y > 1080) { // Reasonable canvas bounds
                return null;
            }

            // Validate previous coordinates if provided
            if (prevX !== undefined && (typeof prevX !== 'number' || isNaN(prevX))) {
                return null;
            }
            if (prevY !== undefined && (typeof prevY !== 'number' || isNaN(prevY))) {
                return null;
            }

            // Validate color (hex color format)
            if (typeof color !== 'string' || !/^#[0-9A-Fa-f]{6}$/.test(color)) {
                return null;
            }

            // Validate brush size (reasonable range)
            if (typeof brushSize !== 'number' || isNaN(brushSize) || 
                brushSize < 1 || brushSize > 50) {
                return null;
            }

            // Validate isDrawing flag
            if (typeof isDrawing !== 'boolean') {
                return null;
            }

            // Validate timestamp (should be recent)
            if (typeof timestamp !== 'number' || isNaN(timestamp)) {
                return null;
            }

            const now = Date.now();
            const timeDiff = Math.abs(now - timestamp);
            if (timeDiff > 5000) { // Allow 5 second clock difference
                // Update timestamp to server time to prevent timing issues
                drawingData.timestamp = now;
            }

            // Return sanitized data
            return {
                x: Math.round(x * 100) / 100, // Round to 2 decimal places
                y: Math.round(y * 100) / 100,
                prevX: prevX !== undefined ? Math.round(prevX * 100) / 100 : undefined,
                prevY: prevY !== undefined ? Math.round(prevY * 100) / 100 : undefined,
                color: color.toUpperCase(), // Normalize color format
                brushSize: Math.round(brushSize),
                isDrawing,
                timestamp: drawingData.timestamp
            };
        } catch (error) {
            logger.error('Error validating drawing data:', error);
            return null;
        }
    }

    /**
     * Checks if drawing event should be throttled for a player
     * @param playerId - ID of the player
     * @returns Whether the event should be throttled
     */
    shouldThrottleDrawing(playerId: string): boolean {
        try {
            const now = Date.now();
            let throttle = this.playerThrottles.get(playerId);

            if (!throttle) {
                // First drawing event for this player
                throttle = {
                    lastDrawTime: now,
                    drawingCount: 1,
                    windowStart: now
                };
                this.playerThrottles.set(playerId, throttle);
                return false;
            }

            // Check if we're in a new time window
            if (now - throttle.windowStart >= this.THROTTLE_WINDOW_MS) {
                // Reset for new window
                throttle.windowStart = now;
                throttle.drawingCount = 1;
                throttle.lastDrawTime = now;
                return false;
            }

            // Check if minimum time has passed since last draw
            if (now - throttle.lastDrawTime < this.MIN_TIME_BETWEEN_DRAWS) {
                return true; // Throttle this event
            }

            // Check if we've exceeded the rate limit for this window
            if (throttle.drawingCount >= this.MAX_DRAWING_EVENTS_PER_SECOND) {
                return true; // Throttle this event
            }

            // Update throttle tracking
            throttle.drawingCount++;
            throttle.lastDrawTime = now;

            return false;
        } catch (error) {
            logger.error('Error checking drawing throttle:', error);
            return true; // Throttle on error to be safe
        }
    }

    /**
     * Clears canvas state for a room
     * @param roomId - ID of the room
     */
    clearCanvasForRoom(roomId: string): void {
        try {
            const now = Date.now();
            this.roomCanvasStates.set(roomId, {
                lastClearTime: now,
                strokeCount: 0
            });

            // Clear throttling for all players in the room when canvas is cleared
            const room = this.roomManager.getRoomById(roomId);
            if (room) {
                room.players.forEach(player => {
                    this.playerThrottles.delete(player.id);
                });
            }
        } catch (error) {
            logger.error('Error clearing canvas state:', error);
        }
    }

    /**
     * Updates stroke count for a room
     * @param roomId - ID of the room
     */
    incrementStrokeCount(roomId: string): void {
        try {
            let canvasState = this.roomCanvasStates.get(roomId);
            if (!canvasState) {
                canvasState = {
                    lastClearTime: Date.now(),
                    strokeCount: 0
                };
                this.roomCanvasStates.set(roomId, canvasState);
            }
            canvasState.strokeCount++;
        } catch (error) {
            logger.error('Error updating stroke count:', error);
        }
    }

    /**
     * Cleans up throttling data for a player
     * @param playerId - ID of the player
     */
    cleanupPlayerThrottling(playerId: string): void {
        this.playerThrottles.delete(playerId);
    }

    /**
     * Cleans up all data for a room
     * @param roomId - ID of the room
     */
    cleanupRoomData(roomId: string): void {
        this.roomCanvasStates.delete(roomId);
        
        // Clean up throttling for all players in the room
        const room = this.roomManager.getRoomById(roomId);
        if (room) {
            room.players.forEach(player => {
                this.playerThrottles.delete(player.id);
            });
        }
    }
}

// Map to store drawing service instances per socket
const drawingServices: Map<string, DrawingService> = new Map();

/**
 * Registers all drawing-related Socket.IO event handlers
 * @param socket - The Socket.IO socket instance
 * @param roomManager - Room management service
 * @param gameService - Game flow management service
 */
export function registerDrawingHandlers(
    socket: TypedSocket,
    roomManager: RoomManager,
    gameService: GameService
): void {
    // Create a drawing service instance for this socket
    const drawingService = new DrawingService(roomManager);
    drawingServices.set(socket.id, drawingService);

    /**
     * Handle drawing stroke events from clients
     * Validates permissions, throttles events, and broadcasts to other players
     */
    socket.on('drawing:stroke', (drawingData: DrawingData) => {
        try {
            const playerId = socket.data.playerId;
            const roomId = socket.data.roomId;

            // Validate player and room data
            if (!playerId || !roomId) {
                logger.warn(`Drawing stroke attempted without player/room data: ${socket.id}`);
                return;
            }

            // Validate drawing permission
            const permissionCheck = drawingService.validateDrawingPermission(playerId, roomId);
            if (!permissionCheck.allowed) {
                logger.warn(`Drawing permission denied for player ${playerId}: ${permissionCheck.reason}`);
                socket.emit('connection:error', `Drawing not allowed: ${permissionCheck.reason}`);
                return;
            }

            // Check throttling
            if (drawingService.shouldThrottleDrawing(playerId)) {
                // Silently drop throttled events - don't spam the client with errors
                return;
            }

            // Validate and sanitize drawing data
            const validatedData = drawingService.validateDrawingData(drawingData);
            if (!validatedData) {
                logger.warn(`Invalid drawing data from player ${playerId}`);
                socket.emit('connection:error', 'Invalid drawing data');
                return;
            }

            // Update stroke count for the room
            drawingService.incrementStrokeCount(roomId);

            // Broadcast drawing data to all other players in the room
            socket.to(roomId).emit('drawing:update', validatedData);

            logger.debug(`Drawing stroke processed for player ${playerId} in room ${roomId}`);
        } catch (error) {
            logger.error('Error handling drawing stroke:', error);
            socket.emit('connection:error', 'Failed to process drawing stroke');
        }
    });

    /**
     * Handle canvas clear events from clients
     * Only allows the current drawer to clear the canvas
     */
    socket.on('drawing:clear', () => {
        try {
            const playerId = socket.data.playerId;
            const roomId = socket.data.roomId;

            // Validate player and room data
            if (!playerId || !roomId) {
                logger.warn(`Canvas clear attempted without player/room data: ${socket.id}`);
                return;
            }

            // Validate drawing permission (same as drawing - only current drawer can clear)
            const permissionCheck = drawingService.validateDrawingPermission(playerId, roomId);
            if (!permissionCheck.allowed) {
                logger.warn(`Canvas clear permission denied for player ${playerId}: ${permissionCheck.reason}`);
                socket.emit('connection:error', `Clear not allowed: ${permissionCheck.reason}`);
                return;
            }

            // Clear canvas state
            drawingService.clearCanvasForRoom(roomId);

            // Broadcast canvas clear to all players in the room (including the drawer)
            socket.to(roomId).emit('drawing:cleared');
            socket.emit('drawing:cleared'); // Also send to the drawer who initiated the clear

            logger.info(`Canvas cleared by player ${playerId} in room ${roomId}`);
        } catch (error) {
            logger.error('Error handling canvas clear:', error);
            socket.emit('connection:error', 'Failed to clear canvas');
        }
    });

    /**
     * Handle player disconnection - clean up drawing-related data
     */
    socket.on('disconnect', () => {
        try {
            const playerId = socket.data.playerId;
            if (playerId) {
                drawingService.cleanupPlayerThrottling(playerId);
                logger.debug(`Cleaned up drawing data for disconnected player ${playerId}`);
            }
            
            // Clean up the drawing service instance for this socket
            drawingServices.delete(socket.id);
        } catch (error) {
            logger.error('Error cleaning up drawing data on disconnect:', error);
        }
    });
}

// Global drawing service for event listeners (shared across all sockets)
let globalDrawingService: DrawingService;

/**
 * Sets up drawing service event listeners for game events
 * @param gameService - Game service instance
 * @param roomManager - Room manager instance
 */
export function setupDrawingServiceListeners(gameService: GameService, roomManager: RoomManager): void {
    // Initialize global drawing service if not already done
    if (!globalDrawingService) {
        globalDrawingService = new DrawingService(roomManager);
    }

    // Clear canvas when a new round starts
    gameService.on('roundStarted', (room, drawer, word, roundNumber) => {
        try {
            globalDrawingService.clearCanvasForRoom(room.id);
            logger.info(`Canvas cleared for new round ${roundNumber} in room ${room.id}`);
        } catch (error) {
            logger.error('Error clearing canvas for new round:', error);
        }
    });

    // Clean up room data when room is deleted
    roomManager.on('roomDeleted', (room) => {
        try {
            globalDrawingService.cleanupRoomData(room.id);
            logger.debug(`Cleaned up drawing data for deleted room ${room.id}`);
        } catch (error) {
            logger.error('Error cleaning up drawing data for deleted room:', error);
        }
    });

    // Clean up player data when player leaves
    roomManager.on('playerLeft', (room, player) => {
        try {
            globalDrawingService.cleanupPlayerThrottling(player.id);
            logger.debug(`Cleaned up drawing data for player ${player.id} who left room ${room.id}`);
        } catch (error) {
            logger.error('Error cleaning up drawing data for leaving player:', error);
        }
    });
}