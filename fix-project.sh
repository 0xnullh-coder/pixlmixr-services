#!/bin/bash

# Fix Google Cloud project configuration
echo "🔧 Fixing Google Cloud Project Configuration"
echo "==========================================="
echo ""

# Show current configuration
echo "Current configuration:"
echo "  Account: $(gcloud config get-value account)"
echo "  Project: $(gcloud config get-value project)"
echo ""

# List available projects
echo "📋 Available projects for your account:"
gcloud projects list --format="table(projectId,name,projectNumber)"
echo ""

# Set to pixlmixr-prod
echo "🔄 Switching to pixlmixr-prod..."
gcloud config set project pixlmixr-prod

# Verify the switch
CURRENT_PROJECT=$(gcloud config get-value project)
if [ "$CURRENT_PROJECT" = "pixlmixr-prod" ]; then
    echo "✅ Successfully switched to pixlmixr-prod!"
else
    echo "❌ Failed to switch projects"
    echo "Please manually run: gcloud config set project pixlmixr-prod"
    exit 1
fi

echo ""
echo "✨ Project configuration fixed!"
echo "You can now run: ./deploy-simple.sh"