# Testing Guide

This guide covers the testing framework and procedures for the Context Optimizer MCP Server.

## Test Suite Overview

The project includes comprehensive testing with Jest:

- **Unit Tests**: Individual component testing
- **Integration Tests**: LLM integration testing (when API keys are available)
- **Security Tests**: Path validation and command filtering
- **Configuration Tests**: Environment variable validation

## Running Tests

### Basic Test Execution

```bash
# Run all tests
npm test

# Run tests with clean output (no console logs)
npm test --silent

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test askAboutFile.test.ts
```

### Integration Tests with API Keys

Integration tests require actual API keys to test LLM functionality:

```bash
# Set environment variables for integration tests
export CONTEXT_OPT_LLM_PROVIDER="gemini"
export CONTEXT_OPT_GEMINI_KEY="your-gemini-api-key"
export CONTEXT_OPT_EXA_KEY="your-exa-api-key"

# Run all tests including integration tests
npm test
```

**Without API keys**, integration tests are automatically skipped:
```bash
# These tests will be skipped:
# - askAboutFile.integration.test.ts
# - runAndExtract.integration.test.ts
# - deepResearch.test.ts (if no EXA_KEY)
```

## Test Environment Setup

### Required Environment Variables for Testing

```bash
# Required for integration tests
export CONTEXT_OPT_LLM_PROVIDER="gemini"        # or "claude", "openai"
export CONTEXT_OPT_GEMINI_KEY="your-key"        # Required if using gemini
export CONTEXT_OPT_CLAUDE_KEY="your-key"        # Required if using claude
export CONTEXT_OPT_OPENAI_KEY="your-key"        # Required if using openai

# Required for research tool tests
export CONTEXT_OPT_EXA_KEY="your-exa-key"

# Required for all tests
export CONTEXT_OPT_ALLOWED_PATHS="/tmp/test"    # Temporary test directory
```

### Test Configuration

Tests automatically set up a safe test environment:

- **Allowed Paths**: Limited to test directories
- **Timeouts**: Reduced for faster test execution
- **File Sizes**: Smaller limits for test files
- **Session Storage**: Uses temporary directories

## Test Structure

### Unit Tests

Located in `test/` directory:

```
test/
├── askAboutFile.test.ts          # File analysis tool tests
├── askFollowUp.test.ts           # Follow-up question tests
├── commandValidator.test.ts      # Command security tests
├── pathValidator.test.ts         # Path security tests
├── deepResearch.test.ts          # Research tool tests
├── researchTopic.test.ts         # Quick research tests
└── setup.ts                     # Test configuration
```

### Integration Tests

```
test/
├── askAboutFile.integration.test.ts    # Real LLM integration
├── runAndExtract.integration.test.ts   # Terminal + LLM integration
└── config-test.ts                      # Configuration validation
```

## Test Categories

### 1. Configuration Tests (`config-test.ts`)

Tests environment variable loading and validation:

```typescript
describe('Configuration', () => {
  it('loads configuration from environment variables');
  it('validates required environment variables');
  it('handles missing API keys gracefully');
  it('validates security settings');
});
```

### 2. Security Tests

#### Path Validator (`pathValidator.test.ts`)
```typescript
describe('PathValidator', () => {
  it('allows paths within allowed base paths');
  it('blocks paths outside allowed base paths');
  it('handles relative path traversal attempts');
  it('validates absolute paths correctly');
});
```

#### Command Validator (`commandValidator.test.ts`)
```typescript
describe('CommandValidator', () => {
  it('allows safe commands');
  it('blocks interactive commands');
  it('blocks dangerous system commands');
  it('blocks path navigation commands');
});
```

### 3. Tool Tests

#### File Analysis (`askAboutFile.test.ts`)
```typescript
describe('AskAboutFile Tool', () => {
  it('extracts information from files');
  it('handles file not found errors');
  it('respects file size limits');
  it('validates file paths');
});
```

#### Terminal Execution (`runAndExtract.integration.test.ts`)
```typescript
describe('RunAndExtract Tool', () => {
  it('executes commands and extracts information');
  it('handles command timeouts');
  it('validates working directories');
  it('filters command output through LLM');
});
```

#### Research Tools (`researchTopic.test.ts`, `deepResearch.test.ts`)
```typescript
describe('Research Tools', () => {
  it('performs web research with Exa.ai');
  it('handles API rate limits');
  it('formats research results');
  it('requires valid Exa.ai API key');
});
```

## Testing Best Practices

### Setting Up Test Environment

1. **Create test directory**:
   ```bash
   mkdir -p /tmp/test-workspace
   export CONTEXT_OPT_ALLOWED_PATHS="/tmp/test-workspace"
   ```

2. **Use test API keys** (not production keys):
   ```bash
   export CONTEXT_OPT_GEMINI_KEY="test-key-for-development"
   ```

3. **Run validation before testing**:
   ```bash
   npm run build && npm test --silent
   ```

### Writing New Tests

