# Assistant Testing Protocol for Context Optimizer MCP Server

This document provides workflow-based testing that comprehensively validates all tools through realistic scenarios. Execute workflows in order and report results.

Important constraints:
- Do not create any files; use only files already in this repository.
- If a required file for a test is not available, ask the user to provide one or point to an alternative file, then proceed.
- Replace `$PROJECT_ROOT` in all examples with your actual project path (e.g., `/home/user/context-optimizer-mcp-server` on Linux/Mac or `C:\Users\username\context-optimizer-mcp-server` on Windows)

---

## Workflow 1: Development Analysis Pipeline

**Scenario**: Complete project analysis covering file analysis, dependency management, and security research
**Tools Tested**: askAboutFile, runAndExtract, askFollowUp, researchTopic
**Coverage**: File analysis, terminal execution, session management, research capabilities

### Step 1.1: Project Configuration Analysis
```
mcp_context-optim_askAboutFile with:
- filePath: "$PROJECT_ROOT/package.json"
- question: "What are the main dependencies and scripts? Are there any development vs production dependencies?"
```
**Expected**: Package structure, dependency categorization, script purposes identified

### Step 1.2: Package Security Assessment
```
mcp_context-optim_runAndExtract with:
- terminalCommand: "npm audit --audit-level=moderate"
- extractionPrompt: "Summarize security vulnerabilities found. What are the severity levels and which packages are affected?"
- workingDirectory: "$PROJECT_ROOT"
```
**Expected**: Security analysis without full audit output, session created for follow-up

### Step 1.3: Dependency Details Follow-up
```
mcp_context-optim_askFollowUp with:
- question: "Which specific packages need updates and what are the recommended actions?"
```
**Expected**: Detailed follow-up using session data, actionable recommendations

### Step 1.4: Security Best Practices Research
```
mcp_context-optim_researchTopic with:
- topic: "Node.js dependency security management and automated vulnerability scanning best practices 2024"
```
**Expected**: Current security practices, tool recommendations, implementation guidance

**Workflow Success Criteria**:
- [ ] File analysis extracts relevant information without dumping full content
- [ ] Terminal command executes and provides focused security summary
- [ ] Follow-up question accesses previous session data correctly
- [ ] Research provides actionable security guidance
- [ ] All responses are concise and focused (context optimization working)

---

## Workflow 2: Code Quality and Build Assessment

**Scenario**: Code quality review, build validation, and architecture analysis
**Tools Tested**: askAboutFile, runAndExtract, askFollowUp, deepResearch
**Coverage**: Configuration analysis, build processes, comprehensive research

### Step 2.1: TypeScript Configuration Review
```
mcp_context-optim_askAboutFile with:
- filePath: "$PROJECT_ROOT/tsconfig.json"
- question: "What are the target, module, and strict settings? Are there any special compilation options configured?"
```
**Expected**: Specific configuration details, clear explanation of settings

### Step 2.2: Build Process Execution
```
mcp_context-optim_runAndExtract with:
- terminalCommand: "npm run build"
- extractionPrompt: "Did the build succeed? Report any warnings, errors, or notable compilation information."
- workingDirectory: "$PROJECT_ROOT"
```
**Expected**: Build status, key issues without verbose logs, session for follow-up

### Step 2.3: Build Analysis Follow-up
```
mcp_context-optim_askFollowUp with:
- question: "Are there any TypeScript compilation warnings or performance concerns from the build output?"
```
**Expected**: Detailed build analysis using session data

### Step 2.4: Architecture Decision Research
```
mcp_context-optim_deepResearch with:
- topic: "MCP server architecture patterns and TypeScript project structure for developer tools: scalability, maintainability, and plugin architecture considerations"
```
**Expected**: Comprehensive architectural analysis, multiple perspectives, implementation recommendations

**Workflow Success Criteria**:
- [ ] Configuration analysis identifies key TypeScript settings
- [ ] Build execution provides focused results
- [ ] Follow-up extracts additional insights from build output
- [ ] Deep research provides strategic architectural guidance
- [ ] No verbose outputs flood the context

---

## Workflow 3: Repository State and Git Analysis

**Scenario**: Repository status, file structure analysis, and development workflow research
**Tools Tested**: runAndExtract, askFollowUp, askAboutFile, researchTopic
**Coverage**: Git operations, project structure, workflow optimization

