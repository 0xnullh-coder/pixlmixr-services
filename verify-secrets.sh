#!/bin/bash

echo "🔍 PIXLMIXR Secrets Verification"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get service URLs
echo "📡 Getting your service URLs..."
CREATION_URL=$(gcloud run services describe creation-service --project pixlmixr-prod --region us-central1 --format 'value(status.url)' 2>/dev/null)
MINTING_URL=$(gcloud run services describe minting-service --project pixlmixr-prod --region us-central1 --format 'value(status.url)' 2>/dev/null)

echo "Creation Service: $CREATION_URL"
echo "Minting Service: $MINTING_URL"
echo ""

# Check Creation Service
echo "🎨 Testing Creation Service..."
if [ -n "$CREATION_URL" ]; then
    HEALTH_RESPONSE=$(curl -s $CREATION_URL/health)
    if echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
        echo -e "${GREEN}✅ Creation Service is healthy${NC}"
        
        # Check environment variables
        echo "   Checking configuration..."
        ENV_VARS=$(gcloud run services describe creation-service --project pixlmixr-prod --region us-central1 --format 'value(spec.template.spec.containers[0].env[].name)' 2>/dev/null)
        
        if echo "$ENV_VARS" | grep -q "GOOGLE_CLOUD_PROJECT"; then
            echo -e "   ${GREEN}✓${NC} Google Cloud Project configured"
        fi
        
        if echo "$ENV_VARS" | grep -q "PINATA_JWT"; then
            echo -e "   ${GREEN}✓${NC} Pinata JWT configured"
        else
            echo -e "   ${YELLOW}⚠${NC} Pinata JWT not found"
        fi
        
        if echo "$ENV_VARS" | grep -q "GCS_BUCKET_NAME"; then
            echo -e "   ${GREEN}✓${NC} GCS Bucket configured"
        fi
    else
        echo -e "${RED}❌ Creation Service not responding properly${NC}"
    fi
else
    echo -e "${RED}❌ Creation Service not found${NC}"
fi

echo ""

# Check Minting Service
echo "🪙 Testing Minting Service..."
if [ -n "$MINTING_URL" ]; then
    HEALTH_RESPONSE=$(curl -s $MINTING_URL/health)
    if echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
        echo -e "${GREEN}✅ Minting Service is healthy${NC}"
        
        # Check environment variables
        echo "   Checking configuration..."
        ENV_VARS=$(gcloud run services describe minting-service --project pixlmixr-prod --region us-central1 --format 'value(spec.template.spec.containers[0].env[].name)' 2>/dev/null)
        
        if echo "$ENV_VARS" | grep -q "NFT_CONTRACT_ADDRESS"; then
            echo -e "   ${GREEN}✓${NC} NFT Contract Address configured"
        else
            echo -e "   ${YELLOW}⚠${NC} NFT Contract Address not found"
        fi
        
        if echo "$ENV_VARS" | grep -q "MINTER_PRIVATE_KEY"; then
            echo -e "   ${GREEN}✓${NC} Minter Private Key configured"
        else
            echo -e "   ${YELLOW}⚠${NC} Minter Private Key not found"
        fi
        
        if echo "$ENV_VARS" | grep -q "PINATA_JWT"; then
            echo -e "   ${GREEN}✓${NC} Pinata JWT configured"
        else
            echo -e "   ${YELLOW}⚠${NC} Pinata JWT not found"
        fi
    else
        echo -e "${RED}❌ Minting Service not responding properly${NC}"
    fi
else
    echo -e "${RED}❌ Minting Service not found${NC}"
fi

echo ""
echo "=================================="
echo ""

# Test actual functionality
echo "🧪 Testing Actual Functionality..."
echo ""

# Test Creation Service with mock data
echo "Testing image analysis endpoint..."
TEST_CREATE=$(curl -s -X POST $CREATION_URL/create \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0fEd0",
    "images": ["data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="],
    "styles": ["Abstract"],
    "highRes": false
  }' 2>/dev/null)

if echo "$TEST_CREATE" | grep -q "success\|masterpieceId\|imageUrl"; then
    echo -e "${GREEN}✅ Creation endpoint working!${NC}"
    echo "   Response preview: $(echo "$TEST_CREATE" | head -c 100)..."
else
    echo -e "${YELLOW}⚠ Creation endpoint returned:${NC}"
    echo "   $(echo "$TEST_CREATE" | head -c 200)"
fi

echo ""

# Test Minting Service
echo "Testing mint endpoint..."
TEST_MINT=$(curl -s -X POST $MINTING_URL/mint \
  -H "Content-Type: application/json" \
  -d '{
    "masterpieceId": "test-123",
    "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0fEd0"
  }' 2>/dev/null)

if echo "$TEST_MINT" | grep -q "success\|transactionHash"; then
    echo -e "${GREEN}✅ Minting endpoint working!${NC}"
    echo "   Response preview: $(echo "$TEST_MINT" | head -c 100)..."
else
    echo -e "${YELLOW}⚠ Minting endpoint returned:${NC}"
    echo "   $(echo "$TEST_MINT" | head -c 200)"
fi

echo ""
echo "=================================="
echo ""

# Check Cloudflare configuration
echo "🌐 Checking Cloudflare Connection..."
echo ""
echo "Visit https://pixlmixr.app and try:"
echo "1. Upload an image"
echo "2. Create a masterpiece"
echo "3. Check if you get a result"
echo ""

# Summary
echo "📊 Summary:"
echo "-----------"
if [ -n "$CREATION_URL" ] && [ -n "$MINTING_URL" ]; then
    echo -e "${GREEN}✅ Both services are deployed${NC}"
    echo ""
    echo "To see all configured environment variables:"
    echo "  gcloud run services describe creation-service --project pixlmixr-prod --region us-central1"
    echo "  gcloud run services describe minting-service --project pixlmixr-prod --region us-central1"
else
    echo -e "${RED}❌ Services need configuration${NC}"
fi

echo ""
echo "To check recent activity:"
echo "  gcloud run services logs read creation-service --project pixlmixr-prod --limit 5"
echo "  gcloud run services logs read minting-service --project pixlmixr-prod --limit 5"