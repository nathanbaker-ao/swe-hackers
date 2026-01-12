# Firestore Data Model

> **Purpose:** Complete documentation of the Firestore database structure, collections, and data relationships.

## Collection Hierarchy

```mermaid
flowchart TB
    subgraph Root["☁️ Firestore Root"]
        USERS[(users)]
        COURSES[(courses)]
        ACTIVITIES[(activities)]
    end

    subgraph UserDoc["users/{uid}"]
        UD[User Document]
        
        subgraph UserSub["Subcollections"]
            CP[(courseProgress)]
            AA[(activityAttempts)]
            QA[(quizAnswers)]
            DC[(dailyChallenges)]
            NOTES[(notes)]
        end
    end

    subgraph CourseProgress["courseProgress/{courseId}"]
        CPD[Course Progress Doc]
        LP[(lessonProgress)]
    end

    USERS --> UD
    UD --> UserSub
    CP --> CPD
    CPD --> LP

    style Root fill:#1a1a2e,stroke:#7986cb,color:#fff
    style UserDoc fill:#16213e,stroke:#4db6ac,color:#fff
    style UserSub fill:#0f3460,stroke:#ffd93d,color:#fff
    style CourseProgress fill:#51cf66,stroke:#2f9e44,color:#fff
```

## Entity Relationship Diagram

```mermaid
erDiagram
    User ||--o{ CourseProgress : "has"
    User ||--o{ ActivityAttempt : "makes"
    User ||--o{ QuizAnswer : "submits"
    User ||--o{ DailyChallenge : "completes"
    User ||--o{ Note : "creates"
    
    CourseProgress ||--o{ LessonProgress : "contains"
    
    Course ||--o{ Activity : "defines"
    
    User {
        string uid PK
        string email
        string displayName
        string photoURL
        string role
        array organizationAccess
        array courseAccess
        int currentStreak
        int longestStreak
        timestamp createdAt
        timestamp lastLoginAt
        timestamp lastStreakDate
        object settings
    }
    
    CourseProgress {
        string courseId PK
        string courseName
        string courseIcon
        int progressPercent
        int completedLessons
        int totalLessons
        object lessons
        object activityStats
        string lastLesson
        int lastLessonProgress
        timestamp enrolledAt
        timestamp lastActivity
    }
    
    LessonProgress {
        string lessonId PK
        string courseId
        array sections
        int viewedSections
        int totalSections
        int progressPercent
        boolean completed
        int totalTimeSpent
        string lastSection
        timestamp completedAt
        timestamp updatedAt
    }
    
    ActivityAttempt {
        string id PK
        string activityId
        string activityType
        string courseId
        string lessonId
        int attemptNumber
        boolean correct
        float score
        int timeSpentMs
        object response
        timestamp createdAt
    }
```

---

## Collection: `users`

### Path
`users/{uid}`

### Purpose
Store user profile, settings, and aggregate learning data.

### Schema

```mermaid
classDiagram
    class UserDocument {
        +string uid
        +string email
        +string displayName
        +string photoURL
        +string role
        +string[] organizationAccess
        +string[] courseAccess
        +int currentStreak
        +int longestStreak
        +Timestamp lastStreakDate
        +Timestamp createdAt
        +Timestamp lastLoginAt
        +UserSettings settings
        +object courses
        +object progress
    }
    
    class UserSettings {
        +boolean emailNotifications
        +string theme
    }
    
    UserDocument *-- UserSettings
```

### Field Descriptions

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `uid` | string | Firebase Auth UID | `"abc123xyz"` |
| `email` | string | User's email | `"user@example.com"` |
| `displayName` | string | Display name | `"John Doe"` |
| `photoURL` | string | Avatar URL | `"https://..."` |
| `role` | string | User role | `"user"`, `"enterprise"`, `"admin"` |
| `organizationAccess` | array | Org IDs with access | `["endless-opportunities"]` |
| `courseAccess` | array | Direct course access | `["special-course"]` |
| `currentStreak` | number | Consecutive active days | `7` |
| `longestStreak` | number | All-time longest streak | `14` |
| `lastStreakDate` | timestamp | Last activity date | `2024-01-15T...` |
| `createdAt` | timestamp | Account creation | `2024-01-01T...` |
| `lastLoginAt` | timestamp | Last login time | `2024-01-15T...` |

### Created By
- `AuthService.createUserDocument()` on first login
- `AuthService.register()` after registration

### Updated By
- `AuthService.updateUserProfile()` on each login
- `DataService.updateStreak()` on daily activity
- `RBACService.setUserRole()` for role changes
- `RBACService.grantOrganizationAccess()` for org access

