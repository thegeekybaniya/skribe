/**
 * @fileoverview Unit tests for Socket.IO server initialization
 * 
 * This test file validates that the Socket.IO server is properly
 * configured with CORS settings, connection handling, and error
 * management for real-time communication.
 * 
 * Requirements coverage: 9.2 (Socket.IO server setup), 9.4 (CORS configuration)
 */

import { createServer, Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { Socket as ClientSocket, io as ClientIO } from 'socket.io-client';
import { initializeSocket } from './index';
import logger from '../utils/logger';

// Mock the logger to avoid actual logging during tests
jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

// Mock the config module
jest.mock('../config', () => ({
  socketCorsOrigin: 'http://localhost:3001',
  nodeEnv: 'test'
}));

describe('Socket.IO Server Initialization', () => {
  let httpServer: HttpServer;
  let io: SocketIOServer;
  let clientSocket: ClientSocket;
  let serverPort: number;

  beforeEach((done) => {
    // Create HTTP server for testing
    httpServer = createServer();
    
    // Find an available port
    httpServer.listen(0, () => {
      const address = httpServer.address();
      serverPort = typeof address === 'object' && address ? address.port : 3000;
      
      // Initialize Socket.IO server
      io = initializeSocket(httpServer);
      
      done();
    });
  });

  afterEach((done) => {
    // Clean up connections
    if (clientSocket && clientSocket.connected) {
      clientSocket.disconnect();
    }
    
    if (io) {
      io.close();
    }
    
    if (httpServer) {
      httpServer.close(done);
    } else {
      done();
    }
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('Server Initialization', () => {
    it('should initialize Socket.IO server successfully', () => {
      expect(io).toBeInstanceOf(SocketIOServer);
      expect(logger.info).toHaveBeenCalledWith('Initializing Socket.IO server...');
      expect(logger.info).toHaveBeenCalledWith('Socket.IO server initialized successfully');
    });

    it('should configure CORS settings correctly', () => {
      // Access the server options to verify CORS configuration
      const serverOptions = (io as any).opts;
      
      expect(serverOptions.cors).toBeDefined();
      expect(serverOptions.cors.origin).toBe('http://localhost:3001');
      expect(serverOptions.cors.methods).toEqual(['GET', 'POST']);
      expect(serverOptions.cors.credentials).toBe(true);
    });

    it('should configure connection settings', () => {
      const serverOptions = (io as any).opts;
      
      expect(serverOptions.pingTimeout).toBe(60000);
      expect(serverOptions.pingInterval).toBe(25000);
    });
  });

  describe('Client Connection Handling', () => {
    it('should handle client connection successfully', (done) => {
      // Create client connection
      clientSocket = ClientIO(`http://localhost:${serverPort}`, {
        transports: ['websocket'],
        forceNew: true
      });

      // Listen for connection event
      clientSocket.on('connect', () => {
        expect(clientSocket.connected).toBe(true);
        expect(logger.info).toHaveBeenCalledWith(
          expect.stringMatching(/^Client connected: .+/)
        );
        done();
      });

      clientSocket.on('connect_error', (error) => {
        done(error);
      });
    });

    it('should send connection acknowledgment to client', (done) => {
      clientSocket = ClientIO(`http://localhost:${serverPort}`, {
        transports: ['websocket'],
        forceNew: true
      });

      // Listen for the connected event from server
      clientSocket.on('connected', (data) => {
        expect(data).toHaveProperty('message', 'Successfully connected to Skribbl.io Clone server');
        expect(data).toHaveProperty('socketId');
        expect(data).toHaveProperty('timestamp');
        
        // Verify timestamp is a valid ISO string
        expect(new Date(data.timestamp).toISOString()).toBe(data.timestamp);
        
        done();
      });

      clientSocket.on('connect_error', (error) => {
        done(error);
      });
    });

    it('should handle client disconnection', (done) => {
      clientSocket = ClientIO(`http://localhost:${serverPort}`, {
        transports: ['websocket'],
        forceNew: true
      });

      clientSocket.on('connect', () => {
        const socketId = clientSocket.id;
        
        // Disconnect the client
        clientSocket.disconnect();
        
        // Give some time for the disconnect event to be processed
        setTimeout(() => {
          expect(logger.info).toHaveBeenCalledWith(
            expect.stringMatching(new RegExp(`Client disconnected: ${socketId}, reason: .+`))
          );
          done();
        }, 100);
      });

      clientSocket.on('connect_error', (error) => {
        done(error);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle socket errors', (done) => {
      clientSocket = ClientIO(`http://localhost:${serverPort}`, {
        transports: ['websocket'],
        forceNew: true
      });

      clientSocket.on('connect', () => {
        // Simulate a socket error by emitting an error event
        (clientSocket as any).emit('error', new Error('Test socket error'));
        
        // Give some time for the error to be processed
        setTimeout(() => {
          expect(logger.error).toHaveBeenCalledWith(
            expect.stringMatching(/^Socket error for client .+:/),
            expect.objectContaining({})
          );
          done();
        }, 100);
      });

      clientSocket.on('connect_error', (error) => {
        done(error);
      });
    });

    it('should handle connection errors', (done) => {
      // Simulate a connection error by trying to connect to a non-existent server
      const badClientSocket = ClientIO('http://localhost:99999', {
        transports: ['websocket'],
        timeout: 1000,
        forceNew: true
      });

      badClientSocket.on('connect_error', () => {
        // Connection error is expected, this is normal behavior
        badClientSocket.disconnect();
        done();
      });

      // Set a timeout to prevent the test from hanging
      setTimeout(() => {
        badClientSocket.disconnect();
        done();
      }, 2000);
    });
  });

  describe('Multiple Client Connections', () => {
    it('should handle multiple simultaneous connections', (done) => {
      const clients: ClientSocket[] = [];
      const numClients = 3;
      let connectedCount = 0;

      // Create multiple client connections
      for (let i = 0; i < numClients; i++) {
        const client = ClientIO(`http://localhost:${serverPort}`, {
          transports: ['websocket'],
          forceNew: true
        });

        client.on('connect', () => {
          connectedCount++;
          
          if (connectedCount === numClients) {
            // All clients connected successfully
            expect(connectedCount).toBe(numClients);
            
            // Verify all connection logs
            expect(logger.info).toHaveBeenCalledTimes(
              2 + (numClients * 1) // 2 for server init + 1 per client connection
            );
            
            // Clean up clients
            clients.forEach(c => c.disconnect());
            done();
          }
        });

        client.on('connect_error', (error) => {
          clients.forEach(c => c.disconnect());
          done(error);
        });

        clients.push(client);
      }
    });
  });
});