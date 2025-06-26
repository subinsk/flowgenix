# Flowgenix - No-Code Workflow Builder

A full-stack, AI-powered no-code workflow builder that enables users to visually create, configure, and interact with intelligent workflows.

## 🌟 Features

### Core Features
- **Visual Workflow Builder**: Drag-and-drop interface using React Flow
- **AI Integration**: Gemini API for LLM interactions and embeddings
- **Document Processing**: Upload and extract text from PDFs, TXT, DOCX files
- **Vector Search**: ChromaDB for semantic document search
- **Web Search**: Pluggable web search (Brave Search & SerpAPI)
- **Real-time Chat**: Interactive chat interface with workflow context
- **User Authentication**: JWT-based authentication system
- **Workflow Persistence**: Save and load workflows with PostgreSQL
- **Real-time Execution**: WebSocket-based progress tracking
- **Enterprise Monitoring**: Prometheus metrics and Grafana dashboards
- **Centralized Logging**: ELK Stack for structured log management
- **Production Deployment**: Kubernetes manifests and Docker containers

### Technical Stack
- **Frontend**: Next.js 14, TypeScript, React Flow, Tailwind CSS, shadcn/ui
- **Backend**: FastAPI, Python 3.9+, WebSockets
- **Database**: PostgreSQL, ChromaDB for vectors
- **AI**: Google Gemini API
- **Authentication**: JWT tokens, bcrypt password hashing
- **Monitoring**: Prometheus, Grafana, ELK Stack
- **Deployment**: Docker, Docker Compose, Kubernetes

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local frontend development)
- Python 3.9+ (for local backend development)

### Docker Setup (Recommended)

1. Clone the repository:
```bash
git clone <repository-url>
cd flowgenix
```

2. Create environment variables:
```bash
cp .env.example .env
# Edit .env with your API keys
```

3. Start all services:
```bash
docker-compose up -d
```

4. Access the application:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Grafana Monitoring**: http://localhost:3001 (admin/admin)
- **Prometheus Metrics**: http://localhost:9090
- **Kibana Logs**: http://localhost:5601

### Local Development Setup

#### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 📁 Project Structure

```
flowgenix/
├── frontend/                 # Next.js frontend
│   ├── src/
│   │   ├── app/             # Next.js App Router pages
│   │   ├── components/      # React components
│   │   ├── services/        # API service layers
│   │   ├── contexts/        # React contexts
│   │   └── lib/            # Utilities
│   ├── package.json
│   └── Dockerfile
├── backend/                 # FastAPI backend
│   ├── main.py             # FastAPI app entry point
│   ├── models.py           # SQLAlchemy models
│   ├── database.py         # Database configuration
│   ├── workflow.py         # Workflow execution engine
│   ├── vector.py           # Vector operations
│   ├── execution_engine.py # Real-time execution
│   ├── metrics.py          # Prometheus metrics
│   ├── logging_config.py   # Structured logging
│   ├── requirements.txt
│   └── Dockerfile
├── k8s/                    # Kubernetes manifests
├── monitoring/             # Monitoring configuration
├── logging/               # Logging configuration
├── database/              # Database initialization
├── docker-compose.yml     # Docker composition
├── MONITORING.md          # Monitoring guide
├── DEMO_SCRIPT.md         # Demo walkthrough
└── README.md
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database
POSTGRES_DB=flowgenix
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/flowgenix

# Backend
SECRET_KEY=your-secret-key-here
GEMINI_API_KEY=your-gemini-api-key
BRAVE_API_KEY=your-brave-search-api-key
SERPAPI_KEY=your-serpapi-key

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### API Keys Required
- **Gemini API**: Get from [Google AI Studio](https://makersuite.google.com/app/apikey)
- **Brave Search API**: Get from [Brave Search API](https://api.search.brave.com/)
- **SerpAPI**: Get from [SerpAPI](https://serpapi.com/)

## 🏗️ Architecture

### Frontend Architecture
- **React Flow**: Visual workflow builder
- **Context API**: State management for authentication
- **Service Layer**: API abstractions for backend communication
- **shadcn/ui**: Component library with custom theming

### Backend Architecture
- **FastAPI**: High-performance async API framework
- **SQLAlchemy**: ORM for PostgreSQL operations
- **ChromaDB**: Vector database for embeddings
- **Pydantic**: Data validation and serialization

### Workflow Execution Engine
1. **Component Validation**: Ensure all required components are connected
2. **Execution Graph**: Build execution order from workflow connections
3. **Context Passing**: Maintain state between workflow components
4. **Error Handling**: Graceful failure handling and recovery

## 🎨 Design System

The application uses a custom color palette extracted from design assets:

- **Prussian Blue** (#003144): Primary background
- **Peach Yellow** (#FEDE99): Primary text and highlights
- **Sea Green** (#42934D): Accent color for buttons and actions
- **Paynes Gray** (#476475): Secondary elements
- **Light Cyan** (#D9F4FE): Input backgrounds
- **Gunmetal** (#042836): Card backgrounds

## 🧪 Development Workflow

### Adding New Components
1. Create component in `frontend/src/components/`
2. Add to component library in `ComponentLibraryPanel.tsx`
3. Implement execution logic in `backend/workflow.py`
4. Update workflow validation rules

### Database Migrations
```bash
# In backend directory
alembic init alembic
alembic revision --autogenerate -m "Your migration message"
alembic upgrade head
```

### Testing
```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

