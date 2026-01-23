/**
 * onLessonComplete - Firestore trigger for lesson completion
 * 
 * This Cloud Function fires when a courseProgress document is updated
 * and a lesson is marked as complete. It triggers analytics recomputation.
 * 
 * @module firebase-functions/analytics/onLessonComplete
 */

import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';

/**
 * Debounce window in milliseconds
 */
const DEBOUNCE_WINDOW_MS = 10000;

/**
 * In-memory cache for recent computations
 */
const recentComputations = new Map();

/**
 * Firestore trigger that fires when courseProgress is updated
 * 
 * Document path: users/{userId}/courseProgress/{courseId}
 */
export const onLessonComplete = onDocumentWritten(
  'users/{userId}/courseProgress/{courseId}',
  async (event) => {
    const { userId, courseId } = event.params;
    const beforeData = event.data?.before?.data();
    const afterData = event.data?.after?.data();
    
    if (!afterData) {
      logger.info(`[onLessonComplete] Document deleted, skipping`);
      return null;
    }
    
    // Check if any lesson was newly completed
    const beforeLessons = beforeData?.lessons || {};
    const afterLessons = afterData?.lessons || {};
    
    let newlyCompletedLessons = [];
    for (const [lessonId, lessonData] of Object.entries(afterLessons)) {
      const wasCompleted = beforeLessons[lessonId]?.completed;
      const isCompleted = lessonData?.completed;
      
      if (isCompleted && !wasCompleted) {
        newlyCompletedLessons.push(lessonId);
      }
    }
    
    if (newlyCompletedLessons.length === 0) {
      logger.info(`[onLessonComplete] No new lesson completions, skipping`);
      return null;
    }
    
    logger.info(`[onLessonComplete] Lessons completed`, {
      userId,
      courseId,
      newlyCompletedLessons,
    });
    
    // Debounce check
    const lastComputation = recentComputations.get(userId);
    const now = Date.now();
    
    if (lastComputation && (now - lastComputation) < DEBOUNCE_WINDOW_MS) {
      logger.info(`[onLessonComplete] Debouncing for user: ${userId}`);
      return null;
    }
    
    recentComputations.set(userId, now);
    
    try {
      // Recompute user analytics
      const analytics = await recomputeAnalyticsFromProgress(userId);
      
      logger.info(`[onLessonComplete] Analytics updated`, {
        userId,
        overallScore: analytics.overallScore,
        totalActivities: analytics.totalActivities,
      });
      
      return { success: true, userId };
      
    } catch (error) {
      logger.error(`[onLessonComplete] Error`, {
        userId,
        error: error.message,
      });
      return { success: false, error: error.message };
      
    } finally {
      // Clean up old debounce entries
      for (const [uid, timestamp] of recentComputations.entries()) {
        if (now - timestamp > 60000) {
          recentComputations.delete(uid);
        }
      }
    }
  }
);

/**
 * Recompute analytics from course progress data
 */
