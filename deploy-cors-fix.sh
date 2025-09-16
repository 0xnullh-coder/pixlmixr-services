#!/bin/bash

echo "🔧 Deploying CORS-Fixed Creation Service"
echo "========================================="
echo ""
echo "This will fix the gallery and image loading issues"
echo ""

PROJECT_ID="pixlmixr-prod"
REGION="us-central1"

# Deploy the fixed creation service
echo "📦 Deploying fixed creation service..."
cd creation-service-cors-fix

gcloud run deploy creation-service \
    --source . \
    --project=$PROJECT_ID \
    --region=$REGION \
    --allow-unauthenticated \
    --memory 2Gi \
    --timeout 60 \
    --port 8080 \
    --set-env-vars "NODE_ENV=production,GOOGLE_CLOUD_PROJECT=$PROJECT_ID"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ CORS fix deployed successfully!"
    
    # Get the service URL
    SERVICE_URL=$(gcloud run services describe creation-service \
        --project=$PROJECT_ID \
        --region=$REGION \
        --format 'value(status.url)')
    
    echo ""
    echo "Service URL: $SERVICE_URL"
    echo ""
    echo "✨ The gallery and images should now load properly!"
    echo "Visit https://pixlmixr.app and try again"
else
    echo "❌ Deployment failed"
    echo "Check the logs for details"
fi