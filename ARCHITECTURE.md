# Flowgenix Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                       │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Auth Pages    │  │  Main App UI    │  │   Components    │ │
│  │   - Login       │  │  - Workflow     │  │   - Library     │ │
│  │   - Register    │  │    Canvas       │  │   - Config      │ │
│  │   - Protected   │  │  - Chat Interface│  │   - Controls    │ │
│  │     Routes      │  │  - Status Bar   │  │   - Upload      │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│              │                 │                        │       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  Auth Context   │  │  Service Layer  │  │   Utilities     │ │
│  │  - JWT Token    │  │  - API Calls    │  │  - Validation   │ │
│  │  - User State   │  │  - Error Handle │  │  - Helpers      │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                  │
                              HTTP/HTTPS
                                  │
┌─────────────────────────────────────────────────────────────────┐
│                        BACKEND (FastAPI)                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Auth System   │  │   API Routes    │  │   File Upload   │ │
│  │   - JWT tokens  │  │   - Workflows   │  │   - PDF/TXT     │ │
│  │   - Password    │  │   - Chat        │  │   - Processing  │ │
│  │     Hashing     │  │   - Documents   │  │   - Storage     │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│              │                 │                        │       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ Workflow Engine │  │   AI Services   │  │   Web Search    │ │
│  │ - Execution     │  │  - Gemini API   │  │  - Brave API    │ │
│  │ - Validation    │  │  - Embeddings   │  │  - SerpAPI      │ │
│  │ - State Mgmt    │  │  - Text Gen     │  │  - Pluggable    │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
          │                       │                        │
    ┌─────────────┐        ┌─────────────┐        ┌─────────────┐
    │ PostgreSQL  │        │  ChromaDB   │        │ External    │
    │ Database    │        │  Vector DB  │        │ APIs        │
    │             │        │             │        │             │
    │ - Users     │        │ - Document  │        │ - Gemini    │
    │ - Workflows │        │   Embeddings│        │ - Brave     │
    │ - Chat Logs │        │ - Semantic  │        │ - SerpAPI   │
    │ - Documents │        │   Search    │        │             │
    │ - Exec Logs │        │             │        │             │
    └─────────────┘        └─────────────┘        └─────────────┘
```

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERACTION                         │
└─────────────────────────────────────────────────────────────────┘
                                  │
                           1. User Actions
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND COMPONENTS                         │
│                                                                 │
│  Workflow Builder ──► Config Panel ──► Execution Controls      │
│         │                                        │              │
│         ▼                                        ▼              │
│  Component Library ◄──── Auth Context ────► Chat Interface     │
└─────────────────────────────────────────────────────────────────┘
                                  │
                        2. API Requests (JWT)
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND SERVICES                           │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   Routes    │  │ Middleware  │  │   Models    │            │
│  │ ┌─────────┐ │  │ ┌─────────┐ │  │ ┌─────────┐ │            │
│  │ │ Auth    │ │  │ │  CORS   │ │  │ │ SQLAlch │ │            │
│  │ │ Workflow│ │  │ │ JWT     │ │  │ │ Pydantic│ │            │
│  │ │ Chat    │ │  │ │ Error   │ │  │ │ Models  │ │            │
│  │ │ Docs    │ │  │ │ Handler │ │  │ │         │ │            │
│  │ └─────────┘ │  │ └─────────┘ │  │ └─────────┘ │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└─────────────────────────────────────────────────────────────────┘
         │                    │                    │
   3. Database Ops     4. Vector Ops      5. External APIs
         ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ PostgreSQL   │    │  ChromaDB    │    │ External     │
│              │    │              │    │ Services     │
│ • Users      │    │ • Embeddings │    │              │
│ • Workflows  │    │ • Similarity │    │ • Gemini API │
│ • Messages   │    │   Search     │    │ • Web Search │
│ • Documents  │    │ • Collections│    │ • File Proc  │
│ • Logs       │    │              │    │              │
└──────────────┘    └──────────────┘    └──────────────┘
```

## Component Interaction Flow

```
1. USER REGISTRATION/LOGIN
   Frontend ──JWT──► Backend ──Hash──► PostgreSQL
                        │
                        ▼
                   Auth Context ──Token──► Protected Routes

2. WORKFLOW CREATION
   Drag & Drop ──► Canvas ──► Validation ──► Save to DB
                      │              │
                      ▼              ▼
                 Node Config    Edge Validation

3. DOCUMENT PROCESSING
   File Upload ──► Text Extract ──► Embeddings ──► ChromaDB
                        │              │
                        ▼              ▼
                   PostgreSQL     Vector Store

4. WORKFLOW EXECUTION
   Build Stack ──► Validate ──► Execute ──► Chat Context
                      │           │
                      ▼           ▼
                 Workflow DB    Execution Logs

5. CHAT INTERACTION
   User Message ──► AI Processing ──► Context Retrieval ──► Response
                        │                    │
                        ▼                    ▼
                   Gemini API          Document Search
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        SECURITY LAYERS                          │
├─────────────────────────────────────────────────────────────────┤
│  Frontend Security:                                             │
│  • JWT Token Storage (localStorage)                            │
│  • Protected Route Guards                                      │
│  • Input Validation & Sanitization                            │
│  • HTTPS in Production                                         │
├─────────────────────────────────────────────────────────────────┤
│  Backend Security:                                              │
│  • JWT Token Verification                                      │
│  • bcrypt Password Hashing                                     │
│  • CORS Configuration                                          │
│  • Input Validation (Pydantic)                                │
│  • SQL Injection Prevention (SQLAlchemy)                      │
├─────────────────────────────────────────────────────────────────┤
│  Database Security:                                             │
│  • User Authentication                                         │
│  • Data Encryption at Rest                                     │
│  • Connection Encryption                                       │
│  • Access Control                                              │
├─────────────────────────────────────────────────────────────────┤
│  API Security:                                                  │
│  • API Key Management                                          │
│  • Rate Limiting (Future)                                      │
│  • Request/Response Validation                                 │
│  • Error Message Sanitization                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      DOCKER CONTAINERS                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │  Frontend   │  │   Backend   │  │ PostgreSQL  │            │
│  │   (3000)    │  │   (8000)    │  │   (5432)    │            │
│  │             │  │             │  │             │            │
│  │ Next.js     │  │ FastAPI     │  │ Database    │            │
│  │ React       │  │ Python      │  │ Storage     │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐                              │
│  │  ChromaDB   │  │   Redis     │                              │
│  │   (8001)    │  │   (6379)    │                              │
│  │             │  │             │                              │
│  │ Vector DB   │  │ Cache       │                              │
│  │ Embeddings  │  │ Sessions    │                              │
│  └─────────────┘  └─────────────┘                              │
└─────────────────────────────────────────────────────────────────┘
                                │
                        Docker Compose
                                │
                        ┌─────────────┐
                        │   Volumes   │
                        │             │
                        │ • postgres  │
                        │ • chroma    │
                        │ • uploads   │
                        │ • redis     │
                        └─────────────┘
```

This architecture provides:
- **Scalability**: Microservices with Docker containers
- **Security**: Multi-layer authentication and validation
- **Performance**: Vector database for fast similarity search
- **Maintainability**: Clear separation of concerns
- **Extensibility**: Pluggable components and modular design
