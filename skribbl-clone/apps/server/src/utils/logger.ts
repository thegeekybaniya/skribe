/**
 * @fileoverview Winston logger configuration for the Skribbl.io clone server
 * This module sets up structured logging with different levels and formats
 * for development and production environments. It provides consistent logging
 * throughout the application with proper error handling.
 * 
 * Requirements coverage: 9.5 (logging implementation)
 */

import winston from 'winston';
import config from '../config';

/**
 * Custom log format for development environment
 * This format is human-readable and includes colors for better debugging
 */
const developmentFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    // If there's a stack trace (error), include it in the log
    return stack 
      ? `${timestamp} [${level}]: ${message}\n${stack}`
      : `${timestamp} [${level}]: ${message}`;
  })
);

/**
 * Custom log format for production environment
 * This format outputs structured JSON logs for better parsing by log aggregators
 */
const productionFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

/**
 * Create and configure the Winston logger instance
 * The logger uses different formats and transports based on the environment
 */
const logger = winston.createLogger({
  // Set log level from configuration
  level: config.logLevel,
  
  // Use different formats for different environments
  format: config.nodeEnv === 'production' ? productionFormat : developmentFormat,
  
  // Configure transports (where logs are written)
  transports: [
    // Always log to console
    new winston.transports.Console({
      // In test environment, suppress console output unless it's an error
      silent: config.nodeEnv === 'test' && config.logLevel !== 'error'
    })
  ],
  
  // Handle uncaught exceptions and rejections
  exceptionHandlers: [
    new winston.transports.Console()
  ],
  
  rejectionHandlers: [
    new winston.transports.Console()
  ]
});

// In production, also log to files for persistence
if (config.nodeEnv === 'production') {
  logger.add(new winston.transports.File({ 
    filename: 'logs/error.log', 
    level: 'error' 
  }));
  logger.add(new winston.transports.File({ 
    filename: 'logs/combined.log' 
  }));
}

export default logger;