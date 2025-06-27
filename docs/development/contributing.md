# Contributing to Flowgenix

We welcome contributions to Flowgenix! This guide will help you get started with contributing to the project.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct:

- **Be Respectful**: Treat everyone with respect and kindness
- **Be Inclusive**: Welcome newcomers and help them learn
- **Be Collaborative**: Work together to improve the project
- **Be Professional**: Keep discussions focused and constructive

## Getting Started

### 1. Fork the Repository

```bash
# Fork on GitHub, then clone your fork
git clone https://github.com/your-username/flowgenix.git
cd flowgenix

# Add upstream remote
git remote add upstream https://github.com/original-repo/flowgenix.git
```

### 2. Set Up Development Environment

Follow the [Development Setup Guide](setup.md) to get your local environment running.

### 3. Create a Feature Branch

```bash
# Update your fork
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feature/your-feature-name
```

## Types of Contributions

### 🐛 Bug Reports

When reporting bugs, please include:

- **Clear Description**: What happened vs. what you expected
- **Steps to Reproduce**: Detailed steps to recreate the issue
- **Environment**: OS, browser, Node.js/Python versions
- **Screenshots**: If applicable
- **Error Messages**: Full error messages and stack traces

**Template:**
```markdown
**Bug Description**
Brief description of the bug

**Steps to Reproduce**
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

**Expected Behavior**
What you expected to happen

**Actual Behavior**
What actually happened

**Environment**
- OS: [e.g. Windows 11, macOS 13, Ubuntu 22.04]
- Browser: [e.g. Chrome 120, Firefox 121]
- Node.js Version: [e.g. 18.17.0]
- Python Version: [e.g. 3.11.5]

**Additional Context**
Any additional information, screenshots, or context
```

### 💡 Feature Requests

For feature requests, please include:

- **Problem Statement**: What problem does this solve?
- **Proposed Solution**: How should this feature work?
- **Alternatives**: Other solutions you've considered
- **Use Cases**: Who would benefit from this feature?

### 🔧 Code Contributions

We welcome code contributions for:

- Bug fixes
- New features
- Performance improvements
- Documentation improvements
- Test coverage improvements

## Development Guidelines

### Frontend (Next.js/TypeScript)

#### Code Style
```typescript
// Use TypeScript interfaces for props
interface ComponentProps {
  title: string;
  isActive?: boolean;
  onClose: () => void;
}

// Use functional components with hooks
export function MyComponent({ title, isActive = false, onClose }: ComponentProps) {
  const [state, setState] = useState<string>('');
  
  // Use early returns
  if (!title) {
    return null;
  }
  
  return (
    <div className="flex flex-col space-y-4">
      <h2 className="text-xl font-semibold">{title}</h2>
      {/* Component content */}
    </div>
  );
}
```

#### File Organization
```
src/
├── components/
│   ├── ui/              # Reusable UI components
│   ├── workflow/        # Workflow-specific components
│   └── layout/          # Layout components
├── hooks/               # Custom React hooks
├── services/            # API service functions
├── types/               # TypeScript type definitions
├── utils/               # Utility functions
└── app/                 # Next.js app pages
```

#### Best Practices
- Use TypeScript strictly (no `any` types)
- Follow React Hook rules
- Use Tailwind CSS for styling
- Implement proper error boundaries
- Add loading states and error handling
- Write unit tests for components

### Backend (FastAPI/Python)

#### Code Style
```python
# Use type hints everywhere
from typing import List, Optional
from pydantic import BaseModel

class UserCreate(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = None

# Use async/await for I/O operations
async def create_user(user_data: UserCreate) -> User:
    # Implementation
    pass

# Use dependency injection
@router.post("/users/", response_model=User)
async def create_user_endpoint(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> User:
    return await create_user(user_data)
```

#### File Organization
```
backend/
├── app/
│   ├── api/             # API routes
│   ├── models/          # SQLAlchemy models
│   ├── schemas/         # Pydantic schemas
│   ├── services/        # Business logic
│   ├── core/            # Core functionality
│   └── utils/           # Utility functions
├── tests/               # Test files
└── alembic/            # Database migrations
```

#### Best Practices
- Use type hints and Pydantic models
- Follow FastAPI patterns
- Implement proper error handling
- Use async/await for I/O operations
- Write comprehensive tests
- Follow PEP 8 style guide

### Database

