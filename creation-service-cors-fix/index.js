import express from 'express';
import axios from 'axios';
import Jimp from 'jimp';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware to handle CORS
app.use((req, res, next) => {
  // Set CORS headers for all responses
  const origin = req.headers.origin || '*';
  res.header('Access-Control-Allow-Origin', origin);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  
  next();
});

// Parse JSON bodies
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'creation-service-cors-fixed',
    version: '1.1.0',
    timestamp: new Date().toISOString()
  });
});

// Main creation endpoint
app.post('/create', async (req, res) => {
  console.log('Creation request received');
  
  try {
    const { images, styles, walletAddress, highRes = false } = req.body;
    
    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address required' });
    }
    
    // Generate a unique ID for this masterpiece
    const masterpieceId = uuidv4();
    
    // Create a gradient image using Jimp (simplified version)
    const width = highRes ? 1920 : 1024;
    const height = highRes ? 1080 : 1024;
    
    const image = new Jimp(width, height, 0x9333EAFF);
    
    // Add gradient effect
    for (let y = 0; y < height; y += 10) {
      for (let x = 0; x < width; x += 10) {
        const gradientFactor = (x / width + y / height) / 2;
        const r = Math.floor(147 + (108 * gradientFactor));
        const g = Math.floor(51 + (49 * gradientFactor));
        const b = Math.floor(234 - (54 * gradientFactor));
        const color = Jimp.rgbaToInt(r, g, b, 255);
        
        // Fill 10x10 blocks for performance
        for (let dy = 0; dy < 10 && y + dy < height; dy++) {
          for (let dx = 0; dx < 10 && x + dx < width; dx++) {
            image.setPixelColor(color, x + dx, y + dy);
          }
        }
      }
    }
    
    // Convert to base64
    const buffer = await image.getBufferAsync(Jimp.MIME_PNG);
    const base64Image = `data:image/png;base64,${buffer.toString('base64')}`;
    
    // Generate a simple prompt
    const prompt = `A ${styles?.join(' and ') || 'digital'} masterpiece created with AI`;
    
    // Return success response
    const response = {
      success: true,
      masterpieceId,
      imageUrl: base64Image,
      prompt,
      analysis: {
        labels: ['Digital Art', 'Abstract', 'Gradient'],
        sentiment: 'creative'
      },
      metadata: {
        highRes,
        styles: styles || [],
        timestamp: new Date().toISOString()
      }
    };
    
    console.log(`Creation completed for wallet ${walletAddress}`);
    res.json(response);
    
  } catch (error) {
    console.error('Creation error:', error);
    res.status(500).json({
      error: 'Creation failed',
      message: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Creation service (CORS fixed) running on port ${PORT}`);
});