# Development Setup Guide

This guide covers setting up Flowgenix for local development on Windows, macOS, and Linux.

## Prerequisites

### Required Software
- **Node.js 18+** - [Download](https://nodejs.org/)
- **Python 3.9+** - [Download](https://python.org/)
- **PostgreSQL 14+** - [Download](https://postgresql.org/)
- **Git** - [Download](https://git-scm.com/)

### Recommended Tools
- **VS Code** - With Python and TypeScript extensions
- **Docker Desktop** - For easy database setup
- **Postman** - For API testing

## Project Structure

```
flowgenix/
├── frontend/           # Next.js React application
├── backend/           # FastAPI Python application
├── docs/             # Documentation
├── k8s/              # Kubernetes manifests
├── monitoring/       # Grafana/Prometheus configs
├── docker-compose.yml
└── .env.example
```

## Environment Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd flowgenix
```

### 2. Environment Variables

```bash
cp .env.example .env
```

Edit `.env` file:

```env
# Database
POSTGRES_DB=flowgenix_dev
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/flowgenix_dev

# Backend
SECRET_KEY=your-super-secret-development-key
GEMINI_API_KEY=your-gemini-api-key
BRAVE_API_KEY=your-brave-api-key  # Optional
SERPAPI_KEY=your-serpapi-key      # Optional

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000

# Development
DEBUG=true
```

## Database Setup

### Option 1: Docker (Recommended)

```bash
# Start only database services
docker-compose up -d db chromadb
```

### Option 2: Local PostgreSQL

1. Install PostgreSQL locally
2. Create database:
   ```sql
   CREATE DATABASE flowgenix_dev;
   CREATE USER flowgenix WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE flowgenix_dev TO flowgenix;
   ```

## Backend Development Setup

### 1. Create Virtual Environment

```bash
cd backend

# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Database Migration

```bash
# Initialize Alembic (if not done)
alembic init alembic

# Create migration
alembic revision --autogenerate -m "Initial migration"

# Apply migration
alembic upgrade head
```

### 4. Run Development Server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Backend will be available at:** http://localhost:8000
**API Documentation:** http://localhost:8000/docs

## Frontend Development Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

**Frontend will be available at:** http://localhost:3000

## Development Workflow

### 1. Feature Development

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes...

# Commit changes
git add .
git commit -m "feat: add your feature description"

# Push branch
git push origin feature/your-feature-name
```

### 2. Backend Changes

When modifying backend models:

```bash
# Generate migration
alembic revision --autogenerate -m "Description of changes"

# Apply migration
alembic upgrade head
```

### 3. Frontend Changes

When adding new components:

```bash
# Install new dependencies
npm install package-name

# Update types if needed
npm run type-check
```

## Testing

### Backend Tests

```bash
cd backend

# Install test dependencies
pip install pytest pytest-asyncio

# Run tests
pytest

# Run with coverage
pytest --cov=app
```

### Frontend Tests

```bash
cd frontend

# Run unit tests
npm test

# Run E2E tests
npm run test:e2e

# Run type checking
npm run type-check
```

## Development Tools

### VS Code Configuration

Create `.vscode/settings.json`:

```json
{
  "python.defaultInterpreterPath": "./backend/venv/bin/python",
  "python.testing.pytestEnabled": true,
  "python.testing.pytestPath": "pytest",
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

### Pre-commit Hooks

```bash
# Install pre-commit
pip install pre-commit

# Setup hooks
pre-commit install

# Run on all files
pre-commit run --all-files
```

## Common Development Tasks

### Adding a New API Endpoint

1. **Create route in `backend/app/api/v1/`**:
   ```python
   @router.get("/new-endpoint")
   async def new_endpoint():
       return {"message": "Hello World"}
   ```

2. **Add to main router in `backend/app/api/v1/__init__.py`**

3. **Create frontend service function**:
   ```typescript
   export const callNewEndpoint = async () => {
     return api.get('/new-endpoint');
   };
   ```

### Adding a New React Component

1. **Create component file**:
   ```typescript
   // frontend/src/components/NewComponent.tsx
   export function NewComponent() {
     return <div>New Component</div>;
   }
   ```

2. **Add to component exports**:
   ```typescript
   // frontend/src/components/index.ts
   export { NewComponent } from './NewComponent';
   ```

### Database Schema Changes

1. **Modify models in `backend/app/models/`**
2. **Generate migration**:
   ```bash
   alembic revision --autogenerate -m "Description"
   ```
3. **Review and edit migration if needed**
4. **Apply migration**:
   ```bash
   alembic upgrade head
   ```

## Debugging

### Backend Debugging

1. **Add breakpoints in VS Code**
2. **Use Python debugger**:
   ```python
   import pdb; pdb.set_trace()
   ```
3. **Check logs**:
   ```bash
   tail -f logs/app.log
   ```

### Frontend Debugging

1. **Browser DevTools** - Network, Console, React DevTools
2. **VS Code Debugger** - With browser debugging
3. **Console logging**:
   ```typescript
   console.log('Debug info:', data);
   ```

## Performance Monitoring

### Backend Performance

```python
# Add timing decorators
import time
from functools import wraps

def timing_decorator(func):
    @wraps(func)
    async def wrapper(*args, **kwargs):
        start = time.time()
        result = await func(*args, **kwargs)
        print(f"{func.__name__} took {time.time() - start:.2f} seconds")
        return result
    return wrapper
```

### Frontend Performance

```bash
# Bundle analysis
npm run build
npm run analyze

# Lighthouse audit
npm run lighthouse
```

## Environment-Specific Configurations

### Development

- Debug mode enabled
- Hot reloading
- Detailed error messages
- Auto-reload on file changes

### Testing

- Test database
- Mock external APIs
- Fast test execution
- Coverage reporting

### Production

- Optimized builds
- Error logging
- Performance monitoring
- Security headers

## Troubleshooting

### Common Issues

**Port already in use:**
```bash
# Find process using port
netstat -ano | findstr "8000"
# Kill process (Windows)
taskkill /PID <pid> /F
```

**Database connection issues:**
```bash
# Check PostgreSQL status
pg_ctl status

# Restart PostgreSQL
sudo service postgresql restart
```

**Node modules issues:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Python environment issues:**
```bash
# Recreate virtual environment
rm -rf venv
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
```

## Next Steps

- [Contributing Guide](contributing.md)
- [API Reference](../guides/api-reference.md)
- [Deployment Guide](../deployment/docker.md)
- [Troubleshooting](troubleshooting.md)
