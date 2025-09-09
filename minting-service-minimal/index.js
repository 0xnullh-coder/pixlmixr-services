import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'minting-service-minimal',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    message: 'Minting service is running in minimal mode'
  });
});

// Mint endpoint (simplified for now)
app.post('/mint', async (req, res) => {
  console.log('Mint request received:', req.body);
  
  try {
    const { masterpieceId, walletAddress } = req.body;
    
    if (!masterpieceId || !walletAddress) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'masterpieceId and walletAddress are required'
      });
    }
    
    // For now, return a mock successful response
    // This will be replaced with actual minting logic later
    const mockResponse = {
      success: true,
      masterpieceId,
      walletAddress,
      transactionHash: '0x' + Math.random().toString(36).substring(2, 15),
      tokenId: Math.floor(Math.random() * 10000).toString(),
      message: 'Minting service is running in minimal mode - this is a mock response',
      timestamp: new Date().toISOString()
    };
    
    console.log('Returning mock response:', mockResponse);
    res.json(mockResponse);
    
  } catch (error) {
    console.error('Error in mint endpoint:', error);
    res.status(500).json({
      error: 'Minting failed',
      message: error.message
    });
  }
});

// Verify endpoint
app.get('/verify/:tokenId', (req, res) => {
  const { tokenId } = req.params;
  
  res.json({
    tokenId,
    status: 'minimal-mode',
    message: 'Verification not available in minimal mode',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'PIXLMIXR Minting Service',
    status: 'running',
    mode: 'minimal',
    endpoints: [
      'GET /health - Health check',
      'POST /mint - Mint NFT (minimal mode)',
      'GET /verify/:tokenId - Verify token (minimal mode)'
    ]
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Minting service (minimal) running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});