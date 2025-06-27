# Getting Started with Flowgenix

This guide will help you set up Flowgenix and create your first AI-powered workflow.

## Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- Python 3.9+ (for local development)

## Quick Setup

### 1. Clone and Setup

```bash
git clone <repository-url>
cd flowgenix
cp .env.example .env
```

### 2. Configure Environment Variables

Edit the `.env` file with your API keys:

```env
# Required
GEMINI_API_KEY=your-gemini-api-key-here

# Optional (for web search features)
BRAVE_API_KEY=your-brave-search-api-key
SERPAPI_KEY=your-serpapi-key

# Database (already configured for Docker)
POSTGRES_DB=flowgenix
POSTGRES_USER=postgres
POSTGRES_PASSWORD=flowgenix_password
DATABASE_URL=postgresql://postgres:flowgenix_password@db:5432/flowgenix

# Security
SECRET_KEY=your-secret-key-here
```

#### Getting API Keys

- **Gemini API**: Get from [Google AI Studio](https://makersuite.google.com/app/apikey)
- **Brave Search API**: Get from [Brave Search API](https://api.search.brave.com/)
- **SerpAPI**: Get from [SerpAPI](https://serpapi.com/)

### 3. Start Services

```bash
docker-compose up -d
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Monitoring Dashboard**: http://localhost:3001 (admin/admin)

## Creating Your First Workflow

### 1. Register an Account

1. Open http://localhost:3000
2. Click "Sign Up" and create an account
3. Log in with your credentials

### 2. Build a Simple Document Analysis Workflow

1. **Drag Components**: From the left panel, drag these components to the canvas:
   - User Query (starting point)
   - Knowledge Base (for document upload)
   - LLM Engine (for AI processing)
   - Output (endpoint)

2. **Connect Components**: Click and drag from output ports to input ports to connect:
   ```
   User Query → LLM Engine → Output
   Knowledge Base → LLM Engine
   ```

3. **Configure Components**:
   - **Knowledge Base**: Upload a PDF or text document
   - **LLM Engine**: Select "Gemini Pro" model
   - Leave other settings as default

4. **Save Workflow**: Click "Save Workflow" and give it a name

### 3. Test Your Workflow

1. Click "Chat with Stack" to open the chat interface
2. Ask a question about your uploaded document
3. Watch as the AI processes your query and provides answers based on the document content

## Advanced Workflows

### Research Workflow with Web Search

Create a workflow that combines web search with AI analysis:

```
User Query → Web Search → LLM Engine → Output
```

1. Add a **Web Search** component
2. Configure it to use Brave Search or SerpAPI
3. Connect: User Query → Web Search → LLM Engine → Output
4. Ask questions that require current information

### Multi-Document Analysis

Create a workflow for analyzing multiple documents:

```
User Query → Knowledge Base (multiple docs) → LLM Engine → Output
```

1. Upload multiple documents to the Knowledge Base
2. The system will create embeddings for all documents
3. Ask comparative questions across documents

## Common Issues

### Docker Issues

**Problem**: Services won't start
```bash
# Check logs
docker-compose logs

# Restart services
docker-compose down
docker-compose up -d
```

**Problem**: Port conflicts
```bash
# Check what's using the ports
netstat -ano | findstr "3000\|8000\|5432"

# Change ports in docker-compose.yml if needed
```

### API Key Issues

**Problem**: Gemini API errors
- Verify your API key is correct
- Check if you have quota remaining
- Ensure the API key has proper permissions

**Problem**: Web search not working
- Brave Search and SerpAPI are optional
- Workflows will work without them
- Check API key validity if enabled

## Next Steps

- [User Guide](user-guide.md) - Learn all features in detail
- [Architecture](architecture.md) - Understand how Flowgenix works
- [Development Setup](../development/setup.md) - Set up for local development
- [Deployment Guide](../deployment/docker.md) - Deploy to production

## Support

- Check the [troubleshooting section](../development/troubleshooting.md)
- Open an issue on GitHub
- Join our Discord community
