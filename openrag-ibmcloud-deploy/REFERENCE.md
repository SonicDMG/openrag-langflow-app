# OpenRAG Reference

Quick reference for managing and using OpenRAG on IBM Cloud.

## Creating API Keys

```bash
# SSH into VM
ssh ubuntu@<your-ip>

# Access backend container
docker exec -it openrag-backend bash

# Create API key
python -c "
from openrag_utils.settings import create_api_key
key = create_api_key('my-app')
print(f'API Key: {key}')
"

# Exit container
exit
```

API keys start with `orag_` prefix.

## Using OpenRAG

### Python

```python
from openrag import OpenRAG

client = OpenRAG(
    base_url="http://<your-ip>:8000",
    api_key="orag_your_key_here"
)

# Ingest documents
client.ingest_text(
    text="Your document content",
    metadata={"source": "demo", "type": "doc"}
)

# Chat
response = client.chat(
    message="What information do you have?",
    collection="default"
)
print(response)

# Search
results = client.search(
    query="search term",
    collection="default",
    limit=5
)
```

### TypeScript/JavaScript

```typescript
import { OpenRAG } from '@langflow/openrag-sdk';

const client = new OpenRAG({
  baseUrl: 'http://<your-ip>:8000',
  apiKey: 'orag_your_key_here'
});

// Ingest
await client.ingestText({
  text: 'Your document content',
  metadata: { source: 'demo' }
});

// Chat
const response = await client.chat({
  message: 'What information do you have?',
  collection: 'default'
});

// Search
const results = await client.search({
  query: 'search term',
  collection: 'default',
  limit: 5
});
```

### cURL

```bash
# Ingest document
curl -X POST http://<your-ip>:8000/api/ingest \
  -H "Authorization: Bearer orag_your_key" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Your document content",
    "metadata": {"source": "demo"}
  }'

# Chat
curl -X POST http://<your-ip>:8000/api/chat \
  -H "Authorization: Bearer orag_your_key" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What do you know?",
    "collection": "default"
  }'

# Search
curl -X POST http://<your-ip>:8000/api/search \
  -H "Authorization: Bearer orag_your_key" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "search term",
    "collection": "default",
    "limit": 5
  }'
```

## Management Commands

### Service Control

```bash
# Check status
docker compose ps

# View logs (all services)
docker compose logs -f

# View logs (specific service)
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f langflow
docker compose logs -f opensearch

# Restart services
docker compose restart

# Stop services
docker compose down

# Start services
docker compose up -d

# Rebuild and restart
docker compose up -d --build
```

### Data Management

```bash
# Backup data
tar -czf openrag-backup-$(date +%Y%m%d).tar.gz \
  opensearch-data/ openrag-documents/ flows/ keys/

# Restore data
tar -xzf openrag-backup-YYYYMMDD.tar.gz

# Clear all data (WARNING: destructive)
docker compose down -v
rm -rf opensearch-data openrag-documents flows keys
```

### System Monitoring

```bash
# Check disk usage
df -h

# Check memory
free -h

# Check Docker resources
docker stats

# Check container health
docker compose ps
docker inspect openrag-backend | jq '.[0].State.Health'
```

## Troubleshooting

### Services Won't Start

```bash
# Check Docker daemon
sudo systemctl status docker
sudo systemctl start docker

# Check logs for errors
docker compose logs

# Restart services
docker compose down
docker compose up -d
```

### Can't Access from Internet

```bash
# Verify security group rules
ibmcloud is security-group-rules <sg-id>

# Check if services are listening
sudo netstat -tlnp | grep -E '3000|8000|7860'

# Test locally
curl http://localhost:3000
curl http://localhost:8000/health
```

### Out of Disk Space

```bash
# Check disk usage
df -h

# Clean Docker
docker system prune -a
docker volume prune

# Clean logs
sudo journalctl --vacuum-time=7d
```

## Endpoints

| Service | Port | URL |
|---------|------|-----|
| Frontend | 3000 | http://\<ip\>:3000 |
| Backend API | 8000 | http://\<ip\>:8000 |
| API Docs | 8000 | http://\<ip\>:8000/docs |
| Langflow | 7860 | http://\<ip\>:7860 |

## Cost Management

**Monthly Cost**: ~$165-315 (bx2-8x32 instance)

**Save Money:**
```bash
# Stop VM when not in use
ibmcloud is instance-stop openrag-demo

# Start VM when needed
ibmcloud is instance-start openrag-demo

# Delete when done
ibmcloud is instance-delete openrag-demo
```

## Support

- **Docs**: https://docs.openr.ag
- **GitHub**: https://github.com/langflow-ai/openrag
- **Discord**: https://discord.gg/langflow