#!/usr/bin/env node
/**
 * Create or update course metadata in Firestore
 * 
 * Usage:
 *   node create-course.js <courseId> --title="..." --subtitle="..." [options]
 */

import { initializeApp, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { readFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

// Try to find service account key
const possibleKeyPaths = [
  join(homedir(), 'firebase-admin-key.json'),
  join(homedir(), '.config', 'firebase-admin-key.json'),
  join(process.cwd(), 'firebase-admin-key.json'),
  join(process.cwd(), '..', 'firebase-admin-key.json'),
];

let app;
let keyPath = possibleKeyPaths.find(p => existsSync(p));

if (keyPath) {
  console.log(`🔑 Using service account key: ${keyPath}`);
  const serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'));
  app = initializeApp({
    credential: cert(serviceAccount),
    projectId: 'autonateai-learning-hub'
  });
} else {
  console.log('🔑 Using Application Default Credentials');
  try {
    app = initializeApp({
      credential: applicationDefault(),
      projectId: 'autonateai-learning-hub'
    });
  } catch (e) {
    console.error('\n❌ No credentials found!');
    console.error('\nTo fix this, either:');
    console.error('1. Download service account key from Firebase Console');
    console.error('   Save as: ~/firebase-admin-key.json');
    console.error('\n2. Or run: gcloud auth application-default login');
    process.exit(1);
  }
}

const db = getFirestore();

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('\n📚 Create Course Tool');
    console.log('=====================\n');
    console.log('Usage: node create-course.js <courseId> --title="..." --subtitle="..." [options]\n');
    console.log('Required:');
    console.log('  --title        Course title');
    console.log('  --subtitle     Course subtitle/description');
    console.log('\nOptional:');
    console.log('  --icon         Emoji icon (default: 📚)');
    console.log('  --difficulty   Difficulty level (default: beginner)');
    console.log('  --weeks        Number of weeks (default: 1)');
    console.log('\nExamples:');
    console.log('  node create-course.js endless-opportunities \\');
    console.log('    --title="Endless Opportunities" \\');
    console.log('    --subtitle="Start your tech journey" \\');
    console.log('    --icon="🚀" --weeks=5');
    process.exit(0);
  }

  const courseId = args[0];
  const getArg = (name) => {
    const arg = args.find(a => a.startsWith(`--${name}=`));
    return arg ? arg.split('=')[1].replace(/^["']|["']$/g, '') : null;
  };

  const title = getArg('title');
  const subtitle = getArg('subtitle');
  const icon = getArg('icon') || '📚';
  const difficulty = getArg('difficulty') || 'beginner';
  const weeks = parseInt(getArg('weeks') || '1');

  if (!title || !subtitle) {
    console.error('\n❌ Error: --title and --subtitle are required\n');
    process.exit(1);
  }

  console.log('\n📚 Creating course metadata...\n');
  console.log(`Course ID: ${courseId}`);
  console.log(`Title: ${title}`);
  console.log(`Subtitle: ${subtitle}`);
  console.log(`Icon: ${icon}`);
  console.log(`Difficulty: ${difficulty}`);
  console.log(`Weeks: ${weeks}`);
  console.log('─'.repeat(60));

  try {
    const courseRef = db.collection('courses').doc(courseId);
    const courseDoc = await courseRef.get();

    const courseData = {
      title,
      subtitle,
      icon,
      difficulty,
      totalWeeks: weeks,
      status: 'active',
      updatedAt: Timestamp.now()
    };

    if (courseDoc.exists) {
      await courseRef.update(courseData);
      console.log('\n✅ Updated existing course metadata');
    } else {
      courseData.createdAt = Timestamp.now();
      await courseRef.set(courseData);
      console.log('\n✅ Created new course metadata');
    }

    console.log('\n📄 Course document:');
    console.log(JSON.stringify(courseData, null, 2));

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  }
  
  process.exit(0);
}

main();
