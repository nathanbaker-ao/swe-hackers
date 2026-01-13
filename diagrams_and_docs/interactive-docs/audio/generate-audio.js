#!/usr/bin/env node
/**
 * Generate audio files + word timestamps for storytelling diagrams
 * 
 * Uses OpenAI gpt-4o-mini-tts with expressive instructions, then Whisper for timestamps.
 * Generates multiple voice options in parallel.
 * 
 * Usage: 
 *   node generate-audio.js                        # Process all story files
 *   node generate-audio.js --page demo-storytelling   # Process specific page
 *   node generate-audio.js --incremental          # Skip existing files
 *   node generate-audio.js --story service-story  # Process specific story
 * 
 * Requires: OPENAI_API_KEY environment variable
 */

const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');

const openai = new OpenAI();

// Voice configurations with expressive storytelling instructions
const VOICES = {
  ballad: {
    name: 'ballad',
    label: 'Storyteller (Female)',
    instructions: `You are an enthusiastic, captivating storyteller narrating an exciting documentary about software architecture.
Be ENERGETIC, warm, and engaging - like you're revealing something amazing!
Build anticipation and excitement as each piece connects to the whole.
Use dynamic pacing: pause briefly before key terms, then deliver them with emphasis.
This is exciting technology that makes real impact - let your voice convey wonder and enthusiasm!
Sound like you're sharing something truly cool with a friend who's going to love it.`
  },
  echo: {
    name: 'echo',
    label: 'Storyteller (Male UK)',
    instructions: `You are a charismatic British storyteller narrating an exciting tech documentary.
Be ENERGETIC, engaging, and enthusiastic - like David Attenborough meets Silicon Valley!
Build excitement as you reveal how each piece connects to the whole system.
Use dynamic, expressive delivery with natural emphasis on key technical terms.
This is fascinating architecture - convey genuine excitement and wonder!
Make the listener feel like they're discovering something incredible.`
  }
};

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    incremental: false,
    page: null,
    story: null
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--incremental':
      case '-i':
        options.incremental = true;
        break;
      case '--page':
      case '-p':
        options.page = args[++i];
        break;
      case '--story':
      case '-s':
        options.story = args[++i];
        break;
      case '--help':
      case '-h':
        console.log(`
Audio Generator for Storytelling Diagrams

Usage: node generate-audio.js [options]

Options:
  --incremental, -i    Skip existing audio files
  --page, -p <name>    Process only specified page (e.g., demo-storytelling)
  --story, -s <name>   Process only specified story (e.g., service-story)
  --help, -h           Show this help message

Story files should be placed in ./stories/ as JSON files.
See ./stories/schema.json for the expected format.
        `);
        process.exit(0);
    }
  }

  return options;
}

