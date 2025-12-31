/**
 * Firebase Configuration for AutoNateAI Learning Hub
 * 
 * SETUP INSTRUCTIONS:
 * 1. Go to Firebase Console: https://console.firebase.google.com/
 * 2. Create a new project or use existing one
 * 3. Enable Authentication (Email/Password + Google Sign-In)
 * 4. Enable Firestore Database
 * 5. Copy your config values below
 * 6. Add your domain to authorized domains in Firebase Auth settings
 */

// Firebase configuration - REPLACE WITH YOUR ACTUAL CONFIG
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
let app, auth, db;

function initFirebase() {
  if (typeof firebase !== 'undefined') {
    // Check if already initialized
    if (!firebase.apps.length) {
      app = firebase.initializeApp(firebaseConfig);
    } else {
      app = firebase.app();
    }
    auth = firebase.auth();
    db = firebase.firestore();
    
    console.log('🔥 Firebase initialized');
    return true;
  } else {
    console.warn('Firebase SDK not loaded');
    return false;
  }
}

// Export for use in other modules
window.FirebaseApp = {
  init: initFirebase,
  getAuth: () => auth,
  getDb: () => db,
  getApp: () => app
};

