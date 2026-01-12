# Service Layer Architecture

> **Purpose:** Deep dive into the shared JavaScript services that power the SWE Hackers platform.

## Service Overview

```mermaid
flowchart TB
    subgraph Browser["🌐 Browser Window"]
        subgraph Global["window.*"]
            FC[FirebaseApp]
            AUTH[AuthService]
            DS[DataService]
            PT[ProgressTracker]
            AT[ActivityTracker]
            AS[AnalyticsService]
            RBAC[RBACService]
            RG[RouteGuard]
            LI[LessonIntegration]
        end
    end

    subgraph Firebase["☁️ Firebase SDK"]
        FBA[firebase.auth]
        FBF[firebase.firestore]
        FBC[firebase.app]
    end

    FC --> FBC
    FC --> FBA
    FC --> FBF
    AUTH --> FC
    DS --> FC
    DS --> AUTH
    PT --> DS
    AT --> DS
    AS --> DS
    RBAC --> AUTH
    RBAC --> DS
    RG --> AUTH
    RG --> RBAC
    LI --> AUTH
    LI --> DS
    LI --> PT

    style Global fill:#1a1a2e,stroke:#7986cb,color:#fff
    style Firebase fill:#ff6b6b,stroke:#c92a2a,color:#fff
```

## Service Initialization Order

```mermaid
sequenceDiagram
    participant HTML as HTML Page
    participant FC as FirebaseApp
    participant AUTH as AuthService
    participant RBAC as RBACService
    participant RG as RouteGuard
    participant DS as DataService
    participant PT as ProgressTracker

    HTML->>FC: Load firebase-config.js
    HTML->>AUTH: Load auth.js
    HTML->>RBAC: Load rbac.js
    HTML->>RG: Load route-guard.js
    HTML->>DS: Load data-service.js
    HTML->>PT: Load progress-tracker.js

    Note over HTML: DOMContentLoaded

    HTML->>FC: FirebaseApp.init()
    FC-->>HTML: Firebase SDK ready
    
    HTML->>AUTH: AuthService.init()
    AUTH->>FC: getAuth()
    AUTH->>AUTH: Setup onAuthStateChanged
    AUTH-->>HTML: Auth service ready

    Note over RBAC: Auto-init after 200ms delay
    RBAC->>AUTH: onAuthStateChanged listener
    RBAC-->>HTML: RBAC ready

    Note over RG: Auto-init after 100ms delay
    RG->>AUTH: waitForAuthState()
    RG->>RBAC: checkRBACAccess()
    RG-->>HTML: Route guard active

    Note over PT: Manual init from page
    HTML->>PT: ProgressTracker.init(courseId, lessonId)
    PT->>DS: getLessonProgress()
    PT-->>HTML: Tracker ready
```

---

## FirebaseApp (`firebase-config.js`)

### Purpose
Initializes the Firebase SDK and exposes Firebase services to other modules.

### API

```javascript
window.FirebaseApp = {
  init()      // Initialize Firebase, returns boolean
  getAuth()   // Returns firebase.auth() instance
  getDb()     // Returns firebase.firestore() instance
  getApp()    // Returns firebase.app() instance
}
```

### Architecture

```mermaid
flowchart LR
    subgraph FirebaseConfig["firebase-config.js"]
        INIT[initFirebase]
        GA[getAuth]
        GD[getDb]
        GAP[getApp]
    end

    subgraph State["Module State"]
        APP[(app)]
        AUTH[(auth)]
        DB[(db)]
    end

    subgraph SDK["Firebase SDK"]
        FSDK[firebase.initializeApp]
        FAUTH[firebase.auth]
        FFS[firebase.firestore]
    end

    INIT --> FSDK
    FSDK --> APP
    INIT --> FAUTH
    FAUTH --> AUTH
    INIT --> FFS
    FFS --> DB

    GA --> AUTH
    GD --> DB
    GAP --> APP

    style State fill:#51cf66,stroke:#2f9e44
```

### Key Behaviors

1. **Singleton Pattern:** Only initializes once even if called multiple times
2. **Defensive Checks:** Verifies Firebase SDK is loaded before initialization
3. **Global Exposure:** Exposes `window.FirebaseApp` for cross-module access

