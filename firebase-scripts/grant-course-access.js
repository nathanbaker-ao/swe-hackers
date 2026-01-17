#!/usr/bin/env node
/**
 * Grant course access to recent signups
 * 
 * Usage:
 *   node grant-course-access.js <courseId> [--hours=N] [--dry-run]
 * 
 * Examples:
 *   node grant-course-access.js endless-opportunities --hours=1
 *   node grant-course-access.js apprentice --hours=24 --dry-run
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
    console.log('\n📚 Grant Course Access Tool');
    console.log('============================\n');
    console.log('Usage: node grant-course-access.js <courseId> [--hours=N] [--dry-run]\n');
    console.log('Examples:');
    console.log('  node grant-course-access.js endless-opportunities --hours=1');
    console.log('  node grant-course-access.js apprentice --hours=24 --dry-run');
    process.exit(0);
  }

  const courseId = args[0];
  const hoursArg = args.find(a => a.startsWith('--hours='));
  const hours = hoursArg ? parseInt(hoursArg.split('=')[1]) : 1;
  const dryRun = args.includes('--dry-run');
  
  // Calculate cutoff time
  const now = new Date();
  const cutoffTime = new Date(now.getTime() - (hours * 60 * 60 * 1000));
  const cutoffTimestamp = Timestamp.fromDate(cutoffTime);
  
  console.log(`\n🔍 Looking for users who signed up after: ${cutoffTime.toLocaleString('en-US', { timeZone: 'America/New_York' })} EST`);
  console.log(`📚 Course: ${courseId}`);
  console.log(`${dryRun ? '🧪 DRY RUN MODE - No changes will be made' : '✏️  LIVE MODE - Changes will be saved'}`);
  console.log('─'.repeat(60));

  try {
    // Query users created after cutoff time
    const usersRef = db.collection('users');
    const snapshot = await usersRef
      .where('createdAt', '>', cutoffTimestamp)
      .orderBy('createdAt', 'desc')
      .get();

    if (snapshot.empty) {
      console.log(`\n✅ No new users found in the last ${hours} hour(s)`);
      process.exit(0);
    }

    console.log(`\n👥 Found ${snapshot.size} user(s):\n`);

    const updates = [];
    
    for (const doc of snapshot.docs) {
      const userData = doc.data();
      const createdAt = userData.createdAt?.toDate();
      const uid = doc.id;
      
      console.log(`📧 ${userData.email || 'No email'}`);
      console.log(`   Name: ${userData.displayName || 'Not set'}`);
      console.log(`   UID: ${uid}`);
      console.log(`   Signed up: ${createdAt?.toLocaleString('en-US', { timeZone: 'America/New_York' })} EST`);
      
      // Check if user already has access
      const courseProgressRef = doc.ref.collection('courseProgress').doc(courseId);
      const courseProgressDoc = await courseProgressRef.get();
      
      if (courseProgressDoc.exists) {
        console.log(`   ⚠️  Already has access to ${courseId}`);
      } else {
        console.log(`   ✅ Will grant access to ${courseId}`);
        updates.push({ uid, email: userData.email, userRef: doc.ref, courseProgressRef });
      }
      console.log('');
    }

    if (updates.length === 0) {
      console.log(`\n✅ All users already have access to ${courseId}`);
      process.exit(0);
    }

    if (dryRun) {
      console.log(`\n🧪 DRY RUN: Would grant access to ${updates.length} user(s)`);
      process.exit(0);
    }

    // Grant course access
    console.log(`\n🚀 Granting course access to ${updates.length} user(s)...\n`);
    
    for (const { uid, email, courseProgressRef } of updates) {
      try {
        await courseProgressRef.set({
          enrolledAt: Timestamp.now(),
          status: 'active',
          currentWeek: 1,
          completedWeeks: [],
          updatedAt: Timestamp.now()
        });
        
        console.log(`✅ ${email} (${uid})`);
      } catch (error) {
        console.error(`❌ Failed for ${email}: ${error.message}`);
      }
    }

    console.log(`\n✅ Done! Granted access to ${updates.length} user(s)`);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  }
  
  process.exit(0);
}

main();