---

## Collection: `users/{uid}/courseProgress`

### Path
`users/{uid}/courseProgress/{courseId}`

### Purpose
Track overall progress for a specific course.

### Schema

```mermaid
classDiagram
    class CourseProgressDocument {
        +string courseId
        +string courseName
        +string courseIcon
        +int progressPercent
        +int completedLessons
        +int totalLessons
        +object lessons
        +object activityStats
        +string lastLesson
        +int lastLessonProgress
        +int totalTimeSpent
        +Timestamp enrolledAt
        +Timestamp lastActivity
    }
    
    class LessonSummary {
        +boolean completed
        +int progressPercent
        +int viewedSections
        +int totalSections
        +int totalTimeSpent
        +string lastSection
        +Timestamp lastUpdated
        +Timestamp completedAt
    }
    
    class ActivityStats {
        +int totalAttempts
        +int totalCorrect
        +int correctFirstTry
        +float avgScore
        +object byType
        +Timestamp lastActivity
    }
    
    CourseProgressDocument *-- "0..*" LessonSummary : lessons
    CourseProgressDocument *-- ActivityStats
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `courseId` | string | Course identifier |
| `courseName` | string | Display name |
| `courseIcon` | string | Emoji icon |
| `progressPercent` | number | 0-100 completion |
| `completedLessons` | number | Lessons finished |
| `totalLessons` | number | Always 7 |
| `lessons` | object | Per-lesson summaries (keyed by lessonId) |
| `activityStats` | object | Aggregated activity performance |
| `lastLesson` | string | Most recently viewed lesson |
| `enrolledAt` | timestamp | When user enrolled |
| `lastActivity` | timestamp | Last interaction |

### Lessons Object Structure

```javascript
{
  "ch0-origins": {
    completed: true,
    progressPercent: 100,
    viewedSections: 8,
    totalSections: 8,
    totalTimeSpent: 285000,
    lastSection: "section-8",
    lastUpdated: Timestamp,
    completedAt: Timestamp
  },
  "ch1-stone": {
    completed: false,
    progressPercent: 45,
    viewedSections: 3,
    totalSections: 7,
    // ...
  }
}
```

### Created By
- `DataService.enrollInCourse()` when user starts a course

### Updated By
- `DataService.saveLessonProgress()` on lesson interaction
- `DataService.recalculateCourseProgress()` when lesson completes
- `DataService.updateActivityStats()` after activity attempts

---

## Collection: `users/{uid}/courseProgress/{courseId}/lessonProgress`

### Path
`users/{uid}/courseProgress/{courseId}/lessonProgress/{lessonId}`

### Purpose
Detailed per-section progress within a lesson.

### Schema

```mermaid
classDiagram
    class LessonProgressDocument {
        +string lessonId
        +string courseId
        +string userId
        +Section[] sections
        +int viewedSections
        +int completedSections
        +int totalSections
        +int progressPercent
        +boolean completed
        +int totalTimeSpent
        +string lastSection
        +Timestamp startedAt
        +Timestamp completedAt
        +Timestamp updatedAt
    }
    
    class Section {
        +string id
        +string title
        +boolean viewed
        +boolean completed
        +int timeSpent
    }
    
    LessonProgressDocument *-- "1..*" Section
```

### Section Array Example

```javascript
{
  lessonId: "ch0-origins",
  courseId: "apprentice",
  sections: [
    {
      id: "section-0",
      title: "In The Beginning...",
      viewed: true,
      completed: true,
      timeSpent: 45000
    },
    {
      id: "section-1", 
      title: "How Electricity Thinks",
      viewed: true,
      completed: true,
      timeSpent: 32000
    },
    // ... more sections
  ],
  viewedSections: 8,
  totalSections: 8,
  progressPercent: 100,
  completed: true,
  totalTimeSpent: 285000,
  lastSection: "section-7"
}
```

### Created By
- `DataService.saveLessonProgress()` on first section view

### Updated By
- `DataService.saveLessonProgress()` on each section view
- `ProgressTracker.saveProgress()` on scroll/interaction

---

## Collection: `users/{uid}/activityAttempts`

### Path
`users/{uid}/activityAttempts/{attemptId}`

### Purpose
Store individual activity attempt records for analytics.

### Schema

```mermaid
classDiagram
    class ActivityAttemptDocument {
        +string activityId
        +string activityType
        +string courseId
        +string lessonId
        +int attemptNumber
        +boolean correct
        +float score
        +int timeSpentMs
        +boolean timedOut
        +object response
        +string startedAt
        +string completedAt
        +Timestamp createdAt
    }
    
    class QuizResponse {
        +string selected
    }
    
    class DragDropResponse {
        +object placements
        +int correctCount
        +int totalZones
    }
    
    class CodeResponse {
        +string code
        +int testsPassed
        +int totalTests
        +TestResult[] testResults
    }
    
    class DemoResponse {
        +int clicks
        +int hovers
        +boolean completed
    }
    
    ActivityAttemptDocument <|-- QuizResponse
    ActivityAttemptDocument <|-- DragDropResponse
    ActivityAttemptDocument <|-- CodeResponse
    ActivityAttemptDocument <|-- DemoResponse
