#!/bin/bash

echo "🧪 PIXLMIXR Complete Flow Test"
echo "=============================="
echo ""

# Get service URLs
CREATION_URL=$(gcloud run services describe creation-service --project pixlmixr-prod --region us-central1 --format 'value(status.url)' 2>/dev/null)
MINTING_URL=$(gcloud run services describe minting-service --project pixlmixr-prod --region us-central1 --format 'value(status.url)' 2>/dev/null)

echo "Testing with:"
echo "Creation: $CREATION_URL"
echo "Minting: $MINTING_URL"
echo ""

# Test wallet address
TEST_WALLET="0x742d35Cc6634C0532925a3b844Bc9e7595f0fEd0"

# Step 1: Test Creation
echo "Step 1: Creating a test masterpiece..."
echo "---------------------------------------"

# Create a simple test image (1x1 pixel)
CREATE_RESPONSE=$(curl -s -X POST $CREATION_URL/create \
  -H "Content-Type: application/json" \
  -d "{
    \"walletAddress\": \"$TEST_WALLET\",
    \"images\": [\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==\"],
    \"styles\": [\"Abstract\", \"Digital\"],
    \"highRes\": false
  }")

echo "Response:"
echo "$CREATE_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$CREATE_RESPONSE"

# Extract masterpieceId if successful
MASTERPIECE_ID=$(echo "$CREATE_RESPONSE" | grep -o '"masterpieceId":"[^"]*' | cut -d'"' -f4)

if [ -n "$MASTERPIECE_ID" ]; then
    echo ""
    echo "✅ Masterpiece created with ID: $MASTERPIECE_ID"
    
    # Step 2: Test Minting
    echo ""
    echo "Step 2: Minting the NFT..."
    echo "--------------------------"
    
    MINT_RESPONSE=$(curl -s -X POST $MINTING_URL/mint \
      -H "Content-Type: application/json" \
      -d "{
        \"masterpieceId\": \"$MASTERPIECE_ID\",
        \"walletAddress\": \"$TEST_WALLET\"
      }")
    
    echo "Response:"
    echo "$MINT_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$MINT_RESPONSE"
    
    # Check if minting was successful
    if echo "$MINT_RESPONSE" | grep -q "transactionHash"; then
        echo ""
        echo "✅ NFT minted successfully!"
        TX_HASH=$(echo "$MINT_RESPONSE" | grep -o '"transactionHash":"[^"]*' | cut -d'"' -f4)
        echo "Transaction Hash: $TX_HASH"
    else
        echo ""
        echo "⚠️  Minting returned unexpected response"
    fi
else
    echo ""
    echo "❌ Failed to create masterpiece"
fi

echo ""
echo "=============================="
echo "📋 Test Complete!"
echo ""
echo "Check your service logs for details:"
echo "  gcloud run services logs read creation-service --project pixlmixr-prod --limit 10"
echo "  gcloud run services logs read minting-service --project pixlmixr-prod --limit 10"