// Load story definitions from JSON files
function loadStories(options) {
  const storiesDir = path.join(__dirname, 'stories');
  const stories = {};

  if (!fs.existsSync(storiesDir)) {
    console.error('Stories directory not found:', storiesDir);
    process.exit(1);
  }

  const files = fs.readdirSync(storiesDir)
    .filter(f => f.endsWith('.json') && f !== 'schema.json');

  for (const file of files) {
    const pageId = path.basename(file, '.json');
    
    // Filter by page if specified
    if (options.page && pageId !== options.page) {
      continue;
    }

    const filePath = path.join(storiesDir, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    for (const story of data.stories) {
      // Filter by story if specified
      if (options.story && story.id !== options.story) {
        continue;
      }

      stories[story.id] = story.steps.map((step, index) => ({
        id: `step-${index}`,
        nodeId: step.nodeId,
        title: step.title,
        narration: step.narration
      }));
    }
  }

  return stories;
}

async function generateAudioForStep(storyId, step, voiceConfig, options) {
  const text = `${step.title}. ${step.narration}`;
  const voiceDir = path.join(__dirname, voiceConfig.name, storyId);
  const audioPath = path.join(voiceDir, `${step.id}.mp3`);
  const timestampPath = path.join(voiceDir, `${step.id}.json`);
  
  // Create directory if needed
  if (!fs.existsSync(voiceDir)) {
    fs.mkdirSync(voiceDir, { recursive: true });
  }

  // Skip if incremental and file exists
  if (options.incremental && fs.existsSync(audioPath) && fs.existsSync(timestampPath)) {
    console.log(`   ⏭️  [${voiceConfig.name}] ${step.id} (skipped - exists)`);
    return JSON.parse(fs.readFileSync(timestampPath, 'utf8'));
  }

  console.log(`   🎤 [${voiceConfig.name}] ${step.id}...`);

  // Step 1: Generate audio with gpt-4o-mini-tts and expressive instructions
  const mp3Response = await openai.audio.speech.create({
    model: 'gpt-4o-mini-tts',
    voice: voiceConfig.name,
    input: text,
    instructions: voiceConfig.instructions,
    response_format: 'mp3'
  });

  // Save audio file
  const buffer = Buffer.from(await mp3Response.arrayBuffer());
  fs.writeFileSync(audioPath, buffer);

  // Step 2: Transcribe with Whisper to get word timestamps
  const transcription = await openai.audio.transcriptions.create({
    file: fs.createReadStream(audioPath),
    model: 'whisper-1',
    response_format: 'verbose_json',
    timestamp_granularities: ['word']
  });

  // Extract word timestamps
  const words = transcription.words || [];
  
  // Build timestamp data
  const timestampData = {
    storyId,
    stepId: step.id,
    voice: voiceConfig.name,
    voiceLabel: voiceConfig.label,
    text,
    duration: transcription.duration,
    words: words.map(w => ({
      word: w.word,
      start: w.start,
      end: w.end
    }))
  };

  // Save timestamp data
  fs.writeFileSync(timestampPath, JSON.stringify(timestampData, null, 2));
  console.log(`   ✅ [${voiceConfig.name}] ${step.id} (${words.length} words, ${transcription.duration.toFixed(1)}s)`);

  return timestampData;
}

async function generateForVoice(voiceConfig, stories, options) {
  console.log(`\n🎭 Generating ${voiceConfig.label} voice...`);
  
  const voiceTimestamps = {};

  for (const [storyId, steps] of Object.entries(stories)) {
    console.log(`\n📚 ${storyId}:`);
    voiceTimestamps[storyId] = [];

    for (const step of steps) {
      try {
        const timestamps = await generateAudioForStep(storyId, step, voiceConfig, options);
        voiceTimestamps[storyId].push(timestamps);
      } catch (error) {
        console.error(`   ❌ [${voiceConfig.name}] ${step.id}: ${error.message}`);
      }
    }
  }

  return voiceTimestamps;
}

async function generateAllAudio(options) {
  // Load stories from JSON files
  const stories = loadStories(options);
  
  if (Object.keys(stories).length === 0) {
    console.log('No stories found to process.');
    console.log('Place story JSON files in ./stories/ directory.');
    process.exit(1);
  }

  console.log('🚀 Starting audio generation with gpt-4o-mini-tts...');
  console.log(`   Voices: ${Object.values(VOICES).map(v => v.label).join(', ')}`);
  console.log(`   Stories: ${Object.keys(stories).join(', ')}`);
  if (options.incremental) {
    console.log('   Mode: Incremental (skipping existing files)');
  }

  // Generate all voices in parallel
  const voiceResults = await Promise.all(
    Object.values(VOICES).map(voiceConfig => generateForVoice(voiceConfig, stories, options))
  );

  // Build combined manifest with voice options
  const manifest = {
    voices: Object.fromEntries(
      Object.entries(VOICES).map(([key, config]) => [key, { name: config.name, label: config.label }])
    ),
    defaultVoice: 'ballad',
    generatedAt: new Date().toISOString(),
    stories: Object.keys(stories)
  };

  // Add each voice's timestamps to manifest
  Object.keys(VOICES).forEach((key, index) => {
    manifest[key] = voiceResults[index];
  });

  // Save combined manifest
  const manifestPath = path.join(__dirname, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\n✅ Generated manifest: ${manifestPath}`);

  console.log('\n🎉 Audio generation complete!');
  Object.values(VOICES).forEach(v => {
    console.log(`   📁 ${v.name}/ - ${v.label}`);
  });
}

// Run
const options = parseArgs();
generateAllAudio(options).catch(console.error);
