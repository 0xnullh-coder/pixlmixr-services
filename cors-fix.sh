#!/bin/bash

echo "🔧 Fixing CORS Issues for PIXLMIXR"
echo "==================================="
echo ""
echo "This script updates your Cloud Run services to properly handle CORS"
echo ""

PROJECT_ID="pixlmixr-prod"
REGION="us-central1"

# Update Creation Service
echo "📝 Updating Creation Service with CORS fix..."
gcloud run services update creation-service \
    --project=$PROJECT_ID \
    --region=$REGION \
    --update-env-vars="CORS_ORIGIN=https://pixlmixr.app,NODE_ENV=production" \
    --set-env-vars="ALLOWED_ORIGINS=https://pixlmixr.app https://minipixlmixr.pages.dev http://localhost:3000"

echo "✅ Creation Service updated"