# API Reference

Complete API documentation for Flowgenix backend services.

## Base URL

```
http://localhost:8000/api/v1
```

## Authentication

Flowgenix uses JWT (JSON Web Tokens) for authentication.

### Get Access Token

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your_password"
}
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer",
  "expires_in": 86400
}
```

### Using Authentication

Include the token in the Authorization header:

```http
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

## Authentication Endpoints

### Register User

```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure_password",
  "full_name": "John Doe"
}
```

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "full_name": "John Doe",
  "created_at": "2024-01-01T00:00:00Z"
}
```

### Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure_password"
}
```

### Refresh Token

```http
POST /auth/refresh
Authorization: Bearer <refresh_token>
```

### Get Current User

```http
GET /auth/me
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "full_name": "John Doe",
  "created_at": "2024-01-01T00:00:00Z"
}
```

## Workflow Endpoints

### Create Workflow

```http
POST /workflows
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "My AI Workflow",
  "description": "Document analysis workflow",
  "workflow_data": {
    "nodes": [...],
    "edges": [...]
  }
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "My AI Workflow",
  "description": "Document analysis workflow",
  "workflow_data": {...},
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

### Get User Workflows

```http
GET /workflows
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `limit` (optional): Number of workflows to return (default: 10)
- `offset` (optional): Number of workflows to skip (default: 0)

**Response:**
```json
{
  "workflows": [
    {
      "id": "uuid",
      "name": "My AI Workflow",
      "description": "Document analysis workflow",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 1
}
```

### Get Workflow by ID

```http
GET /workflows/{workflow_id}
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "id": "uuid",
  "name": "My AI Workflow",
  "description": "Document analysis workflow",
  "workflow_data": {
    "nodes": [...],
    "edges": [...]
  },
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

### Update Workflow

```http
PUT /workflows/{workflow_id}
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Updated Workflow Name",
  "description": "Updated description",
  "workflow_data": {...}
}
```

### Delete Workflow

```http
DELETE /workflows/{workflow_id}
Authorization: Bearer <access_token>
```

### Execute Workflow

```http
POST /workflows/{workflow_id}/execute
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "user_input": "What is the main topic of the uploaded document?",
  "context": {}
}
```

**Response:**
```json
{
  "execution_id": "uuid",
  "status": "running",
  "created_at": "2024-01-01T00:00:00Z"
}
```

### Get Execution Status

```http
GET /workflows/{workflow_id}/executions/{execution_id}
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "execution_id": "uuid",
  "status": "completed",
  "result": {
    "output": "The main topic of the document is artificial intelligence in healthcare.",
    "metadata": {...}
  },
  "created_at": "2024-01-01T00:00:00Z",
  "completed_at": "2024-01-01T00:00:05Z"
}
```

## Document Endpoints

### Upload Document

```http
POST /documents/upload
Authorization: Bearer <access_token>
Content-Type: multipart/form-data

Form Data:
- file: <file_content>
- workflow_id: <workflow_uuid>
```

**Response:**
```json
{
  "id": "uuid",
  "filename": "document.pdf",
  "file_size": 1024,
  "content_type": "application/pdf",
  "workflow_id": "uuid",
  "created_at": "2024-01-01T00:00:00Z",
  "status": "processing"
}
```

### Get Documents

```http
GET /documents
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `workflow_id` (optional): Filter by workflow ID

**Response:**
```json
{
  "documents": [
    {
      "id": "uuid",
      "filename": "document.pdf",
      "file_size": 1024,
      "content_type": "application/pdf",
      "workflow_id": "uuid",
      "created_at": "2024-01-01T00:00:00Z",
      "status": "processed"
    }
  ]
}
```

### Download Document

```http
GET /documents/{document_id}/download
Authorization: Bearer <access_token>
```

**Response:** Binary file content

### Delete Document

```http
DELETE /documents/{document_id}
Authorization: Bearer <access_token>
```

### Get Document Processing Status

```http
GET /documents/{document_id}/status
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "id": "uuid",
  "status": "processed",
  "chunks_count": 15,
  "embeddings_count": 15,
  "processing_time": 5.2
}
```

## Chat Endpoints

### Get Chat History

