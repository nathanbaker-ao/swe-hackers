import admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';

// Initialize with Application Default Credentials
// Set GOOGLE_APPLICATION_CREDENTIALS environment variable if running locally with a service account
admin.initializeApp({
  projectId: 'marketing-command-center-anai'
});

const db = admin.firestore();

/**
 * Pushes researched intelligence to Firestore
 */
async function populateGVSUIntelligence() {
  console.log("🚀 Starting Intelligence Population for GVSU...");

  const orgId = 'gvsu';
  const deptId = 'gvsu-cs';

  const gvsuOrg = {
    id: orgId,
    name: 'Grand Valley State University',
    websiteUrl: 'https://www.gvsu.edu',
    missionVibe: 'Empowering learners to lead in their professions and communities. Strong focus on regional impact and career readiness.',
    culturalSignals: ['Lakers', 'West Michigan Hub', 'Professional Excellence'],
    location: {
      lat: 42.9699,
      lng: -85.8885
    }
  };

  const gvsuCSDept = {
    id: deptId,
    orgId: orgId,
    name: 'School of Computing',
    curriculumMap: ['Data Structures', 'Algorithms', 'Operating Systems', 'Machine Learning', 'AI', 'Software Engineering'],
    techStackFocus: ['Java', 'C', 'Python', 'React', 'SQL'],
    events: [
      { title: 'Winter Semester Career Fair', type: 'career_fair', date: '2026-02-25' },
      { title: 'CS Senior Projects Showcase', type: 'event', date: '2026-04-15' }
    ]
  };

  try {
    console.log("Saving Organization...");
    await db.collection('organizations').doc(orgId).set(gvsuOrg);
    
    console.log("Saving Department...");
    await db.collection('departments').doc(deptId).set(gvsuCSDept);

    console.log("✅ GVSU Intelligence Successfully Mapped.");
  } catch (error) {
    console.error("❌ Error populating intelligence:", error);
  }
}

populateGVSUIntelligence();
