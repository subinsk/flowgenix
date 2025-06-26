# Flowgenix Monitoring & Deployment Guide

This guide covers the advanced monitoring, logging, and deployment features of Flowgenix.

## 🔍 Monitoring Stack

### Prometheus Metrics
Flowgenix includes comprehensive Prometheus metrics for monitoring application performance:

- **HTTP Metrics**: Request rate, response time, error rate
- **Workflow Metrics**: Execution count, duration, success/failure rates
- **WebSocket Metrics**: Active connections, connection lifecycle
- **Database Metrics**: Connection pool usage
- **Document Upload Metrics**: Upload count, file sizes, success rates
- **LLM Metrics**: API request count, response times, token usage
- **Web Search Metrics**: Provider usage, response times

### Grafana Dashboards
Pre-configured dashboards provide visual insights into:
- Application performance overview
- Workflow execution trends
- Error rates and response times
- Resource utilization
- User activity patterns

**Access**: http://localhost:3001 (admin/admin)

### Available Metrics Endpoints
- Application metrics: `http://localhost:8000/metrics`
- Prometheus UI: `http://localhost:9090`
- Grafana dashboards: `http://localhost:3001`

## 📊 Logging Stack (ELK)

### Elasticsearch
Central log storage with powerful search capabilities:
- **Port**: 9200
- **Index Pattern**: `flowgenix-logs-*`
- **Retention**: Configurable (default: 30 days)

### Logstash
Log processing pipeline that:
- Collects logs from multiple sources
- Parses and enriches log data
- Forwards to Elasticsearch
- Supports JSON and text formats

### Kibana
Web interface for log analysis:
- **Port**: 5601
- **Access**: http://localhost:5601
- **Features**: Search, visualization, dashboards

### Filebeat
Log shipper that:
- Monitors log files
- Ships to Logstash
- Handles Docker container logs
- Provides reliable delivery

### Structured Logging
The backend uses structured JSON logging with:
- **Timestamp**: ISO format
- **Service**: flowgenix-backend
- **Level**: DEBUG, INFO, WARN, ERROR
- **Context**: User ID, workflow ID, etc.
- **Event Types**: http_request, workflow_execution, document_upload, etc.

## 🚀 Docker Deployment

### Quick Start
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Services Overview
| Service | Port | Purpose |
|---------|------|---------|
| Frontend | 3000 | Next.js application |
| Backend | 8000 | FastAPI server |
| PostgreSQL | 5432 | Primary database |
| ChromaDB | 8001 | Vector database |
| Redis | 6379 | Caching layer |
| Prometheus | 9090 | Metrics collection |
| Grafana | 3001 | Metrics visualization |
| Elasticsearch | 9200 | Log storage |
| Logstash | 5044 | Log processing |
| Kibana | 5601 | Log visualization |
| cAdvisor | 8080 | Container monitoring |

## ☸️ Kubernetes Deployment

### Prerequisites
- Kubernetes cluster (local or cloud)
- kubectl configured
- NGINX Ingress Controller (for ingress)

### Deployment Steps

#### Windows (PowerShell)
```powershell
# Deploy all components
.\k8s\deploy.ps1

# Cleanup deployment
.\k8s\deploy.ps1 -Cleanup
```

#### Linux/Mac (Bash)
```bash
# Make script executable
chmod +x k8s/deploy.sh

# Deploy all components
./k8s/deploy.sh
```

### Manual Deployment
```bash
# Create namespace
kubectl apply -f k8s/namespace.yaml

# Deploy storage
kubectl apply -f k8s/storage.yaml

# Deploy configuration
kubectl apply -f k8s/configmap.yaml

# Deploy databases
kubectl apply -f k8s/postgres.yaml
kubectl apply -f k8s/chromadb.yaml

# Deploy applications
kubectl apply -f k8s/backend.yaml
kubectl apply -f k8s/frontend.yaml

# Deploy monitoring
kubectl apply -f k8s/monitoring.yaml
kubectl apply -f k8s/grafana.yaml

# Create ingress
kubectl apply -f k8s/ingress.yaml
```

