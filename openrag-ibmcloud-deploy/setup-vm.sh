#!/bin/bash
# OpenRAG Installation Script for IBM Cloud Ubuntu VM
# This script automates the installation process documented in QUICK-START-IBM-CLOUD.md

set -e

echo "================================================"
echo "OpenRAG Installation for IBM Cloud"
echo "================================================"
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    echo "❌ Please do not run this script as root"
    echo "   Run as: bash install-openrag-ibm-cloud.sh"
    exit 1
fi

# Check if running on Ubuntu
if [ ! -f /etc/os-release ] || ! grep -q "Ubuntu" /etc/os-release; then
    echo "⚠️  Warning: This script is designed for Ubuntu"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    [[ ! $REPLY =~ ^[Yy]$ ]] && exit 1
fi

echo "📦 Step 1: Updating system packages..."
sudo apt update && sudo apt upgrade -y

echo ""
echo "🐳 Step 2: Installing Docker..."
if command -v docker &> /dev/null; then
    echo "✅ Docker already installed: $(docker --version)"
else
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    echo "✅ Docker installed"
fi

echo ""
echo "🔧 Step 3: Installing additional tools..."
sudo apt install -y xclip git jq

echo ""
echo "🧹 Step 4: Cleaning up any Podman symlinks..."
sudo rm -f /usr/local/bin/docker 2>/dev/null || true
sudo rm -f /usr/local/bin/docker-compose 2>/dev/null || true

echo ""
echo "📥 Step 5: Installing uv (Python package runner)..."
if command -v uv &> /dev/null; then
    echo "✅ uv already installed"
else
    curl -LsSf https://astral.sh/uv/install.sh | sh
    export PATH="$HOME/.local/bin:$PATH"
    echo "✅ uv installed"
fi

echo ""
echo "================================================"
echo "✅ Installation Complete!"
echo "================================================"
echo ""
echo "IMPORTANT: You must logout and login again for Docker group to take effect"
echo ""
echo "After re-login, run:"
echo "  uvx openrag"
echo ""
echo "This will launch the OpenRAG TUI for configuration."
echo ""
echo "================================================"
echo ""
read -p "Logout now? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Logging out..."
    sleep 2
    kill -HUP $PPID
fi

# Made with Bob
