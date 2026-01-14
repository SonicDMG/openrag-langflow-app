# OpenRAG IBM Cloud Deployment

Deploy OpenRAG to IBM Cloud Virtual Servers in 3 steps.

## Quick Start

```bash
# 1. Create IBM Cloud VM (see SETUP.md)
# 2. SSH into VM and run:
curl -fsSL https://raw.githubusercontent.com/YOUR-REPO/main/openrag-ibmcloud-deploy/setup-vm.sh | bash
# 3. After logout/login, run:
uvx openrag
```

## Files

- **[SETUP.md](SETUP.md)** - Complete setup instructions
- **[REFERENCE.md](REFERENCE.md)** - Commands and API usage
- **[setup-vm.sh](setup-vm.sh)** - Automated installation script

## What You Get

- OpenRAG running on IBM Cloud VM (8 vCPU, 32GB RAM)
- API key authentication for secure access
- Persistent data storage
- Cost: ~$165-315/month

## Support

- Docs: https://docs.openr.ag
- GitHub: https://github.com/langflow-ai/openrag