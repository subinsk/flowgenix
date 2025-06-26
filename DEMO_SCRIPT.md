# Flowgenix Demo Script

This script provides a comprehensive walkthrough of Flowgenix features for demonstration purposes.

## 🎬 Demo Overview

This demo showcases a complete no-code/low-code workflow builder with AI integration, real-time execution, and enterprise-grade monitoring.

### Demo Duration: ~15-20 minutes

---

## 🎯 Demo Script

### 1. Introduction (2 minutes)

**"Welcome to Flowgenix - a comprehensive no-code workflow builder with AI integration."**

- **Show Architecture**: Open `ARCHITECTURE_DIAGRAM.md`
- **Highlight Key Features**:
  - Visual workflow builder with drag-and-drop
  - AI integration (Gemini API)
  - Real-time execution with WebSockets
  - Enterprise monitoring and logging
  - Kubernetes-ready deployment

### 2. Environment Setup (2 minutes)

**"Let's start by launching the complete Flowgenix stack."**

```bash
# Start all services
docker-compose up -d

# Show running services
docker-compose ps
```

**Services Overview**:
- Frontend (Next.js): http://localhost:3000
- Backend (FastAPI): http://localhost:8000
- Grafana Monitoring: http://localhost:3001
- Prometheus Metrics: http://localhost:9090
- Kibana Logs: http://localhost:5601

### 3. User Authentication (1 minute)

**"First, let's create a user account and log in."**

1. Navigate to http://localhost:3000
2. Click "Sign Up"
3. Create account: `demo@flowgenix.com` / `demo123`
4. Log in with credentials
5. **Show**: Protected routes, JWT token handling

### 4. Visual Workflow Builder (4 minutes)

**"Now let's build a workflow using the visual drag-and-drop interface."**

#### Step 1: Add Components
1. **User Query**: Drag from component library
2. **Knowledge Base**: Add document upload component
3. **Web Search**: Configure Brave/SerpAPI toggle
4. **LLM Engine**: Add AI processing component
5. **Output**: Final result component

#### Step 2: Connect Components
1. Draw connections between components
2. **Show**: Validation indicators
3. **Show**: Component configuration panels
4. **Show**: Real-time workflow validation

#### Step 3: Configure Components
1. **User Query**: Set input parameters
2. **Knowledge Base**: Configure document types
3. **Web Search**: Switch between providers
4. **LLM Engine**: Set model parameters
5. **Output**: Configure result format

### 5. Document Upload & Processing (2 minutes)

**"Let's upload a document for knowledge base integration."**

1. Click on Knowledge Base component
2. Upload a PDF document
3. **Show**: File processing progress
4. **Show**: Text extraction with PyMuPDF
5. **Show**: Vector embedding generation
6. **Show**: ChromaDB storage

### 6. Workflow Execution (3 minutes)

**"Now let's execute our workflow with real-time monitoring."**

#### Step 1: Build Workflow
1. Click "Build Stack"
2. **Show**: Validation results
3. **Show**: Build status indicators

#### Step 2: Start Execution
1. Enter query: "What are the key insights from the uploaded document?"
2. Click "Chat with Stack"
3. **Show**: Real-time execution progress modal
4. **Show**: WebSocket connection status
5. **Show**: Step-by-step execution logs

#### Step 3: View Results
1. **Show**: AI-generated response
2. **Show**: Source document references
3. **Show**: Web search integration
4. **Show**: Chat history persistence

### 7. Monitoring & Observability (3 minutes)

**"Let's examine the enterprise-grade monitoring capabilities."**

#### Grafana Dashboards
1. Open http://localhost:3001 (admin/admin)
2. **Show**: Flowgenix Application Metrics dashboard
3. **Show**: HTTP request metrics
4. **Show**: Workflow execution statistics
5. **Show**: WebSocket connection monitoring
6. **Show**: Error rate tracking

#### Prometheus Metrics
1. Open http://localhost:9090
2. **Show**: Raw metrics collection
3. **Show**: Query examples:
   - `rate(http_requests_total[5m])`
   - `workflow_executions_total`
   - `websocket_connections_active`

#### Structured Logging
1. Open http://localhost:5601
2. **Show**: Elasticsearch index patterns
3. **Show**: Kibana log exploration
4. **Show**: JSON structured logs
5. **Show**: Log filtering and search

