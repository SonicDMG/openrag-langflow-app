# Docker Deployment Guide

This guide covers building and running the OpenRAG Langflow App using Docker.

## Prerequisites

- Docker installed (version 20.10 or higher)
- Docker Compose (optional, for easier local testing)
- Environment variables configured (see below)

## Quick Start

### Option 1: Using Docker Compose (Recommended for Local Testing)

1. **Set up environment variables**

   Create a `.env` file in the project root (one level up from `typescript/`):
   ```bash
   cd ..
   cp .env.example .env
   # Edit .env with your values
   ```

2. **Build and run**
   ```bash
   cd typescript
   docker-compose up --build
   ```

3. **Access the application**
   - Open http://localhost:3000
   - Health check: http://localhost:3000/api/health

4. **Stop the application**
   ```bash
   docker-compose down
   ```

### Option 2: Using Docker CLI

1. **Build the image**
   ```bash
   cd typescript
   docker build -t openrag-langflow-app:latest .
   ```

2. **Run the container**
   ```bash
   docker run -d \
     --name openrag-app \
     -p 3000:3000 \
     -e OPENRAG_API_KEY=your_api_key \
     -e OPENRAG_URL=http://localhost:3000 \
     -v $(pwd)/../characters:/app/characters:ro \
     openrag-langflow-app:latest
   ```

3. **View logs**
   ```bash
   docker logs -f openrag-app
   ```

4. **Stop the container**
   ```bash
   docker stop openrag-app
   docker rm openrag-app
   ```

## Environment Variables

### Required Variables

```bash
OPENRAG_API_KEY=orag_your_api_key_here
OPENRAG_URL=http://localhost:3000
```

### Optional Variables

```bash
# EverArt (for image generation in Battle Arena)
EVERART_API_KEY=your_everart_key

# Langflow (for character image analysis)
LANGFLOW_BASE_URL=http://localhost:7860
LANGFLOW_VISION_FLOW_ID=your_flow_id
LANGFLOW_API_KEY=your_langflow_key
LANGFLOW_CHAT_INPUT_ID=ChatInput

# Astra DB (for character storage)
ASTRA_DB_ENDPOINT=https://your-database-id.apps.astra.datastax.com
ASTRA_DB_APPLICATION_TOKEN=AstraCS:your_token

# Security Configuration
MAX_FILE_SIZE_MB=5
MAX_IMAGE_DIMENSION=10000
IMAGE_RESIZE_DIMENSION=1024
```

## IBM Cloud Code Engine Deployment

### Step 1: Build and Push to Docker Hub

1. **Login to Docker Hub**
   ```bash
   docker login
   ```

2. **Build and push the image for linux/amd64 (required for Code Engine)**
   ```bash
   docker buildx build --platform linux/amd64 -t sonicdmg/battle-arena:latest --push .
   ```
   
   Note: This uses `docker buildx` which builds and pushes in one step. If you don't have buildx, you can use:
   ```bash
   docker build --platform linux/amd64 -t sonicdmg/battle-arena:latest --load .
   docker push sonicdmg/battle-arena:latest
   ```

### Step 2: Deploy to Code Engine

1. **Install IBM Cloud CLI** (if not already installed)
   ```bash
   curl -fsSL https://clis.cloud.ibm.com/install/linux | sh
   ```

2. **Login to IBM Cloud**
   ```bash
   ibmcloud login
   ibmcloud target --cf
   ```

3. **Create a Code Engine project** (if not exists)
   ```bash
   ibmcloud ce project create --name battle-arena
   ibmcloud ce project select --name battle-arena
   ```

4. **Create secrets for environment variables**
   ```bash
   # Create secret for OpenRAG API key
   ibmcloud ce secret create --name openrag-secrets \
     --from-literal OPENRAG_API_KEY=your_api_key \
     --from-literal OPENRAG_URL=your_openrag_url
   
   # Optional: Create secret for other services
   ibmcloud ce secret create --name service-secrets \
     --from-literal EVERART_API_KEY=your_everart_key \
     --from-literal ASTRA_DB_APPLICATION_TOKEN=your_token \
     --from-literal ASTRA_DB_ENDPOINT=your_endpoint \
     --from-literal LANGFLOW_BASE_URL=your_langflow_url \
     --from-literal LANGFLOW_VISION_FLOW_ID=your_flow_id \
     --from-literal LANGFLOW_API_KEY=your_langflow_key
   ```

