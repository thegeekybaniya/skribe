/**
 * @fileoverview Configuration module for the Skribbl.io clone server
 * This module centralizes all environment variable configuration and provides
 * type-safe access to server settings. It validates required environment variables
 * and provides sensible defaults for development.
 * 
 * Requirements coverage: 9.2 (server configuration), 9.4 (environment setup)
 */

import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * Server configuration interface defining all configurable options
 * This ensures type safety when accessing configuration values throughout the app
 */
export interface ServerConfig {
  /** Node environment (development, production, test) */
  nodeEnv: string;
  /** Server host address */
  host: string;
  /** Server port number */
  port: number;
  /** CORS allowed origins for HTTP requests */
  corsOrigin: string;
  /** Socket.IO CORS allowed origins */
  socketCorsOrigin: string;
  /** Logging level (error, warn, info, debug) */
  logLevel: string;
}

/**
 * Parse and validate environment variables into a typed configuration object
 * This function ensures all required configuration is present and provides defaults
 * 
 * @returns {ServerConfig} Validated server configuration
 */
function createConfig(): ServerConfig {
  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    host: process.env.HOST || 'localhost',
    port: parseInt(process.env.PORT || '3000', 10),
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:8081',
    socketCorsOrigin: process.env.SOCKET_CORS_ORIGIN || 'http://localhost:8081',
    logLevel: process.env.LOG_LEVEL || 'info',
  };
}

/**
 * Validate that the configuration is valid
 * This ensures the server won't start with invalid configuration
 * 
 * @param config - Configuration object to validate
 * @throws {Error} If configuration is invalid
 */
function validateConfig(config: ServerConfig): void {
  // Validate port is a valid number
  if (isNaN(config.port) || config.port < 1 || config.port > 65535) {
    throw new Error(`Invalid port number: ${config.port}`);
  }

  // Validate log level is supported
  const validLogLevels = ['error', 'warn', 'info', 'debug'];
  if (!validLogLevels.includes(config.logLevel)) {
    throw new Error(`Invalid log level: ${config.logLevel}. Must be one of: ${validLogLevels.join(', ')}`);
  }
}

// Create and validate configuration
const config = createConfig();
validateConfig(config);

// Export the validated configuration
export default config;