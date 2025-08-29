# Manual Testing Setup Guide

This guide provides setup instructions for human users to prepare for manual testing of the Context Optimizer MCP Server.

## Prerequisites

Before starting the testing protocol, ensure:

- [ ] Context Optimizer MCP Server is installed globally: `npm install -g context-optimizer-mcp-server`
- [ ] Environment variables are configured with valid API keys
- [ ] MCP server is configured in your AI assistant (VS Code, Claude Desktop, or Cursor)
- [ ] This project directory is within `CONTEXT_OPT_ALLOWED_PATHS`

## Environment Setup Verification

### Step 1: Verify Installation
```bash
# Run this command to verify installation
context-optimizer-mcp --version
```
**Expected**: Version number displayed (e.g., 1.0.3)

### Step 2: Check Environment Variables
```bash
# Verify key environment variables (sanitized output)
echo "Provider: $CONTEXT_OPT_LLM_PROVIDER"
echo "Allowed Paths: $CONTEXT_OPT_ALLOWED_PATHS"
echo "Exa Key Set: $(if [ -n "$CONTEXT_OPT_EXA_KEY" ]; then echo 'Yes'; else echo 'No'; fi)"
```
**Expected**: All required variables shown, API keys present

### Step 3: Test MCP Server Discovery
Ask your AI assistant: "Can you list the available MCP tools?"
**Expected**: All 5 tools listed (askAboutFile, runAndExtract, askFollowUp, researchTopic, deepResearch)

## Network Control Commands

For testing network connectivity issues, use these commands to disable/enable network. Note: Administrator (Windows) or sudo (macOS/Linux) privileges are typically required.

### Windows
```powershell
# Disable network (run as Administrator)
netsh interface set interface "Wi-Fi" admin=disable
netsh interface set interface "Ethernet" admin=disable

# Re-enable network (run as Administrator)
netsh interface set interface "Wi-Fi" admin=enable
netsh interface set interface "Ethernet" admin=enable
```

### macOS
```bash
# List devices to identify Wi-Fi/Ethernet names
networksetup -listallhardwareports

# Disable/Enable Wi-Fi via networksetup (preferred)
sudo networksetup -setairportpower "Wi-Fi" off
sudo networksetup -setairportpower "Wi-Fi" on

# Alternatively (interface names vary: en0, en1, etc.)
sudo ifconfig en0 down  # Disable
sudo ifconfig en0 up    # Enable
```

### Linux
```bash
# Disable network
sudo ip link set dev wlan0 down  # Wi-Fi
sudo ip link set dev eth0 down   # Ethernet

# Re-enable network
sudo ip link set dev wlan0 up    # Wi-Fi
sudo ip link set dev eth0 up     # Ethernet
```

## Test Files Available

The following test files are available in this project for testing:

### Standard Project Files
- `package.json` - For package management and dependency analysis
- `README.md` - For documentation analysis
- `tsconfig.json` - For configuration file testing
- `jest.config.js` - For build configuration testing
- Any files in `src/` directory - For code analysis

### Special Test Files
- Use existing repository files only. If you need a large file or one with special characters:
  - Large file candidate: `MCP Specs/Combined-Spec-2025-06-18.md`
  - Special characters candidate: `README.md`
  - If insufficient, ask the user to provide suitable files within allowed paths.

## Security Test Paths

For security testing, use these example paths that should be outside your allowed directories:

