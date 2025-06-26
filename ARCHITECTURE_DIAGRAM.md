# Flowgenix Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                  FLOWGENIX                                      │
│                         No-Code/Low-Code Workflow Builder                      │
└─────────────────────────────────────────────────────────────────────────────────┘

## Frontend (Next.js TypeScript + App Router)
┌─────────────────────────────────────────────────────────────────────────────────┐
│  CLIENT LAYER                                                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                │
│  │   Auth Context  │  │  API Services   │  │  UI Components  │                │
│  │   ─────────────  │  │  ─────────────  │  │  ─────────────  │                │
│  │ • JWT Tokens    │  │ • HTTP Client   │  │ • React Flow    │                │
│  │ • User State    │  │ • Auth Service  │  │ • shadcn/ui     │                │
│  │ • Protected     │  │ • Workflow API  │  │ • Custom Theme  │                │
│  │   Routes        │  │ • Chat API      │  │ • WebSocket     │                │
│  │                 │  │ • Document API  │  │   Progress      │                │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────────┤
│  │                          MAIN APPLICATION                                   │
│  │  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐  │
│  │  │ Component     │ │ Workflow      │ │ Execution     │ │ Chat          │  │
│  │  │ Library       │ │ Canvas        │ │ Progress      │ │ Interface     │  │
│  │  │ ─────────     │ │ ─────────     │ │ ─────────     │ │ ─────────     │  │
│  │  │ • UserQuery   │ │ • React Flow  │ │ • Real-time   │ │ • Messages    │  │
│  │  │ • Knowledge   │ │ • Drag & Drop │ │ • WebSocket   │ │ • History     │  │
│  │  │   Base        │ │ • Validation  │ │ • Progress    │ │ • Real-time   │  │
│  │  │ • LLM Engine  │ │ • Visual      │ │   Bar         │ │   Updates     │  │
│  │  │ • Web Search  │ │   Builder     │ │ • Event Log   │ │ • Search      │  │
│  │  │ • Output      │ │               │ │               │ │   Provider    │  │
│  │  └───────────────┘ └───────────────┘ └───────────────┘ └───────────────┘  │
│  └─────────────────────────────────────────────────────────────────────────────┤
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                  HTTP/WebSocket
                                        │
## Backend (FastAPI Python)
┌─────────────────────────────────────────────────────────────────────────────────┐
│  API LAYER                                                                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                │
│  │ Authentication  │  │   API Routes    │  │ WebSocket       │                │
│  │ ─────────────   │  │ ─────────────   │  │ Manager         │                │
│  │ • JWT Tokens    │  │ • Auth Routes   │  │ ─────────────   │                │
│  │ • Bcrypt Hash   │  │ • Workflow API  │  │ • Real-time     │                │
│  │ • User Mgmt     │  │ • Chat API      │  │   Progress      │                │
│  │ • Middleware    │  │ • Document API  │  │ • Execution     │                │
│  │                 │  │ • Execution API │  │   Events        │                │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────────┤
│  │                        BUSINESS LOGIC                                      │
│  │  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐  │
│  │  │ Execution     │ │ Workflow      │ │ Vector        │ │ Document      │  │
│  │  │ Engine        │ │ Orchestrator  │ │ Search        │ │ Processing    │  │
│  │  │ ─────────     │ │ ─────────     │ │ ─────────     │ │ ─────────     │  │
│  │  │ • Async Task  │ │ • Node Exec   │ │ • Embeddings  │ │ • PyMuPDF     │  │
│  │  │ • Progress    │ │ • Dependency  │ │ • ChromaDB    │ │ • Text        │  │
│  │  │   Tracking    │ │   Resolution  │ │ • Similarity  │ │   Extraction  │  │
│  │  │ • Event       │ │ • Error       │ │   Search      │ │ • File        │  │
│  │  │   Emission    │ │   Handling    │ │ • Gemini API  │ │   Upload      │  │
│  │  │ • Cancellation│ │ • Context     │ │               │ │               │  │
│  │  │               │ │   Passing     │ │               │ │               │  │
│  │  └───────────────┘ └───────────────┘ └───────────────┘ └───────────────┘  │
│  └─────────────────────────────────────────────────────────────────────────────┤
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                   SQL/HTTP
                                        │
