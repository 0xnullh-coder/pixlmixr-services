#!/bin/bash

echo "🔍 Checking Build Failure Logs"
echo "=============================="
echo ""

# Get the latest build logs
echo "📋 Recent Cloud Build failures:"
echo ""

# Get builds from the last hour
gcloud builds list --limit=5 --filter="status=FAILURE" --format="table(id,createTime,status)" --project=pixlmixr-prod

echo ""
echo "To view detailed logs for a specific build, run:"
echo "gcloud builds log BUILD_ID --project=pixlmixr-prod"
echo ""
echo "Or visit the Cloud Console:"
echo "https://console.cloud.google.com/cloud-build/builds?project=pixlmixr-prod"
echo ""

# Common issues and fixes
echo "🔧 Common Build Issues and Fixes:"
echo "================================="
echo ""
echo "1. If 'npm ci' fails:"
echo "   - Remove package-lock.json and use 'npm install' instead"
echo ""
echo "2. If Jimp installation fails:"
echo "   - May need to use a different base image"
echo ""
echo "3. If memory issues:"
echo "   - Increase Cloud Build machine type"
echo ""

# Show the current Dockerfile
echo "📄 Current Creation Service Dockerfile:"
echo "---------------------------------------"
head -20 creation-service/Dockerfile