### Windows
- `C:\Windows\System32\drivers\etc\hosts`
- `C:\Program Files\`
- `%TEMP%\` (if not in allowed paths)

### macOS/Linux
- `/etc/passwd`
- `/usr/bin/`
- `/tmp/` (if not in allowed paths)

## Configuration Validation

### Required Environment Variables
Make sure these are set:
```bash
CONTEXT_OPT_LLM_PROVIDER=gemini        # or "claude" or "openai"
CONTEXT_OPT_GEMINI_KEY=your-api-key    # for Gemini
CONTEXT_OPT_EXA_KEY=your-exa-key       # for research tools
CONTEXT_OPT_ALLOWED_PATHS=C:\Projects\context-optimizer-mcp-server  # this project directory
```

### Optional Environment Variables
```bash
CONTEXT_OPT_MAX_FILE_SIZE=1048576      # 1MB default
CONTEXT_OPT_COMMAND_TIMEOUT=30000      # 30 seconds
CONTEXT_OPT_SESSION_TIMEOUT=1800000    # 30 minutes
CONTEXT_OPT_LOG_LEVEL=warn             # error, warn, info, debug
```

## Commands to Test With

### Safe Commands for runAndExtract Testing
These commands are designed to work on this project:

```bash
# Package management
npm list --depth=0
npm outdated
npm audit --audit-level=moderate

# Git operations
git status --porcelain
git log --oneline -10
git branch -a

# Build and test
npm run build
npm test -- --passWithNoTests
npm run test:silent

# File operations (PowerShell on Windows)
Get-ChildItem -Force
Get-ChildItem -Recurse -Filter *.ts | Select-Object -First 10
Select-String -Path src\* -Pattern "export" | Select-Object -First 5

# System info
node --version && npm --version
$env:NODE_ENV
Get-Location
```

### Commands That Should Be Blocked
These should be rejected by security validation:
```bash
rm -rf /
cd ..
vim test.txt
sudo rm -rf *
```

## AI Assistant Configuration

### For VS Code + GitHub Copilot
Ensure your global `mcp.json` includes:
```json
{
  "servers": {
    "context-optimizer": {
      "command": "context-optimizer-mcp"
    }
  }
}
```

### For Claude Desktop
Ensure your `claude_desktop_config.json` includes:
```json
{
  "mcpServers": {
    "context-optimizer": {
      "command": "context-optimizer-mcp"
    }
  }
}
```

### For Cursor AI
Ensure your `mcp.json` includes:
```json
{
  "mcpServers": {
    "context-optimizer": {
      "command": "context-optimizer-mcp"
    }
  }
}
```

## Troubleshooting Setup Issues

### Common Issues

1. **Tools not discovered**
   - Restart your AI assistant completely
   - Verify environment variables are set system-wide
   - Check that `context-optimizer-mcp` command works in terminal

2. **Path validation errors**
   - Ensure this project directory is in `CONTEXT_OPT_ALLOWED_PATHS`
   - Use absolute paths, not relative paths
   - Check directory permissions

3. **API key errors**
   - Verify API keys are valid and have proper permissions
   - Check environment variables are set correctly
   - Test API keys directly if possible

4. **Network testing issues**
   - Run network commands as administrator/sudo when required
   - Be prepared to quickly re-enable network if issues occur
   - Test network commands in a separate terminal first

## Ready to Test

Once all setup is complete:

1. Verify all environment variables are set
2. Confirm your AI assistant can see the 5 MCP tools
3. Ensure you can run basic commands in this project directory
4. Have network disable/enable commands ready
5. Provide the testing protocol to your AI assistant with the following prompt:

### Assistant Testing Prompt

Copy and provide this exact prompt to your AI assistant:

```
Please execute the manual testing protocol for the Context Optimizer MCP Server. 

CRITICAL INSTRUCTION: After executing any 3 tool calls, if more than half of the executed tests are failing, STOP immediately and report to me. Do not continue testing.

The testing protocol document is located at: docs/reference/manual-testing-protocol.md

Please read the protocol and execute the workflows systematically, reporting your results as you progress.
```

The AI assistant should execute the testing protocol systematically and report back with results.

## Important Notes

- **Always test in a safe environment** - these tests involve running commands and manipulating network settings
- **Have backups** of any important work before starting
- **Monitor the testing process** and be ready to intervene if needed
- **Network testing requires administrator privileges** on most systems

After setup, provide your AI assistant with the testing protocol document to begin systematic testing.
