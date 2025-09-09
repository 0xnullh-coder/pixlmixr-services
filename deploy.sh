#!/bin/bash

# PIXLMIXR Services Deployment Script for Google Cloud Run

set -e

echo "🚀 Deploying PIXLMIXR Services to Google Cloud Run..."

# Configuration
PROJECT_ID="pixlmixr"
REGION="us-central1"
SERVICE_ACCOUNT="pixlmixr-services@${PROJECT_ID}.iam.gserviceaccount.com"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    print_error "gcloud CLI is not installed. Please install it first."
    exit 1
fi

# Set the project
print_status "Setting Google Cloud project to ${PROJECT_ID}..."
gcloud config set project ${PROJECT_ID}

# Enable required APIs
print_status "Enabling required Google Cloud APIs..."
gcloud services enable run.googleapis.com \
    artifactregistry.googleapis.com \
    cloudbuild.googleapis.com \
    vision.googleapis.com \
    aiplatform.googleapis.com \
    storage.googleapis.com

# Create service account if it doesn't exist
print_status "Setting up service account..."
if ! gcloud iam service-accounts describe ${SERVICE_ACCOUNT} &> /dev/null; then
    gcloud iam service-accounts create pixlmixr-services \
        --display-name="PIXLMIXR Services Account"
    
    # Grant necessary permissions
    gcloud projects add-iam-policy-binding ${PROJECT_ID} \
        --member="serviceAccount:${SERVICE_ACCOUNT}" \
        --role="roles/storage.admin"
    
    gcloud projects add-iam-policy-binding ${PROJECT_ID} \
        --member="serviceAccount:${SERVICE_ACCOUNT}" \
        --role="roles/aiplatform.user"
    
    gcloud projects add-iam-policy-binding ${PROJECT_ID} \
        --member="serviceAccount:${SERVICE_ACCOUNT}" \
        --role="roles/cloudvision.user"
fi

# Create GCS bucket if it doesn't exist
BUCKET_NAME="pixlmixr-images"
if ! gsutil ls gs://${BUCKET_NAME} &> /dev/null; then
    print_status "Creating Google Cloud Storage bucket..."
    gsutil mb -p ${PROJECT_ID} -l ${REGION} gs://${BUCKET_NAME}/
    gsutil iam ch allUsers:objectViewer gs://${BUCKET_NAME}
fi

# Deploy Creation Service
print_status "Deploying Creation Service..."
cd creation-service

# Build and deploy
gcloud run deploy creation-service \
    --source . \
    --region ${REGION} \
    --platform managed \
    --allow-unauthenticated \
    --service-account ${SERVICE_ACCOUNT} \
    --set-env-vars "GOOGLE_CLOUD_PROJECT=${PROJECT_ID},GCS_BUCKET_NAME=${BUCKET_NAME},NODE_ENV=production" \
    --memory 2Gi \
    --cpu 2 \
    --timeout 60 \
    --concurrency 100 \
    --max-instances 10

# Get the service URL
CREATION_SERVICE_URL=$(gcloud run services describe creation-service --region ${REGION} --format 'value(status.url)')
print_status "Creation Service deployed at: ${CREATION_SERVICE_URL}"

cd ..

# Deploy Minting Service
print_status "Deploying Minting Service..."
cd minting-service

# Build and deploy
gcloud run deploy minting-service \
    --source . \
    --region ${REGION} \
    --platform managed \
    --allow-unauthenticated \
    --service-account ${SERVICE_ACCOUNT} \
    --set-env-vars "GOOGLE_CLOUD_PROJECT=${PROJECT_ID},GCS_BUCKET_NAME=${BUCKET_NAME},NODE_ENV=production" \
    --memory 1Gi \
    --cpu 1 \
    --timeout 120 \
    --concurrency 50 \
    --max-instances 5

# Get the service URL
MINTING_SERVICE_URL=$(gcloud run services describe minting-service --region ${REGION} --format 'value(status.url)')
print_status "Minting Service deployed at: ${MINTING_SERVICE_URL}"

cd ..

# Print summary
echo ""
echo "========================================="
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo "========================================="
echo ""
echo "Service URLs:"
echo "  Creation Service: ${CREATION_SERVICE_URL}"
echo "  Minting Service: ${MINTING_SERVICE_URL}"
echo ""
echo "Next steps:"
echo "1. Add these URLs to your Cloudflare environment variables:"
echo "   CREATION_SERVICE_URL=${CREATION_SERVICE_URL}"
echo "   MINTING_SERVICE_URL=${MINTING_SERVICE_URL}"
echo ""
echo "2. Update your Cloudflare Workers to proxy to these services"
echo ""
echo "3. Test the services:"
echo "   curl ${CREATION_SERVICE_URL}/health"
echo "   curl ${MINTING_SERVICE_URL}/health"
echo ""