## Data Layer
┌─────────────────────────────────────────────────────────────────────────────────┐
│  DATABASE LAYER                                                                │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                │
│  │  PostgreSQL     │  │    ChromaDB     │  │  External APIs  │                │
│  │  ─────────────  │  │  ─────────────  │  │  ─────────────  │                │
│  │ • Users         │  │ • Vector Store  │  │ • Gemini API    │                │
│  │ • Workflows     │  │ • Embeddings    │  │   - LLM         │                │
│  │ • Executions    │  │ • Documents     │  │   - Embeddings  │                │
│  │ • Chat Sessions │  │ • Similarity    │  │ • Brave Search  │                │
│  │ • Chat Messages │  │   Search        │  │ • SerpAPI       │                │
│  │ • Execution     │  │ • Collections   │  │ • Web Search    │                │
│  │   Logs          │  │                 │  │   Providers     │                │
│  │ • Documents     │  │                 │  │                 │                │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                │
└─────────────────────────────────────────────────────────────────────────────────┘

## Key Features

### 🎨 Visual Workflow Builder
- Drag-and-drop interface with React Flow
- Component library (User Query, Knowledge Base, LLM Engine, Web Search, Output)
- Real-time workflow validation
- Visual connection management

### 🔐 Authentication & Authorization
- JWT-based authentication
- Protected routes
- User registration and login
- Session management

### ⚡ Real-time Execution
- Asynchronous workflow execution
- WebSocket-based progress tracking
- Real-time event streaming
- Execution logs and monitoring

### 💾 Data Persistence
- Workflow definitions stored in PostgreSQL
- Chat history persistence
- Execution logs and analytics
- Document storage and processing

### 🤖 AI Integration
- Gemini API for LLM interactions
- Vector embeddings for semantic search
- ChromaDB for vector storage
- Document processing with PyMuPDF

### 🔍 Web Search Integration
- Pluggable search providers (Brave, SerpAPI)
- Runtime provider switching
- Search result integration in workflows

### 💬 Chat Interface
- Real-time chat with workflow context
- Message history persistence
- AI-powered responses
- Search provider selection

## Technology Stack

### Frontend
- **Framework**: Next.js 14 with TypeScript and App Router
- **UI Library**: shadcn/ui with custom theme
- **Workflow**: React Flow for visual workflow building
- **State Management**: React Context and hooks
- **Styling**: Tailwind CSS with custom color palette
- **Authentication**: JWT with protected routes

### Backend
- **Framework**: FastAPI with Python 3.11+
- **Authentication**: JWT with bcrypt password hashing
- **Database ORM**: SQLAlchemy with Alembic migrations
- **Async**: asyncio for concurrent execution
- **WebSocket**: Real-time communication
- **Document Processing**: PyMuPDF for text extraction

### Databases
- **Primary Database**: PostgreSQL for relational data
- **Vector Database**: ChromaDB for embeddings and similarity search

### External Services
- **AI Services**: Google Gemini API for LLM and embeddings
- **Search Services**: Brave Search API and SerpAPI

### DevOps
- **Containerization**: Docker and Docker Compose
- **Environment**: Environment-based configuration
- **Development**: Hot reload and live development

## Security Features
- JWT-based authentication with secure token handling
- Password hashing with bcrypt
- CORS configuration for secure cross-origin requests
- Protected API endpoints with middleware
- Input validation and sanitization

## Scalability Features
- Asynchronous execution engine
- WebSocket connection management
- Database connection pooling
- Pluggable service architecture
- Microservice-ready design
