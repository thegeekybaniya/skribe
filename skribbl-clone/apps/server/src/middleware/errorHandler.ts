/**
 * @fileoverview Error handling middleware for the Skribbl.io clone server
 * This module provides centralized error handling for Express routes and
 * ensures consistent error responses. It logs errors appropriately and
 * prevents sensitive information from being exposed to clients.
 * 
 * Requirements coverage: 9.5 (error handling and logging)
 */

import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

/**
 * Custom error class for application-specific errors
 * This allows us to create errors with specific HTTP status codes
 */
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Marks this as an expected operational error
    
    // Capture stack trace, excluding constructor call from it
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global error handling middleware for Express
 * This middleware catches all errors that occur in route handlers and
 * provides consistent error responses to clients
 * 
 * @param err - The error that occurred
 * @param req - Express request object
 * @param res - Express response object  
 * @param next - Express next function
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Default error values
  let statusCode = 500;
  let message = 'Internal Server Error';

  // Check if this is our custom AppError
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // Log the error with appropriate level
  if (statusCode >= 500) {
    // Server errors should be logged as errors with full stack trace
    logger.error('Server Error:', {
      message: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
  } else {
    // Client errors (4xx) are logged as warnings
    logger.warn('Client Error:', {
      message: err.message,
      statusCode,
      url: req.url,
      method: req.method,
      ip: req.ip
    });
  }

  // Send error response to client
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      // Only include stack trace in development for debugging
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
};

/**
 * Middleware to handle 404 errors for routes that don't exist
 * This should be used after all other routes are defined
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404);
  next(error);
};

/**
 * Async error wrapper utility
 * This wraps async route handlers to automatically catch and forward errors
 * 
 * @param fn - Async function to wrap
 * @returns Wrapped function that catches errors
 */
export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};