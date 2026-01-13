#!/usr/bin/env node
/**
 * Import partners from JSON file to Firestore
 * 
 * Usage:
 *   node import-partners.js <json-file>
 *   node import-partners.js data-input-files/grand-rapids-partner-prospects.json
 */

import { initializeApp, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
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
  app = initializeApp({
    credential: applicationDefault(),
    projectId: 'autonateai-learning-hub'
  });
}

const db = getFirestore();

async function importPartners(jsonPath) {
  // Read JSON file
  if (!existsSync(jsonPath)) {
    console.error(`❌ File not found: ${jsonPath}`);
    process.exit(1);
  }

  const data = JSON.parse(readFileSync(jsonPath, 'utf8'));
  const partners = data.partners;

  if (!partners || !Array.isArray(partners)) {
    console.error('❌ Invalid JSON format: expected { partners: [...] }');
    process.exit(1);
  }

  console.log(`\n📦 Importing ${partners.length} partners...\n`);

  const batch = db.batch();
  const now = FieldValue.serverTimestamp();
  let count = 0;

  for (const partner of partners) {
    const partnerRef = db.collection('partners').doc();
    
    const partnerDoc = {
      name: partner.name,
      type: partner.type,
      status: partner.status || 'prospect',
      contact: {
        name: partner.contact?.name || '',
        email: partner.contact?.email || '',
        phone: partner.contact?.phone || '',
        title: partner.contact?.title || ''
      },
      website: partner.website || '',
      description: partner.description || '',
      logoURL: partner.logoURL || '',
      address: {
        street: partner.address?.street || '',
        city: partner.address?.city || '',
        state: partner.address?.state || '',
        zip: partner.address?.zip || '',
        country: partner.address?.country || 'USA'
      },
      tags: partner.tags || [],
      metrics: {
        totalStudents: 0,
        totalCourses: 0,
        activeCohorts: 0,
        revenue: 0
      },
      totalInteractions: 0,
      createdAt: now,
      updatedAt: now,
      createdBy: 'import-script'
    };

    batch.set(partnerRef, partnerDoc);
    count++;
    console.log(`  ✓ ${partner.name}`);
  }

  console.log(`\n💾 Writing batch to Firestore...`);
  await batch.commit();
  
  console.log(`\n✅ Successfully imported ${count} partners!`);
  console.log(`\n🔗 View in Firebase Console:`);
  console.log(`   https://console.firebase.google.com/project/autonateai-learning-hub/firestore/data/partners\n`);
}

async function main() {
  const jsonPath = process.argv[2];
  
  if (!jsonPath) {
    console.log('\n📦 Partner Import Tool');
    console.log('========================\n');
    console.log('Usage: node import-partners.js <json-file>\n');
    console.log('Example:');
    console.log('  node import-partners.js data-input-files/grand-rapids-partner-prospects.json\n');
    process.exit(0);
  }

  try {
    await importPartners(jsonPath);
  } catch (error) {
    console.error('❌ Import failed:', error.message);
    process.exit(1);
  }
  
  process.exit(0);
}

main();
