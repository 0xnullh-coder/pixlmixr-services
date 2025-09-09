#!/bin/bash

# Simple deployment script for PIXLMIXR Services
# This version uses the current project and minimal configuration

echo "🚀 Simple Deployment for PIXLMIXR Services"
echo "=========================================="

# Get current project
PROJECT_ID=$(gcloud config get-value project)
REGION="us-central1"

if [ -z "$PROJECT_ID" ]; then
    echo "❌ No Google Cloud project configured!"
    echo "Please run: gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

echo "📦 Using project: $PROJECT_ID"
echo "📍 Region: $REGION"
echo ""

# Enable required APIs
echo "🔧 Enabling required APIs..."
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com

# Deploy Creation Service
echo ""
echo "🎨 Deploying Creation Service..."
cd creation-service
gcloud run deploy creation-service \
    --source . \
    --region ${REGION} \
    --allow-unauthenticated \
    --memory 2Gi \
    --timeout 60

# Get service URL
CREATION_URL=$(gcloud run services describe creation-service --region ${REGION} --format 'value(status.url)')
echo "✅ Creation Service: $CREATION_URL"

cd ..

# Deploy Minting Service
echo ""
echo "🪙 Deploying Minting Service..."
cd minting-service
gcloud run deploy minting-service \
    --source . \
    --region ${REGION} \
    --allow-unauthenticated \
    --memory 1Gi \
    --timeout 120

# Get service URL
MINTING_URL=$(gcloud run services describe minting-service --region ${REGION} --format 'value(status.url)')
echo "✅ Minting Service: $MINTING_URL"

cd ..

echo ""
echo "=========================================="
echo "✅ Deployment Complete!"
echo ""
echo "Service URLs:"
echo "  Creation: $CREATION_URL"
echo "  Minting: $MINTING_URL"
echo ""
echo "Next steps:"
echo "1. Set environment variables in Cloud Run console"
echo "2. Update Cloudflare with these URLs"
echo "3. Test the services"