# 🚀 PIXLMIXR Backend Services

Backend microservices for PIXLMIXR - AI art generation and NFT minting on Google Cloud Run.

## 📦 Services

### 1. Creation Service
Handles AI-powered art generation:
- Google Vision API for image analysis
- Google Imagen API for AI art generation
- Google Cloud Storage for image persistence
- Automatic fallback generation

### 2. Minting Service
Handles blockchain operations:
- NFT minting on Base blockchain
- $DEGEN token payment verification
- IPFS upload via Pinata
- Smart contract interactions with ethers.js/Thirdweb

## 🏗️ Architecture

```
User → Cloudflare Edge (Gateway) → Google Cloud Run Services → Blockchain/Storage
```

This architecture separates heavy processing from edge routing:
- **Cloudflare**: Lightweight gateway, rate limiting, static hosting
- **Cloud Run**: Heavy AI processing, blockchain operations
- **Benefits**: No timeouts, full Node.js environment, auto-scaling

## 🚀 Deployment

### Prerequisites
- Google Cloud Project with billing enabled
- Google Cloud CLI (`gcloud`) installed
- Service Account with appropriate permissions
- Environment variables configured (see `.env.example` files)

### Quick Deploy

```bash
# Clone the repository
git clone https://github.com/0xnullh-coder/pixlmixr-services.git
cd pixlmixr-services

# Configure Google Cloud
gcloud auth login
gcloud config set project pixlmixr-prod

# Deploy both services
./deploy.sh
# Or use the simple deployment:
./deploy-simple.sh
```

### Manual Deployment

#### Deploy Creation Service:
```bash
cd creation-service
gcloud run deploy creation-service \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2
```

#### Deploy Minting Service:
```bash
cd minting-service
gcloud run deploy minting-service \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1
```

## 🔧 Configuration

### Environment Variables

#### Creation Service
```env
GOOGLE_CLOUD_PROJECT=your-project-id
GCS_BUCKET_NAME=pixlmixr-images
CLOUDFLARE_D1_API_URL=https://pixlmixr.app/api/internal
CLOUDFLARE_API_TOKEN=your-token
```

#### Minting Service
```env
GOOGLE_CLOUD_PROJECT=your-project-id
GCS_BUCKET_NAME=pixlmixr-images
NFT_CONTRACT_ADDRESS=0xYourContractAddress
MINTER_PRIVATE_KEY=your-private-key
TREASURY_WALLET_ADDRESS=0x68eDdF29e726A04028E15c6804c0C52EfB1C7080
PINATA_JWT=your-pinata-jwt
CLOUDFLARE_D1_API_URL=https://pixlmixr.app/api/internal
CLOUDFLARE_API_TOKEN=your-token
```

### Required Google Cloud APIs
- Cloud Run API
- Cloud Build API
- Artifact Registry API
- Cloud Vision API
- Vertex AI API
- Cloud Storage API

Enable them with:
```bash
gcloud services enable run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  vision.googleapis.com \
  aiplatform.googleapis.com \
  storage.googleapis.com
```

## 🧪 Testing

### Local Testing with Docker Compose
```bash
docker-compose up
```

Services will be available at:
- Creation Service: http://localhost:8080
- Minting Service: http://localhost:8081

### Test Endpoints
```bash
# Test health endpoints
curl http://localhost:8080/health
curl http://localhost:8081/health

# Run test suite
npm install
node test-services.js
```

## 📊 API Documentation

### Creation Service

#### POST /create
Create AI-generated artwork.

**Request:**
```json
{
  "walletAddress": "0x...",
  "images": ["base64..."],
  "styles": ["Abstract", "Futuristic"],
  "highRes": false
}
```

**Response:**
```json
{
  "success": true,
  "masterpieceId": "uuid",
  "imageUrl": "https://storage.googleapis.com/...",
  "prompt": "Generated prompt",
  "analysis": {...}
}
```

### Minting Service

#### POST /mint
Mint NFT on Base blockchain.

**Request:**
```json
{
  "masterpieceId": "uuid",
  "walletAddress": "0x...",
  "paymentTxHash": "0x...",
  "metadata": {...}
}
```

**Response:**
```json
{
  "success": true,
  "transactionHash": "0x...",
  "tokenId": "1",
  "tokenURI": "ipfs://...",
  "ipfs": {...}
}
```

## 🔒 Security

- Service-to-service authentication via Bearer tokens
- Environment variables for sensitive data
- CORS configured for specific domains
- Input validation on all endpoints

## 📈 Monitoring

After deployment, monitor your services:
```bash
# View logs
gcloud run services logs read creation-service
gcloud run services logs read minting-service

# Check metrics
gcloud monitoring dashboards list
```

## 🤝 Integration with Cloudflare

After deploying these services, update your Cloudflare Workers to use them:

1. Get service URLs from deployment output
2. Add to Cloudflare as secrets:
```bash
npx wrangler secret put CREATION_SERVICE_URL
npx wrangler secret put MINTING_SERVICE_URL
npx wrangler secret put SERVICE_AUTH_TOKEN
```

3. Deploy updated Cloudflare Workers:
```bash
npx wrangler pages deploy . --project-name minipixlmixr
```

## 📝 License

Part of the PIXLMIXR project.

## 🆘 Support

For issues or questions, please open an issue in this repository.

---

**Built for scalability, designed for reliability.**