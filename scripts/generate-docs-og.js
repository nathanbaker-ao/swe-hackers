#!/usr/bin/env node
/**
 * OpenAI Image Generation Script for AutoNateAI Team Docs
 * 
 * Generates social preview image for the Team Documentation portal
 * 
 * Usage:
 *   node generate-docs-og.js
 * 
 * Environment:
 *   OPENAI_API_KEY - Your OpenAI API key
 * 
 * Output:
 *   courses/admin/docs/assets/og-team-docs.png
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
  model: 'gpt-image-1',
  
  // Output
  outputDir: path.join(__dirname, '..', 'courses', 'admin', 'docs', 'assets'),
  outputFile: 'og-team-docs.png',
  
  // Image specs
  size: '1536x1024',
  quality: 'high',
  
  // Prompt for the Team Docs image
  prompt: `Create a stunning social media preview image for "AutoNateAI Team Docs" - internal documentation for a development team.

Design specifications:
- Dark background color: #0a0a0f (nearly black)
- Primary accent: #7986cb (soft purple)
- Secondary accent: #4db6ac (teal)
- Tertiary accent: #ffd54f (gold)

Visual elements to include:
- The text "Team Docs" prominently displayed in a modern, clean sans-serif font
- Smaller "AutoNateAI" text above or below as a brand identifier
- Abstract flowing documentation/blueprint lines in the background
- Floating architecture diagram elements (boxes connected by lines, like system diagrams)
- Code editor snippets with syntax highlighting floating subtly
- Gear/cog icons representing engineering and technical documentation
- Clean geometric shapes suggesting structure and organization

Style:
- Modern, sleek, professional
- Technical/engineering aesthetic
- High contrast with the dark background
- Glowing/luminous effects on accent colors (purple and teal prominent)
- Minimalist but impactful
- Feels like opening a technical knowledge base

The image should convey: "This is where the team's technical knowledge lives - architecture, patterns, and best practices."

Dimensions: 1200x630 pixels (social media preview optimal size)
Text to include: "AutoNateAI" (smaller, top or corner) and "Team Docs" (larger, central)`
};

// ============================================================================
// MAIN SCRIPT
// ============================================================================

async function main() {
  console.log('🎨 AutoNateAI Team Docs OG Image Generator\n');
  
  // Check for API key
  if (!CONFIG.apiKey) {
    console.error('❌ Error: OPENAI_API_KEY environment variable not set.\n');
    console.log('To set your API key, run:');
    console.log('  export OPENAI_API_KEY="your-key-here"\n');
    console.log('Then run this script again:');
    console.log('  node scripts/generate-docs-og.js\n');
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
    
    if (imageUrl !== 'BASE64_SAVED') {
      console.log(`🔗 URL: ${imageUrl}\n`);
      console.log('📥 Downloading image...');
      await downloadImage(imageUrl, path.join(CONFIG.outputDir, CONFIG.outputFile));
    }
    
    console.log('✅ Image saved!\n');
    
    console.log('🎉 Success! Your Team Docs OG preview image is ready at:');
    console.log(`   courses/admin/docs/assets/${CONFIG.outputFile}\n`);
    
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
    return;
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
      fs.unlink(outputPath, () => {});
      reject(err);
    });
  });
}

// ============================================================================
// RUN
// ============================================================================

main();