## 📊 Monitoring and Logging

### Planned Features
- Prometheus metrics collection
- Grafana dashboards
- ELK stack for centralized logging
- Real-time execution progress tracking

## 🚀 Deployment

### Production Deployment
1. Configure production environment variables
2. Build and deploy with Docker Compose
3. Set up reverse proxy (nginx)
4. Configure SSL certificates

### Kubernetes Deployment

For production deployment with Kubernetes:

#### Windows (PowerShell)
```powershell
# Deploy to Kubernetes
.\k8s\deploy.ps1

# Cleanup deployment
.\k8s\deploy.ps1 -Cleanup
```

#### Linux/Mac (Bash)
```bash
# Deploy to Kubernetes
chmod +x k8s/deploy.sh
./k8s/deploy.sh
```

**Access URLs** (add to `/etc/hosts` or `C:\Windows\System32\drivers\etc\hosts`):
```
127.0.0.1 flowgenix.local
127.0.0.1 api.flowgenix.local
127.0.0.1 grafana.flowgenix.local
127.0.0.1 prometheus.flowgenix.local
127.0.0.1 kibana.flowgenix.local
```

See [MONITORING.md](MONITORING.md) for detailed monitoring and deployment guide.

## 📚 Documentation

- **[MONITORING.md](MONITORING.md)** - Complete monitoring and deployment guide
- **[DEMO_SCRIPT.md](DEMO_SCRIPT.md)** - Demo walkthrough and video script
- **[START.md](START.md)** - Quick start development guide
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture overview
- **[ARCHITECTURE_DIAGRAM.md](ARCHITECTURE_DIAGRAM.md)** - Detailed architecture diagram
- **[roadmap.md](roadmap.md)** - Project roadmap and progress tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation at `/docs` endpoint
- Review the API documentation at `/docs` when running locally

## 🗺️ Roadmap

- [x] Core workflow builder functionality
- [x] User authentication system
- [x] Document processing and vector search
- [x] AI integration with Gemini API
- [x] Web search integration
- [x] Real-time execution progress tracking
- [x] Advanced monitoring with Prometheus and Grafana
- [x] Centralized logging with ELK Stack
- [x] Kubernetes deployment manifests
- [x] Production-ready Docker containers
- [ ] Video demo and documentation
- [ ] Workflow templates and marketplace
- [ ] Collaborative editing
- [ ] Advanced AI model support

## 🎬 Demo

See [DEMO_SCRIPT.md](DEMO_SCRIPT.md) for a complete demo walkthrough showcasing all features.

---

Built with ❤️ using Next.js, FastAPI, and modern web technologies.