### 8. Advanced Features (2 minutes)

**"Let's explore the advanced enterprise features."**

#### Workflow Management
1. **Show**: Save workflow functionality
2. **Show**: Load saved workflows
3. **Show**: Workflow versioning
4. **Show**: Export/import capabilities

#### API Integration
1. **Show**: RESTful API endpoints
2. **Show**: WebSocket real-time API
3. **Show**: Authentication with JWT
4. **Show**: API documentation (FastAPI auto-docs)

#### Multi-Provider Support
1. **Show**: Web search provider switching
2. **Show**: Brave Search integration
3. **Show**: SerpAPI integration
4. **Show**: Runtime provider selection

### 9. Production Deployment (1 minute)

**"For production deployment, Flowgenix includes Kubernetes manifests."**

```bash
# Show Kubernetes manifests
ls k8s/

# Deployment script
cat k8s/deploy.ps1
```

**Highlights**:
- Auto-scaling deployment
- Health checks and probes
- Persistent volume claims
- Ingress configuration
- Service mesh ready
- Resource limits and requests

### 10. Demo Wrap-up (1 minute)

**"Flowgenix provides a complete solution for AI-powered workflow automation."**

#### Key Achievements Demonstrated:
✅ **Visual Workflow Builder**: Drag-and-drop interface
✅ **AI Integration**: Gemini API with embeddings
✅ **Real-time Execution**: WebSocket-based progress
✅ **Document Processing**: PDF upload and vector search
✅ **Web Search Integration**: Multiple provider support
✅ **Enterprise Monitoring**: Prometheus + Grafana
✅ **Centralized Logging**: ELK Stack
✅ **Production Ready**: Kubernetes deployment
✅ **Security**: JWT authentication, protected routes
✅ **Scalability**: Microservices architecture

---

## 🎥 Video Recording Tips

### Pre-Recording Checklist
- [ ] Clear browser cache and cookies
- [ ] Prepare sample documents for upload
- [ ] Reset database to clean state
- [ ] Verify all services are running
- [ ] Test workflow execution flow
- [ ] Prepare demo account credentials

### Recording Setup
- **Resolution**: 1920x1080 (Full HD)
- **Frame Rate**: 30 FPS
- **Audio**: Clear narration with demo script
- **Screen**: Clean desktop, close unnecessary applications
- **Browser**: Use Chrome/Edge for best compatibility

### Recording Segments
1. **Introduction** (0:00-2:00)
2. **Setup & Authentication** (2:00-4:00)
3. **Workflow Building** (4:00-8:00)
4. **Execution & Results** (8:00-11:00)
5. **Monitoring Dashboard** (11:00-14:00)
6. **Production Features** (14:00-16:00)
7. **Conclusion** (16:00-17:00)

### Post-Production
- Add title cards for each section
- Highlight key features with annotations
- Include URL overlays for important endpoints
- Add conclusion slide with key benefits

---

## 🎬 Alternative Demo Scenarios

### Scenario A: Technical Deep-Dive
Focus on architecture, APIs, and technical implementation details.

### Scenario B: Business Use Cases
Demonstrate practical business workflows and ROI scenarios.

### Scenario C: DevOps Focus
Emphasize monitoring, logging, deployment, and operational aspects.

---

## 📋 Demo Troubleshooting

### Common Issues
1. **Services not starting**: Check Docker daemon and port conflicts
2. **Slow response**: Ensure adequate system resources
3. **Authentication issues**: Clear browser storage
4. **WebSocket connection**: Check firewall and proxy settings
5. **File upload fails**: Verify backend storage permissions

### Quick Fixes
```bash
# Restart services
docker-compose restart

# Check service logs
docker-compose logs backend

# Reset database
docker-compose down -v
docker-compose up -d
```

---

## 🌟 Demo Success Metrics

A successful demo should showcase:
- **Ease of Use**: Non-technical users can build workflows
- **Performance**: Sub-second response times
- **Reliability**: Error-free execution during demo
- **Scalability**: Production-ready deployment options
- **Observability**: Comprehensive monitoring and logging
- **Integration**: Seamless AI and web search capabilities

---

*"Thank you for watching the Flowgenix demonstration. This platform represents the future of no-code AI workflow automation."*
