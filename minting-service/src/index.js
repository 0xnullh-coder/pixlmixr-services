import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { Storage } from '@google-cloud/storage';
import { ethers } from 'ethers';
import { ThirdwebSDK } from '@thirdweb-dev/sdk';
import axios from 'axios';
import FormData from 'form-data';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
dotenv.config();

// Initialize Google Cloud Storage
const storage = new Storage();
const bucket = storage.bucket(process.env.GCS_BUCKET_NAME || 'pixlmixr-images');

// Initialize blockchain connections
const CHAIN_ID = 8453; // Base mainnet
const RPC_URL = 'https://mainnet.base.org';
const provider = new ethers.JsonRpcProvider(RPC_URL);

// Smart contract configuration
const NFT_CONTRACT_ADDRESS = process.env.NFT_CONTRACT_ADDRESS || '0xYourContractAddress';
const NFT_CONTRACT_ABI = [
  'function mintNFT(address to, string memory tokenURI) public returns (uint256)',
  'function ownerOf(uint256 tokenId) public view returns (address)',
  'function tokenURI(uint256 tokenId) public view returns (string)',
  'function balanceOf(address owner) public view returns (uint256)'
];

// $DEGEN token configuration
const DEGEN_TOKEN_ADDRESS = '0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed'; // Base mainnet $DEGEN
const DEGEN_TOKEN_ABI = [
  'function balanceOf(address owner) public view returns (uint256)',
  'function transfer(address to, uint256 amount) public returns (bool)',
  'event Transfer(address indexed from, address indexed to, uint256 value)'
];

// Create Hono app
const app = new Hono();

// Middleware
app.use('*', cors({
  origin: [
    'https://pixlmixr.app',
    'https://minipixlmixr.pages.dev',
    'https://minipixlmixr-staging.pages.dev',
    'http://localhost:3000'
  ],
  credentials: true
}));
app.use('*', logger());

