/**
 * @fileoverview Unit tests for server configuration module
 * 
 * This test file validates that the configuration module properly loads
 * environment variables, provides sensible defaults, and validates
 * configuration values correctly.
 * 
 * Requirements coverage: 9.2 (server configuration validation)
 */

describe('Server Configuration', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original environment variables
    originalEnv = { ...process.env };
    
    // Clear the module cache to allow fresh imports
    jest.resetModules();
  });

  afterEach(() => {
    // Restore original environment variables
    process.env = originalEnv;
  });

  describe('Default Configuration', () => {
    it('should provide default values when environment variables are not set', async () => {
      // Clear relevant environment variables
      delete process.env.NODE_ENV;
      delete process.env.HOST;
      delete process.env.PORT;
      delete process.env.CORS_ORIGIN;
      delete process.env.SOCKET_CORS_ORIGIN;
      delete process.env.LOG_LEVEL;

      // Import config after clearing env vars
      const config = (await import('./index')).default;

      // Verify default values are used
      expect(config.nodeEnv).toBe('development');
      expect(config.host).toBe('localhost');
      expect(config.port).toBe(3000);
      expect(config.corsOrigin).toBe('http://localhost:8081');
      expect(config.socketCorsOrigin).toBe('http://localhost:8081');
      expect(config.logLevel).toBe('info');
    });
  });

  describe('Environment Variable Loading', () => {
    it('should load configuration from environment variables', async () => {
      // Set test environment variables
      process.env.NODE_ENV = 'production';
      process.env.HOST = '0.0.0.0';
      process.env.PORT = '8080';
      process.env.CORS_ORIGIN = 'https://example.com';
      process.env.SOCKET_CORS_ORIGIN = 'https://socket.example.com';
      process.env.LOG_LEVEL = 'debug';

      // Import config after setting env vars
      const config = (await import('./index')).default;

      // Verify environment variables are used
      expect(config.nodeEnv).toBe('production');
      expect(config.host).toBe('0.0.0.0');
      expect(config.port).toBe(8080);
      expect(config.corsOrigin).toBe('https://example.com');
      expect(config.socketCorsOrigin).toBe('https://socket.example.com');
      expect(config.logLevel).toBe('debug');
    });

    it('should parse PORT as integer', async () => {
      process.env.PORT = '5000';
      
      const config = (await import('./index')).default;
      
      expect(config.port).toBe(5000);
      expect(typeof config.port).toBe('number');
    });
  });

  describe('Configuration Validation', () => {
    it('should throw error for invalid port number', async () => {
      process.env.PORT = 'invalid';
      
      // Importing should throw an error due to validation
      await expect(import('./index')).rejects.toThrow('Invalid port number');
    });

    it('should throw error for port out of range', async () => {
      process.env.PORT = '70000'; // Above valid port range
      
      await expect(import('./index')).rejects.toThrow('Invalid port number');
    });

    it('should throw error for negative port', async () => {
      process.env.PORT = '-1';
      
      await expect(import('./index')).rejects.toThrow('Invalid port number');
    });

    it('should throw error for invalid log level', async () => {
      process.env.LOG_LEVEL = 'invalid';
      
      await expect(import('./index')).rejects.toThrow('Invalid log level');
    });

    it('should accept valid log levels', async () => {
      const validLevels = ['error', 'warn', 'info', 'debug'];
      
      for (const level of validLevels) {
        // Clear module cache for each test
        jest.resetModules();
        process.env.LOG_LEVEL = level;
        
        const config = (await import('./index')).default;
        expect(config.logLevel).toBe(level);
      }
    });
  });

  describe('Configuration Type Safety', () => {
    it('should export configuration with correct types', async () => {
      const config = (await import('./index')).default;
      
      expect(typeof config.nodeEnv).toBe('string');
      expect(typeof config.host).toBe('string');
      expect(typeof config.port).toBe('number');
      expect(typeof config.corsOrigin).toBe('string');
      expect(typeof config.socketCorsOrigin).toBe('string');
      expect(typeof config.logLevel).toBe('string');
    });
  });
});