```http
GET /chat/{workflow_id}/messages
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `limit` (optional): Number of messages to return (default: 50)
- `offset` (optional): Number of messages to skip (default: 0)

**Response:**
```json
{
  "messages": [
    {
      "id": "uuid",
      "role": "user",
      "content": "What is AI?",
      "created_at": "2024-01-01T00:00:00Z"
    },
    {
      "id": "uuid",
      "role": "assistant",
      "content": "AI stands for Artificial Intelligence...",
      "created_at": "2024-01-01T00:00:01Z"
    }
  ]
}
```

### Send Chat Message

```http
POST /chat/{workflow_id}/messages
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "content": "What is the main benefit of AI in healthcare?",
  "context": {}
}
```

**Response:**
```json
{
  "id": "uuid",
  "role": "assistant",
  "content": "The main benefits of AI in healthcare include...",
  "created_at": "2024-01-01T00:00:00Z"
}
```

## Search Endpoints

### Web Search

```http
POST /search/web
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "query": "latest AI developments 2024",
  "provider": "brave",
  "num_results": 5
}
```

**Response:**
```json
{
  "query": "latest AI developments 2024",
  "provider": "brave",
  "results": [
    {
      "title": "AI Breakthrough in 2024",
      "url": "https://example.com/ai-2024",
      "snippet": "Latest developments in artificial intelligence...",
      "published_date": "2024-01-01"
    }
  ],
  "total_results": 5
}
```

### Document Search

```http
POST /search/documents
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "query": "machine learning algorithms",
  "workflow_id": "uuid",
  "limit": 5
}
```

**Response:**
```json
{
  "query": "machine learning algorithms",
  "results": [
    {
      "document_id": "uuid",
      "chunk_id": "uuid",
      "content": "Machine learning algorithms are computational procedures...",
      "similarity_score": 0.85,
      "metadata": {
        "filename": "ml_guide.pdf",
        "page_number": 5
      }
    }
  ]
}
```

## Health Check Endpoints

### System Health

```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z",
  "services": {
    "database": "healthy",
    "chromadb": "healthy",
    "gemini_api": "healthy"
  }
}
```

### Detailed Health Check

```http
GET /health/detailed
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z",
  "services": {
    "database": {
      "status": "healthy",
      "response_time": "0.05s",
      "connections": 5
    },
    "chromadb": {
      "status": "healthy",
      "response_time": "0.02s",
      "collections": 3
    },
    "gemini_api": {
      "status": "healthy",
      "response_time": "0.8s",
      "quota_remaining": 85
    }
  },
  "system": {
    "cpu_usage": "15%",
    "memory_usage": "60%",
    "disk_usage": "25%"
  }
}
```

## WebSocket API

### Real-time Workflow Execution

Connect to: `ws://localhost:8000/ws/{workflow_id}`

**Authentication:** Send JWT token in connection query parameter
```
ws://localhost:8000/ws/{workflow_id}?token=<access_token>
```

**Message Types:**

#### Execution Start
```json
{
  "type": "execution_start",
  "execution_id": "uuid",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

#### Component Progress
```json
{
  "type": "component_progress",
  "component_id": "uuid",
  "component_type": "llm_engine",
  "status": "processing",
  "progress": 50,
  "timestamp": "2024-01-01T00:00:01Z"
}
```

#### Execution Complete
```json
{
  "type": "execution_complete",
  "execution_id": "uuid",
  "result": {
    "output": "Execution completed successfully",
    "metadata": {...}
  },
  "timestamp": "2024-01-01T00:00:05Z"
}
```

#### Error
```json
{
  "type": "error",
  "error_code": "COMPONENT_ERROR",
  "message": "Error in LLM Engine component",
  "timestamp": "2024-01-01T00:00:03Z"
}
```

## Error Handling

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `500` - Internal Server Error

### Error Response Format

```json
{
  "error": "VALIDATION_ERROR",
  "message": "Invalid input data",
  "details": {
    "field": "email",
    "issue": "Invalid email format"
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### Common Error Codes

- `AUTHENTICATION_REQUIRED` - Missing or invalid authentication
- `AUTHORIZATION_FAILED` - Insufficient permissions
- `VALIDATION_ERROR` - Invalid input data
- `RESOURCE_NOT_FOUND` - Requested resource doesn't exist
- `WORKFLOW_EXECUTION_ERROR` - Error during workflow execution
- `DOCUMENT_PROCESSING_ERROR` - Error processing uploaded document
- `EXTERNAL_API_ERROR` - Error with external API (Gemini, Search)
- `RATE_LIMIT_EXCEEDED` - Too many requests

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **Authentication endpoints**: 5 requests per minute
- **Workflow operations**: 60 requests per hour
- **Document upload**: 10 uploads per hour
- **Chat messages**: 100 messages per hour
- **Search operations**: 50 searches per hour

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1704067200
```

## SDK Examples

### JavaScript/TypeScript

```typescript
// Install: npm install @flowgenix/sdk

import { FlowgenixClient } from '@flowgenix/sdk';

const client = new FlowgenixClient({
  baseUrl: 'http://localhost:8000',
  apiKey: 'your-api-key'
});

// Create workflow
const workflow = await client.workflows.create({
  name: 'My Workflow',
  description: 'Document analysis',
  workflow_data: {...}
});

// Execute workflow
const execution = await client.workflows.execute(workflow.id, {
  user_input: 'Analyze this document'
});

// Get result
const result = await client.workflows.getExecution(
  workflow.id, 
  execution.execution_id
);
```

### Python

```python
# Install: pip install flowgenix-sdk

from flowgenix import FlowgenixClient

client = FlowgenixClient(
    base_url='http://localhost:8000',
    api_key='your-api-key'
)

# Create workflow
workflow = client.workflows.create(
    name='My Workflow',
    description='Document analysis',
    workflow_data={...}
)

# Execute workflow
execution = client.workflows.execute(
    workflow['id'],
    user_input='Analyze this document'
)

# Get result
result = client.workflows.get_execution(
    workflow['id'],
    execution['execution_id']
)
```

## Testing

### Using cURL

```bash
# Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password"}'

# Create workflow
curl -X POST http://localhost:8000/api/v1/workflows \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Workflow", "workflow_data": {}}'
```

### Using Postman

1. Import the [Postman Collection](../postman/flowgenix-api.json)
2. Set environment variables:
   - `base_url`: http://localhost:8000
   - `token`: Your JWT access token

### Interactive API Documentation

Visit http://localhost:8000/docs for interactive Swagger UI documentation with the ability to test endpoints directly.

## Next Steps

- [User Guide](user-guide.md) - Learn how to use the application
- [Development Guide](../development/setup.md) - Set up development environment
- [Architecture Guide](architecture.md) - Understand system design
