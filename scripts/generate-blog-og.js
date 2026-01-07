#!/usr/bin/env node
/**
 * Blog OG Image Generator for AutoNateAI
 * 
 * Generates custom social preview images for individual blog posts.
 * Optimized for iMessage, Twitter, LinkedIn, Discord embeds.
 * 
 * Usage:
 *   BLOG_SLUG="context-engineering" BLOG_TITLE="Context Engineering" node generate-blog-og.js
 * 
 * Or for parallel generation:
 *   BLOG_SLUG="slug1" BLOG_TITLE="Title 1" node generate-blog-og.js &
 *   BLOG_SLUG="slug2" BLOG_TITLE="Title 2" node generate-blog-og.js &
 *   wait
 * 
 * Environment:
 *   OPENAI_API_KEY - Your OpenAI API key
 *   BLOG_SLUG      - URL slug for the blog (e.g., "context-engineering")
 *   BLOG_TITLE     - Title of the blog post
 *   BLOG_CATEGORY  - Category (optional, defaults to "Blog")
 *   BLOG_ICON      - Emoji icon (optional, defaults to "📝")
 * 
 * Output:
 *   courses/assets/blog/[slug]-og.png
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
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const BLOG_SLUG = process.env.BLOG_SLUG;
const BLOG_TITLE = process.env.BLOG_TITLE;
const BLOG_CATEGORY = process.env.BLOG_CATEGORY || 'Blog';
const BLOG_ICON = process.env.BLOG_ICON || '📝';

const CONFIG = {
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-image-1',
  
  outputDir: path.join(__dirname, '..', 'courses', 'assets', 'blog'),
  outputFile: `${BLOG_SLUG}-og.png`,
  
  size: '1536x1024', // Will look great at 1200x630
  quality: 'high',
  
  // Dynamic prompt based on blog info
  prompt: `Create a stunning social media preview image for a blog post.

BLOG DETAILS:
- Title: "${BLOG_TITLE}"
- Category: ${BLOG_CATEGORY}
- Brand: AutoNateAI (AI-augmented learning platform)

DESIGN SPECIFICATIONS:
- Dark background: #0a0a0f (deep dark)
- Primary accent: #7986cb (soft purple-blue)
- Secondary accent: #4db6ac (teal)
- Tertiary accent: #ffd54f (gold)

MUST INCLUDE:
1. The blog title "${BLOG_TITLE}" prominently displayed
2. "AutoNateAI" logo/text in the corner
3. Category badge "${BLOG_CATEGORY}" 
4. Visual elements that represent the topic

VISUAL STYLE:
- Modern, sleek, professional dark theme
- Abstract geometric patterns or neural network elements
- Glowing/luminous accent colors
- Clean typography (modern sans-serif)
- High contrast for readability
- Tech/education aesthetic

LAYOUT:
- Title should be the hero element (large, readable)
- AutoNateAI branding subtle but present
- Category badge in a corner
- Background should be atmospheric, not distracting

DO NOT INCLUDE:
- Stock photo humans
- Busy/cluttered designs
- Bright white backgrounds
- Generic clip art

Dimensions: 1200x630 pixels (social media optimal)`
};

// ============================================================================
// VALIDATION
// ============================================================================

function validateInputs() {
  const errors = [];
  
  if (!CONFIG.apiKey) {
    errors.push('OPENAI_API_KEY environment variable not set');
  }
  
  if (!BLOG_SLUG) {
    errors.push('BLOG_SLUG environment variable not set');
  }
  
  if (!BLOG_TITLE) {
    errors.push('BLOG_TITLE environment variable not set');
  }
  
  if (errors.length > 0) {
    console.error('❌ Validation Errors:\n');
    errors.forEach(e => console.error(`   • ${e}`));
    console.log('\nUsage:');
    console.log('  BLOG_SLUG="your-slug" BLOG_TITLE="Your Title" node generate-blog-og.js\n');
    console.log('Example:');
    console.log('  BLOG_SLUG="context-engineering" BLOG_TITLE="Context Engineering: The Skill That Will Define Your AI Career" node generate-blog-og.js\n');
    process.exit(1);
  }
}

// ============================================================================
// MAIN SCRIPT
// ============================================================================

async function main() {
  console.log(`\n🎨 Generating OG Image: ${BLOG_SLUG}\n`);
  
  validateInputs();
  
  console.log(`   Title: ${BLOG_TITLE}`);
  console.log(`   Category: ${BLOG_CATEGORY}`);
  console.log(`   Output: assets/blog/${CONFIG.outputFile}\n`);
  
  // Ensure output directory exists
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
    console.log('📁 Created blog assets directory');
  }
  
  try {
    console.log('🚀 Generating image with GPT Image...');
    console.log('   (This may take 30-60 seconds)\n');
    
    const startTime = Date.now();
    const imageResult = await generateImage();
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    if (imageResult === 'BASE64_SAVED') {
      console.log(`✅ Image saved! (${duration}s)\n`);
    } else {
      console.log(`✅ Image generated! (${duration}s)`);
      console.log('📥 Downloading...');
      await downloadImage(imageResult, path.join(CONFIG.outputDir, CONFIG.outputFile));
      console.log('✅ Image saved!\n');
    }
    
    console.log(`🎉 Success! OG image ready:`);
    console.log(`   courses/assets/blog/${CONFIG.outputFile}\n`);
    
    // Output the meta tags to use
    console.log('📋 Add these meta tags to your blog HTML:\n');
    console.log(`<meta property="og:image" content="https://autonateai.com/assets/blog/${CONFIG.outputFile}">`);
    console.log(`<meta name="twitter:image" content="https://autonateai.com/assets/blog/${CONFIG.outputFile}">\n`);
    
  } catch (error) {
    console.error(`❌ Error generating ${BLOG_SLUG}:`, error.message);
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
            if (response.data[0].url) {
              resolve(response.data[0].url);
            } else if (response.data[0].b64_json) {
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
  if (url === 'BASE64_SAVED') return;
  
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