async function recomputeAnalyticsFromProgress(userId) {
  const db = getFirestore();
  
  // Get all course progress for user
  const progressSnapshot = await db
    .collection('users')
    .doc(userId)
    .collection('courseProgress')
    .get();
  
  let totalLessons = 0;
  let completedLessons = 0;
  let totalTimeSpent = 0;
  let skillScores = {};
  let recentActivity = [];
  let streakDays = new Set();
  
  for (const doc of progressSnapshot.docs) {
    const courseId = doc.id;
    const progress = doc.data();
    const lessons = progress.lessons || {};
    
    for (const [lessonId, lessonData] of Object.entries(lessons)) {
      totalLessons++;
      
      if (lessonData.completed) {
        completedLessons++;
        
        // Track completion dates for streak
        if (lessonData.completedAt) {
          const date = lessonData.completedAt.toDate?.() || new Date(lessonData.completedAt._seconds * 1000);
          streakDays.add(date.toDateString());
        }
        
        // Accumulate skill scores from viewed sections
        if (lessonData.viewedSections && lessonData.totalSections) {
          const score = lessonData.viewedSections / lessonData.totalSections;
          const skill = extractSkillFromLesson(lessonId, courseId);
          if (skill) {
            if (!skillScores[skill]) {
              skillScores[skill] = { total: 0, count: 0 };
            }
            skillScores[skill].total += score;
            skillScores[skill].count++;
          }
        }
      }
      
      // Track time spent (estimate from progress)
      if (lessonData.progressPercent) {
        totalTimeSpent += Math.round(lessonData.progressPercent * 0.15); // ~15 min per full lesson
      }
    }
  }
  
  // Get activity attempts for additional metrics
  const attemptsSnapshot = await db
    .collection('users')
    .doc(userId)
    .collection('activityAttempts')
    .orderBy('createdAt', 'desc')
    .limit(100)
    .get();
  
  let totalAttempts = attemptsSnapshot.size;
  let correctAttempts = 0;
  
  for (const doc of attemptsSnapshot.docs) {
    const attempt = doc.data();
    if (attempt.correct) correctAttempts++;
    
    if (attempt.createdAt) {
      const date = attempt.createdAt.toDate?.() || new Date(attempt.createdAt._seconds * 1000);
      streakDays.add(date.toDateString());
    }
  }
  
  // Calculate overall score (weighted average)
  const progressScore = totalLessons > 0 ? (completedLessons / totalLessons) : 0;
  const accuracyScore = totalAttempts > 0 ? (correctAttempts / totalAttempts) : 0;
  const overallScore = Math.round((progressScore * 0.6 + accuracyScore * 0.4) * 100);
  
  // Calculate streak
  const { currentStreak, streakRecord } = calculateStreak(Array.from(streakDays));
  
  // Calculate skill breakdown
  const skills = {};
  for (const [skill, data] of Object.entries(skillScores)) {
    skills[skill] = Math.round((data.total / data.count) * 100);
  }
  
  // Identify growth and strength areas
  const growthAreas = [];
  const strengthAreas = [];
  for (const [skill, score] of Object.entries(skills)) {
    if (score < 60) {
      growthAreas.push({ topic: skill, score: score / 100 });
    } else if (score >= 80) {
      strengthAreas.push({ topic: skill, score: score / 100 });
    }
  }
  
  // Build analytics document
  const analytics = {
    userId,
    overallScore,
    totalActivities: completedLessons + totalAttempts,
    totalLessonsCompleted: completedLessons,
    totalAttempts,
    correctAttempts,
    accuracyRate: totalAttempts > 0 ? Math.round(accuracyScore * 100) : 0,
    skills,
    growthAreas: growthAreas.slice(0, 3),
    strengthAreas: strengthAreas.slice(0, 3),
    engagementPatterns: {
      currentStreak,
      streakRecord,
      totalTimeSpentMinutes: totalTimeSpent,
      avgSessionLength: Math.round(totalTimeSpent / Math.max(streakDays.size, 1)),
      consistencyScore: Math.min(streakDays.size / 30, 1),
      peakPerformanceHour: 19, // Default evening
    },
    lastComputed: FieldValue.serverTimestamp(),
    computeVersion: '2.0.0',
    dataQuality: {
      hasEnoughData: completedLessons >= 3,
      activityCount: completedLessons + totalAttempts,
      daysCovered: streakDays.size,
    },
  };
  
  // Save to Firestore
  await db.collection('userAnalytics').doc(userId).set(analytics, { merge: true });
  
  return analytics;
}

/**
 * Extract skill category from lesson ID
 */
function extractSkillFromLesson(lessonId, courseId) {
  const skillMappings = {
    'variables': 'Variables',
    'functions': 'Functions',
    'loops': 'Loops',
    'recursion': 'Recursion',
    'data': 'Data Structures',
    'intro': 'Fundamentals',
    'foundations': 'Fundamentals',
    'origins': 'Fundamentals',
    'stone': 'Fundamentals',
    'lightning': 'Control Flow',
    'magnetism': 'Patterns',
    'architect': 'Architecture',
    'capstone': 'Projects',
  };
  
  const lowerLesson = lessonId.toLowerCase();
  for (const [key, skill] of Object.entries(skillMappings)) {
    if (lowerLesson.includes(key)) {
      return skill;
    }
  }
  
  return 'General';
}

/**
 * Calculate current and record streaks from date strings
 */
function calculateStreak(dateStrings) {
  if (dateStrings.length === 0) {
    return { currentStreak: 0, streakRecord: 0 };
  }
  
  const dates = dateStrings
    .map(d => new Date(d))
    .sort((a, b) => a - b);
  
  let currentStreak = 1;
  let streakRecord = 1;
  let tempStreak = 1;
  
  for (let i = 1; i < dates.length; i++) {
    const diffDays = Math.round((dates[i] - dates[i-1]) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      tempStreak++;
    } else if (diffDays > 1) {
      streakRecord = Math.max(streakRecord, tempStreak);
      tempStreak = 1;
    }
  }
  streakRecord = Math.max(streakRecord, tempStreak);
  
  // Check if current streak is active
  const lastDate = dates[dates.length - 1];
  const today = new Date();
  const daysSinceLast = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
  
  currentStreak = daysSinceLast <= 1 ? tempStreak : 0;
  
  return { currentStreak, streakRecord };
}

export default onLessonComplete;
