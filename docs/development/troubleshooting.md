# Troubleshooting Guide

Common issues and solutions for Flowgenix development and deployment.

## Development Issues

### Frontend Issues

#### Node.js/npm Issues

**Problem**: `npm install` fails
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

**Problem**: TypeScript compilation errors
```bash
# Check TypeScript configuration
npm run type-check

# Fix common issues
- Update @types packages
- Check tsconfig.json configuration
- Verify import paths
```

**Problem**: Next.js build fails
```bash
# Clear Next.js cache
rm -rf .next

# Rebuild
npm run build

# Check for:
- Missing environment variables
- Invalid React component syntax
- Import/export issues
```

#### React/UI Issues

**Problem**: Components not rendering
- Check for JSX syntax errors
- Verify component imports/exports
- Check browser console for errors
- Ensure proper prop types

**Problem**: Tailwind CSS not working
```bash
# Verify Tailwind is installed
npm list tailwindcss

# Check tailwind.config.js
# Ensure CSS imports are correct
# Clear cache and rebuild
```

### Backend Issues

#### Python/Virtual Environment

**Problem**: Virtual environment issues
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/macOS
python3 -m venv venv
source venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt
```

**Problem**: Import errors
```python
# Check Python path
import sys
print(sys.path)

# Verify package installation
pip list

# Check for circular imports
# Verify relative imports
```

**Problem**: FastAPI server won't start
```bash
# Check port availability
netstat -ano | findstr "8000"

# Verify uvicorn installation
pip install uvicorn

# Check for syntax errors
python -m py_compile app/main.py

# Run with debug
uvicorn app.main:app --reload --log-level debug
```

#### Database Issues

**Problem**: PostgreSQL connection fails
```bash
# Check PostgreSQL service
# Windows
sc query postgresql

# Linux
systemctl status postgresql

# Verify connection string
psql "postgresql://user:password@localhost:5432/dbname"
```

**Problem**: Alembic migration issues
```bash
# Check current revision
alembic current

# Upgrade to head
alembic upgrade head

# If migrations are out of sync
alembic stamp head

# Create new migration
alembic revision --autogenerate -m "description"
```

**Problem**: ChromaDB connection issues
```bash
# Check ChromaDB service
curl http://localhost:8001/api/v1/heartbeat

# Restart ChromaDB container
docker-compose restart chromadb

# Clear ChromaDB data (development only)
docker-compose down
docker volume rm flowgenix_chromadb_data
docker-compose up -d
```

## Docker Issues

### Container Issues

**Problem**: Docker containers won't start
```bash
# Check Docker service
docker version

# Check container logs
docker-compose logs service-name

# Restart services
docker-compose restart

# Full restart
docker-compose down
docker-compose up -d
```

**Problem**: Port conflicts
```bash
# Check port usage
netstat -ano | findstr "3000"
netstat -ano | findstr "8000"
netstat -ano | findstr "5432"

# Kill process using port (Windows)
taskkill /PID <pid> /F

# Change ports in docker-compose.yml if needed
```

**Problem**: Volume mounting issues
```bash
# Check volume permissions
ls -la /path/to/volume

# Windows: Share drive in Docker Desktop
# Linux: Check SELinux context
# Fix ownership
sudo chown -R user:group /path/to/volume
```

**Problem**: Image build failures
```bash
# Clear Docker cache
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache

# Check Dockerfile syntax
# Verify base image availability
```

### Environment Issues

**Problem**: Environment variables not loading
```bash
# Check .env file exists
cat .env

# Verify docker-compose.yml env_file
# Check variable names match
# Restart containers after .env changes
```

**Problem**: API keys not working
```bash
# Verify API key format
# Check API key permissions
# Test API keys independently:

# Gemini API
curl -H "Authorization: Bearer $GEMINI_API_KEY" \
  https://generativelanguage.googleapis.com/v1/models

# Brave Search
curl -H "X-Subscription-Token: $BRAVE_API_KEY" \
  https://api.search.brave.com/res/v1/web/search?q=test
```

## Production Issues

### Performance Issues

**Problem**: Slow application response
```bash
# Check system resources
docker stats

# Monitor database performance
# Check query execution times
# Review application logs

# Optimize:
- Database indexes
- Query optimization
- Caching strategies
- Resource allocation
```

**Problem**: High memory usage
```bash
# Check memory usage
free -h
docker stats

# Solutions:
- Increase container memory limits
- Optimize database queries
- Implement response caching
- Scale horizontally
```

**Problem**: Database connection pool exhausted
```python
# Increase pool size in database.py
engine = create_engine(
    DATABASE_URL,
    pool_size=20,
    max_overflow=30
)

