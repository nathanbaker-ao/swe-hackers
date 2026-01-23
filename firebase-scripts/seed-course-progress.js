#!/usr/bin/env node
/**
 * Seed courseProgress data for a specific user
 * 
 * This creates course progress with lesson completions for testing
 * the dashboard timeline and course cards.
 * 
 * Usage:
 *   node seed-course-progress.js <userId>
 *   node seed-course-progress.js bLDCOI8o0dbwLyX5eOYHaNQMmyq1
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
    console.error('Download service account key and save as: ~/firebase-admin-key.json');
    process.exit(1);
  }
}

const db = getFirestore();

async function main() {
  const args = process.argv.slice(2);
  const userId = args[0];
  
  if (!userId) {
    console.log('\n📊 Course Progress Seed Script');
    console.log('================================\n');
    console.log('Usage: node seed-course-progress.js <userId>\n');
    console.log('Example:');
    console.log('  node seed-course-progress.js bLDCOI8o0dbwLyX5eOYHaNQMmyq1\n');
    process.exit(0);
  }
  
  console.log(`\n📊 Seeding course progress for user: ${userId}`);
  
  const now = new Date();
  
  // Helper to create timestamps for past dates
  const daysAgo = (days) => Timestamp.fromDate(new Date(now.getTime() - days * 24 * 60 * 60 * 1000));
  const hoursAgo = (hours) => Timestamp.fromDate(new Date(now.getTime() - hours * 60 * 60 * 1000));
  
  try {
    // ═══════════════════════════════════════════════════════════════════════
    // APPRENTICE COURSE PROGRESS
    // ═══════════════════════════════════════════════════════════════════════
    
    const apprenticeProgress = {
      courseId: 'apprentice',
      enrolledAt: daysAgo(30),
      lastActivity: hoursAgo(2),
      totalTimeSpent: 18420, // ~5 hours in seconds
      progressPercent: 42,
      lessons: {
        'ch0-origins': {
          completed: true,
          completedAt: daysAgo(25),
          viewedSections: 8,
          totalSections: 8,
          progressPercent: 100,
          timeSpent: 2400
        },
        'ch1-stone': {
          completed: true,
          completedAt: daysAgo(18),
          viewedSections: 9,
          totalSections: 9,
          progressPercent: 100,
          timeSpent: 3600
        },
        'ch2-lightning': {
          completed: true,
          completedAt: daysAgo(10),
          viewedSections: 7,
          totalSections: 7,
          progressPercent: 100,
          timeSpent: 4200
        },
        'ch3-magnetism': {
          completed: false,
          viewedSections: 4,
          totalSections: 8,
          progressPercent: 50,
          timeSpent: 2400,
          lastViewedAt: hoursAgo(2)
        },
        'ch4-architect': {
          completed: false,
          viewedSections: 0,
          totalSections: 6,
          progressPercent: 0,
          timeSpent: 0
        },
        'ch5-capstone1': {
          completed: false,
          viewedSections: 0,
          totalSections: 5,
          progressPercent: 0,
          timeSpent: 0
        },
        'ch6-capstone2': {
          completed: false,
          viewedSections: 0,
          totalSections: 5,
          progressPercent: 0,
          timeSpent: 0
        }
      }
    };
    
    console.log('\n📚 Writing apprentice course progress...');
    await db.collection('users').doc(userId)
      .collection('courseProgress').doc('apprentice')
      .set(apprenticeProgress);
    console.log('✅ Apprentice progress saved (3 lessons complete)');
    
    // ═══════════════════════════════════════════════════════════════════════
    // ENDLESS OPPORTUNITIES COURSE PROGRESS
    // ═══════════════════════════════════════════════════════════════════════
    
    const endlessProgress = {
      courseId: 'endless-opportunities',
      enrolledAt: daysAgo(45),
      lastActivity: daysAgo(3),
      totalTimeSpent: 28800, // ~8 hours
      progressPercent: 67,
      lessons: {
        'week0-intro': {
          completed: true,
          completedAt: daysAgo(42),
          viewedSections: 5,
          totalSections: 5,
          progressPercent: 100,
          timeSpent: 1800
        },
        'week1-foundations': {
          completed: true,
          completedAt: daysAgo(35),
          viewedSections: 8,
          totalSections: 8,
          progressPercent: 100,
          timeSpent: 5400
        },
        'week2-variables': {
          completed: true,
          completedAt: daysAgo(28),
          viewedSections: 10,
          totalSections: 10,
          progressPercent: 100,
          timeSpent: 7200
        },
        'week3-functions': {
          completed: true,
          completedAt: daysAgo(14),
          viewedSections: 12,
          totalSections: 12,
          progressPercent: 100,
          timeSpent: 9000
        },
        'week4-loops': {
          completed: false,
          viewedSections: 6,
          totalSections: 10,
          progressPercent: 60,
          timeSpent: 3600,
          lastViewedAt: daysAgo(3)
        },
        'week5-projects': {
          completed: false,
          viewedSections: 0,
          totalSections: 8,
          progressPercent: 0,
          timeSpent: 0
        }
      }
    };
    
    console.log('\n📚 Writing endless-opportunities course progress...');
    await db.collection('users').doc(userId)
      .collection('courseProgress').doc('endless-opportunities')
      .set(endlessProgress);
    console.log('✅ Endless Opportunities progress saved (4 lessons complete)');
    
    // ═══════════════════════════════════════════════════════════════════════
    // SUMMARY
    // ═══════════════════════════════════════════════════════════════════════
    
    console.log('\n══════════════════════════════════════════════════');
    console.log('📊 Course Progress Seeded Successfully!');
    console.log('══════════════════════════════════════════════════');
    console.log('\nApprentice Course:');
    console.log('  - Progress: 42%');
    console.log('  - Completed: ch0-origins, ch1-stone, ch2-lightning');
    console.log('  - In Progress: ch3-magnetism (50%)');
    console.log('\nEndless Opportunities Course:');
    console.log('  - Progress: 67%');
    console.log('  - Completed: week0, week1, week2, week3');
    console.log('  - In Progress: week4-loops (60%)');
    console.log('\nTotal: 7 lessons completed across 2 courses');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
  
  process.exit(0);
}

main();
