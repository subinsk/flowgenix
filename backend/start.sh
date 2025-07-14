#!/bin/bash

# Startup script for Flowgenix Backend
set -e

echo "Starting Flowgenix Backend..."

# Create necessary directories
mkdir -p /opt/render/project/chroma_db
mkdir -p /opt/render/project/uploads

# Set proper permissions
chmod 755 /opt/render/project/chroma_db
chmod 755 /opt/render/project/uploads

echo "Directories created and permissions set."

# Run database migrations
echo "Running database migrations..."
alembic upgrade head || echo "Migration failed or not needed"

# Start the application
echo "Starting FastAPI application..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 1