### Step 3.1: Repository Status Check
```
mcp_context-optim_runAndExtract with:
- terminalCommand: "git status --porcelain && git log --oneline -5"
- extractionPrompt: "What is the current repository state? Are there uncommitted changes? What are the recent commits about?"
- workingDirectory: "$PROJECT_ROOT"
```
**Expected**: Repository state summary, recent activity overview

### Step 3.2: Git History Follow-up
```
mcp_context-optim_askFollowUp with:
- question: "Based on the recent commits, what areas of the codebase have been most active recently?"
```
**Expected**: Development activity analysis from git data

### Step 3.3: Project Documentation Analysis
```
mcp_context-optim_askAboutFile with:
- filePath: "$PROJECT_ROOT/README.md"
- question: "What is the main purpose and key features of this project? What special characters or emojis are used for formatting?"
```
**Expected**: Project overview plus Unicode/emoji handling test

### Step 3.4: Development Workflow Research
```
mcp_context-optim_researchTopic with:
- topic: "TypeScript MCP server development workflow optimization: testing strategies, CI/CD, and documentation practices"
```
**Expected**: Workflow optimization recommendations, tooling suggestions

**Workflow Success Criteria**:
- [ ] Git operations execute and provide clear status
- [ ] Follow-up accesses git session data effectively
- [ ] README analysis handles special characters correctly
- [ ] Research provides practical workflow guidance
- [ ] Repository analysis is comprehensive but focused

---

## Failure Testing Scenarios

**Purpose**: Test security controls, error handling, and edge cases
**Tools Tested**: All tools with expected failures
**Coverage**: Security validation, error responses, edge cases

### Failure Test 1: Security Path Validation
```
mcp_context-optim_askAboutFile with:
- filePath: "/etc/passwd"  # On Unix/Linux/Mac, use "C:\Windows\System32\drivers\etc\hosts" on Windows
- question: "What does this file contain?"
```
**Expected**: Security error, clear rejection message, no file access

### Failure Test 2: Command Security Filtering
```
mcp_context-optim_runAndExtract with:
- terminalCommand: "rm -rf /"  # On Unix/Linux/Mac, use "rmdir /s C:\" on Windows
- extractionPrompt: "What happened?"
- workingDirectory: "$PROJECT_ROOT"
```
**Expected**: Command blocked, security explanation, no execution

### Failure Test 3: Follow-up Without Session
```
mcp_context-optim_askFollowUp with:
- question: "What were the results of the last command?"
```
**Expected**: No session error, instruction to use runAndExtract first

### Failure Test 4: Command Timeout
```
mcp_context-optim_runAndExtract with:
- terminalCommand: "sleep 35"  # On Unix/Linux/Mac, use "powershell -Command Start-Sleep -Seconds 35" on Windows
- extractionPrompt: "Did the command complete?"
- workingDirectory: "$PROJECT_ROOT"
```
**Expected**: Timeout error, no hanging processes

### Failure Test 5: Large File Handling
```
mcp_context-optim_askAboutFile with:
- filePath: "$PROJECT_ROOT/MCP Specs/Combined-Spec-2025-06-18.md"
- question: "What is the general structure of this document?"
```
**Expected**: Appropriate handling (process or reject with size message), no crashes

### Failure Test 6: Research Without API Key
**Note**: Only test if research API key is not configured
```
mcp_context-optim_researchTopic with:
- topic: "Any technical topic"
```
**Expected**: Clear API configuration error, setup guidance

**Failure Testing Success Criteria**:
- [ ] Security controls properly block unauthorized access
- [ ] Dangerous commands are prevented from executing
- [ ] Error messages are clear and helpful
- [ ] No tool crashes or hangs occur
- [ ] Large file handling is appropriate
- [ ] Missing API key errors are informative

---

## Edge Case Testing

**Purpose**: Test special conditions and boundary cases
**Coverage**: Unicode handling, rapid succession, network issues

### Edge Test 1: Special Characters and Encoding
```
mcp_context-optim_askAboutFile with:
- filePath: "$PROJECT_ROOT/README.md"
- question: "List all emojis and special Unicode characters found in this file. Test encoding handling."
```
**Expected**: Proper Unicode handling, no character corruption

