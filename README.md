# Flowgenix

**AI-Powered No-Code Workflow Builder**

[![Demo](https://img.shields.io/badge/Demo-Live-green)](http://localhost:3000)
[![Documentation](https://img.shields.io/badge/Docs-Available-blue)](#documentation)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

Flowgenix is a modern, full-stack no-code workflow builder that enables users to create intelligent workflows through a visual drag-and-drop interface. Built with AI integration, real-time execution, and enterprise-grade monitoring.

## ✨ Key Features

- 🎨 **Visual Workflow Builder** - Drag-and-drop interface with React Flow
- 🤖 **AI Integration** - Google Gemini API for LLM interactions and embeddings
- 📄 **Document Processing** - Upload and extract text from PDFs, TXT, DOCX files
- 🔍 **Vector Search** - ChromaDB for semantic document search
- 🌐 **Web Search** - Integrated Brave Search & SerpAPI
- 💬 **Real-time Chat** - Interactive chat with workflow context
- 🔐 **User Authentication** - JWT-based secure authentication
- 📊 **Enterprise Monitoring** - Prometheus metrics and Grafana dashboards
- 🚀 **Production Ready** - Docker containers and Kubernetes manifests

## 🚀 Quick Start

### Using Docker (Recommended)

1. **Clone and setup**
   ```bash
   git clone <repository-url>
   cd flowgenix
   cp .env.example .env
   ```

2. **Configure environment**
   ```bash
   # Edit .env with your API keys
   GEMINI_API_KEY=your-gemini-api-key
   BRAVE_API_KEY=your-brave-search-api-key  # Optional
   ```

3. **Start services**
   ```bash
   docker-compose up -d
   ```

4. **Access application**
   - Frontend: http://localhost:3000
   - API Docs: http://localhost:8000/docs
   - Monitoring: http://localhost:3001 (admin/admin)

### Local Development

See [Development Guide](docs/development/setup.md) for detailed local setup instructions.

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Databases     │
│   (Next.js)     │◄──►│   (FastAPI)     │◄──►│  PostgreSQL     │
│                 │    │                 │    │  ChromaDB       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         └─────────────►│   AI Services   │◄─────────────┘
                        │  (Gemini API)   │
                        └─────────────────┘
```

**Tech Stack:**
- **Frontend**: Next.js 14, TypeScript, React Flow, Tailwind CSS, shadcn/ui
- **Backend**: FastAPI, Python 3.9+, SQLAlchemy, WebSockets
- **Database**: PostgreSQL, ChromaDB
- **AI**: Google Gemini API
- **Monitoring**: Prometheus, Grafana, ELK Stack
- **Deployment**: Docker, Kubernetes

## 📚 Documentation

- **[Getting Started](docs/guides/getting-started.md)** - Complete setup and first workflow
- **[User Guide](docs/guides/user-guide.md)** - How to use all features
- **[Development Guide](docs/development/setup.md)** - Local development setup
- **[Architecture](docs/guides/architecture.md)** - System design and components
- **[Deployment](docs/deployment/docker.md)** - Production deployment guides
- **[API Reference](docs/guides/api-reference.md)** - Backend API documentation

## 🎯 Use Cases

- **Document Analysis Workflows** - Upload documents and ask AI questions
- **Content Generation** - Create AI-powered content pipelines
- **Research Automation** - Combine web search with AI analysis
- **Data Processing** - Build custom data transformation workflows
- **Customer Support** - AI-powered help desk workflows

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](docs/development/contributing.md) for details.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📖 Check the [documentation](docs/)
- � Report bugs in [GitHub Issues](https://github.com/your-repo/flowgenix/issues)
- 💬 Join our [Discord community](https://discord.gg/flowgenix)
- 📧 Email us at support@flowgenix.com

---

**Built with ❤️ using modern web technologies**
