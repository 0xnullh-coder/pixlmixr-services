#!/usr/bin/env node

/**
 * PIXLMIXR Services End-to-End Test
 * Tests the complete flow through the new architecture
 */

import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration
const config = {
  // Update these after deployment
  creationServiceUrl: process.env.CREATION_SERVICE_URL || 'http://localhost:8080',
  mintingServiceUrl: process.env.MINTING_SERVICE_URL || 'http://localhost:8081',
  cloudflareUrl: process.env.CLOUDFLARE_URL || 'https://pixlmixr.app',
  testWallet: '0x742d35Cc6634C0532925a3b844Bc9e7595f0fEd0',
  authToken: process.env.SERVICE_AUTH_TOKEN || 'test-token'
};

// Colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Test functions
async function testHealthEndpoints() {
  log('\n📋 Testing Health Endpoints...', 'blue');
  
  const endpoints = [
    { name: 'Creation Service', url: `${config.creationServiceUrl}/health` },
    { name: 'Minting Service', url: `${config.mintingServiceUrl}/health` },
    { name: 'Cloudflare Gateway', url: `${config.cloudflareUrl}/api/health` }
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(endpoint.url);
      if (response.data.status === 'healthy' || response.data.timestamp) {
        log(`  ✅ ${endpoint.name}: HEALTHY`, 'green');
      } else {
        log(`  ⚠️ ${endpoint.name}: DEGRADED`, 'yellow');
      }
    } catch (error) {
      log(`  ❌ ${endpoint.name}: FAILED - ${error.message}`, 'red');
    }
  }
}

async function testCreationFlow() {
  log('\n🎨 Testing Creation Flow...', 'blue');
  
  try {
    // Create a simple test image (base64 encoded 1x1 pixel)
    const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    
    const createRequest = {
      walletAddress: config.testWallet,
      images: [testImage],
      styles: ['Abstract', 'Futuristic'],
      highRes: false
    };
    
    log('  📤 Sending creation request...', 'yellow');
    
    // Test direct service call
    const serviceResponse = await axios.post(
      `${config.creationServiceUrl}/create`,
      createRequest,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.authToken}`
        }
      }
    );
    
    if (serviceResponse.data.success) {
      log(`  ✅ Creation successful! Masterpiece ID: ${serviceResponse.data.masterpieceId}`, 'green');
      log(`  🖼️ Image URL: ${serviceResponse.data.imageUrl}`, 'green');
      return serviceResponse.data.masterpieceId;
    } else {
      log(`  ❌ Creation failed: ${serviceResponse.data.error}`, 'red');
      return null;
    }
  } catch (error) {
    log(`  ❌ Creation test failed: ${error.message}`, 'red');
    if (error.response) {
      log(`     Response: ${JSON.stringify(error.response.data)}`, 'red');
    }
    return null;
  }
}

async function testMintingFlow(masterpieceId) {
  log('\n🪙 Testing Minting Flow...', 'blue');
  
  if (!masterpieceId) {
    log('  ⚠️ Skipping mint test - no masterpiece ID', 'yellow');
    return;
  }
  
  try {
    const mintRequest = {
      masterpieceId,
      walletAddress: config.testWallet,
      // For testing without actual payment
      paymentTxHash: null,
      metadata: {
        name: 'Test NFT',
        description: 'Test minting',
        highRes: false
      }
    };
    
    log('  📤 Sending mint request...', 'yellow');
    
    // Test direct service call
    const serviceResponse = await axios.post(
      `${config.mintingServiceUrl}/mint`,
      mintRequest,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.authToken}`
        }
      }
    );
    
    if (serviceResponse.data.success) {
      log(`  ✅ Minting successful!`, 'green');
      log(`  🔗 Transaction: ${serviceResponse.data.transactionHash}`, 'green');
      log(`  🎨 Token ID: ${serviceResponse.data.tokenId}`, 'green');
      log(`  📦 IPFS: ${serviceResponse.data.ipfs.metadataUrl}`, 'green');
    } else {
      log(`  ❌ Minting failed: ${serviceResponse.data.error}`, 'red');
    }
  } catch (error) {
    log(`  ❌ Minting test failed: ${error.message}`, 'red');
    if (error.response) {
      log(`     Response: ${JSON.stringify(error.response.data)}`, 'red');
    }
  }
}

async function testGatewayIntegration() {
  log('\n🌐 Testing Cloudflare Gateway Integration...', 'blue');
  
  try {
    // Test the gateway endpoint
    const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    
    const response = await axios.post(
      `${config.cloudflareUrl}/api/create-masterpiece`,
      {
        walletAddress: config.testWallet,
        images: [testImage],
        styles: ['Digital', 'Modern']
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data.success || response.data.masterpieceId) {
      log(`  ✅ Gateway integration working!`, 'green');
      log(`  🆔 Masterpiece ID: ${response.data.masterpieceId}`, 'green');
    } else {
      log(`  ⚠️ Gateway returned unexpected response`, 'yellow');
    }
  } catch (error) {
    if (error.response?.status === 429) {
      log(`  ⚠️ Rate limited (expected behavior)`, 'yellow');
    } else {
      log(`  ❌ Gateway test failed: ${error.message}`, 'red');
    }
  }
}

// Main test runner
async function runTests() {
  log('🚀 Starting PIXLMIXR Services Test Suite', 'blue');
  log('=====================================', 'blue');
  
  // Run tests
  await testHealthEndpoints();
  
  const masterpieceId = await testCreationFlow();
  
  // Only test minting if we have proper configuration
  if (process.env.MINTER_PRIVATE_KEY && process.env.NFT_CONTRACT_ADDRESS) {
    await testMintingFlow(masterpieceId);
  } else {
    log('\n⚠️ Skipping minting test - missing blockchain configuration', 'yellow');
  }
  
  await testGatewayIntegration();
  
  log('\n=====================================', 'blue');
  log('✨ Test suite complete!', 'green');
  log('\nNext steps:', 'yellow');
  log('1. Deploy services to Google Cloud Run', 'yellow');
  log('2. Update Cloudflare with service URLs', 'yellow');
  log('3. Run tests against production', 'yellow');
}

// Run tests
runTests().catch(error => {
  log(`\n❌ Test suite failed: ${error.message}`, 'red');
  process.exit(1);
});