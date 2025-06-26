# Flowgenix - Quick Start Guide

## 🚀 Docker Setup (Recommended)

### Prerequisites
- Docker and Docker Compose installed
- Git for cloning the repository

### Quick Start
1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd flowgenix
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env file with your API keys:
   # - GEMINI_API_KEY (required for AI features)
   # - BRAVE_API_KEY (optional, for web search)
   # - SERPAPI_KEY (optional, alternative web search)
   ```

3. **Start all services:**
   ```bash
   docker-compose up -d
   ```

4. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs
   - ChromaDB: http://localhost:8001

5. **Create your first account:**
   - Navigate to http://localhost:3000
   - Click "Sign up" and create an account
   - Start building workflows!

### Stop Services
```bash
docker-compose down
```

### View Logs
```bash
docker-compose logs -f [service_name]
# Example: docker-compose logs -f backend
```

---

## 🛠️ Local Development Setup

### Backend Setup (FastAPI)

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   venv\Scripts\activate  # Windows
   source venv/bin/activate  # Mac/Linux
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up database:**
   ```bash
   # Make sure PostgreSQL is running
   # Update DATABASE_URL in .env file
   python -c "from database import init_db; init_db()"
   ```

5. **Start backend server:**
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

### Frontend Setup (Next.js)

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Access application:**
   - Frontend: http://localhost:3000
   - Hot reload enabled for development

---

## 🔧 Configuration

### Required API Keys

1. **Gemini API Key:**
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Add to `.env` as `GEMINI_API_KEY`

2. **Web Search APIs (Optional):**
   - **Brave Search:** Get key from [Brave Search API](https://api.search.brave.com/)
   - **SerpAPI:** Get key from [SerpAPI](https://serpapi.com/)

### Environment Variables
```env
# Database
POSTGRES_DB=flowgenix
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/flowgenix

# Backend
SECRET_KEY=your-secret-key
GEMINI_API_KEY=your-gemini-key
BRAVE_API_KEY=your-brave-key (optional)
SERPAPI_KEY=your-serpapi-key (optional)

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 🧪 Testing the Application

### 1. User Authentication
- Register a new account
- Login/logout functionality
- Protected routes

### 2. Workflow Builder
- Drag components from library
- Connect components with edges
- Configure component properties

### 3. Document Upload
- Upload PDF, TXT, or DOCX files
- Text extraction and processing
- Vector search functionality

### 4. AI Features
- Build a workflow with LLM components
- Chat with your workflow
- Test AI responses

### 5. Web Search Integration
- Add web search components
- Switch between Brave and SerpAPI
- Test search functionality

---

## 🐛 Troubleshooting

### Common Issues

1. **Port already in use:**
   ```bash
   # Check what's using the port
   netstat -tulpn | grep :3000
   # Kill the process or use different ports
   ```

2. **Database connection issues:**
   ```bash
   # Check if PostgreSQL is running
   docker-compose ps
   # Restart database service
   docker-compose restart postgres
   ```

3. **API key issues:**
   - Verify API keys are correctly set in `.env`
   - Check API key permissions and quotas
   - Restart services after updating environment variables

4. **Node modules issues:**
   ```bash
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   ```

5. **Python dependency issues:**
   ```bash
   cd backend
   pip install --upgrade pip
   pip install -r requirements.txt --force-reinstall
   ```

### Logs and Debugging

1. **Backend logs:**
   ```bash
   docker-compose logs -f backend
   ```

2. **Frontend logs:**
   ```bash
   docker-compose logs -f frontend
   ```

3. **Database logs:**
   ```bash
   docker-compose logs -f postgres
   ```

---

## 📚 Additional Resources

- **API Documentation:** http://localhost:8000/docs (when running)
- **Project Structure:** See main README.md
- **Architecture Overview:** See main README.md
- **Contributing Guidelines:** See main README.md

---

## 🆘 Getting Help

If you encounter issues:

1. Check the logs for error messages
2. Verify all environment variables are set
3. Ensure all required services are running
4. Check the troubleshooting section above
5. Create an issue in the repository

Happy building! 🌊✨

## Start Frontend (React)

1. Open a new terminal in the project root.
2. Run:
   ```sh
   cd frontend
   npm install
   npm start
   ```
3. The frontend will be available at http://localhost:3000

## Start with Docker Compose (all services)

1. From the project root, run:
   ```sh
   docker-compose up --build
   ```
2. This will start frontend, backend, and database together.

---

You can use either the local dev servers or Docker Compose as needed.