---

## AuthService (`auth.js`)

### Purpose
Handles user authentication, registration, session management, and auth state observation.

### API

```javascript
window.AuthService = {
  // State
  currentUser              // Current Firebase user or null
  
  // Initialization
  init()                   // Start auth state listener
  waitForAuthState()       // Returns Promise<User|null>
  
  // Authentication
  register(email, password, displayName)
  loginWithEmail(email, password)
  loginWithGoogle()
  logout()
  resetPassword(email)
  
  // User Info
  isAuthenticated()        // Returns boolean
  getUser()                // Returns current user
  
  // State Management
  onAuthStateChanged(cb)   // Subscribe to auth changes
  setRedirectUrl(url)      // Store URL for post-login redirect
  getRedirectUrl()         // Get and clear stored redirect
}
```

### State Machine

```mermaid
stateDiagram-v2
    [*] --> NotInitialized
    
    NotInitialized --> Initializing: init()
    Initializing --> WaitingForSession: onAuthStateChanged(null)
    
    WaitingForSession --> Authenticated: Session restored
    WaitingForSession --> Anonymous: Timeout (300ms)
    
    Authenticated --> Anonymous: logout()
    Anonymous --> Authenticated: login success
    
    Authenticated --> Authenticated: Session persists
    
    state Authenticated {
        [*] --> UserReady
        UserReady --> ProfileUpdated: updateUserProfile()
    }

    state Anonymous {
        [*] --> GuestBrowsing
        GuestBrowsing --> RedirectToLogin: Protected page access
    }
```

### Auth Flow

```mermaid
sequenceDiagram
    participant U as User
    participant AS as AuthService
    participant FB as Firebase Auth
    participant FS as Firestore

    U->>AS: loginWithEmail(email, pass)
    AS->>FB: signInWithEmailAndPassword()
    
    alt Success
        FB-->>AS: UserCredential
        AS->>AS: notifyListeners(user)
        AS->>FS: updateUserProfile()
        AS-->>U: { success: true, user }
    else Failure
        FB-->>AS: Error
        AS->>AS: getErrorMessage(code)
        AS-->>U: { success: false, error }
    end
```

### Key Behaviors

1. **Auth State Promise:** `waitForAuthState()` resolves when auth is definitively known
2. **Session Restoration:** Waits 300ms for Firebase to restore existing session
3. **User Document Creation:** Auto-creates Firestore user doc on first login
4. **Redirect Management:** Stores intended destination during auth flow

---

## DataService (`data-service.js`)

### Purpose
Central data access layer for all Firestore operations. Handles course progress, quiz answers, activity tracking, and user stats.

### API Categories

```mermaid
mindmap
  root((DataService))
    Course Progress
      getCourseProgress
      getEnrolledCourses
      enrollInCourse
      recalculateCourseProgress
    Lesson Progress
      updateLessonProgress
      completeLesson
      saveLessonProgress
      getLessonProgress
      getAllLessonsProgress
    Activities
      saveQuizAnswer
      saveActivityPerformance
      saveActivityAttempt
      getActivityAttempts
      getActivityStats
    Time Tracking
      trackTimeSpent
      updateLessonStats
    User Data
      getUserStats
      updateStreak
      getDailyChallenges
      completeDailyChallenge
    Notes
      getNotes
      saveNote
      deleteNote
```

### Data Flow Pattern

```mermaid
flowchart TD
    subgraph Callers["📱 Callers"]
        DB[Dashboard]
        LP[Lesson Page]
        AT[ActivityTracker]
        PT[ProgressTracker]
    end

    subgraph DataService["🔧 DataService"]
        API[Public API Methods]
        CACHE[In-Memory Cache]
        BATCH[Batch Operations]
    end

    subgraph Firestore["☁️ Firestore"]
        USR[(users)]
        CP[(courseProgress)]
        LP2[(lessonProgress)]
        AA[(activityAttempts)]
        QA[(quizAnswers)]
    end

    DB --> API
    LP --> API
    AT --> API
    PT --> API

    API --> CACHE
    API --> BATCH
    BATCH --> USR
    BATCH --> CP
    CP --> LP2
    USR --> AA
    USR --> QA

    style DataService fill:#51cf66,stroke:#2f9e44,color:#fff
```

