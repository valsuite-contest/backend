# Contributing to Contest Backend

Thank you for your interest in contributing to the Contest Backend project! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)
- [Documentation](#documentation)

## Code of Conduct

This project follows a standard Code of Conduct. Please be respectful and constructive in all interactions.

### Our Standards

- Use welcoming and inclusive language
- Be respectful of differing viewpoints
- Gracefully accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- PostgreSQL 14.x or higher
- Git
- A code editor (VS Code recommended)

### Setting Up Development Environment

1. Fork the repository on GitHub

2. Clone your fork:
```bash
git clone https://github.com/YOUR_USERNAME/contest-backend.git
cd contest-backend
```

3. Add upstream remote:
```bash
git remote add upstream https://github.com/valsuite-contest/contest-backend.git
```

4. Install dependencies:
```bash
npm install
```

5. Set up your database and environment:
```bash
cp .env.example .env
# Edit .env with your local database credentials
```

6. Run migrations:
```bash
npm run prisma:migrate
```

7. Seed the database:
```bash
npm run seed
```

8. Start development server:
```bash
npm run dev
```

## Development Workflow

### Creating a Branch

Always create a new branch for your work:

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

Branch naming conventions:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Adding or updating tests
- `chore/` - Maintenance tasks

### Making Changes

1. Make your changes in your branch
2. Write or update tests as needed
3. Update documentation if needed
4. Ensure your code follows the coding standards
5. Test your changes locally

### Keeping Your Fork Updated

```bash
git fetch upstream
git checkout main
git merge upstream/main
git push origin main
```

## Coding Standards

### TypeScript Style

- Use TypeScript for all new code
- Enable strict mode in tsconfig.json
- Prefer interfaces over type aliases for object shapes
- Use explicit return types for functions
- Avoid `any` type; use `unknown` if type is truly unknown

### Code Formatting

- Use 2 spaces for indentation
- Use single quotes for strings
- Add trailing commas in multi-line objects/arrays
- Max line length: 100 characters
- Use semicolons

Example:
```typescript
import { Request, Response } from 'express';

interface UserData {
  username: string;
  email: string;
  roles: string[];
}

export async function createUser(
  req: Request,
  res: Response
): Promise<void> {
  const { username, email } = req.body;
  
  const user: UserData = {
    username,
    email,
    roles: ['TEAM'],
  };
  
  // Implementation...
}
```

### Naming Conventions

- **Files**: camelCase for files, PascalCase for classes
  - `userController.ts`
  - `authMiddleware.ts`
  
- **Classes**: PascalCase
  - `UserController`
  - `AuthMiddleware`
  
- **Functions/Methods**: camelCase
  - `createUser()`
  - `authenticateRequest()`
  
- **Variables**: camelCase
  - `userId`
  - `contestData`
  
- **Constants**: UPPER_SNAKE_CASE
  - `MAX_RETRIES`
  - `DEFAULT_TIMEOUT`
  
- **Interfaces**: PascalCase with 'I' prefix (optional)
  - `User` or `IUser`
  - `Contest` or `IContest`

### Error Handling

Always use proper error handling:

```typescript
try {
  // Code that might throw
  const result = await someOperation();
  res.json(result);
} catch (error) {
  next(error); // Pass to error middleware
}
```

Create custom errors when needed:

```typescript
throw new HttpError(400, 'Invalid request data');
```

### Database Operations

- Always use Prisma client
- Use transactions for multiple related operations
- Include appropriate relations in queries
- Handle unique constraint violations

```typescript
const user = await prisma.user.create({
  data: {
    username,
    email,
    passwordHash,
    roles: {
      create: [{ role: 'TEAM' }],
    },
  },
  include: {
    roles: true,
  },
});
```

### Security Best Practices

- Never log sensitive data (passwords, tokens)
- Always hash passwords with bcrypt
- Validate and sanitize all user input
- Use parameterized queries (Prisma handles this)
- Implement proper authorization checks
- Use HTTPS in production

## Commit Guidelines

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Maintenance tasks

### Examples

```
feat(auth): add 2FA support

Implement two-factor authentication using TOTP.
Add endpoints for 2FA setup and verification.

Closes #123
```

```
fix(submissions): prevent duplicate submissions

Add rate limiting to submission endpoint to prevent
users from submitting the same solution multiple times
within a short time period.
```

```
docs(api): update authentication examples

Add more detailed examples for JWT authentication
and refresh token usage.
```

### Commit Best Practices

- Keep commits atomic (one logical change per commit)
- Write clear, descriptive commit messages
- Reference issues/PRs when applicable
- Ensure each commit builds and passes tests

## Pull Request Process

### Before Submitting

1. Update your branch with latest upstream changes:
```bash
git fetch upstream
git rebase upstream/main
```

2. Ensure your code builds:
```bash
npm run build
```

3. Run tests (when available):
```bash
npm test
```

4. Update documentation if needed

### Submitting a Pull Request

1. Push your branch to your fork:
```bash
git push origin feature/your-feature-name
```

2. Go to GitHub and create a Pull Request

3. Fill out the PR template with:
   - Description of changes
   - Related issue numbers
   - Testing performed
   - Screenshots (if UI changes)
   - Breaking changes (if any)

4. Request review from maintainers

### PR Title Format

Use the same format as commit messages:
```
feat(auth): add 2FA support
fix(api): resolve CORS issues
docs: update setup guide
```

### Review Process

- At least one maintainer must approve
- All CI checks must pass
- Address all review comments
- Keep PR focused on a single feature/fix
- Rebase if conflicts arise

### After Approval

- Maintainers will merge your PR
- Delete your feature branch
- Pull latest changes to your main branch

## Testing

### Unit Tests

(To be implemented)

```typescript
describe('UserController', () => {
  it('should create a new user', async () => {
    // Test implementation
  });
});
```

### Integration Tests

(To be implemented)

```typescript
describe('POST /api/users', () => {
  it('should return 201 on successful creation', async () => {
    // Test implementation
  });
});
```

### Manual Testing

1. Test all affected endpoints with Postman/curl
2. Verify database changes with Prisma Studio
3. Check error handling
4. Verify authorization rules
5. Test edge cases

## Documentation

### Code Comments

- Use JSDoc for functions and classes
- Comment complex logic
- Don't comment obvious code
- Keep comments up to date

```typescript
/**
 * Creates a new contest with the provided configuration.
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 * @returns Promise<void>
 * @throws HttpError if validation fails
 */
async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  // Implementation
}
```

### API Documentation

- Update API.md for new/changed endpoints
- Include request/response examples
- Document error responses
- Explain authentication requirements

### README Updates

- Update feature list
- Add new configuration options
- Document new environment variables
- Update examples

## Issue Guidelines

### Reporting Bugs

Include:
- Clear description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Node version, etc.)
- Error messages and stack traces
- Screenshots if applicable

### Suggesting Features

Include:
- Clear use case
- Expected behavior
- Possible implementation approach
- Related features or alternatives

### Issue Labels

- `bug` - Something isn't working
- `enhancement` - New feature request
- `documentation` - Documentation improvements
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention needed
- `question` - Further information requested

## Code Review Checklist

When reviewing PRs, check:

- [ ] Code follows style guidelines
- [ ] Comments are clear and helpful
- [ ] No unnecessary code is added
- [ ] Error handling is appropriate
- [ ] Security best practices followed
- [ ] Database operations are efficient
- [ ] API documentation is updated
- [ ] No sensitive data is logged
- [ ] Code is tested (manually or automated)
- [ ] Commit messages are clear

## Getting Help

- **Questions**: Open an issue with the `question` label
- **Discussion**: Use GitHub Discussions
- **Security Issues**: Email security@example.com (do not open public issues)

## Recognition

Contributors will be recognized in:
- CONTRIBUTORS.md file
- Release notes for significant contributions
- Project README for major features

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (ISC).

## Thank You!

Every contribution helps make this project better. We appreciate your time and effort!
