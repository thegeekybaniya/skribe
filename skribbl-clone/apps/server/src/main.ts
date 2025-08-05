/**
 * @fileoverview Main server entry point for the Skribbl.io clone
 * This file initializes the Express server with Socket.IO, sets up middleware,
 * configures routes, and starts the server. It serves as the foundation for
 * the real-time multiplayer drawing game backend.
 * 
 * Requirements coverage: 9.2 (Express server with TypeScript), 9.4 (CORS and connection handling), 9.5 (error handling and logging)
 */

import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import config from './config';
import logger from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import routes from './routes';
import { initializeSocket } from './socket';

/**
 * Create and configure the Express application
 * This function sets up all middleware, routes, and error handling
 */
function createApp(): express.Application {
  const app = express();

  // Security middleware - sets various HTTP headers for security
  app.use(helmet());

  // CORS middleware - allows cross-origin requests from the mobile app
  app.use(cors({
    origin: config.corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
  app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded bodies

  // HTTP request logging middleware
  // Use different formats for different environments
  const morganFormat = config.nodeEnv === 'production' ? 'combined' : 'dev';
  app.use(morgan(morganFormat, {
    stream: {
      write: (message: string) => {
        // Remove trailing newline and log through Winston
        logger.info(message.trim());
      }
    }
  }));

  // API routes
  app.use('/api', routes);

  // Handle 404 errors for undefined routes
  app.use(notFoundHandler);

  // Global error handling middleware (must be last)
  app.use(errorHandler);

  return app;
}

/**
 * Start the server with both HTTP and Socket.IO
 * This function initializes the complete server stack
 */
async function startServer(): Promise<void> {
  try {
    logger.info('Starting Skribbl.io Clone server...');

    // Create Express app
    const app = createApp();

    // Create HTTP server
    const httpServer = createServer(app);

    // Initialize Socket.IO and get the managers
    const { roomManager, playerManager, gameService, wordService } = initializeSocket(httpServer);

    // Start the server
    httpServer.listen(config.port, config.host, () => {
      logger.info(`Server running on http://${config.host}:${config.port}`);
      logger.info(`Environment: ${config.nodeEnv}`);
      logger.info(`CORS origin: ${config.corsOrigin}`);
      logger.info(`Socket.IO CORS origin: ${config.socketCorsOrigin}`);
    });

    // Graceful shutdown handling
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully...');
      gameService.shutdown();
      wordService.shutdown();
      playerManager.shutdown();
      roomManager.shutdown();
      httpServer.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down gracefully...');
      gameService.shutdown();
      wordService.shutdown();
      playerManager.shutdown();
      roomManager.shutdown();
      httpServer.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();