### Key Method: `getEnrolledCourses()`

This method demonstrates the subcollection fallback pattern:

```mermaid
flowchart TD
    START[getEnrolledCourses called]
    START --> AUTH{User authenticated?}
    
    AUTH -->|No| EMPTY[Return empty array]
    AUTH -->|Yes| FETCH[Fetch courseProgress docs]
    
    FETCH --> FOREACH[For each course]
    FOREACH --> CHECK{lessons field empty?}
    
    CHECK -->|No| USE[Use existing data]
    CHECK -->|Yes| SUBCOL[Fetch lessonProgress subcollection]
    
    SUBCOL --> BUILD[Build lessons object]
    BUILD --> COUNT[Count completed]
    COUNT --> CALC[Calculate progress %]
    CALC --> MERGE[Merge into course data]
    MERGE --> USE
    
    USE --> NEXT{More courses?}
    NEXT -->|Yes| FOREACH
    NEXT -->|No| RETURN[Return courses array]
    
    style SUBCOL fill:#ffd93d,stroke:#f59f00
    style BUILD fill:#ffd93d,stroke:#f59f00
```

### Key Method: `saveLessonProgress()`

Dual-write pattern to subcollection and parent:

```mermaid
sequenceDiagram
    participant C as Caller
    participant DS as DataService
    participant FS as Firestore

    C->>DS: saveLessonProgress(courseId, lessonId, data)
    
    Note over DS: Write #1: Subcollection
    DS->>FS: lessonProgress/{lessonId}.set(data)
    FS-->>DS: ✅ Success

    Note over DS: Determine completion
    DS->>DS: isComplete = progressPercent >= 100

    Note over DS: Write #2: Parent summary
    DS->>FS: courseProgress/{courseId}.set({<br/>  lessons.{lessonId}: summary<br/>})
    FS-->>DS: ✅ Success

    alt Lesson complete
        DS->>DS: recalculateCourseProgress()
        DS->>FS: Update completedLessons, progressPercent
    end

    DS-->>C: { success: true }
```

---

## ProgressTracker (`progress-tracker.js`)

### Purpose
Tracks user progress through lesson sections in real-time using Intersection Observer. Persists to Firestore and provides visual feedback.

### API

```javascript
window.ProgressTracker = {
  // Initialization
  init(courseId, lessonId)
  
  // Section Management
  discoverSections()
  setCurrentSection(section)
  markSectionComplete(sectionId)
  scrollToSection(sectionId)
  
  // Persistence
  loadProgress()
  saveProgress()
  
  // UI
  renderTracker()
  updateTrackerUI()
  toggleCollapse()
  showCompletionToast()
}
```

### State Model

```mermaid
classDiagram
    class ProgressTracker {
        +string courseId
        +string lessonId
        +Section[] sections
        +Section currentSection
        +number startTime
        +object sectionTimes
        +boolean isInitialized
        +boolean completionShown
        
        +init(courseId, lessonId)
        +discoverSections()
        +setCurrentSection(section)
        +saveProgress()
        +loadProgress()
    }

    class Section {
        +string id
        +string title
        +Element element
        +boolean viewed
        +boolean completed
        +number timeSpent
    }

    ProgressTracker "1" *-- "many" Section
```

### Section Discovery

```mermaid
flowchart TD
    START[discoverSections called]
    START --> QUERY[Query DOM for sections]
    
    QUERY --> SEL["document.querySelectorAll(
    '.lesson-section, section[id], 
    section[data-section], .origin-section'
    )"]
    
    SEL --> FOREACH[For each element]
    FOREACH --> DEDUPE{Already seen?}
    
    DEDUPE -->|Yes| SKIP[Skip]
    DEDUPE -->|No| ADD[Add to seen Set]
    
    ADD --> TITLE[Extract title from h2/h3]
    TITLE --> ID[Get or generate ID]
    ID --> CREATE[Create Section object]
    
    CREATE --> PUSH[Push to sections array]
    PUSH --> NEXT{More elements?}
    
    NEXT -->|Yes| FOREACH
    NEXT -->|No| DONE[Log discovered sections]
    SKIP --> NEXT
```

