#!/usr/bin/env node
/**
 * Course Preview Image Generator for AutoNateAI
 * 
 * Generates preview images for each course using OpenAI's image API
 * 
 * Usage:
 *   node generate-course-images.js           # Generate all 4 course images
 *   node generate-course-images.js apprentice # Generate just one
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Load .env if exists
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
  console.log('📁 Loaded .env file\n');
}

// ============================================================================
// COURSE DEFINITIONS
// ============================================================================

const COURSES = {
  apprentice: {
    name: "The Apprentice's Path",
    emoji: "⭐",
    outputFile: "course-apprentice.png",
    prompt: `Create a stunning course preview image for "The Apprentice's Path" - a beginner's Python programming course.

Design specifications:
- Dark background: #0a0a0f with subtle grid pattern
- Primary accent: GOLDEN YELLOW (#ffd54f) as the dominant color - this represents "beginnings" and "discovery"
- Secondary accents: soft purple (#7986cb) and teal (#4db6ac)

Visual elements:
- A glowing golden STAR (⭐) as the central icon - large and prominent
- The text "The Apprentice's Path" in elegant typography
- Magical sparks and particles emanating from the star
- Subtle code symbols floating in the background (if, for, def, print)
- A winding path or stepping stones leading upward
- Young/fresh energy - like dawn or sunrise colors

Style:
- Magical, inspiring, welcoming
- Video game "start your adventure" aesthetic  
- Warm and inviting for beginners
- Fantasy/RPG quest feeling

The image should convey: "Begin your coding adventure here - everyone starts somewhere!"

Dimensions: 1200x630 pixels`
  },
  
  undergrad: {
    name: "The Bridge to Industry",
    emoji: "🎓",
    outputFile: "course-undergrad.png",
    prompt: `Create a stunning course preview image for "The Bridge to Industry" - a course for CS students transitioning to professional work.

Design specifications:
- Dark background: #0a0a0f
- Primary accent: DEEP BLUE (#3f51b5) representing academic/professional transition
- Secondary accents: teal (#4db6ac), gold (#ffd54f)

Visual elements:
- A glowing GRADUATION CAP (🎓) as the central icon
- The text "The Bridge to Industry" in professional typography
- A literal glowing bridge connecting two sides (academy → industry)
- One side with books/diploma imagery, other side with tech company/code imagery
- Circuit patterns transforming into corporate building outlines
- Professional, sleek geometric shapes

Style:
- Professional but aspirational
- University-to-career transition energy
- Modern tech company aesthetic
- Clean, structured, confident

The image should convey: "Bridge the gap between what you learned and what you'll build."

Dimensions: 1200x630 pixels`
  },
  
  junior: {
    name: "The Junior Accelerator",
    emoji: "🚀",
    outputFile: "course-junior.png",
    prompt: `Create a stunning course preview image for "The Junior Accelerator" - a fast-track course for junior developers.

Design specifications:
- Dark background: #0a0a0f
- Primary accent: VIBRANT TEAL (#00bcd4) representing speed and growth
- Secondary accents: orange (#ff9800), electric blue (#2196f3)

Visual elements:
- A glowing ROCKET (🚀) as the central icon - dynamic, launching upward
- The text "The Junior Accelerator" in bold, energetic typography
- Speed lines and motion blur effects
- Growth chart or arrow trajectory going up
- Code brackets and symbols in the motion trail
- Energy particles and boost flames

Style:
- High energy, dynamic, fast-paced
- Startup/tech acceleration aesthetic
- Movement and momentum
- Ambitious and driven

The image should convey: "Accelerate your career - skip years of slow progress with AI-augmented learning."

Dimensions: 1200x630 pixels`
  },
  
  senior: {
    name: "The Senior Amplifier",
    emoji: "⚡",
    outputFile: "course-senior.png",
    prompt: `Create a stunning course preview image for "The Senior Amplifier" - a course for experienced engineers to multiply their impact.

Design specifications:
- Dark background: #0a0a0f
- Primary accent: ELECTRIC PURPLE (#9c27b0) representing power and mastery
- Secondary accents: gold (#ffd54f), white/silver

Visual elements:
- A glowing LIGHTNING BOLT (⚡) as the central icon - powerful, electric
- The text "The Senior Amplifier" in commanding typography
- Amplification waves radiating outward
- Multiple smaller lightning bolts or energy nodes connecting
- System architecture diagrams subtly in background
- Crown or leadership subtle imagery

Style:
- Powerful, authoritative, masterful
- "Level up your already strong skills" energy
- Premium, exclusive feeling
- Strategic and impactful

The image should convey: "Multiply your impact - lead bigger projects, mentor teams, architect systems."

Dimensions: 1200x630 pixels`
  }
};

// ============================================================================
// CONFIG
// ============================================================================

const CONFIG = {
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-image-1',
  size: '1536x1024',
  quality: 'high',
  outputDir: path.join(__dirname, '..', 'courses', 'assets', 'courses')
};

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('🎨 AutoNateAI Course Image Generator\n');
  
  if (!CONFIG.apiKey) {
    console.error('❌ Error: OPENAI_API_KEY not set.\n');
    console.log('Run: export OPENAI_API_KEY="your-key-here"');
    process.exit(1);
  }
  
  // Ensure output directory exists
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
    console.log('📁 Created courses assets directory\n');
  }
  
  // Get which courses to generate
  const arg = process.argv[2];
  let coursesToGenerate;
  
  if (arg && COURSES[arg]) {
    coursesToGenerate = [arg];
    console.log(`🎯 Generating image for: ${COURSES[arg].name}\n`);
  } else if (arg) {
    console.error(`❌ Unknown course: ${arg}`);
    console.log('Available courses: apprentice, undergrad, junior, senior');
    process.exit(1);
  } else {
    coursesToGenerate = Object.keys(COURSES);
    console.log(`🎯 Generating images for all ${coursesToGenerate.length} courses\n`);
  }
  
  // Generate each course image
  for (const courseKey of coursesToGenerate) {
    const course = COURSES[courseKey];
    console.log(`\n${'='.repeat(60)}`);
    console.log(`${course.emoji} ${course.name}`);
    console.log(`${'='.repeat(60)}\n`);
    
    try {
      console.log('🚀 Generating image... (30-60 seconds)');
      const imageData = await generateImage(course.prompt);
      
      const outputPath = path.join(CONFIG.outputDir, course.outputFile);
      
      if (imageData.startsWith('http')) {
        await downloadImage(imageData, outputPath);
      } else {
        // Base64
        const buffer = Buffer.from(imageData, 'base64');
        fs.writeFileSync(outputPath, buffer);
      }
      
      console.log(`✅ Saved: courses/assets/courses/${course.outputFile}`);
      
    } catch (error) {
      console.error(`❌ Error generating ${courseKey}:`, error.message);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🎉 Done! Course images generated.');
  console.log('='.repeat(60) + '\n');
  console.log('Next: Update course detail pages to use these images');
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

async function generateImage(prompt) {
  return new Promise((resolve, reject) => {
    const requestBody = JSON.stringify({
      model: CONFIG.model,
      prompt: prompt,
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
      res.on('data', chunk => data += chunk);
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
              resolve(response.data[0].b64_json);
            }
          } else {
            reject(new Error('Unexpected response format'));
          }
        } catch (e) {
          reject(new Error(`Parse error: ${e.message}`));
        }
      });
    });
    
    req.on('error', e => reject(new Error(`Request failed: ${e.message}`)));
    req.write(requestBody);
    req.end();
  });
}

async function downloadImage(url, outputPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(outputPath);
    https.get(url, response => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', err => {
      fs.unlink(outputPath, () => {});
      reject(err);
    });
  });
}

// ============================================================================
// RUN
// ============================================================================

main();