1. **Follow existing patterns** in test files
2. **Use environment variable mocking**:
   ```typescript
   beforeEach(() => {
     process.env.CONTEXT_OPT_LLM_PROVIDER = 'gemini';
     process.env.CONTEXT_OPT_ALLOWED_PATHS = '/tmp/test';
   });
   ```

3. **Clean up after tests**:
   ```typescript
   afterEach(() => {
     jest.clearAllMocks();
   });
   ```

### Mock vs Real Testing

- **Unit tests**: Use mocked LLM responses
- **Integration tests**: Use real API calls (when keys available)
- **Security tests**: Always use real validation logic

## Continuous Integration

### GitHub Actions Setup

```yaml
# Example CI configuration
env:
  CONTEXT_OPT_LLM_PROVIDER: gemini
  CONTEXT_OPT_ALLOWED_PATHS: /tmp/ci-test
  # API keys should be set as repository secrets
  CONTEXT_OPT_GEMINI_KEY: ${{ secrets.GEMINI_KEY }}
  CONTEXT_OPT_EXA_KEY: ${{ secrets.EXA_KEY }}

steps:
  - run: npm test --silent
```

### Local CI Simulation

```bash
# Simulate CI environment
export NODE_ENV=test
export CONTEXT_OPT_LOG_LEVEL=error
npm run validate
```

## Troubleshooting Tests

### Common Test Issues

1. **Tests timing out**:
   ```bash
   # Increase Jest timeout
   npm test -- --testTimeout=60000
   ```

2. **API rate limits**:
   ```bash
   # Run tests with delays
   npm test -- --runInBand
   ```

3. **Path permission errors**:
   ```bash
   # Ensure test directory is writable
   chmod 755 /tmp/test-workspace
   ```

### Debug Mode

```bash
# Run with debug logging
export CONTEXT_OPT_LOG_LEVEL=debug
npm test askAboutFile.test.ts
```

### Test Coverage

```bash
# Generate coverage report
npm test -- --coverage

# View coverage in browser
open coverage/lcov-report/index.html
```

## Test Data Management

Tests use temporary files and directories that are automatically cleaned up. Test data includes:

- Sample code files for analysis
- Mock terminal command outputs
- Temporary session files
- Test configuration files

All test data is isolated and doesn't affect the main system or other test runs.

## Manual Testing Protocol

For comprehensive end-to-end testing with AI assistants, we provide a workflow-based manual testing protocol that validates all tools through realistic scenarios.

### Overview

The manual testing system consists of two documents:

1. **[Manual Testing Setup Guide](manual-testing-setup.md)** - For human users to prepare the testing environment
2. **[Manual Testing Protocol](manual-testing-protocol.md)** - For AI assistants to execute systematically

### When to Use Manual Testing

- **Before releases**: Validate all functionality end-to-end
- **After major changes**: Ensure tools still work together correctly
- **With new AI assistants**: Verify compatibility with different MCP clients
- **When integration tests can't cover**: Real-world usage patterns and edge cases

### Manual Testing Approach

The protocol uses **workflow-based testing** instead of individual tool testing:

#### 3 Main Workflows
1. **Development Analysis Pipeline** (4 steps)
   - File analysis → Security audit → Follow-up → Research
   - Tests: `askAboutFile`, `runAndExtract`, `askFollowUp`, `researchTopic`

2. **Code Quality and Build Assessment** (4 steps)
   - Config analysis → Build execution → Build follow-up → Architecture research
   - Tests: `askAboutFile`, `runAndExtract`, `askFollowUp`, `deepResearch`

3. **Repository State and Git Analysis** (4 steps)
   - Git status → History follow-up → Documentation → Workflow research
   - Tests: `runAndExtract`, `askFollowUp`, `askAboutFile`, `researchTopic`

#### Focused Failure Testing (6 tests)
- Security path validation
- Command filtering
- Session error handling
- Timeout handling
- Large file handling
- API key validation

#### Edge Case Testing (3 tests)
- Unicode character handling
- Rapid tool succession
- Network connectivity issues

### Benefits of Manual Testing

- **Real Usage Patterns**: Tests how tools actually work together
- **Context Optimization Validation**: Ensures responses stay focused and don't flood context
- **Assistant Compatibility**: Validates with actual AI assistants (VS Code, Claude Desktop, Cursor)
- **Human-readable Results**: Clear pass/fail criteria and detailed reporting
- **Comprehensive Coverage**: 40% fewer test cases while maintaining full functionality coverage

### Setup Instructions

1. **Complete environment setup** using the [Manual Testing Setup Guide](manual-testing-setup.md)
2. **Provide the testing prompt** to your AI assistant (included in setup guide)
3. **Monitor progress** and review the structured report generated

### Safety Features

- **Stop-on-failure rule**: Assistant stops if >50% of tests fail after 3 tool calls
- **No file creation**: Uses only existing repository files
- **Security validation**: Tests include dangerous command and path validation
- **Network testing**: Optional network connectivity testing with clear instructions

The manual testing protocol provides confidence that all tools work correctly in realistic scenarios while maintaining the context optimization benefits that make this MCP server valuable.

---