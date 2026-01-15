#!/bin/bash
# Deploy Battle Arena to IBM Cloud Code Engine
# Usage: ./deploy-to-code-engine.sh

set -e

echo "🚀 Deploying Battle Arena to IBM Cloud Code Engine"
echo ""

# Configuration
APP_NAME="battle-arena"
DOCKER_IMAGE="sonicdmg/battle-arena:latest"
PROJECT_NAME="battle-arena"

# Step 1: Build and push Docker image for linux/amd64
echo "Do you want to build and push the Docker image? (y/n)"
echo "(Skip if image is already pushed to Docker Hub)"
read -r BUILD_IMAGE

if [ "$BUILD_IMAGE" = "y" ]; then
    echo "📦 Building and pushing Docker image for linux/amd64..."
    echo "This may take a few minutes..."
    docker buildx build --platform linux/amd64 -t $DOCKER_IMAGE --push .
else
    echo "⏭️  Skipping Docker build (using existing image: $DOCKER_IMAGE)"
fi

# Step 2: Ensure resource group is targeted
echo ""
echo "🔧 Checking IBM Cloud configuration..."

# Check if a resource group is targeted
CURRENT_RG=$(ibmcloud target --output json 2>/dev/null | grep -o '"resource_group":{"name":"[^"]*"' | cut -d'"' -f6)

if [ -z "$CURRENT_RG" ]; then
    echo "No resource group targeted. Listing available resource groups..."
    ibmcloud resource groups
    echo ""
    echo "Please enter the resource group name to use:"
    read -r RESOURCE_GROUP
    ibmcloud target -g "$RESOURCE_GROUP"
else
    echo "Using resource group: $CURRENT_RG"
fi

# Step 3: Select or create Code Engine project
echo ""
echo "🔧 Setting up Code Engine project..."
if ibmcloud ce project get --name $PROJECT_NAME &>/dev/null; then
    echo "Project $PROJECT_NAME exists, selecting it..."
    ibmcloud ce project select --name $PROJECT_NAME
else
    echo "Creating new project $PROJECT_NAME..."
    ibmcloud ce project create --name $PROJECT_NAME
    ibmcloud ce project select --name $PROJECT_NAME
fi

# Step 4: Check if secrets exist, create if not
echo ""
echo "🔐 Setting up secrets..."

# Check if openrag-secrets exists
if ! ibmcloud ce secret get --name openrag-secrets &>/dev/null; then
    echo "Creating openrag-secrets..."
    echo "Please enter your OPENRAG_API_KEY:"
    read -r OPENRAG_API_KEY
    echo "Please enter your OPENRAG_URL:"
    read -r OPENRAG_URL
    
    ibmcloud ce secret create --name openrag-secrets \
        --from-literal OPENRAG_API_KEY="$OPENRAG_API_KEY" \
        --from-literal OPENRAG_URL="$OPENRAG_URL"
else
    echo "openrag-secrets already exists"
fi

# Check if service-secrets exists
if ! ibmcloud ce secret get --name service-secrets &>/dev/null; then
    echo ""
    echo "Do you want to configure optional services (EverArt, Astra DB, Langflow)? (y/n)"
    read -r CONFIGURE_SERVICES
    
    if [ "$CONFIGURE_SERVICES" = "y" ]; then
        echo "Please enter your EVERART_API_KEY (or press Enter to skip):"
        read -r EVERART_API_KEY
        echo "Please enter your ASTRA_DB_APPLICATION_TOKEN (or press Enter to skip):"
        read -r ASTRA_DB_TOKEN
        echo "Please enter your ASTRA_DB_ENDPOINT (or press Enter to skip):"
        read -r ASTRA_DB_ENDPOINT
        echo "Please enter your LANGFLOW_BASE_URL (or press Enter to skip):"
        read -r LANGFLOW_URL
        echo "Please enter your LANGFLOW_VISION_FLOW_ID (or press Enter to skip):"
        read -r LANGFLOW_FLOW_ID
        echo "Please enter your LANGFLOW_API_KEY (or press Enter to skip):"
        read -r LANGFLOW_API_KEY
        
        ibmcloud ce secret create --name service-secrets \
            ${EVERART_API_KEY:+--from-literal EVERART_API_KEY="$EVERART_API_KEY"} \
            ${ASTRA_DB_TOKEN:+--from-literal ASTRA_DB_APPLICATION_TOKEN="$ASTRA_DB_TOKEN"} \
            ${ASTRA_DB_ENDPOINT:+--from-literal ASTRA_DB_ENDPOINT="$ASTRA_DB_ENDPOINT"} \
            ${LANGFLOW_URL:+--from-literal LANGFLOW_BASE_URL="$LANGFLOW_URL"} \
            ${LANGFLOW_FLOW_ID:+--from-literal LANGFLOW_VISION_FLOW_ID="$LANGFLOW_FLOW_ID"} \
            ${LANGFLOW_API_KEY:+--from-literal LANGFLOW_API_KEY="$LANGFLOW_API_KEY"}
    fi
else
    echo "service-secrets already exists"
fi

# Step 5: Deploy or update application
echo ""
if ibmcloud ce application get --name $APP_NAME &>/dev/null; then
    echo "🔄 Updating existing application..."
    ibmcloud ce application update \
        --name $APP_NAME \
        --image docker.io/$DOCKER_IMAGE
else
    echo "🆕 Creating new application..."
    ibmcloud ce application create \
        --name $APP_NAME \
        --image docker.io/$DOCKER_IMAGE \
        --port 3000 \
        --min-scale 1 \
        --max-scale 3 \
        --cpu 1 \
        --memory 2G \
        --env-from-secret openrag-secrets \
        --env-from-secret service-secrets
fi

# Step 6: Get application URL
echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Application details:"
ibmcloud ce application get --name $APP_NAME

echo ""
echo "🌐 Your application URL:"
ibmcloud ce application get --name $APP_NAME --output url

echo ""
echo "🎉 Battle Arena is now deployed to IBM Cloud Code Engine!"

# Made with Bob
