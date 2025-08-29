/**
 * Unit tests for PathValidator
 * 
 * Tests path security validation functionality including:
 * - Path traversal attack prevention
 * - Allowed base path validation  
 * - File size limit enforcement
 * - Directory vs file validation
 */

import { promises as fs } from 'fs';
import { join, resolve } from 'path';
import { tmpdir } from 'os';
import { PathValidator } from '../src/security/pathValidator';
import { ConfigurationManager } from '../src/config/manager';

// Mock the ConfigurationManager
jest.mock('../src/config/manager');
const mockedConfigManager = jest.mocked(ConfigurationManager);

describe('PathValidator', () => {
  const tempDir = join(tmpdir(), 'pathvalidator-test');
  const allowedDir = join(tempDir, 'allowed');
  const forbiddenDir = join(tempDir, 'forbidden');
  
  beforeAll(async () => {
    // Setup test directories
    await fs.mkdir(tempDir, { recursive: true });
    await fs.mkdir(allowedDir, { recursive: true });
    await fs.mkdir(forbiddenDir, { recursive: true });
    
    // Create test files
    await fs.writeFile(join(allowedDir, 'test.txt'), 'test content');
    await fs.writeFile(join(allowedDir, 'large.txt'), 'x'.repeat(2000000)); // 2MB file
    await fs.writeFile(join(forbiddenDir, 'forbidden.txt'), 'forbidden content');
  });
  
  afterAll(async () => {
    // Cleanup test directories
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });
  
  beforeEach(() => {
    // Mock configuration
    mockedConfigManager.getConfig.mockReturnValue({
      security: {
        allowedBasePaths: [allowedDir],
        maxFileSize: 1048576, // 1MB
        commandTimeout: 30000,
        sessionTimeout: 1800000
      },
      llm: {
        provider: 'gemini' as const,
        geminiKey: 'test-key'
      },
      research: {
        exaKey: 'test-exa-key'
      },
      server: {
        logLevel: 'info' as const
      }
    });
  });
  
  describe('validateFilePath', () => {
    it('should validate allowed file paths', async () => {
      const testFile = join(allowedDir, 'test.txt');
      const result = await PathValidator.validateFilePath(testFile);
      
      expect(result.valid).toBe(true);
      expect(result.resolvedPath).toBe(resolve(testFile));
      expect(result.error).toBeUndefined();
    });
    
    it('should reject paths outside allowed directories', async () => {
      const forbiddenFile = join(forbiddenDir, 'forbidden.txt');
      const result = await PathValidator.validateFilePath(forbiddenFile);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('outside allowed directories');
      expect(result.resolvedPath).toBeUndefined();
    });
    
    it('should reject non-existent files', async () => {
      const nonExistentFile = join(allowedDir, 'nonexistent.txt');
      const result = await PathValidator.validateFilePath(nonExistentFile);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('does not exist or is not accessible');
    });
    
    it('should reject directories when expecting files', async () => {
      const result = await PathValidator.validateFilePath(allowedDir);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('is not a file');
    });
    
    it('should reject files exceeding size limit', async () => {
      const largeFile = join(allowedDir, 'large.txt');
      const result = await PathValidator.validateFilePath(largeFile);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds maximum size limit');
    });
    
    it('should handle path traversal attempts', async () => {
      const traversalPath = join(allowedDir, '../forbidden/forbidden.txt');
      const result = await PathValidator.validateFilePath(traversalPath);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('outside allowed directories');
    });
  });
  
  describe('validateWorkingDirectory', () => {
    it('should validate allowed directories', async () => {
      const result = await PathValidator.validateWorkingDirectory(allowedDir);
      
      expect(result.valid).toBe(true);
      expect(result.resolvedPath).toBe(resolve(allowedDir));
      expect(result.error).toBeUndefined();
    });
    
    it('should reject directories outside allowed paths', async () => {
      const result = await PathValidator.validateWorkingDirectory(forbiddenDir);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('outside allowed paths');
    });
    
    it('should reject non-existent directories', async () => {
      const nonExistentDir = join(allowedDir, 'nonexistent');
      const result = await PathValidator.validateWorkingDirectory(nonExistentDir);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('does not exist or is not accessible');
    });
    
    it('should reject files when expecting directories', async () => {
      const testFile = join(allowedDir, 'test.txt');
      const result = await PathValidator.validateWorkingDirectory(testFile);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('is not a directory');
    });
  });
  
  describe('isPathAllowed', () => {
    it('should return true for allowed paths', () => {
      const testPath = join(allowedDir, 'subdir', 'file.txt');
      const result = PathValidator.isPathAllowed(testPath);
      
      expect(result).toBe(true);
    });
    
    it('should return false for forbidden paths', () => {
      const testPath = join(forbiddenDir, 'file.txt');
      const result = PathValidator.isPathAllowed(testPath);
      
      expect(result).toBe(false);
    });
    
    it('should handle configuration errors gracefully', () => {
      mockedConfigManager.getConfig.mockImplementation(() => {
        throw new Error('Config not loaded');
      });
      
      const result = PathValidator.isPathAllowed('/any/path');
      
      expect(result).toBe(false);
    });
  });
  
  describe('sanitizePathForLogging', () => {
    it('should sanitize sensitive path components', () => {
      const sensitivePath = '/home/user/sensitive/project/file.txt';
      const sanitized = PathValidator.sanitizePathForLogging(sensitivePath);
      
      expect(sanitized).toContain('****');
      expect(sanitized).toContain('file.txt'); // filename should be preserved
      expect(sanitized).not.toContain('user');
      expect(sanitized).not.toContain('sensitive');
    });
    
    it('should handle invalid paths gracefully', () => {
      // Use a path that will genuinely cause path.resolve to fail
      const invalidPath = '<>:"|?*';
      const sanitized = PathValidator.sanitizePathForLogging(invalidPath);
      
      expect(sanitized).toBe('[INVALID_PATH]');
    });
  });

  const describeWindows = process.platform === 'win32' ? describe : describe.skip;
  describeWindows('Windows Case Sensitivity', () => {
    beforeEach(() => {
      mockedConfigManager.getConfig.mockReturnValue({
        security: {
          allowedBasePaths: ['C:\\Test\\Projects'], // Uppercase
          maxFileSize: 1000000,
          commandTimeout: 30000,
          sessionTimeout: 1800000
        },
        llm: { provider: 'gemini', geminiKey: 'test-key' },
        research: { exaKey: 'test-exa-key' },
        server: { logLevel: 'info' }
      });
    });

    it('should handle case-insensitive path validation on Windows', async () => {
      // Use the same base path as configured in the mock
      const testBaseDir = join(tempDir, 'Test', 'Projects');
      const testProjectDir = join(testBaseDir, 'MyProject');
      await fs.mkdir(testProjectDir, { recursive: true });

      // Update mock to use actual temp directory structure
      mockedConfigManager.getConfig.mockReturnValue({
        security: {
          allowedBasePaths: [testBaseDir], // Use actual temp dir path
          maxFileSize: 1000000,
          commandTimeout: 30000,
          sessionTimeout: 1800000
        },
        llm: { provider: 'gemini', geminiKey: 'test-key' },
        research: { exaKey: 'test-exa-key' },
        server: { logLevel: 'info' }
      });

      // Test various case combinations that should all be valid
      const testCases = [
        testProjectDir.toLowerCase(),     // all lowercase
        testProjectDir.toUpperCase(),     // all uppercase
        testProjectDir                    // original case
      ];

      for (const testPath of testCases) {
        const result = await PathValidator.validateWorkingDirectory(testPath);
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      }
    });

    it('should still reject paths outside allowed directories on Windows', async () => {
      const forbiddenPath = 'C:\\Windows\\System32';
      const result = await PathValidator.validateWorkingDirectory(forbiddenPath);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('outside allowed paths');
    });

  // No teardown needed
  });
});