### Scroll Tracking

```mermaid
sequenceDiagram
    participant U as User Scroll
    participant IO as IntersectionObserver
    participant PT as ProgressTracker
    participant UI as Tracker UI
    participant DS as DataService

    Note over U,IO: Observer with -20% top, -60% bottom margin

    U->>IO: Section enters viewport
    IO->>PT: Callback: entry.isIntersecting
    
    PT->>PT: setCurrentSection(section)
    PT->>PT: Mark section viewed
    PT->>PT: Mark previous sections viewed
    
    PT->>UI: updateTrackerUI()
    UI->>UI: Update progress bar
    UI->>UI: Update section indicators
    UI->>UI: Update stats

    alt State changed
        alt All sections complete
            PT->>DS: saveProgress() [immediate]
            DS-->>PT: Save complete
            PT->>UI: showCompletionToast()
        else Partial progress
            PT->>PT: debouncedSave() [1s delay]
        end
    end
```

### Visual Components

```mermaid
flowchart LR
    subgraph TrackerUI["Progress Tracker UI"]
        direction TB
        HDR[Header: Title + Toggle]
        BAR[Progress Bar]
        PCT[Percentage Text]
        SEC[Section List]
        STAT[Time + Sections Stats]
    end

    subgraph SectionItem["Section Item"]
        DOT[Indicator Dot]
        NUM[Section Number]
        NAME[Section Name]
    end

    SEC --> SectionItem

    style TrackerUI fill:#16162a,stroke:#7986cb
    style SectionItem fill:#1a1a2e,stroke:#4db6ac
```

---

## ActivityTracker (`activity-tracker.js`)

### Purpose
Tracks user engagement with interactive lesson activities (quizzes, drag-drop, code challenges, demos). Supports offline caching with sync.

### Supported Activity Types

```mermaid
mindmap
  root((Activity Types))
    Quiz
      Multiple choice
      data-answer attribute
      First-try tracking
    DragDrop
      Draggable items
      Drop zones
      Partial credit scoring
    Code
      Text input
      Keyword matching
      Test case validation
    Demo
      Click interactions
      Hover tracking
      Auto-complete threshold
```

### Activity Discovery

```mermaid
flowchart TD
    INIT[ActivityTracker.init]
    INIT --> QUERY["querySelectorAll('[data-activity]')"]
    
    QUERY --> FOREACH[For each element]
    FOREACH --> PARSE[Parse data attributes]
    
    PARSE --> EXTRACT["Extract:
    • id: data-activity
    • type: data-type
    • points: data-points
    • timeLimit: data-time-limit"]
    
    EXTRACT --> ATTACH[Attach listeners by type]
    
    ATTACH --> QUIZ[setupQuizListeners]
    ATTACH --> DD[setupDragDropListeners]
    ATTACH --> CODE[setupCodeChallengeListeners]
    ATTACH --> DEMO[setupDemoListeners]
```

### Quiz Submission Flow

```mermaid
sequenceDiagram
    participant U as User
    participant AT as ActivityTracker
    participant DS as DataService
    participant LS as LocalStorage
    participant FS as Firestore

    U->>AT: Click quiz option
    AT->>AT: Start timer if not started
    U->>AT: Click submit button
    
    AT->>AT: getCorrectAnswer(activityId)
    
    alt Answer in cache
        AT-->>AT: Return cached answer
    else Not cached
        AT->>FS: Fetch from activities collection
        FS-->>AT: Return correct answer
        AT->>AT: Cache answer
    end

    AT->>AT: Calculate score & correct flag
    AT->>AT: Build attemptData object
    
    Note over AT,FS: Offline-first save
    AT->>LS: Cache attempt
    
    alt Online
        AT->>DS: saveActivityAttempt()
        DS->>FS: Write attempt
        FS-->>DS: Success
        AT->>LS: Remove from cache
    else Offline
        AT->>AT: Queue for later sync
        AT->>U: Show "Saved offline" toast
    end

    AT->>AT: showQuizFeedback()
    AT->>U: Visual feedback (correct/incorrect)
```

