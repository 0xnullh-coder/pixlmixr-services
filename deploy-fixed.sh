#!/bin/bash

echo "🚀 Fixed Deployment Script for PIXLMIXR-PROD"
echo "============================================"
echo ""

# Ensure we're using pixlmixr-prod
gcloud config set project pixlmixr-prod

PROJECT_ID="pixlmixr-prod"
REGION="us-central1"

echo "📦 Project: $PROJECT_ID"
echo "📍 Region: $REGION"
echo ""

# Enable required APIs
echo "🔧 Enabling required APIs..."
gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com --project=$PROJECT_ID

echo ""
echo "🎨 Deploying Creation Service with fixed Dockerfile..."
cd creation-service

# Use the simple Dockerfile if it exists, otherwise fix the main one
if [ -f "Dockerfile.simple" ]; then
    mv Dockerfile Dockerfile.backup
    cp Dockerfile.simple Dockerfile
fi

# Deploy
gcloud run deploy creation-service \
    --source . \
    --project $PROJECT_ID \
    --region $REGION \
    --platform managed \
    --allow-unauthenticated \
    --memory 2Gi \
    --timeout 60 \
    --port 8080 \
    --set-env-vars "NODE_ENV=production,GOOGLE_CLOUD_PROJECT=$PROJECT_ID"

# Restore original Dockerfile if we backed it up
if [ -f "Dockerfile.backup" ]; then
    mv Dockerfile.backup Dockerfile
fi

# Get URL
CREATION_URL=$(gcloud run services describe creation-service --project $PROJECT_ID --region $REGION --format 'value(status.url)' 2>/dev/null)
if [ -n "$CREATION_URL" ]; then
    echo "✅ Creation Service: $CREATION_URL"
else
    echo "⚠️  Creation Service deployment may have failed"
fi

cd ..

echo ""
echo "🪙 Deploying Minting Service..."
cd minting-service

# Deploy
gcloud run deploy minting-service \
    --source . \
    --project $PROJECT_ID \
    --region $REGION \
    --platform managed \
    --allow-unauthenticated \
    --memory 1Gi \
    --timeout 120 \
    --port 8081 \
    --set-env-vars "NODE_ENV=production,GOOGLE_CLOUD_PROJECT=$PROJECT_ID"

# Get URL
MINTING_URL=$(gcloud run services describe minting-service --project $PROJECT_ID --region $REGION --format 'value(status.url)' 2>/dev/null)
if [ -n "$MINTING_URL" ]; then
    echo "✅ Minting Service: $MINTING_URL"
else
    echo "⚠️  Minting Service deployment may have failed"
fi

cd ..

echo ""
echo "============================================"
if [ -n "$CREATION_URL" ] && [ -n "$MINTING_URL" ]; then
    echo "✅ DEPLOYMENT SUCCESSFUL!"
    echo ""
    echo "Service URLs:"
    echo "  Creation: $CREATION_URL"
    echo "  Minting: $MINTING_URL"
else
    echo "⚠️  Deployment completed with issues"
    echo "Check the Cloud Build logs:"
    echo "https://console.cloud.google.com/cloud-build/builds?project=$PROJECT_ID"
fi