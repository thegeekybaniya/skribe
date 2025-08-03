/**
 * @fileoverview Unit tests for error handling middleware
 * 
 * This test file validates that the error handling middleware properly
 * catches errors, logs them appropriately, and returns consistent
 * error responses to clients.
 * 
 * Requirements coverage: 9.5 (error handling and logging)
 */

import { Request, Response, NextFunction } from 'express';
import { AppError, errorHandler, notFoundHandler, asyncHandler } from './errorHandler';
import logger from '../utils/logger';

// Mock the logger to avoid actual logging during tests
jest.mock('../utils/logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
}));

describe('Error Handling Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Create mock response object with chaining support
    mockJson = jest.fn().mockReturnThis();
    mockStatus = jest.fn().mockReturnThis();
    
    mockRequest = {
      url: '/test',
      method: 'GET',
      ip: '127.0.0.1',
      originalUrl: '/api/test',
      get: jest.fn().mockReturnValue('test-user-agent')
    };

    mockResponse = {
      status: mockStatus,
      json: mockJson
    };

    mockNext = jest.fn();
  });

  describe('AppError Class', () => {
    it('should create AppError with default status code 500', () => {
      const error = new AppError('Test error');
      
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(true);
      expect(error).toBeInstanceOf(Error);
    });

    it('should create AppError with custom status code', () => {
      const error = new AppError('Not found', 404);
      
      expect(error.message).toBe('Not found');
      expect(error.statusCode).toBe(404);
      expect(error.isOperational).toBe(true);
    });

    it('should capture stack trace', () => {
      const error = new AppError('Test error');
      
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('Test error');
    });
  });

  describe('errorHandler Middleware', () => {
    it('should handle AppError with custom status code', () => {
      const error = new AppError('Custom error', 400);
      
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Custom error'
        }
      });
    });

    it('should handle generic Error with default 500 status', () => {
      const error = new Error('Generic error');
      
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Internal Server Error'
        }
      });
    });

    it('should log server errors (5xx) as errors', () => {
      const error = new AppError('Server error', 500);
      
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(logger.error).toHaveBeenCalledWith('Server Error:', expect.objectContaining({
        message: 'Server error',
        stack: expect.any(String),
        url: '/test',
        method: 'GET',
        ip: '127.0.0.1',
        userAgent: 'test-user-agent'
      }));
    });

    it('should log client errors (4xx) as warnings', () => {
      const error = new AppError('Client error', 400);
      
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(logger.warn).toHaveBeenCalledWith('Client Error:', expect.objectContaining({
        message: 'Client error',
        statusCode: 400,
        url: '/test',
        method: 'GET',
        ip: '127.0.0.1'
      }));
    });

    it('should include stack trace in development environment', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const error = new Error('Test error');
      
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Internal Server Error',
          stack: expect.any(String)
        }
      });
      
      // Restore original environment
      process.env.NODE_ENV = originalEnv;
    });

    it('should not include stack trace in production environment', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const error = new Error('Test error');
      
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Internal Server Error'
        }
      });
      
      // Restore original environment
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('notFoundHandler Middleware', () => {
    it('should create 404 AppError and call next', () => {
      notFoundHandler(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      
      const calledError = (mockNext as jest.Mock).mock.calls[0][0];
      expect(calledError.statusCode).toBe(404);
      expect(calledError.message).toBe('Route /api/test not found');
    });
  });

  describe('asyncHandler Utility', () => {
    it('should handle successful async function', async () => {
      const asyncFn = jest.fn().mockResolvedValue('success');
      const wrappedFn = asyncHandler(asyncFn);
      
      await wrappedFn(mockRequest, mockResponse, mockNext);
      
      expect(asyncFn).toHaveBeenCalledWith(mockRequest, mockResponse, mockNext);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should catch and forward async errors', async () => {
      const error = new Error('Async error');
      const asyncFn = jest.fn().mockRejectedValue(error);
      const wrappedFn = asyncHandler(asyncFn);
      
      await wrappedFn(mockRequest, mockResponse, mockNext);
      
      expect(asyncFn).toHaveBeenCalledWith(mockRequest, mockResponse, mockNext);
      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should handle synchronous functions that return promises', async () => {
      const syncFn = jest.fn().mockReturnValue(Promise.resolve('success'));
      const wrappedFn = asyncHandler(syncFn);
      
      await wrappedFn(mockRequest, mockResponse, mockNext);
      
      expect(syncFn).toHaveBeenCalledWith(mockRequest, mockResponse, mockNext);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});