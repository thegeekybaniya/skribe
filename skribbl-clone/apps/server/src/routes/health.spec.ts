/**
 * @fileoverview Unit tests for health check routes
 * 
 * This test file validates that the health check endpoints return
 * proper status information and handle requests correctly for
 * server monitoring purposes.
 * 
 * Requirements coverage: 9.2 (health check endpoint for server monitoring)
 */

import request from 'supertest';
import express from 'express';
import healthRoutes from './health';
import logger from '../utils/logger';

// Mock the logger to avoid actual logging during tests
jest.mock('../utils/logger', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

describe('Health Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    // Create a test Express app with health routes
    app = express();
    app.use(express.json());
    app.use('/health', healthRoutes);
    
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('GET /health', () => {
    it('should return basic health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      // Verify response structure
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('service', 'skribbl-clone-server');

      // Verify timestamp is a valid ISO string
      expect(new Date(response.body.timestamp).toISOString()).toBe(response.body.timestamp);

      // Verify logger was called
      expect(logger.debug).toHaveBeenCalledWith('Health check requested');
    });

    it('should return JSON content type', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    it('should handle multiple concurrent requests', async () => {
      // Make multiple concurrent requests
      const requests = Array(5).fill(null).map(() => 
        request(app).get('/health').expect(200)
      );

      const responses = await Promise.all(requests);

      // All responses should be successful
      responses.forEach(response => {
        expect(response.body.status).toBe('ok');
        expect(response.body.service).toBe('skribbl-clone-server');
      });

      // Logger should be called for each request
      expect(logger.debug).toHaveBeenCalledTimes(5);
    });
  });

  describe('GET /health/detailed', () => {
    it('should return detailed health information', async () => {
      const response = await request(app)
        .get('/health/detailed')
        .expect(200);

      // Verify response structure
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('service', 'skribbl-clone-server');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('memory');
      expect(response.body).toHaveProperty('nodeVersion');
      expect(response.body).toHaveProperty('platform');

      // Verify uptime is a number
      expect(typeof response.body.uptime).toBe('number');
      expect(response.body.uptime).toBeGreaterThanOrEqual(0);

      // Verify memory object structure
      expect(response.body.memory).toHaveProperty('rss');
      expect(response.body.memory).toHaveProperty('heapTotal');
      expect(response.body.memory).toHaveProperty('heapUsed');
      expect(response.body.memory).toHaveProperty('external');

      // Verify memory values are formatted as MB strings
      expect(response.body.memory.rss).toMatch(/^\d+ MB$/);
      expect(response.body.memory.heapTotal).toMatch(/^\d+ MB$/);
      expect(response.body.memory.heapUsed).toMatch(/^\d+ MB$/);
      expect(response.body.memory.external).toMatch(/^\d+ MB$/);

      // Verify Node.js version format
      expect(response.body.nodeVersion).toMatch(/^v\d+\.\d+\.\d+/);

      // Verify platform is a string
      expect(typeof response.body.platform).toBe('string');

      // Verify logger was called
      expect(logger.debug).toHaveBeenCalledWith('Detailed health check requested');
    });

    it('should return consistent timestamp format', async () => {
      const response = await request(app)
        .get('/health/detailed')
        .expect(200);

      // Verify timestamp is a valid ISO string
      const timestamp = response.body.timestamp;
      expect(new Date(timestamp).toISOString()).toBe(timestamp);
      
      // Verify timestamp is recent (within last 5 seconds)
      const now = new Date();
      const responseTime = new Date(timestamp);
      const timeDiff = now.getTime() - responseTime.getTime();
      expect(timeDiff).toBeLessThan(5000); // Less than 5 seconds
    });

    it('should return memory usage in reasonable ranges', async () => {
      const response = await request(app)
        .get('/health/detailed')
        .expect(200);

      const memory = response.body.memory;
      
      // Extract numeric values from memory strings (e.g., "50 MB" -> 50)
      const rss = parseInt(memory.rss.split(' ')[0]);
      const heapTotal = parseInt(memory.heapTotal.split(' ')[0]);
      const heapUsed = parseInt(memory.heapUsed.split(' ')[0]);
      const external = parseInt(memory.external.split(' ')[0]);

      // Verify memory values are reasonable (greater than 0, less than 1GB)
      expect(rss).toBeGreaterThan(0);
      expect(rss).toBeLessThan(1024);
      
      expect(heapTotal).toBeGreaterThan(0);
      expect(heapTotal).toBeLessThan(1024);
      
      expect(heapUsed).toBeGreaterThan(0);
      expect(heapUsed).toBeLessThan(heapTotal);
      
      expect(external).toBeGreaterThanOrEqual(0);
      expect(external).toBeLessThan(1024);
    });

    it('should handle errors gracefully', async () => {
      // Mock process.memoryUsage to throw an error
      const originalMemoryUsage = process.memoryUsage;
      process.memoryUsage = jest.fn().mockImplementation(() => {
        throw new Error('Memory usage error');
      });

      const response = await request(app)
        .get('/health/detailed')
        .expect(500);

      // Restore original function
      process.memoryUsage = originalMemoryUsage;
    });
  });

  describe('Route Error Handling', () => {
    it('should handle invalid routes', async () => {
      await request(app)
        .get('/health/invalid')
        .expect(404);
    });

    it('should handle POST requests to health endpoints', async () => {
      await request(app)
        .post('/health')
        .expect(404);
    });
  });
});