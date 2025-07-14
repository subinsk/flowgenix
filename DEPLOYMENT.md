# Deployment Guide: Frontend to Vercel, Backend to Render

## Overview
This guide will help you deploy your FlowGenix application with:
- **Frontend**: Deployed to Vercel
- **Backend**: Deployed to Render (with embedded ChromaDB)
- **Database**: PostgreSQL on Render (free tier)

## What Changed for ChromaDB
✅ **ChromaDB now runs in embedded mode** - no separate server needed!

### Key Changes Made:
1. **Backend Configuration**: ChromaDB now uses embedded mode with file persistence
2. **No HTTP Client**: Removed ChromaDB server dependency
3. **File Storage**: ChromaDB data persists to `./chroma_db` directory
4. **Render Compatible**: Works perfectly with Render's free tier

## Prerequisites
- GitHub account (for code repository)
- Vercel account (free)
- Render account (free)

## Step 1: Prepare Your Code

### Update Environment Variables
Create/update your `.env` file for local development:

```env
# Application
APP_NAME=Flowgenix
DEBUG=false

# Database (will be provided by Render)
DATABASE_URL=postgresql://user:password@host:port/db

# Security (generate new keys for production)
SECRET_KEY=your-super-secret-key-change-this
API_KEY_ENCRYPTION_KEY=your-encryption-key-change-this

# ChromaDB (Embedded Mode)
CHROMA_PERSIST_DIRECTORY=./chroma_db

# CORS (update with your Vercel domain)
ALLOWED_ORIGINS=https://your-app.vercel.app,http://localhost:3000

# File Upload
UPLOAD_DIR=./uploaded_docs
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=.pdf,.txt,.docx
```

### Update Frontend API URL
In `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=https://your-backend-app.onrender.com
```

## Step 2: Deploy Backend to Render

### 2.1 Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub

### 2.2 Create PostgreSQL Database
1. In Render dashboard, click "New +"
2. Select "PostgreSQL"
3. Choose:
   - **Name**: `flowgenix-db`
   - **Database**: `flowgenix`
   - **User**: `flowgenix`
   - **Region**: Choose closest to you
   - **Plan**: Free
4. Click "Create Database"
5. **Save the connection details** (Internal Database URL)

### 2.3 Deploy Backend Service
1. In Render dashboard, click "New +"
2. Select "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `flowgenix-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Docker`
   - **Plan**: Free
   - **Region**: Same as database

### 2.4 Configure Environment Variables
In your Render web service settings, add these environment variables:

```
DATABASE_URL=<use_internal_database_url_from_step_2.2>
SECRET_KEY=<generate_a_strong_secret_key>
API_KEY_ENCRYPTION_KEY=<generate_base64_key>
ALLOWED_ORIGINS=https://your-app.vercel.app
CHROMA_PERSIST_DIRECTORY=/opt/render/project/src/chroma_db
UPLOAD_DIR=/opt/render/project/src/uploaded_docs
```

**To generate secure keys:**
```python
# For SECRET_KEY
import secrets
print(secrets.token_urlsafe(32))

# For API_KEY_ENCRYPTION_KEY
from cryptography.fernet import Fernet
print(Fernet.generate_key().decode())
```

### 2.5 Deploy
1. Click "Create Web Service"
2. Render will automatically build and deploy your backend
3. Note your backend URL: `https://your-backend-app.onrender.com`

## Step 3: Deploy Frontend to Vercel

### 3.1 Update Frontend Configuration
Update `frontend/vercel.json` with your actual backend URL:
```json
{
  "framework": "nextjs",
  "env": {
    "NEXT_PUBLIC_API_URL": "https://your-actual-backend-app.onrender.com"
  },
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "https://your-actual-backend-app.onrender.com/api/$1"
    }
  ]
}
```

### 3.2 Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Click "Import Project"
4. Select your repository
5. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### 3.3 Configure Environment Variables
In Vercel project settings, add:
```
NEXT_PUBLIC_API_URL=https://your-backend-app.onrender.com
```

### 3.4 Deploy
1. Click "Deploy"
2. Vercel will build and deploy your frontend
3. Note your frontend URL: `https://your-app.vercel.app`

## Step 4: Update CORS Settings

### 4.1 Update Backend CORS
In your Render backend environment variables, update:
```
ALLOWED_ORIGINS=https://your-actual-app.vercel.app
```

### 4.2 Redeploy Backend
After updating CORS, trigger a new deployment in Render.

## Step 5: Test Your Deployment

### 5.1 Backend Health Check
Visit: `https://your-backend-app.onrender.com/health`
Should return:
```json
{
  "status": "healthy",
  "timestamp": "2025-07-14T...",
  "service": "Flowgenix",
  "version": "1.0.0"
}
```

### 5.2 Frontend Access
Visit: `https://your-app.vercel.app`
Should load your FlowGenix application.

### 5.3 Test Full Workflow
1. Create an account
2. Upload a document
3. Create a workflow
4. Execute the workflow
5. Verify document context works

## ChromaDB in Production

### How It Works Now:
- ✅ **Embedded Mode**: ChromaDB runs inside your FastAPI process
- ✅ **File Persistence**: Data persists to `/opt/render/project/src/chroma_db`
- ✅ **No External Dependencies**: No separate ChromaDB server needed
- ✅ **Free Tier Compatible**: Works within Render's resource limits

### Benefits:
- **Simpler Deployment**: One less service to manage
- **Cost Effective**: No additional ChromaDB hosting costs
- **Better Performance**: No network latency for vector operations
- **Automatic Persistence**: Data survives container restarts

### Limitations:
- **Single Instance**: Can't share ChromaDB between multiple backend instances
- **Storage Limits**: Limited by Render's disk space (should be sufficient for most use cases)

## Troubleshooting

### Common Issues:

1. **CORS Errors**:
   - Ensure `ALLOWED_ORIGINS` in backend matches your Vercel URL exactly
   - Check for trailing slashes

2. **ChromaDB Issues**:
   - Verify `CHROMA_PERSIST_DIRECTORY` path is writable
   - Check backend logs for ChromaDB initialization

3. **File Upload Issues**:
   - Ensure `UPLOAD_DIR` path exists and is writable
   - Check file size limits

4. **Database Connection**:
   - Verify `DATABASE_URL` is correct
   - Ensure database migrations ran successfully

### Logs:
- **Render Backend**: Check deployment logs in Render dashboard
- **Vercel Frontend**: Check function logs in Vercel dashboard

## Performance Notes

### Render Free Tier:
- **Sleep Mode**: Apps sleep after 15 minutes of inactivity
- **Cold Start**: First request after sleep takes longer
- **Resource Limits**: 512MB RAM, shared CPU

### Optimization Tips:
1. **Keep-Alive**: Consider adding a cron job to ping your backend
2. **Caching**: Implement response caching where appropriate
3. **File Cleanup**: Consider periodic cleanup of old uploaded files

## Security Considerations

1. **Environment Variables**: Never commit secrets to version control
2. **API Keys**: Store user API keys encrypted (already implemented)
3. **File Uploads**: Validate file types and sizes (already implemented)
4. **CORS**: Keep ALLOWED_ORIGINS restrictive

## Monitoring

- **Health Checks**: Available at `/health` endpoint
- **Metrics**: Available at `/metrics` endpoint (if enabled)
- **Logs**: Monitor via Render and Vercel dashboards

Your FlowGenix application is now ready for production with embedded ChromaDB! 🚀
