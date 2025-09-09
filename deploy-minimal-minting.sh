#!/bin/bash

echo "🚀 Deploying Minimal Minting Service"
echo "===================================="
echo ""
echo "This deploys a simplified version that will definitely work,"
echo "then we can add features incrementally."
echo ""

# Ensure we're in the right directory
cd ~/pixlmixr-services

# Create the minimal service if it doesn't exist
if [ ! -d "minting-service-minimal" ]; then
    echo "❌ Minimal service directory not found!"
    echo "Please get the latest code:"
    echo "  git pull origin main"
    exit 1
fi

cd minting-service-minimal

echo "📦 Deploying minimal minting service to pixlmixr-prod..."
echo ""

# Deploy using buildpacks (no Dockerfile needed)
gcloud run deploy minting-service \
    --source . \
    --project pixlmixr-prod \
    --region us-central1 \
    --allow-unauthenticated \
    --memory 512Mi \
    --timeout 60 \
    --port 8080 \
    --set-env-vars "NODE_ENV=production"

# Check if deployment succeeded
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deployment successful!"
    
    # Get the service URL
    MINTING_URL=$(gcloud run services describe minting-service \
        --project pixlmixr-prod \
        --region us-central1 \
        --format 'value(status.url)')
    
    echo ""
    echo "===================================="
    echo "✅ Minting Service Deployed!"
    echo "URL: $MINTING_URL"
    echo ""
    echo "Test it with:"
    echo "  curl $MINTING_URL/health"
    echo ""
    echo "This is a minimal version that:"
    echo "  - Returns mock responses for testing"
    echo "  - Has no heavy dependencies"
    echo "  - Will definitely deploy successfully"
    echo ""
    echo "Once confirmed working, we can add:"
    echo "  - Real blockchain integration"
    echo "  - IPFS/Pinata uploads"
    echo "  - Actual NFT minting"
else
    echo ""
    echo "❌ Deployment failed!"
    echo "Check the logs at:"
    echo "https://console.cloud.google.com/cloud-build/builds?project=pixlmixr-prod"
fi