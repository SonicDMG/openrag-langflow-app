# OpenRAG IBM Cloud Setup

Complete setup instructions for deploying OpenRAG to IBM Cloud.

## Prerequisites

- IBM Cloud account
- IBM Cloud CLI with VPC plugin: `ibmcloud plugin install vpc-infrastructure`
- SSH key configured in IBM Cloud

## Step 1: Create IBM Cloud Infrastructure

### Create VPC and Networking

```bash
# Set variables
REGION="us-east"
ZONE="us-east-1"

# Create VPC
ibmcloud is vpc-create openrag-vpc

# Get VPC ID
VPC_ID=$(ibmcloud is vpcs --output json | jq -r '.[] | select(.name=="openrag-vpc") | .id')

# Create subnet
ibmcloud is subnet-create openrag-subnet $VPC_ID --zone $ZONE --ipv4-cidr-block 10.240.0.0/24

# Get subnet ID
SUBNET_ID=$(ibmcloud is subnets --output json | jq -r '.[] | select(.name=="openrag-subnet") | .id')

# Create public gateway
ibmcloud is public-gateway-create openrag-gateway $VPC_ID $ZONE

# Get gateway ID
GATEWAY_ID=$(ibmcloud is public-gateways --output json | jq -r '.[] | select(.name=="openrag-gateway") | .id')

# Attach gateway to subnet
ibmcloud is subnet-update $SUBNET_ID --public-gateway $GATEWAY_ID
```

### Create VM Instance

```bash
# Get your SSH key ID
KEY_ID=$(ibmcloud is keys --output json | jq -r '.[0].id')

# Create instance
ibmcloud is instance-create openrag-demo $VPC_ID $ZONE bx2-8x32 $SUBNET_ID \
  --image ibm-ubuntu-22-04-5-minimal-amd64-9 \
  --keys $KEY_ID \
  --boot-volume '{"name":"boot-vol","volume":{"capacity":200,"profile":{"name":"general-purpose"}}}'
```

### Assign Public IP

```bash
# Create floating IP
ibmcloud is floating-ip-reserve openrag-ip --zone $ZONE

# Get IDs
FLOATING_IP_ID=$(ibmcloud is floating-ips --output json | jq -r '.[] | select(.name=="openrag-ip") | .id')
FLOATING_IP=$(ibmcloud is floating-ips --output json | jq -r '.[] | select(.name=="openrag-ip") | .address')
INSTANCE_ID=$(ibmcloud is instances --output json | jq -r '.[] | select(.name=="openrag-demo") | .id')
VNI_ID=$(ibmcloud is instance $INSTANCE_ID --output json | jq -r '.network_attachments[0].virtual_network_interface.id')

# Attach floating IP
ibmcloud is virtual-network-interface-floating-ip-add $VNI_ID $FLOATING_IP_ID

echo "Your OpenRAG IP: $FLOATING_IP"
```

### Configure Security Group

```bash
# Get security group ID
SG_ID=$(ibmcloud is instance openrag-demo --output json | jq -r '.network_attachments[0].virtual_network_interface.security_groups[0].id')

# Add rules
ibmcloud is security-group-rule-add $SG_ID inbound tcp --port-min 22 --port-max 22
ibmcloud is security-group-rule-add $SG_ID inbound tcp --port-min 3000 --port-max 3000
ibmcloud is security-group-rule-add $SG_ID inbound tcp --port-min 8000 --port-max 8000
ibmcloud is security-group-rule-add $SG_ID inbound tcp --port-min 7860 --port-max 7860
```

## Step 2: Install OpenRAG

### Automated Installation (Recommended)

```bash
# SSH into VM
ssh ubuntu@$FLOATING_IP

# Download and run setup script
curl -fsSL https://raw.githubusercontent.com/YOUR-REPO/main/openrag-ibmcloud-deploy/setup-vm.sh -o setup-vm.sh
chmod +x setup-vm.sh
bash setup-vm.sh

# Logout when prompted
exit
```

### Manual Installation

```bash
# SSH into VM
ssh ubuntu@$FLOATING_IP

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
rm get-docker.sh

# Install tools
sudo apt install -y xclip git jq

# Install uv
curl -LsSf https://astral.sh/uv/install.sh | sh
export PATH="$HOME/.local/bin:$PATH"

# Logout and login
exit
```

## Step 3: Configure OpenRAG

```bash
# SSH back in
ssh ubuntu@$FLOATING_IP

# Launch OpenRAG TUI
uvx openrag
```

### Configuration Options

**Basic Setup (Recommended):**
- Quick configuration with defaults
- Minimal prompts

**Advanced Setup:**
- Full control over settings
- Custom configuration

### Required Settings

1. **OpenSearch Password**: Strong password (e.g., `MySecure123!`)
2. **AI Provider**: Choose one:
   - OpenAI: `sk-...`
   - Anthropic: `sk-ant-...`
   - Watsonx: API key + endpoint + project ID
3. **Langflow Secrets**: Auto-generated

### Optional Settings

- OAuth (skip for API-only)
- Custom ports (use defaults)

## Step 4: Verify Installation

```bash
# Check services
docker compose ps

# Test frontend
curl http://localhost:3000

# Test backend
curl http://localhost:8000/health
```

## Access OpenRAG

- **Frontend**: http://$FLOATING_IP:3000
- **Backend**: http://$FLOATING_IP:8000
- **API Docs**: http://$FLOATING_IP:8000/docs

## Next Steps

See [REFERENCE.md](REFERENCE.md) for:
- Creating API keys
- Using OpenRAG in your apps
- Management commands