# Changelog

All notable changes to the Context Optimizer MCP Server project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.3] - 2025-08-24

### Fixed
- **Exa Research Integration:** Updated to `exa-js@^1.5.13`, switched to default import, and added compatibility with `research.pollTask`. Resolved runtime error `createTask is not a function` for `researchTopic` and `deepResearch` tools.

### Changed
- **VS Code MCP Config Guidance:** Documented how to point VS Code to the local `dist/server.js` for development instead of the globally installed package.

## [1.0.2] - 2025-08-08

### Fixed
- **CLI Version Display**: Fixed `--version` and `--help` commands to show correct version number dynamically from package.json
- **Server Configuration**: MCP server now reports correct version in protocol metadata

## [1.0.1] - 2025-08-08

### Added
- **CLI Argument Support**: Added `--version` and `--help` command line arguments
- **Graceful Exit**: Server now exits properly for CLI commands instead of hanging

## [1.0.0] - 2025-08-08

### Added
- **Core MCP Tools**: File analysis (`askAboutFile`), terminal execution (`runAndExtract`), follow-up questions (`askFollowUp`)
- **Research Tools**: Quick research (`researchTopic`) and deep research (`deepResearch`) using Exa.ai
- **Multi-LLM Support**: Google Gemini, Anthropic Claude, and OpenAI integration
- **Security Layer**: Path validation, command filtering, session management
- **Environment Variable Configuration**: All settings via `CONTEXT_OPT_*` environment variables
- **MCP Protocol Compliance**: Proper JSON-RPC communication over stdio
- **Cross-Platform Support**: Windows, macOS, and Linux compatibility
- **Comprehensive Testing**: Unit tests, integration tests, security validation
- **Documentation**: Setup guides for VS Code, Claude Desktop, and Cursor AI

### Fixed
- **MCP Protocol Issues**: Fixed stdout/stderr logging conflicts causing "Failed to parse message" warnings
- **Windows Path Validation**: Fixed case sensitivity issues in path validation
- **Environment Variable Loading**: Consistent `CONTEXT_OPT_` prefixed variables across all components
- **Test Suite**: All 84 tests passing with conditional LLM integration testing

### Changed
- **Logging**: Default log level changed from 'info' to 'warn' for cleaner output
- **Configuration**: Moved from JSON config files to environment variables only
- **Error Handling**: Enhanced MCP-compliant error responses with proper content structure
- **Documentation Updates**: Enhanced README.md with detailed tool summaries including specific use cases and capabilities
- **Usage Guide Improvements**: 
  - Merged required and optional environment variables into single unified section
  - Removed temporary/session-only environment variable options for cleaner setup
  - Updated AI Assistant Setup with accurate MCP configuration based on latest 2024-2025 specifications
  - Verified VS Code, Claude Desktop, and Cursor AI setup procedures with proper file locations and JSON schemas