### Offline Sync

```mermaid
flowchart TD
    subgraph Online["📶 Online"]
        SAVE[saveAttemptWithCache]
        SAVE --> CACHE[Cache to localStorage]
        CACHE --> TRY[Try Firestore write]
        TRY -->|Success| REMOVE[Remove from cache]
        TRY -->|Fail| QUEUE[Keep in queue]
    end

    subgraph Offline["📴 Offline"]
        ATTEMPT[User submits attempt]
        ATTEMPT --> CACHE2[Cache to localStorage]
        CACHE2 --> TOAST[Show offline toast]
    end

    subgraph Reconnect["🔌 Back Online"]
        EVENT[online event]
        EVENT --> SYNC[syncQueuedAttempts]
        SYNC --> FOREACH[For each queued item]
        FOREACH --> WRITE[Write to Firestore]
        WRITE -->|Success| DEL[Delete from queue]
        WRITE -->|Fail| RETRY[Keep for next sync]
    end

    style Online fill:#51cf66,stroke:#2f9e44
    style Offline fill:#ff6b6b,stroke:#c92a2a
    style Reconnect fill:#7986cb,stroke:#3949ab
```

---

## AnalyticsService (`analytics-service.js`)

### Purpose
Calculates learning metrics and cognitive progress indicators for dashboard display.

### Metrics Computed

```mermaid
flowchart TB
    subgraph Raw["📊 Raw Data Sources"]
        CP[Course Progress]
        LP[Lesson Progress]
        AA[Activity Attempts]
        UD[User Document]
    end

    subgraph Metrics["🧮 Computed Metrics"]
        VEL[Learning Velocity]
        MAS[Quiz Mastery]
        STR[Active Streak]
        COG[Cognitive Score]
    end

    subgraph Display["📱 Dashboard Display"]
        DASH[Summary Cards]
        CHART[Progress Charts]
        CHAP[Chapter Analytics]
    end

    CP --> VEL
    LP --> VEL
    AA --> MAS
    LP --> STR
    AA --> STR
    
    VEL --> COG
    MAS --> COG
    STR --> COG
    
    COG --> DASH
    VEL --> DASH
    MAS --> DASH
    STR --> DASH

    style Metrics fill:#ffd93d,stroke:#f59f00,color:#000
```

### Cognitive Score Calculation

```mermaid
flowchart LR
    subgraph Inputs["Normalized Inputs (0-100)"]
        M["Mastery: firstTryAccuracy × 100"]
        V["Velocity: (lessons/week ÷ 3) × 100"]
        S["Streak: (days ÷ 7) × 100"]
        C["Completion: (done/total) × 100"]
    end

    subgraph Weights["Applied Weights"]
        MW["40%"]
        VW["30%"]
        SW["20%"]
        CW["10%"]
    end

    subgraph Score["Final Score"]
        CALC["M×0.4 + V×0.3 + S×0.2 + C×0.1"]
        ROUND["Round to integer"]
        LEVEL["Determine level"]
    end

    M --> MW --> CALC
    V --> VW --> CALC
    S --> SW --> CALC
    C --> CW --> CALC
    CALC --> ROUND --> LEVEL
```

### Caching Strategy

```mermaid
flowchart TD
    CALL[Method called]
    CALL --> KEY[Generate cache key]
    KEY --> CHECK{Cache exists & not expired?}
    
    CHECK -->|Yes| HIT[Return cached value]
    CHECK -->|No| FETCH[Fetch fresh data]
    
    FETCH --> COMPUTE[Compute metric]
    COMPUTE --> STORE[Store in cache]
    STORE --> EXPIRE[Set 5-min expiry]
    EXPIRE --> RETURN[Return value]

    style HIT fill:#51cf66,stroke:#2f9e44
    style FETCH fill:#ffd93d,stroke:#f59f00
```

---

## Service Interaction Patterns

### Pattern 1: Authenticated Data Access

