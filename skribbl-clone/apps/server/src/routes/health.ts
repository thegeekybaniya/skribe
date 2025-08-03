/**
 * @fileoverview Health check routes for the Skribbl.io clone server
 * This module provides endpoints for monitoring server health and status.
 * These endpoints are used by load balancers and monitoring systems to
 * determine if the server is running properly.
 * 
 * Requirements coverage: 9.2 (health check endpoint for server monitoring)
 */

import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import logger from '../utils/logger';

const router = Router();

/**
 * Basic health check endpoint
 * Returns a simple status indicating the server is running
 * 
 * GET /health
 * Response: { status: 'ok', timestamp: ISO string }
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  logger.debug('Health check requested');
  
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'skribbl-clone-server'
  });
}));

/**
 * Detailed health check endpoint
 * Returns more detailed information about server status including uptime
 * 
 * GET /health/detailed
 * Response: { status: 'ok', uptime: number, memory: object, timestamp: ISO string }
 */
router.get('/detailed', asyncHandler(async (req: Request, res: Response) => {
  logger.debug('Detailed health check requested');
  
  // Get memory usage information
  const memoryUsage = process.memoryUsage();
  
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'skribbl-clone-server',
    uptime: process.uptime(),
    memory: {
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
      external: `${Math.round(memoryUsage.external / 1024 / 1024)} MB`
    },
    nodeVersion: process.version,
    platform: process.platform
  });
}));

export default router;