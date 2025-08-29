/**
 * Path security validation utilities
 * 
 * Prevents path traversal attacks and unauthorized file access
 */

import * as path from 'path';
import * as fs from 'fs/promises';
import { ConfigurationManager } from '../config/manager';

export class PathValidator {
  /**
   * Get the current platform (allows for easier testing)
   */
  static getPlatform(): NodeJS.Platform {
    return process.platform;
  }

  /**
   * Normalize a path string for OS-specific comparison
   */
  private static normalizeForComparison(p: string): string {
    return this.getPlatform() === 'win32' ? p.toLowerCase() : p;
  }

  /**
   * Checks if a resolved path is within a resolved base path (cross-platform, case-aware)
   */
  private static isWithinBase(resolvedPath: string, resolvedBase: string): boolean {
    const normalizedPath = this.normalizeForComparison(resolvedPath);
    const normalizedBase = this.normalizeForComparison(resolvedBase);
    const baseWithSep = normalizedBase.endsWith(path.sep) ? normalizedBase : normalizedBase + path.sep;
    return normalizedPath === normalizedBase || normalizedPath.startsWith(baseWithSep);
  }

  /**
   * Validates a file path against security boundaries
   * 
   * @param requestedPath - Path to validate
   * @returns Validation result with resolved path or error
   */
  static async validateFilePath(requestedPath: string): Promise<{
    valid: boolean;
    resolvedPath?: string;
    error?: string;
  }> {
    try {
      const config = ConfigurationManager.getConfig();
      const resolvedPath = path.resolve(requestedPath);
      
      // Check against allowed base paths
      const isAllowed = config.security.allowedBasePaths.some(basePath => {
        const resolvedBase = path.resolve(basePath);
        return PathValidator.isWithinBase(resolvedPath, resolvedBase);
      });
      
      if (!isAllowed) {
        return {
          valid: false,
          error: `Path '${resolvedPath}' is outside allowed directories: ${config.security.allowedBasePaths.join(', ')}`
        };
      }
      
      // Check if file exists
      try {
        const stats = await fs.stat(resolvedPath);
        if (!stats.isFile()) {
          return {
            valid: false,
            error: `Path '${resolvedPath}' is not a file`
          };
        }
        
        // Check file size
        if (stats.size > config.security.maxFileSize) {
          return {
            valid: false,
            error: `File '${resolvedPath}' exceeds maximum size limit (${config.security.maxFileSize} bytes)`
          };
        }
      } catch {
        return {
          valid: false,
          error: `File '${resolvedPath}' does not exist or is not accessible`
        };
      }
      
      return {
        valid: true,
        resolvedPath
      };
    } catch (error) {
      return {
        valid: false,
        error: `Path validation error: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
  
  /**
   * Validates a working directory path against security boundaries
   * 
   * @param requestedPath - Directory path to validate
   * @returns Validation result with resolved path or error
   */
  static async validateWorkingDirectory(requestedPath: string): Promise<{
    valid: boolean;
    resolvedPath?: string;
    error?: string;
  }> {
    try {
      const config = ConfigurationManager.getConfig();
      const resolvedPath = path.resolve(requestedPath);
      
      // Check against allowed base paths
      const isAllowed = config.security.allowedBasePaths.some(basePath => {
        const resolvedBase = path.resolve(basePath);
        return PathValidator.isWithinBase(resolvedPath, resolvedBase);
      });
      
      if (!isAllowed) {
        return {
          valid: false,
          error: `Working directory '${resolvedPath}' is outside allowed paths: ${config.security.allowedBasePaths.join(', ')}`
        };
      }
      
      // Check if directory exists
      try {
        const stats = await fs.stat(resolvedPath);
        if (!stats.isDirectory()) {
          return {
            valid: false,
            error: `Path '${resolvedPath}' is not a directory`
          };
        }
      } catch {
        return {
          valid: false,
          error: `Directory '${resolvedPath}' does not exist or is not accessible`
        };
      }
      
      return {
        valid: true,
        resolvedPath
      };
    } catch (error) {
      return {
        valid: false,
        error: `Directory validation error: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
  
  /**
   * Helper method to check if a path is within allowed boundaries (without file system checks)
   * 
   * @param requestedPath - Path to check
   * @returns Whether the path is within allowed boundaries
   */
  static isPathAllowed(requestedPath: string): boolean {
    try {
      const config = ConfigurationManager.getConfig();
      const resolvedPath = path.resolve(requestedPath);
      
      return config.security.allowedBasePaths.some(basePath => {
        const resolvedBase = path.resolve(basePath);
        return PathValidator.isWithinBase(resolvedPath, resolvedBase);
      });
    } catch {
      return false;
    }
  }
  
  /**
   * Normalize and sanitize a path for logging purposes
   * 
   * @param filePath - Path to sanitize
   * @returns Sanitized path safe for logging
   */
  static sanitizePathForLogging(filePath: string): string {
    try {
      // Check for obviously invalid characters first
      if (/[<>:"|?*\0]/.test(filePath)) {
        return '[INVALID_PATH]';
      }
      
      const resolved = path.resolve(filePath);
      // Replace all directory components except the last one with placeholders
      const parts = resolved.split(path.sep);
      if (parts.length <= 2) {
        return resolved; // Too short to sanitize meaningfully
      }
      
      // Keep first part (drive on Windows, root on Unix) and last part (filename)
      const sanitized = parts.map((part, index) => {
        if (index === 0 || index === parts.length - 1) {
          return part;
        }
        return '****';
      }).join(path.sep);
      
      return sanitized;
    } catch {
      return '[INVALID_PATH]';
    }
  }
}
