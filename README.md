# Context Optimizer MCP Server

![npm version](https://img.shields.io/npm/v/context-optimizer-mcp-server?color=blue) ![license](https://img.shields.io/badge/license-MIT-green.svg) ![node](https://img.shields.io/badge/node-%3E=18.x-informational) ![tests](https://img.shields.io/badge/tests-passing-success) 

A Model Context Protocol (MCP) server that provides context optimization tools for AI coding assistants including GitHub Copilot, Cursor AI, Claude Desktop, and other MCP-compatible assistants enabling them to extract targeted information rather than processing large terminal outputs and files wasting their context.

> This MCP server is the evolution of the [VS Code Copilot Context Optimizer extension](https://github.com/malaksedarous/vscode-copilot-context-optimizer), but with compatibility across MCP-supporting applications.

## 🎯 The Problem It Solves

**Have you ever experienced this with your AI coding assistant (like Copilot, Claude Code, or Cursor)?**

*   🔄 **Your assistant keeps compacting/summarizing conversations** and losing a bit of the context in the process.
*   🖥️ **Terminal outputs flood the context** with hundreds of lines when the assistant only needs key information.
*   📄 **Large files overwhelm the context** when the assistant just needs to check one specific thing.
*   ⚠️ **"Context limit reached"** messages interrupting your workflow.
*   🧠 **Your assistant "forgets" earlier parts** of your conversation due to context overflow.
*   😫 **The reasoning quality drops** when you have a longer conversation.

**The Root Cause**: When your assistant:
*   Reads long logs during builds, tests, lints, etc. after executing a terminal command.
*   Reads a large file (or multiple) in full just to answer a question when it doesn't need the whole code.
*   Reads multiple web pages from the web to search a topic to learn how to do something.
*   Or just during a long conversation.

The assistant will either:

*   Start compacting, summarizing or truncating the conversation history.
*   Drop the quality of reasoning.
*   Lose track of earlier context and decisions.
*   Become less helpful as it loses focus.

**The Solution**:

This server provides any MCP-compatible assistant with specialized tools that extract only the specific information you need, keeping your chat context clean and focused on productive problem-solving rather than data management.

## Features

- **🔍 File Analysis Tool** (`askAboutFile`) - Extract specific information from files without loading entire contents
- **🖥️ Terminal Execution Tool** (`runAndExtract`) - Execute commands and extract relevant information using LLM analysis
- **❓ Follow-up Questions Tool** (`askFollowUp`) - Continue conversations about previous terminal executions
- **🔬 Research Tools** (`researchTopic`, `deepResearch`) - Conduct web research using Exa.ai's API
- **🔒 Security Controls** - Path validation, command filtering, and session management
- **🔧 Multi-LLM Support** - Works with Google Gemini, Claude (Anthropic), and OpenAI
- **⚙️ Environment Variable Configuration** - API key management through system environment variables
- **🏗️ Simple Configuration** - Environment variables only, no config files to manage
- **🧪 Comprehensive Testing** - Unit tests, integration tests, and security validation

## Quick Start

**1. Install globally:**
```bash
npm install -g context-optimizer-mcp-server
```

**2. Set environment variables** (see [docs/guides/usage.md](docs/guides/usage.md) for OS-specific instructions):
```bash
export CONTEXT_OPT_LLM_PROVIDER="gemini"
export CONTEXT_OPT_GEMINI_KEY="your-gemini-api-key"
export CONTEXT_OPT_EXA_KEY="your-exa-api-key"
export CONTEXT_OPT_ALLOWED_PATHS="/path/to/your/projects"
```

**3. Add to your MCP client configuration:**

like "mcpServers" in `claude_desktop_config.json` (Claude Desktop) or  "servers" in `mcp.json` (VS Code).
```json
"context-optimizer": {
  "command": "context-optimizer-mcp"
}
```
For **complete setup instructions** including OS-specific environment variable configuration and AI assistant setup, see **[docs/guides/usage.md](docs/guides/usage.md)**.

## Available Tools

- **`askAboutFile`** - Extract specific information from files without loading entire contents into chat context. Perfect for checking if files contain specific functions, extracting import/export statements, or understanding file purpose without reading the full content.

- **`runAndExtract`** - Execute terminal commands and intelligently extract relevant information using LLM analysis. Supports non-interactive commands with security validation, timeouts, and session management for follow-up questions.

- **`askFollowUp`** - Continue conversations about previous terminal executions without re-running commands. Access complete context from previous `runAndExtract` calls including full command output and execution details.

- **`researchTopic`** - Conduct quick, focused web research on software development topics using Exa.ai's research capabilities. Get current best practices, implementation guidance, and up-to-date information on evolving technologies.

- **`deepResearch`** - Comprehensive research and analysis using Exa.ai's exhaustive capabilities for critical decision-making and complex architectural planning. Ideal for strategic technology decisions, architecture planning, and long-term roadmap development.

For detailed tool documentation and examples, see **[docs/tools.md](docs/tools.md)** and **[docs/guides/usage.md](docs/guides/usage.md)**.

## Documentation

All documentation is organized under the `docs/` directory:

| Topic | Location | Description |
|-------|----------|-------------|
| **Architecture** | `docs/architecture.md` | System design and component overview |
| **Tools Reference** | `docs/tools.md` | Complete tool documentation and examples |
| **Usage Guide** | `docs/guides/usage.md` | Complete setup and configuration |
| **VS Code Setup** | `docs/guides/vs-code-setup.md` | VS Code specific configuration |
| **Troubleshooting** | `docs/guides/troubleshooting.md` | Common issues and solutions |
| **API Keys** | `docs/reference/api-keys.md` | API key management |
| **Testing** | `docs/reference/testing.md` | Testing framework and procedures |
| **Changelog** | `docs/reference/changelog.md` | Version history |
| **Contributing** | `docs/reference/contributing.md` | Development guidelines |
| **Security** | `docs/reference/security.md` | Security policy |
| **Code of Conduct** | `docs/reference/code-of-conduct.md` | Community guidelines |

### Quick Links
- **Get Started**: See `docs/guides/usage.md` for complete setup instructions
- **Tools Reference**: Check `docs/tools.md` for detailed tool documentation
- **Troubleshooting**: Check `docs/guides/troubleshooting.md` for common issues
- **VS Code Setup**: Follow `docs/guides/vs-code-setup.md` for VS Code configuration

## Testing

```bash
# Run all tests (skips LLM integration tests without API keys)
npm test

# Run tests with API keys for full integration testing
# Set environment variables first:
export CONTEXT_OPT_LLM_PROVIDER="gemini"
export CONTEXT_OPT_GEMINI_KEY="your-gemini-key"
export CONTEXT_OPT_EXA_KEY="your-exa-key"
npm test  # Now runs all tests including LLM integration

# Run in watch mode
npm run test:watch
```

### Manual Testing

For comprehensive end-to-end testing with an AI assistant, see the **[Manual Testing Setup Guide](docs/reference/manual-testing-setup.md)**. This provides a workflow-based testing protocol that validates all tools through realistic scenarios.

For detailed testing setup, see **[docs/reference/testing.md](docs/reference/testing.md)**.

## Contributing

Contributions are welcome! Please read **[docs/reference/contributing.md](docs/reference/contributing.md)** for guidelines on development workflow, coding standards, testing, and submitting pull requests.

## Community

- **Code of Conduct**: See **[docs/reference/code-of-conduct.md](docs/reference/code-of-conduct.md)**
- **Security Reports**: Follow **[docs/reference/security.md](docs/reference/security.md)** for responsible disclosure
- **Issues**: Use GitHub Issues for bugs & feature requests
- **Pull Requests**: Ensure tests pass and docs are updated
- **Discussions**: (If enabled) Use for open-ended questions/ideas

## License

MIT License - see LICENSE file for details.
## Related Projects

- [VS Code Copilot Context Optimizer](https://github.com/malaksedarous/vscode-copilot-context-optimizer) – Original VS Code extension (companion project)