### Edge Test 2: Rapid Tool Succession
Execute quickly in sequence:
```
1. mcp_context-optim_runAndExtract with:
   - terminalCommand: "node --version"
   - extractionPrompt: "What version?"
   - workingDirectory: "$PROJECT_ROOT"

2. mcp_context-optim_askFollowUp with:
   - question: "Is this a recent version?"

3. mcp_context-optim_askAboutFile with:
   - filePath: "$PROJECT_ROOT/package.json"
   - question: "What Node.js version is required?"
```
**Expected**: Proper session management, no conflicts between tools

### Edge Test 3: Network Connectivity (Optional)
**Note**: Requires manual network disconnection
```
mcp_context-optim_researchTopic with:
- topic: "Test topic during network issues"
```
**Expected**: Graceful network error, no crashes

**Edge Case Success Criteria**:
- [ ] Unicode characters handled correctly
- [ ] Rapid tool usage works without conflicts
- [ ] Network issues handled gracefully
- [ ] Session data remains consistent
- [ ] No memory leaks or performance issues

---

---

## Success Criteria

### Overall Success Indicators
- [ ] All 5 tools execute without crashes across all workflows
- [ ] Security controls work as expected in failure scenarios
- [ ] Session management functions correctly between workflow steps
- [ ] Error handling is graceful and informative
- [ ] Context optimization is demonstrably effective (focused responses)
- [ ] Workflows demonstrate realistic usage patterns

### Quality Indicators
- [ ] Responses are focused and relevant (not verbose)
- [ ] No unnecessary data flooding
- [ ] Clear, actionable information provided
- [ ] Consistent response formatting
- [ ] Appropriate use of markdown formatting
- [ ] Helpful error messages when things go wrong
- [ ] Tools complement each other effectively in workflows

---

## Testing Report Template

After completing the testing protocol, document results using this template:

```markdown
# Context Optimizer MCP Server - Workflow Testing Report

**Date**: [Testing Date]
**Tester**: [Code Assistant Name/Version]
**Environment**: [VS Code/Claude Desktop/Cursor + OS]
**Server Version**: [Version Number]

## Summary
- **Workflows Completed**: [Number]
- **Individual Tool Calls**: [Number]
- **Passed**: [Number]
- **Failed**: [Number]
- **Critical Failures**: [Security/Safety issues]

## Workflow Results
### Workflow 1: Development Analysis Pipeline
- [✅/❌] Step 1.1: Project Configuration Analysis
- [✅/❌] Step 1.2: Package Security Assessment
- [✅/❌] Step 1.3: Dependency Details Follow-up
- [✅/❌] Step 1.4: Security Best Practices Research

### Workflow 2: Code Quality and Build Assessment
- [✅/❌] Step 2.1: TypeScript Configuration Review
- [✅/❌] Step 2.2: Build Process Execution
- [✅/❌] Step 2.3: Build Analysis Follow-up
- [✅/❌] Step 2.4: Architecture Decision Research

### Workflow 3: Repository State and Git Analysis
- [✅/❌] Step 3.1: Repository Status Check
- [✅/❌] Step 3.2: Git History Follow-up
- [✅/❌] Step 3.3: Project Documentation Analysis
- [✅/❌] Step 3.4: Development Workflow Research

### Failure Testing
- [✅/❌] Security controls functioning
- [✅/❌] Error handling appropriate
- [✅/❌] Edge cases handled gracefully

## Context Optimization Assessment
- **Response Focus**: [Excellent/Good/Poor]
- **Information Density**: [High/Medium/Low]
- **Context Usage**: [Efficient/Moderate/Wasteful]

## Issues Found
1. [Issue description and severity]
2. [Issue description and severity]

## Recommendations
- [Suggestions for improvements]
```

---

## Notes for Code Assistants

### When Executing This Protocol
1. **Execute workflows in order** - later workflows may depend on earlier ones
2. **Complete entire workflows** before moving to the next
3. **Document all results** - both successes and failures
4. **Note context optimization effectiveness** - are responses focused or verbose?
5. **Test failure scenarios thoroughly** - security is critical
6. **Verify session data persistence** between workflow steps
7. **Monitor for any tool conflicts** or unexpected interactions

### Tips for Effective Testing
- Workflows simulate realistic usage patterns rather than isolated tool testing
- Each workflow tests multiple tools in logical sequences
- Failure scenarios ensure security and error handling work correctly
- Focus on whether context optimization is actually working (responses should be targeted, not comprehensive)
- Validate that tools enhance each other when used together
- Look for any degradation in response quality as workflows progress

This protocol provides comprehensive coverage with 75% fewer test cases while maintaining thorough validation of all functionality through realistic usage scenarios.
