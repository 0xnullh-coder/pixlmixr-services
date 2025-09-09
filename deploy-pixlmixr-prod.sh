#!/bin/bash

# Deployment script specifically for pixlmixr-prod
echo "🚀 PIXLMIXR-PROD Deployment Script"
echo "===================================="
echo ""

# Force set to pixlmixr-prod
echo "📦 Setting project to pixlmixr-prod..."
gcloud config set project pixlmixr-prod

# Verify we're on the right project
CURRENT_PROJECT=$(gcloud config get-value project)
if [ "$CURRENT_PROJECT" != "pixlmixr-prod" ]; then
    echo "❌ Failed to set project to pixlmixr-prod"
    echo "You may need to authenticate first:"
    echo "  gcloud auth login"
    exit 1
fi

echo "✅ Using project: pixlmixr-prod"
echo "📍 Region: us-central1"
echo ""

# Enable required APIs
echo "🔧 Enabling required APIs..."
gcloud services enable run.googleapis.com --project pixlmixr-prod
gcloud services enable cloudbuild.googleapis.com --project pixlmixr-prod
gcloud services enable artifactregistry.googleapis.com --project pixlmixr-prod

echo ""
echo "🎨 Deploying Creation Service..."
cd creation-service

# Deploy with explicit project
gcloud run deploy creation-service \
    --source . \
    --project pixlmixr-prod \
    --region us-central1 \
    --allow-unauthenticated \
    --memory 2Gi \
    --timeout 60 \
    --set-env-vars "GOOGLE_CLOUD_PROJECT=pixlmixr-prod,NODE_ENV=production"

# Get service URL
CREATION_URL=$(gcloud run services describe creation-service \
    --project pixlmixr-prod \
    --region us-central1 \
    --format 'value(status.url)')

echo "✅ Creation Service deployed: $CREATION_URL"
cd ..

echo ""
echo "🪙 Deploying Minting Service..."
cd minting-service

# Deploy with explicit project
gcloud run deploy minting-service \
    --source . \
    --project pixlmixr-prod \
    --region us-central1 \
    --allow-unauthenticated \
    --memory 1Gi \
    --timeout 120 \
    --set-env-vars "GOOGLE_CLOUD_PROJECT=pixlmixr-prod,NODE_ENV=production"

# Get service URL
MINTING_URL=$(gcloud run services describe minting-service \
    --project pixlmixr-prod \
    --region us-central1 \
    --format 'value(status.url)')

echo "✅ Minting Service deployed: $MINTING_URL"
cd ..

echo ""
echo "===================================="
echo "✅ DEPLOYMENT COMPLETE!"
echo ""
echo "Service URLs:"
echo "  Creation: $CREATION_URL"
echo "  Minting: $MINTING_URL"
echo ""
echo "Next steps:"
echo "1. Add environment variables in Cloud Run console"
echo "2. Update Cloudflare with these URLs"