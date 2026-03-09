# Contributing to MCP Bridge

Thank you for your interest in contributing to MCP Bridge! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them succeed
- Focus on constructive feedback
- Accept criticism professionally

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- TypeScript 5.3+
- Git

### Development Setup

1. **Fork the repository**

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/OpenClaw-MCP-Bridge.git
   cd mcp-bridge
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

5. **Build the project**
   ```bash
   npm run build:all
   ```

6. **Run tests**
   ```bash
   npm test
   ```

## Project Structure

```
mcp-bridge/
├── src/
│   ├── cli.tsx          # CLI application (Ink/React)
│   ├── index.ts         # Main entry point
│   ├── types/
│   │   └── mcp.ts       # TypeScript types
│   ├── lib/
│   │   ├── config.ts         # Config management
│   │   ├── protocol.ts       # MCP protocol handling
│   │   ├── installer.ts      # Server installation
│   │   ├── retry.ts          # Retry logic
│   │   ├── logger.ts         # Logging utilities
│   │   ├── errors.ts         # Error handling
│   │   └── config-validator.ts
│   └── __tests__/
│       └── *.test.ts    # Unit tests
├── docs/                # Documentation
├── coverage/            # Test coverage reports
└── dist/                # Built output
```

## Making Changes

### Code Style

- Use TypeScript with strict mode enabled
- Follow existing code formatting
- Use meaningful variable and function names
- Add JSDoc comments for public APIs

### Writing Tests

- Write tests for new features
- Maintain test coverage above 80%
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)

Example:
```typescript
describe('MCPBridge', () => {
  describe('connectToServer', () => {
    it('should connect to a valid server', async () => {
      // Arrange
      const bridge = new MCPBridge({ configPath: './test-config.json' });
      
      // Act
      await bridge.connectToServer('filesystem');
      
      // Assert
      expect(bridge.isConnected('filesystem')).toBe(true);
    });
  });
});
```

### Commit Messages

Follow conventional commits:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `test`: Tests
- `refactor`: Code refactoring
- `chore`: Build/process changes

Examples:
```
feat(servers): add retry logic for connection failures
fix(config): validate server names properly
docs: update CLI reference
test: add tests for retry mechanism
```

### Pull Request Process

1. **Update documentation** if needed
2. **Run tests** and ensure they pass
3. **Run coverage** and ensure it's above 80%
4. **Push your branch**
   ```bash
   git push origin feature/your-feature-name
   ```
5. **Open a Pull Request** against `main`
6. **Fill out the PR template** completely

### PR Title Format

Use the same format as commit messages:
```
feat(servers): add auto-reconnection
fix(cli): handle missing config file
docs: add troubleshooting section
```

## Types of Contributions

### 🐛 Bug Reports

Use GitHub Issues with:
- Clear title describing the problem
- Steps to reproduce
- Expected vs actual behavior
- Environment details

### 💡 Feature Requests

Use GitHub Issues with:
- Clear description of the feature
- Use cases
- Potential alternatives considered

### 📖 Documentation

- Improve existing docs
- Add examples
- Fix typos
- Translate to other languages

### 🧪 Testing

- Add missing tests
- Improve test coverage
- Fix flaky tests

### 💻 Code

- Implement new features
- Fix bugs
- Refactor code
- Improve performance

## Review Process

1. **Automated checks** run (tests, linting, coverage)
2. **Maintainer review** within 48 hours
3. **Address feedback** if requested
4. **Merge** after approval

## Questions?

- Open a GitHub Discussion
- Join our community chat
- Email the maintainers

## Recognition

Contributors will be acknowledged in:
- README.md contributors section
- Release notes
- GitHub profile

---

Thank you for contributing to MCP Bridge! 🎉
