#!/usr/bin/env node
/**
 * OpenAI Image Generation Script for AutoNateAI
 * 
 * Generates social preview images using GPT Image 1.5
 * 
 * Usage:
 *   node generate-og-image.js
 * 
 * Environment:
 *   OPENAI_API_KEY - Your OpenAI API key
 * 
 * Output:
 *   courses/assets/og-preview.png
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// ============================================================================
// LOAD .env FILE IF EXISTS
// ============================================================================

const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && !key.startsWith('#')) {
      const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
      if (value) process.env[key.trim()] = value;
    }
  });
  console.log('📁 Loaded .env file');
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  // OpenAI API
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-image-1', // Use gpt-image-1 for image generation
  
  // Output
  outputDir: path.join(__dirname, '..', 'courses', 'assets'),
  outputFile: 'og-homepage.png',

  // Image specs
  size: '1536x1024', // Will be cropped to 1200x630
  quality: 'high',

  // Prompt for the image
  prompt: `Create a stunning social media preview image for "AutoNateAI" - a digital tech shop where AI agents built from real LinkedIn professionals power Scroll Courses.

Design specifications:
- Dark background color: #0a0a0f (nearly black)
- Primary accent: #7986cb (soft purple)
- Secondary accent: #4db6ac (teal)
- Tertiary accent: #ffd54f (gold)

Visual elements to include:
- The text "AutoNateAI" prominently displayed in a modern, clean sans-serif font
- Subtitle text: "Learn from Pros. Powered by AI."
- A short-form video feed interface (like TikTok/Reels) as a central visual motif — showing a phone or feed with scrollable content cards
- LinkedIn-style professional silhouettes or avatars transforming into AI agent avatars via glowing neural connections
- Scroll/swipe gesture visual — an upward arrow or finger-swipe trail
- Small icons representing the 3 feeds: a lightbulb (theory), a wrench/hammer (practice), a trophy (results)
- Subtle code brackets and tech patterns in the background
- A progress bar or data visualization element representing tracked learning

Style:
- Modern, sleek, professional but approachable
- Short-form content meets professional development
- High contrast with the dark background
- Glowing/luminous effects on accent colors
- Conveys innovation, real expertise being delivered through AI, and a new way to learn

The image should convey: "AI agents built from real professionals teach you through a scrollable feed. Learn by scrolling."

Dimensions: 1200x630 pixels (social media preview optimal size)
Only text allowed: "AutoNateAI" and "Learn from Pros. Powered by AI."`
};

// ============================================================================
// MAIN SCRIPT
// ============================================================================

async function main() {
  console.log('🎨 AutoNateAI OG Image Generator\n');
  
  // Check for API key
  if (!CONFIG.apiKey) {
    console.error('❌ Error: OPENAI_API_KEY environment variable not set.\n');
    console.log('To set your API key, run:');
    console.log('  export OPENAI_API_KEY="your-key-here"\n');
    console.log('Then run this script again:');
    console.log('  node scripts/generate-og-image.js\n');
    process.exit(1);
  }
  
  console.log('✅ API key found');
  console.log(`📁 Output: ${path.join(CONFIG.outputDir, CONFIG.outputFile)}\n`);
  
  // Ensure output directory exists
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
    console.log('📁 Created assets directory');
  }
  
  try {
    console.log('🚀 Generating image with GPT Image...');
    console.log('   This may take 30-60 seconds...\n');
    
    const imageUrl = await generateImage();
    console.log('✅ Image generated!');
    console.log(`🔗 URL: ${imageUrl}\n`);
    
    console.log('📥 Downloading image...');
    await downloadImage(imageUrl, path.join(CONFIG.outputDir, CONFIG.outputFile));
    console.log('✅ Image saved!\n');
    
    console.log('🎉 Success! Your OG preview image is ready at:');
    console.log(`   courses/assets/${CONFIG.outputFile}\n`);
    console.log('Next steps:');
    console.log('1. Review the generated image');
    console.log('2. If needed, tweak the prompt in this script and regenerate');
    console.log('3. Commit and push to deploy\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('   API Response:', error.response);
    }
    process.exit(1);
  }
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

async function generateImage() {
  return new Promise((resolve, reject) => {
    const requestBody = JSON.stringify({
      model: CONFIG.model,
      prompt: CONFIG.prompt,
      n: 1,
      size: CONFIG.size,
      quality: CONFIG.quality
    });
    
    const options = {
      hostname: 'api.openai.com',
      port: 443,
      path: '/v1/images/generations',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.apiKey}`,
        'Content-Length': Buffer.byteLength(requestBody)
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          if (response.error) {
            reject(new Error(response.error.message));
            return;
          }
          
          if (response.data && response.data[0]) {
            // Check for URL or b64_json
            if (response.data[0].url) {
              resolve(response.data[0].url);
            } else if (response.data[0].b64_json) {
              // Save base64 directly
              const outputPath = path.join(CONFIG.outputDir, CONFIG.outputFile);
              const buffer = Buffer.from(response.data[0].b64_json, 'base64');
              fs.writeFileSync(outputPath, buffer);
              resolve('BASE64_SAVED');
            } else {
              reject(new Error('No image URL or base64 in response'));
            }
          } else {
            reject(new Error('Unexpected API response format'));
          }
        } catch (e) {
          reject(new Error(`Failed to parse response: ${e.message}`));
        }
      });
    });
    
    req.on('error', (e) => {
      reject(new Error(`Request failed: ${e.message}`));
    });
    
    req.write(requestBody);
    req.end();
  });
}

async function downloadImage(url, outputPath) {
  if (url === 'BASE64_SAVED') {
    return; // Already saved from base64
  }
  
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(outputPath);
    
    https.get(url, (response) => {
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(outputPath, () => {}); // Delete partial file
      reject(err);
    });
  });
}

// ============================================================================
// RUN
// ============================================================================

main();

