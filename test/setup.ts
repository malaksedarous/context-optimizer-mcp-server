/**
 * Jest setup file
 */

// The MCP server now uses environment variables exclusively for configuration
// No need to load .env files as the configuration system reads environment variables directly

// Set quieter log level for tests to reduce console noise
import { Logger } from '../src/utils/logger';

// Set log level to 'error' during tests to suppress info/debug messages
Logger.setLogLevel('error');

// Extend Jest matchers
import 'jest';
