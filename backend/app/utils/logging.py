import logging
import json
import sys
from datetime import datetime
from typing import Any, Dict
from pythonjsonlogger import jsonlogger
import structlog

from app.core.config import settings


class FlowgenixJSONFormatter(jsonlogger.JsonFormatter):
    def add_fields(self, log_record: Dict[str, Any], record: logging.LogRecord, message_dict: Dict[str, Any]) -> None:
        super().add_fields(log_record, record, message_dict)
        
        # Add timestamp
        if not log_record.get('timestamp'):
            log_record['timestamp'] = datetime.utcnow().isoformat()
        
        # Add service info
        log_record['service'] = settings.app_name.lower()
        log_record['version'] = settings.app_version
        
        # Add level
        if log_record.get('level'):
            log_record['level'] = log_record['level'].upper()
        else:
            log_record['level'] = record.levelname


def setup_logging() -> logging.Logger:
    """Setup structured logging for the application"""
    
    # Create logger
    logger = logging.getLogger("flowgenix")
    logger.setLevel(getattr(logging, settings.log_level.upper()))
    
    # Remove existing handlers
    for handler in logger.handlers[:]:
        logger.removeHandler(handler)
    
    # Console handler with JSON formatting
    console_handler = logging.StreamHandler(sys.stdout)
    json_formatter = FlowgenixJSONFormatter(
        fmt='%(timestamp)s %(level)s %(name)s %(message)s'
    )
    console_handler.setFormatter(json_formatter)
    logger.addHandler(console_handler)
    
    return logger


# Configure structlog
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

# Create logger instances
logger = setup_logging()
struct_logger = structlog.get_logger()


def log_request(method: str, path: str, status_code: int, duration: float, user_id: str = None):
    """Log HTTP request information"""
    struct_logger.info(
        "HTTP request processed",
        method=method,
        path=path,
        status_code=status_code,
        duration_ms=duration * 1000,
        user_id=user_id,
        event_type="http_request"
    )


def log_workflow_execution(workflow_id: str, user_id: str, status: str, duration: float = None, error: str = None):
    """Log workflow execution events"""
    log_data = {
        "workflow_id": workflow_id,
        "user_id": user_id,
        "status": status,
        "event_type": "workflow_execution"
    }
    
    if duration is not None:
        log_data["duration_ms"] = duration * 1000
    
    if error:
        log_data["error"] = error
        struct_logger.error("Workflow execution failed", **log_data)
    else:
        struct_logger.info("Workflow execution completed", **log_data)


def log_document_upload(filename: str, user_id: str, status: str, file_size: int = None, error: str = None):
    """Log document upload events"""
    log_data = {
        "filename": filename,
        "user_id": user_id,
        "status": status,
        "event_type": "document_upload"
    }
    
    if file_size is not None:
        log_data["file_size_bytes"] = file_size
    
    if error:
        log_data["error"] = error
        struct_logger.error("Document upload failed", **log_data)
    else:
        struct_logger.info("Document uploaded successfully", **log_data)
