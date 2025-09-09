#!/usr/bin/env node

/**
 * Test script to verify Jimp image generation works correctly
 */

import Jimp from 'jimp';
import fs from 'fs/promises';

async function testJimpGeneration() {
  console.log('Testing Jimp image generation...');
  
  try {
    // Test 1: Create standard resolution image
    console.log('\n1. Creating standard resolution image (1024x1024)...');
    const standardImage = new Jimp(1024, 1024, 0x9333EAFF);
    
    // Add gradient effect
    for (let y = 0; y < 1024; y++) {
      for (let x = 0; x < 1024; x++) {
        const gradientFactor = (x / 1024 + y / 1024) / 2;
        const r = Math.floor(147 + (255 - 147) * gradientFactor);
        const g = Math.floor(51 + (100 - 51) * gradientFactor);
        const b = Math.floor(234 - (234 - 180) * gradientFactor);
        const color = Jimp.rgbaToInt(r, g, b, 255);
        standardImage.setPixelColor(color, x, y);
      }
    }
    
    const standardBuffer = await standardImage.getBufferAsync(Jimp.MIME_PNG);
    await fs.writeFile('test-standard.png', standardBuffer);
    console.log(`✅ Standard image created: ${standardBuffer.length} bytes`);
    
    // Test 2: Create high resolution image
    console.log('\n2. Creating high resolution image (1920x1080)...');
    const highResImage = new Jimp(1920, 1080, 0x9333EAFF);
    
    // Add gradient effect
    for (let y = 0; y < 1080; y++) {
      for (let x = 0; x < 1920; x++) {
        const gradientFactor = (x / 1920 + y / 1080) / 2;
        const r = Math.floor(147 + (255 - 147) * gradientFactor);
        const g = Math.floor(51 + (100 - 51) * gradientFactor);
        const b = Math.floor(234 - (234 - 180) * gradientFactor);
        const color = Jimp.rgbaToInt(r, g, b, 255);
        highResImage.setPixelColor(color, x, y);
      }
    }
    
    const highResBuffer = await highResImage.getBufferAsync(Jimp.MIME_PNG);
    await fs.writeFile('test-highres.png', highResBuffer);
    console.log(`✅ High-res image created: ${highResBuffer.length} bytes`);
    
    // Test 3: Process an existing image (resize)
    console.log('\n3. Testing image processing (resize)...');
    const processedImage = await Jimp.read(standardBuffer);
    processedImage.resize(512, 512);
    const processedBuffer = await processedImage.getBufferAsync(Jimp.MIME_PNG);
    await fs.writeFile('test-resized.png', processedBuffer);
    console.log(`✅ Image resized: ${processedBuffer.length} bytes`);
    
    // Test 4: Test image quality
    console.log('\n4. Testing JPEG quality settings...');
    const jpegImage = new Jimp(512, 512, 0xFF00FFFF);
    const jpegBuffer = await jpegImage.quality(90).getBufferAsync(Jimp.MIME_JPEG);
    await fs.writeFile('test-quality.jpg', jpegBuffer);
    console.log(`✅ JPEG with quality 90: ${jpegBuffer.length} bytes`);
    
    console.log('\n✨ All tests passed! Jimp is working correctly.');
    console.log('Generated files:');
    console.log('  - test-standard.png (1024x1024)');
    console.log('  - test-highres.png (1920x1080)');
    console.log('  - test-resized.png (512x512)');
    console.log('  - test-quality.jpg (512x512)');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests
testJimpGeneration();