```

### Activity Types

| Type | Response Shape | Score Calculation |
|------|---------------|-------------------|
| `quiz` | `{ selected: string }` | 1.0 if correct, 0.0 if wrong |
| `dragdrop` | `{ placements: {}, correctCount, totalZones }` | correctCount / totalZones |
| `code` | `{ code, testsPassed, totalTests }` | testsPassed / totalTests |
| `demo` | `{ clicks, hovers, completed }` | 0.5 + (engagement bonus up to 0.5) |

### Created By
- `DataService.saveActivityAttempt()` via ActivityTracker

### Queried By
- `DataService.getActivityAttempts()` with filters
- `AnalyticsService.calculateQuizMastery()`

---

## Collection: `users/{uid}/quizAnswers`

### Path
`users/{uid}/quizAnswers/{answerId}`

### Purpose
Legacy quiz answer storage (separate from activity attempts).

### Schema

```javascript
{
  courseId: "apprentice",
  lessonId: "ch1-stone",
  quizId: "quiz-1",
  answer: "B",
  isCorrect: true,
  timestamp: Timestamp
}
```

### Created By
- `DataService.saveQuizAnswer()` (legacy path)

---

## Collection: `users/{uid}/dailyChallenges`

### Path
`users/{uid}/dailyChallenges/{challengeId}`

### Purpose
Track daily challenge completions for streaks.

### Schema

```javascript
{
  challengeId: "challenge-2024-01-15",
  date: Timestamp,
  completed: true,
  result: {
    score: 85,
    timeSpent: 120000
  },
  timestamp: Timestamp
}
```

### Created By
- `DataService.completeDailyChallenge()`

### Queried By
- `DataService.getDailyChallenges()` (last 7 days)

---

## Collection: `users/{uid}/notes`

### Path
`users/{uid}/notes/{noteId}`

### Purpose
User-created notes linked to courses/lessons.

### Schema

```javascript
{
  id: "note-abc123",
  courseId: "apprentice",
  lessonId: "ch1-stone",
  title: "Variables in Python",
  content: "Variables are like boxes...",
  tags: ["python", "basics"],
  userId: "user-uid",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Created/Updated By
- `DataService.saveNote()`

### Deleted By
- `DataService.deleteNote()`

---

## Collection: `courses`

### Path
`courses/{courseId}`

### Purpose
Course metadata and access configuration (admin-managed).

### Schema

```javascript
{
  courseId: "endless-opportunities",
  displayName: "Endless Opportunities AI Bootcamp",
  description: "Partner course for...",
  visibility: "organization",  // public | authenticated | organization | admin
  organizations: ["endless-opportunities"],
  partnerLogo: "/assets/partners/eo-logo.png",
  createdAt: Timestamp,
  createdBy: "admin-uid"
}
```

### Visibility Types

| Value | Access Rule |
|-------|-------------|
| `public` | Anyone can access |
| `authenticated` | Must be logged in |
| `organization` | Must belong to specified org |
| `admin` | Admin role only |

### Created By
- `RBACService.registerCourse()` (admin only)

### Note
Most course config is in `RBACService.COURSE_REGISTRY` for performance. Firestore lookup is fallback.

---

## Collection: `activities`

### Path
`activities/{activityId}`

### Purpose
Store correct answers and configuration for activities.

### Schema

```javascript
{
  activityId: "quiz-ch1-variables",
  activityType: "quiz",
  courseId: "apprentice",
  lessonId: "ch1-stone",
  correctAnswer: "B",
  points: 10,
  timeLimit: null,  // seconds, or null for no limit
  testCases: null,  // for code challenges
  updatedAt: Timestamp
}
```

### Created By
- `DataService.saveActivityDefinition()` (admin)

### Queried By
- `ActivityTracker.getCorrectAnswer()`
- `DataService.getActivityDefinition()`

---

## Data Flow Diagrams

### Enrollment Flow

```mermaid
sequenceDiagram
    participant U as User
    participant P as Course Page
    participant DS as DataService
    participant FS as Firestore

    U->>P: Click "Start Learning"
    P->>DS: enrollInCourse('apprentice', courseData)
    
    DS->>FS: users/{uid}/courseProgress/apprentice.set({<br/>  courseId, courseName, courseIcon,<br/>  enrolledAt, progressPercent: 0,<br/>  completedLessons: 0, totalLessons: 7,<br/>  lessons: {}<br/>})
    
    FS-->>DS: Success
    DS-->>P: { success: true }
    P->>U: Redirect to ch0-origins
```

### Progress Save Flow

```mermaid
sequenceDiagram
    participant PT as ProgressTracker
    participant DS as DataService
    participant FS as Firestore

    Note over PT: All sections viewed (100%)

    PT->>DS: saveLessonProgress('apprentice', 'ch0-origins', data)

    Note over DS,FS: Write #1: Detailed Progress
    DS->>FS: courseProgress/apprentice/lessonProgress/ch0-origins.set({<br/>  sections, viewedSections, totalSections,<br/>  progressPercent: 100, completed: true,<br/>  totalTimeSpent, lastSection<br/>})

    Note over DS,FS: Write #2: Summary on Parent
    DS->>FS: courseProgress/apprentice.set({<br/>  lessons.ch0-origins: { completed: true, ... },<br/>  lastLesson: 'ch0-origins',<br/>  lastActivity: serverTimestamp()<br/>}, merge: true)

    Note over DS: Check if lesson complete
    DS->>DS: recalculateCourseProgress('apprentice')
    
    DS->>FS: courseProgress/apprentice.get()
    FS-->>DS: Course document with lessons
    
    DS->>DS: Count completed lessons
    DS->>FS: courseProgress/apprentice.update({<br/>  completedLessons: 1,<br/>  progressPercent: 14<br/>})
```

### Dashboard Data Load

```mermaid
sequenceDiagram
    participant D as Dashboard
    participant DS as DataService
    participant FS as Firestore

    D->>DS: getEnrolledCourses()
    DS->>FS: users/{uid}/courseProgress.get()
    FS-->>DS: [courseProgress documents]

    loop For each course
        DS->>DS: Check if lessons empty
        
        alt Lessons populated
            DS->>DS: Use existing data
        else Lessons empty (fallback)
            DS->>FS: courseProgress/{id}/lessonProgress.get()
            FS-->>DS: [lesson documents]
            DS->>DS: Build lessons object
            DS->>DS: Calculate completedLessons
            DS->>DS: Calculate progressPercent
        end
    end

    DS-->>D: Enriched courses array
```

---

## Index Requirements

### Composite Indexes Needed

| Collection | Fields | Order |
|------------|--------|-------|
| `activityAttempts` | `courseId`, `lessonId`, `createdAt` | ASC, ASC, DESC |
| `activityAttempts` | `activityType`, `createdAt` | ASC, DESC |
| `dailyChallenges` | `date`, `date` | ASC, DESC |
| `notes` | `courseId`, `updatedAt` | ASC, DESC |

### Query Patterns

```javascript
// Get activity attempts for a lesson
db.collection('users').doc(uid)
  .collection('activityAttempts')
  .where('courseId', '==', 'apprentice')
  .where('lessonId', '==', 'ch0-origins')
  .orderBy('createdAt', 'desc')

// Get recent challenges
db.collection('users').doc(uid)
  .collection('dailyChallenges')
  .where('date', '>=', weekAgo)
  .orderBy('date', 'desc')
  .limit(7)

// Get notes for a course
db.collection('users').doc(uid)
  .collection('notes')
  .where('courseId', '==', 'apprentice')
  .orderBy('updatedAt', 'desc')
```

---

## Security Rules Patterns

### User Data Isolation

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Subcollections inherit same rule
      match /{subcollection}/{document=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
    
    // Course configs readable by authenticated users
    match /courses/{courseId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Activity definitions readable, writable by admin
    match /activities/{activityId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

---

## Data Migration Notes

### Legacy Data Handling

1. **Old quiz answers** in `/quizAnswers` → New format in `/activityAttempts`
2. **Lessons object empty** → Fallback to `/lessonProgress` subcollection
3. **Missing `completedLessons`** → Recalculated from lessons object

### Backward Compatibility

The `DataService.getEnrolledCourses()` method includes fallback logic to read from subcollections when the parent `lessons` object is empty, ensuring old user data still displays correctly.
