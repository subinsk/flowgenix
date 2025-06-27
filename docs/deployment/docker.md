# Docker Deployment Guide

This guide covers deploying Flowgenix using Docker and Docker Compose for development, staging, and production environments.

## Quick Deployment

### Prerequisites
- Docker 20.10+
- Docker Compose 2.0+
- At least 4GB RAM available

### One-Command Deployment

```bash
git clone <repository-url>
cd flowgenix
cp .env.example .env
# Edit .env with your API keys
docker-compose up -d
```

Access your application:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/docs
- **Monitoring**: http://localhost:3001 (admin/admin)

## Environment Configuration

### Required Environment Variables

Edit your `.env` file:

```env
# API Keys (Required)
GEMINI_API_KEY=your-gemini-api-key-here

# Optional API Keys
BRAVE_API_KEY=your-brave-search-api-key
SERPAPI_KEY=your-serpapi-key

# Database Configuration
POSTGRES_DB=flowgenix
POSTGRES_USER=postgres
POSTGRES_PASSWORD=secure-production-password
DATABASE_URL=postgresql://postgres:secure-production-password@db:5432/flowgenix

# Security
SECRET_KEY=your-super-secret-production-key-change-this

# Application
NEXT_PUBLIC_API_URL=http://localhost:8000
NODE_ENV=production
```

### Security Considerations

**For Production:**
1. **Change default passwords**
2. **Use strong SECRET_KEY** (generate with `openssl rand -hex 32`)
3. **Set proper CORS origins**
4. **Use environment-specific database credentials**

## Docker Compose Configuration

### Development Setup

```yaml
# docker-compose.yml
version: '3.8'

services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000
    depends_on:
      - backend

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - SECRET_KEY=${SECRET_KEY}
    depends_on:
      - db
      - chromadb
    volumes:
      - ./uploads:/app/uploads

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=${POSTGRES_DB}
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  chromadb:
    image: chromadb/chroma:latest
    ports:
      - "8001:8000"
    volumes:
      - chromadb_data:/chroma/chroma

volumes:
  postgres_data:
  chromadb_data:
```

### Production Setup

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    restart: unless-stopped
    environment:
      - NODE_ENV=production

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    restart: unless-stopped
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - SECRET_KEY=${SECRET_KEY}
      - ENVIRONMENT=production
    volumes:
      - ./uploads:/app/uploads
      - ./logs:/app/logs

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend
    restart: unless-stopped

  db:
    image: postgres:15
    restart: unless-stopped
    environment:
      - POSTGRES_DB=${POSTGRES_DB}
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    # Don't expose port in production

  chromadb:
    image: chromadb/chroma:latest
    restart: unless-stopped
    volumes:
      - chromadb_data:/chroma/chroma
    # Don't expose port in production
```

## Dockerfile Optimization

### Frontend Dockerfile

```dockerfile
# frontend/Dockerfile.prod
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

### Backend Dockerfile

```dockerfile
# backend/Dockerfile.prod
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Create non-root user
RUN adduser --disabled-password --gecos '' appuser
RUN chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## Nginx Configuration

### Production Nginx Setup

```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream frontend {
        server frontend:3000;
    }

    upstream backend {
        server backend:8000;
    }

    server {
        listen 80;
        server_name your-domain.com;

        # Redirect HTTP to HTTPS
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name your-domain.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Backend API
        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # WebSocket support
        location /ws {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
        }
    }
}
```

## SSL/TLS Setup

### Using Let's Encrypt

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal crontab
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
```

### Using Custom Certificates

```bash
# Create SSL directory
mkdir -p ssl

# Copy your certificates
cp your-cert.pem ssl/cert.pem
cp your-key.pem ssl/key.pem

# Set proper permissions
chmod 600 ssl/key.pem
chmod 644 ssl/cert.pem
```

## Monitoring Setup

### Enable Monitoring Stack

```yaml
# Add to docker-compose.yml
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD:-admin}
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana:/etc/grafana/provisioning

volumes:
  prometheus_data:
  grafana_data:
```

## Backup and Recovery

### Database Backup

```bash
# Create backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec db pg_dump -U postgres flowgenix > backup_$DATE.sql

# Automated daily backups
echo "0 2 * * * /path/to/backup-script.sh" | crontab -
```

### Volume Backup

```bash
# Backup all volumes
docker run --rm -v flowgenix_postgres_data:/data -v $(pwd):/backup \
  alpine tar czf /backup/postgres_backup.tar.gz -C /data .

docker run --rm -v flowgenix_chromadb_data:/data -v $(pwd):/backup \
  alpine tar czf /backup/chromadb_backup.tar.gz -C /data .
```

### Restore Process

```bash
# Stop services
docker-compose down

# Restore volumes
docker run --rm -v flowgenix_postgres_data:/data -v $(pwd):/backup \
  alpine tar xzf /backup/postgres_backup.tar.gz -C /data

# Start services
docker-compose up -d
```

## Performance Optimization

### Resource Limits

```yaml
# Add to services in docker-compose.yml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M

  frontend:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
```

### Health Checks

```yaml
# Add health checks
services:
  backend:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  frontend:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3
```

## Deployment Commands

### Development

```bash
# Start development environment
docker-compose up -d

# View logs
docker-compose logs -f

# Update images
docker-compose pull
docker-compose up -d
```

### Production

```bash
# Deploy to production
docker-compose -f docker-compose.prod.yml up -d

# Rolling update
docker-compose -f docker-compose.prod.yml up -d --no-deps backend
docker-compose -f docker-compose.prod.yml up -d --no-deps frontend

# Scale services
docker-compose -f docker-compose.prod.yml up -d --scale backend=3
```

### Maintenance

```bash
# Clean up unused images
docker system prune -a

# Update and restart
docker-compose pull
docker-compose up -d

# Database migration
docker-compose exec backend alembic upgrade head
```

## Troubleshooting

### Common Issues

**Services won't start:**
```bash
# Check logs
docker-compose logs service-name

# Check resource usage
docker stats

# Restart specific service
docker-compose restart service-name
```

**Database connection issues:**
```bash
# Check database logs
docker-compose logs db

# Test connection
docker-compose exec backend python -c "from app.database import engine; print(engine.url)"
```

**Performance issues:**
```bash
# Monitor resource usage
docker stats

# Check disk space
df -h

# Optimize images
docker system prune -a
```

## Security Best Practices

1. **Use non-root users in containers**
2. **Scan images for vulnerabilities**
3. **Keep base images updated**
4. **Use secrets management**
5. **Enable container logging**
6. **Implement proper network isolation**
7. **Regular security updates**

## Next Steps

- [Kubernetes Deployment](kubernetes.md)
- [Monitoring Guide](monitoring.md)
- [Security Guide](../guides/security.md)
- [Backup Strategies](backup.md)
