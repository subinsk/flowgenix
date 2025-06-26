from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import time
from datetime import datetime

from app.core.config import settings
from app.core.database import init_db
from app.api.v1 import api_router
from app.utils.logging import setup_logging, log_request
from app.utils.metrics import setup_metrics, metrics

# Setup logging
logger = setup_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    logger.info("Starting Flowgenix application")
    init_db()
    logger.info("Database initialized")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Flowgenix application")


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="AI-powered no-code workflow builder",
    lifespan=lifespan
)

# Setup monitoring
if settings.prometheus_enabled:
    setup_metrics(app)

# Middleware
@app.middleware("http")
async def logging_middleware(request: Request, call_next):
    """Logging middleware"""
    start_time = time.time()
    
    response = await call_next(request)
    
    # Log the request
    duration = time.time() - start_time
    log_request(
        method=request.method,
        path=str(request.url.path),
        status_code=response.status_code,
        duration=duration
    )
    
    return response


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to Flowgenix API",
        "version": settings.app_version,
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint for Kubernetes probes"""
    try:
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "service": settings.app_name,
            "version": settings.app_version
        }
    except Exception as e:
        raise HTTPException(status_code=503, detail={
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        })


@app.get("/metrics")
async def get_metrics():
    """Prometheus metrics endpoint"""
    if settings.prometheus_enabled:
        from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
        from fastapi import Response
        
        return Response(
            content=generate_latest(),
            media_type=CONTENT_TYPE_LATEST
        )
    else:
        return {"message": "Metrics disabled"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug
    )