5. **Deploy the application**
   ```bash
   ibmcloud ce application create \
     --name battle-arena \
     --image docker.io/sonicdmg/battle-arena:latest \
     --port 3000 \
     --min-scale 1 \
     --max-scale 3 \
     --cpu 1 \
     --memory 2G \
     --env-from-secret openrag-secrets \
     --env-from-secret service-secrets
   ```

6. **Get the application URL**
   ```bash
   ibmcloud ce application get --name battle-arena
   ```

### Step 3: Update the Application

```bash
# Build and push new version
docker buildx build --platform linux/amd64 -t sonicdmg/battle-arena:v2 --push .

# Update Code Engine application
ibmcloud ce application update \
  --name battle-arena \
  --image docker.io/sonicdmg/battle-arena:v2
```

## Health Checks

The application includes a health check endpoint at `/api/health`:

```bash
# Test locally
curl http://localhost:3000/api/health

# Test on Code Engine
curl https://your-app-url.appdomain.cloud/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-01-15T17:54:00.000Z",
  "service": "openrag-langflow-app"
}
```

## Troubleshooting

### Build Issues

**Problem**: Build fails with "Lockfile not found"
```bash
# Solution: Ensure package-lock.json exists
cd typescript
npm install
```

**Problem**: Out of memory during build
```bash
# Solution: Increase Docker memory limit
# Docker Desktop > Settings > Resources > Memory (increase to 4GB+)
```

### Runtime Issues

**Problem**: Container exits immediately
```bash
# Check logs
docker logs openrag-app

# Common causes:
# - Missing required environment variables
# - Port 3000 already in use
# - Invalid configuration
```

**Problem**: Cannot connect to OpenRAG
```bash
# Verify OpenRAG is running
curl http://localhost:3000/health

# Check network connectivity from container
docker exec openrag-app curl http://host.docker.internal:3000/health
```

**Problem**: Characters not loading in Battle Arena
```bash
# Ensure characters directory is mounted
docker run -v $(pwd)/../characters:/app/characters:ro ...
```

### Code Engine Issues

**Problem**: Application not starting
```bash
# Check application logs
ibmcloud ce application logs --name openrag-app

# Check application events
ibmcloud ce application events --name openrag-app
```

**Problem**: Environment variables not set
```bash
# Verify secrets exist
ibmcloud ce secret list

# Update secret
ibmcloud ce secret update --name openrag-secrets \
  --from-literal OPENRAG_API_KEY=new_key
```

## Security Considerations

The Docker image includes several security features:

- ✅ **Non-root user**: Application runs as user `nextjs` (UID 1001)
- ✅ **Minimal base image**: Alpine Linux for smaller attack surface
- ✅ **Multi-stage build**: Only production dependencies included
- ✅ **Security headers**: CSP, HSTS, X-Frame-Options configured
- ✅ **Health checks**: Automatic container health monitoring
- ✅ **Read-only volumes**: Character data mounted read-only

## Performance Optimization

### Build Cache

To speed up builds, Docker caches layers. To clear cache:
```bash
docker build --no-cache -t openrag-langflow-app:latest .
```

### Image Size

Current image size: ~500MB (optimized with Alpine and standalone output)

To check image size:
```bash
docker images openrag-langflow-app
```

### Resource Limits

For Code Engine, recommended settings:
- **CPU**: 1 vCPU (minimum), 2 vCPU (recommended)
- **Memory**: 2GB (minimum), 4GB (recommended for image generation)
- **Min Scale**: 1 (always-on) or 0 (scale to zero)
- **Max Scale**: 3-5 (based on expected load)

## Next Steps

- Review [SECURITY.md](SECURITY.md) for security implementation details
- Configure monitoring and logging in Code Engine
- Set up CI/CD pipeline for automated deployments
- Configure custom domain and SSL certificate

## Support

For issues or questions:
- Check the [main README](../README.md)
- Review [TypeScript README](README.md)
- Check Docker logs: `docker logs openrag-app`