# Monitor connections
SELECT count(*) FROM pg_stat_activity;
```

### Security Issues

**Problem**: CORS errors
```python
# Update CORS settings in main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Update for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Problem**: JWT token issues
```bash
# Check token expiration
# Verify SECRET_KEY configuration
# Test token generation/validation

# Debug token payload
import jwt
payload = jwt.decode(token, verify=False)
print(payload)
```

### Monitoring Issues

**Problem**: Metrics not appearing in Grafana
```bash
# Check Prometheus targets
curl http://localhost:9090/api/v1/targets

# Verify metrics endpoint
curl http://localhost:8000/metrics

# Check Grafana data sources
# Verify dashboard configuration
```

**Problem**: Logs not appearing
```bash
# Check log configuration
# Verify log volume mounts
# Check log rotation settings

# Test logging
docker-compose exec backend python -c "
import logging
logging.getLogger().info('Test log message')
"
```

## API Issues

### Authentication Issues

**Problem**: 401 Unauthorized errors
```bash
# Check token format
# Verify token hasn't expired
# Test login endpoint
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password"}'
```

**Problem**: 403 Forbidden errors
```bash
# Check user permissions
# Verify resource ownership
# Check route protection logic
```

### Workflow Execution Issues

**Problem**: Workflow execution fails
```bash
# Check component configuration
# Verify workflow connections
# Check execution logs
# Test individual components

# Debug workflow data
curl -X GET http://localhost:8000/api/v1/workflows/{id} \
  -H "Authorization: Bearer <token>"
```

**Problem**: Document processing fails
```bash
# Check file format support
# Verify file size limits
# Check ChromaDB connection
# Review processing logs

# Test document upload
curl -X POST http://localhost:8000/api/v1/documents/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@test.pdf" \
  -F "workflow_id=uuid"
```

## Browser Issues

### JavaScript Errors

**Problem**: Console errors in browser
```javascript
// Check browser console (F12)
// Common issues:
- CORS errors: Check backend CORS configuration
- Network errors: Verify API endpoints
- React errors: Check component syntax
- Import errors: Verify file paths
```

**Problem**: WebSocket connection fails
```javascript
// Check WebSocket URL format
// Verify authentication token
// Check firewall/proxy settings
// Test WebSocket endpoint

// Debug WebSocket
const ws = new WebSocket('ws://localhost:8000/ws/workflow-id?token=jwt-token');
ws.onopen = () => console.log('Connected');
ws.onerror = (error) => console.error('WebSocket error:', error);
```

### UI Issues

**Problem**: Layout broken
```css
/* Check CSS classes */
/* Verify Tailwind compilation */
/* Check responsive design */
/* Test in different browsers */
```

**Problem**: Components not interactive
```javascript
// Check event handlers
// Verify state management
// Check for JavaScript errors
// Test component props
```

## Getting Help

### Before Asking for Help

1. **Check Logs**: Always check relevant logs first
2. **Search Issues**: Look for similar issues on GitHub
3. **Minimal Reproduction**: Create minimal example
4. **Environment Details**: Include OS, versions, configuration

### Where to Get Help

1. **Documentation**: Check relevant documentation sections
2. **GitHub Issues**: Search existing issues or create new one
3. **Discord Community**: Ask in our community chat
4. **Stack Overflow**: Tag questions with `flowgenix`

### Information to Include

```markdown
**Environment**
- OS: Windows 11 / macOS 13 / Ubuntu 22.04
- Node.js: 18.17.0
- Python: 3.11.5
- Docker: 24.0.6

**Steps to Reproduce**
1. Detailed steps
2. Expected behavior
3. Actual behavior

**Error Messages**
- Full error messages
- Stack traces
- Log entries

**Configuration**
- Relevant configuration files
- Environment variables (without secrets)
- Docker compose configuration
```

## Preventive Measures

### Development Best Practices

1. **Version Control**: Commit frequently with clear messages
2. **Testing**: Write tests for new features
3. **Code Review**: Review code before merging
4. **Documentation**: Keep documentation updated

### Monitoring

1. **Health Checks**: Implement comprehensive health checks
2. **Logging**: Log important events and errors
3. **Metrics**: Monitor key performance indicators
4. **Alerts**: Set up alerts for critical issues

### Backup and Recovery

1. **Database Backups**: Regular automated backups
2. **Configuration Backup**: Version control all configuration
3. **Data Recovery**: Test recovery procedures
4. **Rollback Plans**: Have rollback procedures ready

---

**Still having issues?** Join our [Discord community](https://discord.gg/flowgenix) or [create an issue](https://github.com/your-repo/flowgenix/issues) on GitHub.
