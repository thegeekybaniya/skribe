/**
 * @fileoverview Integration tests for the main server application
 * 
 * This test file validates that the complete server setup works correctly,
 * including Express app creation, middleware configuration, route setup,
 * and Socket.IO integration.
 * 
 * Requirements coverage: 9.2 (Express server with TypeScript), 9.4 (CORS and connection handling), 9.5 (error handling and logging)
 */

import request from 'supertest';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { Socket as ClientSocket, io as ClientIO } from 'socket.io-client';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import config from './config';
import logger from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import routes from './routes';
import { initializeSocket } from './socket';

// Mock the logger and config to avoid actual logging and use test config
jest.mock('./utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

jest.mock('./config', () => ({
  nodeEnv: 'test',
  host: 'localhost',
  port: 3000,
  corsOrigin: 'http://localhost:3001',
  socketCorsOrigin: 'http://localhost:3001',
  logLevel: 'info'
}));

describe('Main Server Application', () => {
  let app: express.Application;
  let httpServer: any;
  let io: SocketIOServer;
  let clientSocket: ClientSocket;
  let serverPort: number;

  beforeEach((done) => {
    // Create the Express app with the same configuration as main.ts
    app = express();

    // Apply the same middleware as in main.ts
    app.use(helmet());
    app.use(cors({
      origin: config.corsOrigin,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Skip morgan in tests to avoid cluttering test output
    if (config.nodeEnv !== 'test') {
      app.use(morgan('dev'));
    }

    // Apply routes first
    app.use('/api', routes);

    // Add test routes before error handlers
    app.post('/api/test-json', (req, res) => {
      res.json({ received: req.body });
    });

    app.get('/api/test-error', (req, res, next) => {
      next(new Error('Test error'));
    });

    app.get('/api/test-error-logging', (req, res, next) => {
      next(new Error('Test logging error'));
    });

    app.post('/api/test-large-payload', (req, res) => {
      res.json({ size: JSON.stringify(req.body).length });
    });

    app.post('/api/test-form-data', (req, res) => {
      res.json({ received: req.body });
    });

    // Apply error handling last
    app.use(notFoundHandler);
    app.use(errorHandler);

    // Create HTTP server and initialize Socket.IO
    httpServer = createServer(app);
    const socketResult = initializeSocket(httpServer);
    io = socketResult.io;

    // Start server on random port
    httpServer.listen(0, () => {
      const address = httpServer.address();
      serverPort = typeof address === 'object' && address ? address.port : 3000;
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

  describe('Express Application Setup', () => {
    it('should create Express app with proper middleware', async () => {
      const response = await request(app)
        .get('/api')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Skribbl.io Clone API');
      expect(response.body).toHaveProperty('version', '1.0.0');
      expect(response.body).toHaveProperty('status', 'running');
    });

    it('should handle CORS properly', async () => {
      const response = await request(app)
        .options('/api')
        .set('Origin', 'http://localhost:3001')
        .set('Access-Control-Request-Method', 'GET')
        .expect(204);

      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3001');
      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });

    it('should parse JSON bodies', async () => {
      const testData = { test: 'data', number: 123 };

      const response = await request(app)
        .post('/api/test-json')
        .send(testData)
        .expect(200);

      expect(response.body.received).toEqual(testData);
    });

    it('should set security headers with helmet', async () => {
      const response = await request(app)
        .get('/api')
        .expect(200);

      // Helmet sets various security headers
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
    });
  });

  describe('Route Handling', () => {
    it('should serve API routes correctly', async () => {
      const response = await request(app)
        .get('/api')
        .expect(200);

      expect(response.body.message).toBe('Skribbl.io Clone API');
    });

    it('should serve health check routes', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body.status).toBe('ok');
      expect(response.body.service).toBe('skribbl-clone-server');
    });

    it('should handle 404 for undefined routes', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Route /api/nonexistent not found');
    });
  });

  describe('Error Handling', () => {
    it('should handle application errors properly', async () => {
      const response = await request(app)
        .get('/api/test-error')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Internal Server Error');
    });

    it('should log errors appropriately', async () => {
      await request(app)
        .get('/api/test-error-logging')
        .expect(500);

      expect(logger.error).toHaveBeenCalledWith(
        'Server Error:',
        expect.objectContaining({
          message: 'Test logging error',
          url: '/api/test-error-logging',
          method: 'GET'
        })
      );
    });
  });

  describe('Socket.IO Integration', () => {
    it('should initialize Socket.IO server with HTTP server', () => {
      expect(io).toBeInstanceOf(SocketIOServer);
      expect(logger.info).toHaveBeenCalledWith('Initializing Socket.IO server...');
      expect(logger.info).toHaveBeenCalledWith('Socket.IO server initialized successfully');
    });

    it('should handle client connections through Socket.IO', (done) => {
      clientSocket = ClientIO(`http://localhost:${serverPort}`, {
        transports: ['websocket'],
        forceNew: true
      });

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

    it('should send connection acknowledgment to clients', (done) => {
      clientSocket = ClientIO(`http://localhost:${serverPort}`, {
        transports: ['websocket'],
        forceNew: true
      });

      clientSocket.on('connected', (data) => {
        expect(data.message).toBe('Successfully connected to Skribbl.io Clone server');
        expect(data.socketId).toBeDefined();
        expect(data.timestamp).toBeDefined();
        done();
      });

      clientSocket.on('connect_error', (error) => {
        done(error);
      });
    });
  });

  describe('Server Configuration', () => {
    it('should use configuration values correctly', () => {
      // Verify that the app is using the mocked config values
      expect(config.nodeEnv).toBe('test');
      expect(config.corsOrigin).toBe('http://localhost:3001');
      expect(config.socketCorsOrigin).toBe('http://localhost:3001');
    });

    it('should handle different HTTP methods', async () => {
      // Test different HTTP methods are handled by CORS
      const methods = ['GET', 'POST', 'PUT', 'DELETE'];

      for (const method of methods) {
        const response = await request(app)
          .options('/api')
          .set('Origin', 'http://localhost:3001')
          .set('Access-Control-Request-Method', method)
          .expect(204);

        expect(response.headers['access-control-allow-methods']).toContain(method);
      }
    });
  });

  describe('Request/Response Handling', () => {
    it('should handle large JSON payloads within limit', async () => {
      // Create a payload that's large but within the 10MB limit
      const largeData = { data: 'x'.repeat(1000) }; // 1KB of data

      const response = await request(app)
        .post('/api/test-large-payload')
        .send(largeData)
        .expect(200);

      expect(response.body.size).toBeGreaterThan(1000);
    });

    it('should handle URL-encoded data', async () => {
      const response = await request(app)
        .post('/api/test-form-data')
        .type('form')
        .send('name=test&value=123')
        .expect(200);

      expect(response.body.received).toEqual({ name: 'test', value: '123' });
    });
  });
});