#### Migration Guidelines
```python
# Always use descriptive migration names
alembic revision --autogenerate -m "add_user_preferences_table"

# Review auto-generated migrations
# Add data migrations when needed
# Test migrations on sample data
```

#### Schema Best Practices
- Use UUIDs for primary keys
- Add proper indexes
- Use foreign key constraints
- Include created_at/updated_at timestamps
- Add soft delete columns when appropriate

### Testing

#### Frontend Tests
```typescript
// Component tests with React Testing Library
import { render, screen, fireEvent } from '@testing-library/react';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('renders title correctly', () => {
    render(<MyComponent title="Test Title" onClose={jest.fn()} />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('calls onClose when button is clicked', () => {
    const onClose = jest.fn();
    render(<MyComponent title="Test" onClose={onClose} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(onClose).toHaveBeenCalled();
  });
});
```

#### Backend Tests
```python
# Use pytest and async test patterns
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_create_user(client: AsyncClient):
    response = await client.post(
        "/api/v1/users/",
        json={"email": "test@example.com", "password": "password"}
    )
    assert response.status_code == 201
    assert response.json()["email"] == "test@example.com"
```

#### Test Coverage
- Aim for 80%+ test coverage
- Test both happy path and error cases
- Include integration tests
- Test edge cases and boundary conditions

## Pull Request Process

### 1. Before Submitting

- [ ] Code follows style guidelines
- [ ] Tests pass locally
- [ ] New features include tests
- [ ] Documentation updated if needed
- [ ] No console errors or warnings
- [ ] Branch is up to date with main

### 2. PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## How Has This Been Tested?
- [ ] Unit tests
- [ ] Integration tests
- [ ] Manual testing

## Screenshots (if applicable)
Add screenshots to show the changes

## Checklist
- [ ] My code follows the style guidelines
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
```

### 3. Review Process

1. **Automated Checks**: CI/CD pipeline runs tests and linting
2. **Peer Review**: At least one maintainer reviews the code
3. **Feedback**: Address any requested changes
4. **Approval**: PR is approved and merged

## Commit Guidelines

### Commit Message Format

```
type(scope): subject

body

footer
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples
```bash
feat(chat): add markdown support for AI responses

- Add react-markdown dependency
- Update ChatInterface component
- Add syntax highlighting for code blocks
- Update tests for markdown rendering

Closes #123
```

```bash
fix(auth): resolve token refresh issue

The refresh token was not being properly validated,
causing users to be logged out unexpectedly.

- Update token validation logic
- Add proper error handling
- Include tests for edge cases

Fixes #456
```

## Documentation

### Types of Documentation

1. **Code Comments**: Explain complex logic
2. **README Updates**: Keep setup instructions current
3. **API Documentation**: Document new endpoints
4. **User Guides**: Explain new features to users
5. **Architecture Docs**: Explain design decisions

### Documentation Style

- Use clear, concise language
- Include code examples
- Add screenshots for UI changes
- Keep documentation up to date with code changes

## Release Process

### Version Numbering

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR**: Incompatible API changes
- **MINOR**: New functionality (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Workflow

1. **Feature Freeze**: Stop adding new features
2. **Testing**: Comprehensive testing of release candidate
3. **Documentation**: Update changelog and documentation
4. **Release**: Tag and publish new version
5. **Deployment**: Deploy to production environments

## Community

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and discussions
- **Discord**: Real-time community chat
- **Email**: Direct contact for sensitive issues

### Getting Help

- **Documentation**: Check existing documentation first
- **Search Issues**: Look for similar issues or questions
- **Discord Chat**: Ask questions in our community
- **Create Issue**: Open a new issue if needed

## Recognition

Contributors are recognized in:

- **CONTRIBUTORS.md**: All contributors listed
- **Release Notes**: Major contributors mentioned
- **GitHub**: Contributor statistics visible
- **Community**: Recognition in Discord and discussions

## License

By contributing to Flowgenix, you agree that your contributions will be licensed under the same MIT License that covers the project.

## Questions?

If you have questions about contributing:

1. Check the [documentation](../guides/)
2. Search [existing issues](https://github.com/your-repo/flowgenix/issues)
3. Join our [Discord community](https://discord.gg/flowgenix)
4. Create a [new issue](https://github.com/your-repo/flowgenix/issues/new)

Thank you for contributing to Flowgenix! 🎉
