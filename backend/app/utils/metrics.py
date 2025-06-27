from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST
from prometheus_fastapi_instrumentator import Instrumentator
import time
from typing import Dict, Any

from app.core.config import settings

# Prometheus metrics
http_requests_total = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status']
)

http_request_duration_seconds = Histogram(
    'http_request_duration_seconds',
    'HTTP request duration in seconds',
    ['method', 'endpoint']
)

workflow_executions_total = Counter(
    'workflow_executions_total',
    'Total workflow executions',
    ['status']
)

workflow_execution_duration_seconds = Histogram(
    'workflow_execution_duration_seconds',
    'Workflow execution duration in seconds',
    ['workflow_type']
)

websocket_connections_active = Gauge(
    'websocket_connections_active',
    'Active WebSocket connections'
)

db_connections_active = Gauge(
    'db_connections_active',
    'Active database connections'
)

db_connections_idle = Gauge(
    'db_connections_idle',
    'Idle database connections'
)

document_uploads_total = Counter(
    'document_uploads_total',
    'Total document uploads',
    ['status']
)

embedding_operations_total = Counter(
    'embedding_operations_total',
    'Total embedding operations',
    ['operation_type']
)

llm_requests_total = Counter(
    'llm_requests_total',
    'Total LLM requests',
    ['provider', 'status']
)

llm_request_duration_seconds = Histogram(
    'llm_request_duration_seconds',
    'LLM request duration in seconds',
    ['provider']
)

web_search_requests_total = Counter(
    'web_search_requests_total',
    'Total web search requests',
    ['provider', 'status']
)


class MetricsMiddleware:
    """Centralized metrics collection"""
    
    def __init__(self):
        self.active_connections = 0
    
    def track_request(self, method: str, endpoint: str, status_code: int, duration: float):
        """Track HTTP request metrics"""
        if not settings.prometheus_enabled:
            return
            
        http_requests_total.labels(
            method=method,
            endpoint=endpoint,
            status=status_code
        ).inc()
        
        http_request_duration_seconds.labels(
            method=method,
            endpoint=endpoint
        ).observe(duration)
    
    def track_workflow_execution(self, status: str, duration: float = None, workflow_type: str = "default"):
        """Track workflow execution metrics"""
        if not settings.prometheus_enabled:
            return
            
        workflow_executions_total.labels(status=status).inc()
        
        if duration is not None:
            workflow_execution_duration_seconds.labels(
                workflow_type=workflow_type
            ).observe(duration)
    
    def track_websocket_connection(self, increment: bool = True):
        """Track WebSocket connection metrics"""
        if not settings.prometheus_enabled:
            return
            
        if increment:
            self.active_connections += 1
        else:
            self.active_connections = max(0, self.active_connections - 1)
        
        websocket_connections_active.set(self.active_connections)
    
    def track_document_upload(self, status: str):
        """Track document upload metrics"""
        if not settings.prometheus_enabled:
            return
            
        document_uploads_total.labels(status=status).inc()
    
    def track_embedding_operation(self, operation_type: str):
        """Track embedding operation metrics"""
        if not settings.prometheus_enabled:
            return
            
        embedding_operations_total.labels(operation_type=operation_type).inc()
    
    def track_llm_request(self, provider: str, status: str, duration: float = None):
        """Track LLM request metrics"""
        if not settings.prometheus_enabled:
            return
            
        llm_requests_total.labels(provider=provider, status=status).inc()
        
        if duration is not None:
            llm_request_duration_seconds.labels(provider=provider).observe(duration)
    
    def track_web_search(self, provider: str, status: str):
        """Track web search request metrics"""
        if not settings.prometheus_enabled:
            return
            
        web_search_requests_total.labels(provider=provider, status=status).inc()
    
    def update_db_connections(self, active: int, idle: int):
        """Update active and idle database connections metrics"""
        if not settings.prometheus_enabled:
            return
            
        db_connections_active.set(active)
        db_connections_idle.set(idle)


# Global metrics instance
metrics = MetricsMiddleware()


def setup_metrics(app):
    """Setup Prometheus metrics for FastAPI app"""
    if not settings.prometheus_enabled:
        return
    
    # Add Prometheus instrumentator
    instrumentator = Instrumentator()
    instrumentator.instrument(app)
    
    @app.middleware("http")
    async def metrics_middleware(request, call_next):
        start_time = time.time()
        
        response = await call_next(request)
        
        # Track metrics
        duration = time.time() - start_time
        metrics.track_request(
            method=request.method,
            endpoint=request.url.path,
            status_code=response.status_code,
            duration=duration
        )
        
        return response
    
    @app.get("/metrics")
    async def get_metrics():
        """Expose metrics endpoint"""
        return generate_latest()
