/**
 * @fileoverview Main routes configuration for the Skribbl.io clone server
 * This module sets up all API routes and provides a centralized place
 * to configure route middleware and organize different route modules.
 * 
 * Requirements coverage: 9.2 (route structure setup)
 */

import { Router } from 'express';
import healthRoutes from './health';

const router = Router();

/**
 * Configure all API routes
 * Each route module is mounted under its respective path
 */

// Health check routes - used for monitoring and load balancer health checks
router.use('/health', healthRoutes);

// API info route - provides basic API information
router.get('/', (req, res) => {
  res.json({
    message: 'Skribbl.io Clone API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

export default router;