#!/usr/bin/env node
/**
 * Generate audio files + word timestamps for storytelling diagrams
 * 
 * Uses OpenAI gpt-4o-mini-tts with expressive instructions, then Whisper for timestamps.
 * FULLY PARALLELIZED: All steps across all stories and voices generated simultaneously!
 * 
 * Usage: 
 *   node generate-audio.js                        # Process all story files
 *   node generate-audio.js --page demo-storytelling   # Process specific page
 *   node generate-audio.js --incremental          # Skip existing files
 *   node generate-audio.js --story service-story  # Process specific story
 *   node generate-audio.js --concurrency 20       # Limit parallel requests (default: 15)
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
    story: null,
    concurrency: 15  // Default concurrent requests
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
      case '--concurrency':
      case '-c':
        options.concurrency = parseInt(args[++i], 10);
        break;
      case '--help':
      case '-h':
        console.log(`
Audio Generator for Storytelling Diagrams

Usage: node generate-audio.js [options]

Options:
  --incremental, -i      Skip existing audio files
  --page, -p <name>      Process only specified page (e.g., demo-storytelling)
  --story, -s <name>     Process only specified story (e.g., service-story)
  --concurrency, -c <n>  Max parallel API calls (default: 15)
  --help, -h             Show this help message

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

// Semaphore for controlling concurrency
class Semaphore {
  constructor(max) {
    this.max = max;
    this.current = 0;
    this.queue = [];
  }

  async acquire() {
    if (this.current < this.max) {
      this.current++;
      return;
    }
    await new Promise(resolve => this.queue.push(resolve));
  }

  release() {
    this.current--;
    if (this.queue.length > 0) {
      this.current++;
      this.queue.shift()();
    }
  }
}

async function generateAudioForStep(storyId, step, voiceConfig, options, semaphore, stats) {
  const text = `${step.title}. ${step.narration}`;
  const voiceDir = path.join(__dirname, voiceConfig.name, storyId);
  const audioPath = path.join(voiceDir, `${step.id}.mp3`);
  const timestampPath = path.join(voiceDir, `${step.id}.json`);
  
  // Create directory if needed
  if (!fs.existsSync(voiceDir)) {
    fs.mkdirSync(voiceDir, { recursive: true });
  }

  // Skip if incremental and file exists - but still load existing timestamps for manifest
  if (options.incremental && fs.existsSync(audioPath) && fs.existsSync(timestampPath)) {
    stats.skipped++;
    try {
      const existingData = JSON.parse(fs.readFileSync(timestampPath, 'utf8'));
      return existingData; // Return existing timestamp data for manifest
    } catch (e) {
      return { skipped: true, storyId, stepId: step.id, voice: voiceConfig.name };
    }
  }

  // Acquire semaphore slot
  await semaphore.acquire();
  
  const startTime = Date.now();
  const taskId = `[${voiceConfig.name}] ${storyId}/${step.id}`;
  
  try {
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
    
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    stats.completed++;
    console.log(`✅ ${taskId} (${words.length} words, ${transcription.duration.toFixed(1)}s audio, ${elapsed}s elapsed) [${stats.completed}/${stats.total}]`);

    return timestampData;
  } catch (error) {
    stats.failed++;
    console.error(`❌ ${taskId}: ${error.message}`);
    return { error: error.message, storyId, stepId: step.id, voice: voiceConfig.name };
  } finally {
    semaphore.release();
  }
}

async function generateAllAudio(options) {
  // Load stories from JSON files
  const stories = loadStories(options);
  
  if (Object.keys(stories).length === 0) {
    console.log('No stories found to process.');
    console.log('Place story JSON files in ./stories/ directory.');
    process.exit(1);
  }

  // Calculate total tasks
  const voices = Object.values(VOICES);
  const storyEntries = Object.entries(stories);
  let totalSteps = 0;
  storyEntries.forEach(([_, steps]) => totalSteps += steps.length);
  const totalTasks = totalSteps * voices.length;

  console.log('🚀 Starting PARALLEL audio generation with gpt-4o-mini-tts...');
  console.log(`   Voices: ${voices.map(v => v.label).join(', ')}`);
  console.log(`   Stories: ${storyEntries.length} stories, ${totalSteps} steps`);
  console.log(`   Total tasks: ${totalTasks} (${totalSteps} steps × ${voices.length} voices)`);
  console.log(`   Concurrency: ${options.concurrency} parallel requests`);
  if (options.incremental) {
    console.log('   Mode: Incremental (skipping existing files)');
  }
  console.log('\n');

  // Create semaphore for rate limiting
  const semaphore = new Semaphore(options.concurrency);
  
  // Stats tracking
  const stats = { total: totalTasks, completed: 0, skipped: 0, failed: 0 };
  const startTime = Date.now();

  // Build array of ALL tasks (every step × every voice)
  const allTasks = [];
  for (const voiceConfig of voices) {
    for (const [storyId, steps] of storyEntries) {
      for (const step of steps) {
        allTasks.push({ storyId, step, voiceConfig });
      }
    }
  }

  // Execute ALL tasks in parallel (controlled by semaphore)
  const results = await Promise.all(
    allTasks.map(({ storyId, step, voiceConfig }) =>
      generateAudioForStep(storyId, step, voiceConfig, options, semaphore, stats)
    )
  );

  // Organize results by voice and story
  const voiceResults = {};
  for (const voiceConfig of voices) {
    voiceResults[voiceConfig.name] = {};
    for (const storyId of Object.keys(stories)) {
      voiceResults[voiceConfig.name][storyId] = [];
    }
  }

  for (const result of results) {
    if (result && !result.error && !result.skipped && result.voice && result.storyId) {
      voiceResults[result.voice][result.storyId].push(result);
    }
  }

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
  for (const [voiceName, storyData] of Object.entries(voiceResults)) {
    manifest[voiceName] = storyData;
  }

  // Save combined manifest
  const manifestPath = path.join(__dirname, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  // Summary
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('\n' + '='.repeat(60));
  console.log('🎉 Audio generation complete!');
  console.log(`   ✅ Completed: ${stats.completed}`);
  console.log(`   ⏭️  Skipped: ${stats.skipped}`);
  console.log(`   ❌ Failed: ${stats.failed}`);
  console.log(`   ⏱️  Total time: ${elapsed}s`);
  console.log(`   📁 Manifest: ${manifestPath}`);
  console.log('='.repeat(60));
  
  voices.forEach(v => {
    console.log(`   📁 ${v.name}/ - ${v.label}`);
  });
}

// Run
const options = parseArgs();
generateAllAudio(options).catch(console.error);