// Health check endpoint
app.get('/health', async (c) => {
  try {
    // Check blockchain connection
    const blockNumber = await provider.getBlockNumber();
    
    return c.json({
      status: 'healthy',
      service: 'minting-service',
      version: '1.0.0',
      blockchain: {
        connected: true,
        chain: 'Base',
        blockNumber
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return c.json({
      status: 'unhealthy',
      service: 'minting-service',
      error: error.message
    }, 500);
  }
});

// Main minting endpoint
app.post('/mint', async (c) => {
  console.log('Minting request received');
  
  try {
    const body = await c.req.json();
    const { 
      masterpieceId, 
      walletAddress, 
      paymentTxHash,
      imageUrl,
      metadata 
    } = body;
    
    // Validate required fields
    if (!masterpieceId || !walletAddress) {
      return c.json({ error: 'Missing required fields' }, 400);
    }
    
    console.log(`Processing mint for masterpiece ${masterpieceId} to wallet ${walletAddress}`);
    
    // Step 1: Verify payment if provided
    if (paymentTxHash) {
      console.log('Step 1: Verifying $DEGEN payment...');
      try {
        const tx = await provider.getTransaction(paymentTxHash);
        if (!tx) {
          return c.json({ error: 'Payment transaction not found' }, 400);
        }
        
        // Verify it's a $DEGEN transfer
        const degenToken = new ethers.Contract(DEGEN_TOKEN_ADDRESS, DEGEN_TOKEN_ABI, provider);
        const receipt = await provider.getTransactionReceipt(paymentTxHash);
        
        // Check for Transfer event to treasury
        const transferEvent = receipt.logs.find(log => 
          log.address.toLowerCase() === DEGEN_TOKEN_ADDRESS.toLowerCase()
        );
        
        if (!transferEvent) {
          return c.json({ error: 'Invalid payment transaction' }, 400);
        }
        
        // Decode the transfer event
        const decoded = degenToken.interface.parseLog({
          topics: transferEvent.topics,
          data: transferEvent.data
        });
        
        const amount = decoded.args[2]; // amount
        const to = decoded.args[1]; // to address
        
        // Verify amount (10 $DEGEN = 10 * 10^18 wei)
        const expectedAmount = ethers.parseEther('10');
        if (amount < expectedAmount) {
          return c.json({ error: 'Insufficient payment amount' }, 400);
        }
        
        // Verify recipient is treasury
        const treasuryAddress = process.env.TREASURY_WALLET_ADDRESS;
        if (to.toLowerCase() !== treasuryAddress.toLowerCase()) {
          return c.json({ error: 'Payment not sent to treasury' }, 400);
        }
        
        console.log('Payment verified successfully');
      } catch (paymentError) {
        console.error('Payment verification error:', paymentError);
        return c.json({ error: 'Payment verification failed' }, 400);
      }
    }
    
    // Step 2: Retrieve image from GCS if not provided
    let finalImageUrl = imageUrl;
    let imageBuffer;
    
    if (!imageUrl) {
      console.log('Step 2: Retrieving image from Google Cloud Storage...');
      const filename = `creations/${walletAddress}/${masterpieceId}.png`;
      const file = bucket.file(filename);
      
      const [exists] = await file.exists();
      if (!exists) {
        return c.json({ error: 'Image not found in storage' }, 404);
      }
      
      [imageBuffer] = await file.download();
      finalImageUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;
    } else {
      // Download image from URL
      const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      imageBuffer = Buffer.from(response.data);
    }
    
    // Step 3: Upload to IPFS via Pinata
    console.log('Step 3: Uploading to IPFS via Pinata...');
    
    // Upload image to IPFS
    const imageFormData = new FormData();
    imageFormData.append('file', imageBuffer, {
      filename: `${masterpieceId}.png`,
      contentType: 'image/png'
    });
    
    const imagePinResponse = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      imageFormData,
      {
        headers: {
          ...imageFormData.getHeaders(),
          'Authorization': `Bearer ${process.env.PINATA_JWT}`
        }
      }
    );
    
    const imageIpfsHash = imagePinResponse.data.IpfsHash;
    const imageIpfsUrl = `https://gateway.pinata.cloud/ipfs/${imageIpfsHash}`;
    console.log('Image uploaded to IPFS:', imageIpfsUrl);
    
    // Create and upload metadata
    const nftMetadata = {
      name: metadata?.name || `PIXLMIXR Masterpiece #${masterpieceId.slice(0, 8)}`,
      description: metadata?.description || 'AI-generated art masterpiece created with PIXLMIXR',
      image: imageIpfsUrl,
      attributes: [
        {
          trait_type: 'Artist',
          value: walletAddress
        },
        {
          trait_type: 'Creation Date',
          value: new Date().toISOString()
        },
        {
          trait_type: 'High Resolution',
          value: metadata?.highRes ? 'Yes' : 'No'
        },
        ...(metadata?.styles || []).map(style => ({
          trait_type: 'Style',
          value: style
        }))
      ],
      properties: {
        masterpieceId,
        createdWith: 'PIXLMIXR',
        blockchain: 'Base',
        paymentToken: paymentTxHash ? 'DEGEN' : 'FREE'
      }
    };
    
    const metadataBlob = new Blob([JSON.stringify(nftMetadata)], { type: 'application/json' });
    const metadataFormData = new FormData();
    metadataFormData.append('file', metadataBlob, {
      filename: `${masterpieceId}-metadata.json`,
      contentType: 'application/json'
    });
    
    const metadataPinResponse = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      metadataFormData,
      {
        headers: {
          ...metadataFormData.getHeaders(),
          'Authorization': `Bearer ${process.env.PINATA_JWT}`
        }
      }
    );
    
    const metadataIpfsHash = metadataPinResponse.data.IpfsHash;
    const tokenURI = `https://gateway.pinata.cloud/ipfs/${metadataIpfsHash}`;
    console.log('Metadata uploaded to IPFS:', tokenURI);
    
    // Step 4: Mint NFT using Thirdweb SDK (or direct contract call)
    console.log('Step 4: Minting NFT on Base blockchain...');
    
    let mintTxHash;
    let tokenId;
    
    try {
      // Option 1: Use Thirdweb SDK (recommended for complex contracts)
      if (process.env.USE_THIRDWEB === 'true' && process.env.THIRDWEB_SECRET_KEY) {
        const sdk = ThirdwebSDK.fromPrivateKey(
          process.env.MINTER_PRIVATE_KEY,
          'base',
          {
            secretKey: process.env.THIRDWEB_SECRET_KEY
          }
        );
        
        const contract = await sdk.getContract(NFT_CONTRACT_ADDRESS);
        const tx = await contract.erc721.mintTo(walletAddress, {
          name: nftMetadata.name,
          description: nftMetadata.description,
          image: imageIpfsUrl,
          attributes: nftMetadata.attributes
        });
        
        mintTxHash = tx.receipt.transactionHash;
        tokenId = tx.id.toString();
      } else {
        // Option 2: Direct contract interaction with ethers.js
        const wallet = new ethers.Wallet(process.env.MINTER_PRIVATE_KEY, provider);
        const nftContract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, wallet);
        
        // Estimate gas
        const estimatedGas = await nftContract.mintNFT.estimateGas(walletAddress, tokenURI);
        
        // Add 20% buffer to gas estimate
        const gasLimit = estimatedGas * 120n / 100n;
        
        // Get current gas price
        const feeData = await provider.getFeeData();
        
        // Send transaction
        const tx = await nftContract.mintNFT(walletAddress, tokenURI, {
          gasLimit,
          maxFeePerGas: feeData.maxFeePerGas,
          maxPriorityFeePerGas: feeData.maxPriorityFeePerGas
        });
        
        console.log('Transaction sent:', tx.hash);
        
        // Wait for confirmation
        const receipt = await tx.wait(2); // Wait for 2 confirmations
        mintTxHash = receipt.hash;
        
        // Get token ID from event logs
        const mintEvent = receipt.logs.find(log => 
          log.address.toLowerCase() === NFT_CONTRACT_ADDRESS.toLowerCase()
        );
        
        if (mintEvent && mintEvent.topics.length > 3) {
          tokenId = ethers.toBigInt(mintEvent.topics[3]).toString();
        } else {
          tokenId = 'unknown';
        }
      }
      
      console.log(`NFT minted successfully! TX: ${mintTxHash}, Token ID: ${tokenId}`);
      
    } catch (mintError) {
      console.error('Minting error:', mintError);
      return c.json({
        error: 'NFT minting failed',
        message: mintError.message,
        ipfsData: {
          image: imageIpfsUrl,
          metadata: tokenURI
        }
      }, 500);
    }
    
    // Step 5: Update database via Cloudflare API
    console.log('Step 5: Updating database...');
    if (process.env.CLOUDFLARE_D1_API_URL) {
      try {
        await axios.post(
          `${process.env.CLOUDFLARE_D1_API_URL}/update-mint`,
          {
            masterpieceId,
            mintTxHash,
            tokenId,
            tokenURI,
            ipfsImageHash: imageIpfsHash,
            ipfsMetadataHash: metadataIpfsHash
          },
          {
            headers: {
              'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
              'Content-Type': 'application/json'
            }
          }
        );
        console.log('Database updated successfully');
      } catch (dbError) {
        console.error('Database update error:', dbError);
        // Continue - mint was successful
      }
    }
    
    // Return success response
    const response = {
      success: true,
      masterpieceId,
      transactionHash: mintTxHash,
      tokenId,
      tokenURI,
      ipfs: {
        imageUrl: imageIpfsUrl,
        imageHash: imageIpfsHash,
        metadataUrl: tokenURI,
        metadataHash: metadataIpfsHash
      },
      blockchain: {
        chain: 'Base',
        contract: NFT_CONTRACT_ADDRESS,
        explorer: `https://basescan.org/tx/${mintTxHash}`
      },
      timestamp: new Date().toISOString()
    };
    
    console.log('Minting completed successfully');
    return c.json(response);
    
  } catch (error) {
    console.error('Minting service error:', error);
    return c.json({
      error: 'Minting failed',
      message: error.message,
      service: 'minting-service'
    }, 500);
  }
});

// Verify NFT ownership endpoint
app.get('/verify/:tokenId', async (c) => {
  try {
    const tokenId = c.req.param('tokenId');
    const nftContract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, provider);
    
    const owner = await nftContract.ownerOf(tokenId);
    const tokenURI = await nftContract.tokenURI(tokenId);
    
    return c.json({
      tokenId,
      owner,
      tokenURI,
      contract: NFT_CONTRACT_ADDRESS,
      explorer: `https://basescan.org/token/${NFT_CONTRACT_ADDRESS}?a=${tokenId}`
    });
  } catch (error) {
    return c.json({ error: 'Token not found or error verifying' }, 404);
  }
});

// Start server
const port = process.env.PORT || 8081;
console.log(`Minting service starting on port ${port}...`);

serve({
  fetch: app.fetch,
  port
});

console.log(`✅ Minting service running at http://localhost:${port}`);