#!/usr/bin/env node
/**
 * Generate audio files + word timestamps for storytelling diagrams
 * 
 * Uses OpenAI gpt-4o-mini-tts with expressive instructions, then Whisper for timestamps.
 * Generates multiple voice options in parallel.
 * 
 * Usage: node generate-audio.js
 * Requires: OPENAI_API_KEY environment variable
 */

const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');

const openai = new OpenAI();

// Story data extracted from demo-storytelling-diagram.html
const stories = {
  'service-story': [
    {
      id: 'step-0',
      nodeId: 'firebase-config',
      title: 'Foundation: Firebase Config',
      narration: 'Everything starts here. FirebaseApp initializes the Firebase SDK, establishing connections to Authentication and Firestore. This is loaded first on every page.'
    },
    {
      id: 'step-1',
      nodeId: 'auth-service',
      title: 'Authentication Layer',
      narration: 'AuthService wraps Firebase Auth, managing user sessions, login flows, and auth state changes. It depends on FirebaseApp for the auth instance.'
    },
    {
      id: 'step-2',
      nodeId: 'data-service',
      title: 'Data Access Layer',
      narration: 'DataService handles all Firestore CRUD operations. It needs FirebaseApp for database access AND AuthService to scope queries to the current user.'
    },
    {
      id: 'step-3',
      nodeId: 'rbac',
      title: 'Role-Based Access Control',
      narration: 'RBACService checks user roles and permissions. It queries AuthService to get the current user, then checks their role against required permissions.'
    },
    {
      id: 'step-4',
      nodeId: 'progress-tracker',
      title: 'Progress Tracking',
      narration: 'ProgressTracker uses IntersectionObserver to detect which content users have viewed. It saves progress via DataService and identifies users via AuthService.'
    },
    {
      id: 'step-5',
      nodeId: 'activity-tracker',
      title: 'Activity Completion',
      narration: 'ActivityTracker records quiz answers and exercise completions. Like ProgressTracker, it writes to Firestore via DataService for authenticated users.'
    },
    {
      id: 'step-6',
      nodeId: 'route-guard',
      title: 'Route Protection',
      narration: 'RouteGuard runs on page load to check if users can access the current page. It verifies authentication status AND role requirements before showing content.'
    },
    {
      id: 'step-7',
      nodeId: 'lesson-integration',
      title: 'Lesson Orchestration',
      narration: 'Finally, LessonIntegration ties it all together on lesson pages. It coordinates ProgressTracker and ActivityTracker to create a seamless learning experience.'
    }
  ],
  'dataflow-story': [
    {
      id: 'step-0',
      nodeId: 'user-click',
      title: 'User Initiates Action',
      narration: 'It all starts with a user interaction—clicking a Complete Quiz button, scrolling past a section, or submitting a form. The browser captures this event.'
    },
    {
      id: 'step-1',
      nodeId: 'event-handler',
      title: 'Event Handler Catches It',
      narration: 'The DOM event handler fires. This is JavaScript code in the page that responds to user actions and decides what to do next.'
    },
    {
      id: 'step-2',
      nodeId: 'service-call',
      title: 'Service Method Called',
      narration: 'The handler calls a service method like ProgressTracker.markComplete or ActivityTracker.submitAnswer. Business logic lives in these services, not in UI code.'
    },
    {
      id: 'step-3',
      nodeId: 'auth-check',
      title: 'Authentication Verified',
      narration: 'Before writing data, the service checks AuthService.getCurrentUser. If no user is logged in, the action may be queued or rejected.'
    },
    {
      id: 'step-4',
      nodeId: 'firestore-write',
      title: 'Data Written to Firestore',
      narration: 'The service calls Firestore to persist the data. This might be updating a progress document, saving quiz answers, or logging activity.'
    },
    {
      id: 'step-5',
      nodeId: 'realtime-update',
      title: 'Realtime Listener Triggers',
      narration: 'Firestores onSnapshot listeners detect the change instantly. Any component subscribed to this data gets notified automatically.'
    },
    {
      id: 'step-6',
      nodeId: 'state-update',
      title: 'Local State Updates',
      narration: 'The listener callback updates the local state. This keeps the UI in sync with the database.'
    },
    {
      id: 'step-7',
      nodeId: 'ui-render',
      title: 'UI Reflects the Change',
      narration: 'Finally, the UI re-renders to show the new state. A progress bar fills, a checkmark appears, or a success toast shows. The cycle is complete!'
    }
  ]
};

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

async function generateAudioForStep(storyId, step, voiceConfig) {
  const text = `${step.title}. ${step.narration}`;
  const voiceDir = path.join(__dirname, voiceConfig.name, storyId);
  const audioPath = path.join(voiceDir, `${step.id}.mp3`);
  const timestampPath = path.join(voiceDir, `${step.id}.json`);
  
  // Create directory if needed
  if (!fs.existsSync(voiceDir)) {
    fs.mkdirSync(voiceDir, { recursive: true });
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

async function generateForVoice(voiceConfig) {
  console.log(`\n🎭 Generating ${voiceConfig.label} voice...`);
  
  const voiceTimestamps = {};

  for (const [storyId, steps] of Object.entries(stories)) {
    console.log(`\n📚 ${storyId}:`);
    voiceTimestamps[storyId] = [];

    for (const step of steps) {
      try {
        const timestamps = await generateAudioForStep(storyId, step, voiceConfig);
        voiceTimestamps[storyId].push(timestamps);
      } catch (error) {
        console.error(`   ❌ [${voiceConfig.name}] ${step.id}: ${error.message}`);
      }
    }
  }

  return voiceTimestamps;
}

async function generateAllAudio() {
  console.log('🚀 Starting audio generation with gpt-4o-mini-tts...');
  console.log(`   Voices: ${Object.values(VOICES).map(v => v.label).join(', ')}`);
  console.log(`   Stories: ${Object.keys(stories).join(', ')}`);

  // Generate all voices in parallel
  const voiceResults = await Promise.all(
    Object.values(VOICES).map(voiceConfig => generateForVoice(voiceConfig))
  );

  // Build combined manifest with voice options
  const manifest = {
    voices: Object.fromEntries(
      Object.entries(VOICES).map(([key, config]) => [key, { name: config.name, label: config.label }])
    ),
    defaultVoice: 'ballad'
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
  console.log(`   📁 ballad/ - Storyteller voice`);
  console.log(`   📁 sage/   - Wise mentor voice`);
}

// Run
generateAllAudio().catch(console.error);