### Host File Configuration
Add these entries to your hosts file:
```
127.0.0.1 flowgenix.local
127.0.0.1 api.flowgenix.local
127.0.0.1 grafana.flowgenix.local
127.0.0.1 prometheus.flowgenix.local
127.0.0.1 kibana.flowgenix.local
```

### Kubernetes Resources
- **Namespace**: flowgenix
- **Deployments**: Frontend (2 replicas), Backend (2 replicas)
- **Services**: ClusterIP for internal communication
- **PVCs**: Persistent storage for databases and monitoring
- **ConfigMaps**: Configuration for all services
- **Secrets**: API keys and passwords
- **Ingress**: External access with domain routing

### Resource Requirements
| Component | CPU Request | Memory Request | CPU Limit | Memory Limit |
|-----------|-------------|----------------|-----------|--------------|
| Frontend | 100m | 256Mi | 200m | 512Mi |
| Backend | 250m | 512Mi | 500m | 1Gi |
| PostgreSQL | 100m | 256Mi | 500m | 1Gi |
| ChromaDB | 100m | 256Mi | 300m | 512Mi |

## 🔧 Configuration

### Environment Variables
Key environment variables for production:

```bash
# Backend
DATABASE_URL=postgresql://user:pass@host:5432/db
SECRET_KEY=your-super-secret-key
GEMINI_API_KEY=your-gemini-api-key
BRAVE_API_KEY=your-brave-api-key
SERPAPI_KEY=your-serpapi-key

# Logging
LOG_LEVEL=INFO
ELASTICSEARCH_HOST=elasticsearch:9200

# Monitoring
PROMETHEUS_ENABLED=true
METRICS_PORT=8000
```

### Secrets Management
For production deployment:
1. Use Kubernetes secrets for sensitive data
2. Consider external secret management (Azure Key Vault, AWS Secrets Manager)
3. Rotate secrets regularly
4. Use service accounts for authentication

## 📈 Monitoring Best Practices

### Alerts Configuration
Set up alerts for:
- High error rates (>5%)
- Slow response times (>2s average)
- Low success rates (<95%)
- Resource exhaustion (CPU >80%, Memory >90%)
- Database connection issues

### Log Retention
- **Development**: 7 days
- **Staging**: 30 days
- **Production**: 90+ days (compliance dependent)

### Performance Monitoring
Monitor these key metrics:
- Request throughput (requests/second)
- Response latency (p50, p95, p99)
- Error rate percentage
- Workflow execution time
- Database query performance

## 🛠️ Troubleshooting

### Common Issues

#### Prometheus Not Scraping Metrics
```bash
# Check if metrics endpoint is accessible
curl http://localhost:8000/metrics

# Verify Prometheus configuration
kubectl logs -n flowgenix deployment/prometheus
```

#### Logs Not Appearing in Kibana
```bash
# Check Elasticsearch health
curl http://localhost:9200/_cluster/health

# Verify Logstash is processing logs
kubectl logs -n flowgenix deployment/logstash
```

#### High Memory Usage
```bash
# Check container resource usage
kubectl top pods -n flowgenix

# Scale down if needed
kubectl scale deployment backend --replicas=1 -n flowgenix
```

### Health Checks
All services include health check endpoints:
- Backend: `GET /health`
- Database connectivity verification
- Service dependency checks

## 🔒 Security Considerations

### Network Security
- All internal communication uses cluster DNS
- External access only through ingress
- TLS termination at ingress level

### Data Security
- Secrets stored in Kubernetes secrets
- Database credentials encrypted
- API keys managed externally

### Monitoring Security
- Grafana admin credentials
- Prometheus metric exposure
- Log data sensitivity

## 📚 Additional Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Elasticsearch Guide](https://www.elastic.co/guide/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Docker Compose Reference](https://docs.docker.com/compose/)

## 🆘 Support

For issues and questions:
1. Check application logs in Kibana
2. Review metrics in Grafana
3. Examine Kubernetes events: `kubectl get events -n flowgenix`
4. Check pod status: `kubectl get pods -n flowgenix`