```mermaid
sequenceDiagram
    participant Page
    participant Service as Any Service
    participant Auth as AuthService
    participant FB as Firestore

    Page->>Service: Call method
    Service->>Auth: getUser()
    
    alt User exists
        Auth-->>Service: User object
        Service->>FB: Query with user.uid
        FB-->>Service: Data
        Service-->>Page: Result
    else No user
        Auth-->>Service: null
        Service-->>Page: null/empty/error
    end
```

### Pattern 2: Progressive Loading

```mermaid
sequenceDiagram
    participant Page
    participant UI as UI Layer
    participant Service
    participant Cache
    participant FB as Firestore

    Page->>UI: Show loading state
    Page->>Service: Request data
    
    Service->>Cache: Check cache
    alt Cache hit
        Cache-->>Service: Cached data
        Service-->>Page: Quick response
        Page->>UI: Render cached data
    else Cache miss
        Service->>FB: Fetch data
        FB-->>Service: Fresh data
        Service->>Cache: Update cache
        Service-->>Page: Response
        Page->>UI: Render data
    end
```

### Pattern 3: Optimistic UI with Retry

```mermaid
sequenceDiagram
    participant U as User
    participant UI as UI Layer
    participant Service
    participant Cache
    participant FB as Firestore

    U->>UI: Trigger action
    UI->>UI: Optimistic update
    UI->>Service: Persist change
    Service->>Cache: Cache locally
    
    Service->>FB: Write to Firestore
    
    alt Success
        FB-->>Service: Confirmed
        Service->>Cache: Mark synced
    else Failure
        FB-->>Service: Error
        Service->>Service: Queue for retry
        Service->>UI: Show retry indicator
    end
```

---

## Error Handling Patterns

### Auth Errors

```mermaid
flowchart TD
    ERR[Firebase Auth Error]
    ERR --> CODE{Error Code}
    
    CODE -->|auth/email-in-use| MSG1["Email already registered"]
    CODE -->|auth/invalid-email| MSG2["Invalid email address"]
    CODE -->|auth/weak-password| MSG3["Password too weak"]
    CODE -->|auth/user-not-found| MSG4["No account found"]
    CODE -->|auth/wrong-password| MSG5["Incorrect password"]
    CODE -->|auth/too-many-requests| MSG6["Too many attempts"]
    CODE -->|auth/network-request-failed| MSG7["Network error"]
    CODE -->|default| MSG8["An error occurred"]
    
    MSG1 --> USER[Display to User]
    MSG2 --> USER
    MSG3 --> USER
    MSG4 --> USER
    MSG5 --> USER
    MSG6 --> USER
    MSG7 --> USER
    MSG8 --> USER
```

### Data Service Errors

```mermaid
flowchart TD
    ERR[Firestore Error]
    ERR --> CHECK{Error Type}
    
    CHECK -->|not-found| CREATE[Create document]
    CHECK -->|permission-denied| AUTH[Re-authenticate]
    CHECK -->|unavailable| OFFLINE[Queue for offline]
    CHECK -->|other| LOG[Console.error + return null]
    
    CREATE --> RETRY[Retry operation]
    AUTH --> REDIRECT[Redirect to login]
    OFFLINE --> CACHE[Cache locally]
```

---

## Testing & Debugging

### Console Commands

```javascript
// Check current auth state
AuthService.getUser()

// View current permissions
RBACService.debug()

// Check enrolled courses
DataService.getEnrolledCourses()

// View lesson progress
DataService.getLessonProgress('apprentice', 'ch0-origins')

// Get analytics summary
AnalyticsService.getDashboardSummary()

// Clear analytics cache
AnalyticsService.clearCache()

// Check activity tracker state
ActivityTracker.activities
ActivityTracker.attemptCounts
```

### Common Issues

| Symptom | Likely Cause | Debug Steps |
|---------|--------------|-------------|
| Dashboard shows 0% | Subcollection not read | Check `getEnrolledCourses()` fallback |
| Progress not saving | Auth timing issue | Check `waitForAuthState()` |
| Quiz won't submit | Activity not discovered | Verify `data-activity` attribute |
| Route guard loops | Auth state race | Check `_authReadyPromise` |
| Offline cache not syncing | Event listener missing | Verify `online` event |
