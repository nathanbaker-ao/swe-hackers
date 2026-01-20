# Analytics & Community Engagement Architecture

## Vision

Transform learning data into actionable insights and meaningful connections. Build a system that serves:

1. **Administrators** - District-wide performance metrics, cohort analysis, intervention alerts
2. **Teachers** - Class performance, individual student progress, curriculum effectiveness
3. **Students** - Personal growth tracking, skill gaps, recommended learning paths, peer connections
4. **Community** - Leaderboards, peer matching, collaborative challenges, Discord integration

---

## System Architecture Overview

```mermaid
flowchart TB
    subgraph "Data Collection Layer"
        AA[Activity Attempts]
        LP[Lesson Progress]
        CP[Course Progress]
        CH[Challenge Submissions]
        EN[Engagement Events]
    end
    
    subgraph "Analytics Engine"
        AGG[Aggregation Service]
        ML[Learning Analytics ML]
        PM[Peer Matching Algorithm]
        REC[Recommendation Engine]
    end
    
    subgraph "Storage Layer"
        FS[(Firestore)]
        CACHE[(Redis Cache)]
        BQ[(BigQuery Archive)]
    end
    
    subgraph "Presentation Layer"
        SD[Student Dashboard]
        TD[Teacher Dashboard]
        AD[Admin Dashboard]
        LB[Leaderboard]
        CD[Challenges Dashboard]
    end
    
    subgraph "Community Layer"
        DISC[Discord Bot]
        NOTIF[Notification Service]
        MATCH[Connection Matcher]
    end
    
    AA & LP & CP & CH & EN --> AGG
    AGG --> FS & CACHE
    FS --> BQ
    
    AGG --> ML & PM & REC
    ML --> REC
    PM --> MATCH
    
    FS & CACHE --> SD & TD & AD & LB & CD
    REC --> SD
    MATCH --> SD & DISC
    
    LB & CD --> DISC
    NOTIF --> DISC
```

---

## Data Model Architecture

### Core Collections (Firestore)

```mermaid
erDiagram
    USERS ||--o{ ACTIVITY_ATTEMPTS : makes
    USERS ||--o{ COURSE_PROGRESS : has
    USERS ||--o{ CHALLENGE_SUBMISSIONS : submits
    USERS ||--o{ CONNECTIONS : has
    USERS ||--o{ ACHIEVEMENTS : earns
    
    ACTIVITY_ATTEMPTS {
        string id PK
        string userId FK
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
    
    COURSE_PROGRESS {
        string id PK
        string userId FK
        string courseId
        object lessons
        float overallProgress
        object activityStats
        timestamp lastActivity
    }
    
    CHALLENGE_SUBMISSIONS {
        string id PK
        string userId FK
        string challengeId
        string challengeType
        object response
        float score
        object peerVotes
        boolean featured
        timestamp submittedAt
    }
    
    USER_ANALYTICS {
        string userId PK
        object learningStyle
        object strengthAreas
        object growthAreas
        object engagementPatterns
        float consistencyScore
        object recommendedPaths
        timestamp lastComputed
    }
    
    CONNECTIONS {
        string id PK
        string userId FK
        string connectedUserId FK
        string matchReason
        float compatibilityScore
        string status
        timestamp createdAt
    }
    
    ACHIEVEMENTS {
        string id PK
        string userId FK
        string achievementType
        string title
        object criteria
        timestamp earnedAt
    }
```

### Aggregated Analytics Collections

```mermaid
erDiagram
    COURSE_ANALYTICS ||--o{ LESSON_ANALYTICS : contains
    LESSON_ANALYTICS ||--o{ ACTIVITY_ANALYTICS : contains
    
    COURSE_ANALYTICS {
        string courseId PK
        int totalEnrollments
        float avgCompletionRate
        float avgScore
        object activityTypeBreakdown
        object difficultyDistribution
        object timeDistribution
        array topChallenges
        timestamp lastUpdated
    }
    
    LESSON_ANALYTICS {
        string lessonId PK
        string courseId FK
        float avgTimeToComplete
        float completionRate
        object activityPerformance
        array commonMistakes
        array topPerformers
        timestamp lastUpdated
    }
    
    COHORT_ANALYTICS {
        string cohortId PK
        string teacherId FK
        array studentIds
        object courseProgress
        object comparisonMetrics
        array interventionAlerts
        timestamp lastUpdated
    }
    
    LEADERBOARD {
        string id PK
        string type
        string period
        array rankings
        timestamp computedAt
        timestamp expiresAt
    }
```

---

## Analytics Computation Flows

### Real-time Activity Processing

```mermaid
sequenceDiagram
    participant User
    participant Activity
    participant AT as ActivityTracker
    participant DS as DataService
    participant FS as Firestore
    participant AE as Analytics Engine
    participant Cache
    
    User->>Activity: Submit answer
    Activity->>AT: completeActivity(id, result)
    AT->>DS: saveActivityAttempt(data)
    DS->>FS: Write to activityAttempts
    DS->>FS: Update activityStats
    
    FS-->>AE: Trigger Cloud Function
    AE->>AE: Compute user analytics
    AE->>AE: Update learning patterns
    AE->>AE: Check achievement criteria
    AE->>FS: Update userAnalytics
    AE->>Cache: Invalidate user cache
    
    alt Achievement Unlocked
        AE->>FS: Create achievement
        AE->>User: Show achievement toast
    end
    
    alt Peer Match Found
        AE->>FS: Create connection suggestion
        AE->>User: Suggest peer connection
    end
```

### Batch Analytics Processing (Cloud Functions)

```mermaid
flowchart LR
    subgraph "Scheduled Jobs"
        D[Daily 2AM]
        W[Weekly Sunday]
        M[Monthly 1st]
    end
    
    subgraph "Daily Jobs"
        D --> DA[Update Course Analytics]
        D --> DL[Compute Leaderboards]
        D --> DC[Process Challenge Rankings]
        D --> DS[Generate Streak Data]
    end
    
    subgraph "Weekly Jobs"
        W --> WC[Cohort Analysis]
        W --> WR[Recommendation Refresh]
        W --> WM[Peer Match Computation]
        W --> WI[Intervention Alerts]
    end
    
    subgraph "Monthly Jobs"
        M --> MA[Archive to BigQuery]
        M --> MC[Certificate Generation]
        M --> MR[Progress Reports]
    end
```

---

## Dashboard Architecture

### Reusable Analytics Components

```mermaid
flowchart TB
    subgraph "Base Components"
        MC[MetricCard]
        CH[Chart]
        PB[ProgressBar]
        LB[Leaderboard]
        TL[Timeline]
        HM[Heatmap]
    end
    
    subgraph "Composite Components"
        SP[SkillProfile] --> MC & PB
        LJ[LearningJourney] --> TL & CH
        PA[PeerActivity] --> LB & MC
        EA[EngagementAnalytics] --> HM & CH
        IA[InterventionAlert] --> MC & TL
    end
    
    subgraph "Dashboard Views"
        SD[StudentDashboard] --> SP & LJ & PA
        TD[TeacherDashboard] --> EA & IA & LB
        AD[AdminDashboard] --> EA & IA & CH
        CBD[ChallengeDashboard] --> LB & PA & CH
    end
```

### Student Dashboard

```mermaid
flowchart TB
    subgraph "Student Dashboard"
        subgraph "Personal Analytics"
            OS[Overall Score]
            SK[Skill Radar]
            ST[Streak Counter]
            TT[Time Tracking]
        end
        
        subgraph "Learning Insights"
            LP[Learning Path]
            SG[Skill Gaps]
            RN[Recommendations]
            NL[Next Lessons]
        end
        
        subgraph "Community"
            LB[Leaderboard Position]
            PM[Peer Matches]
            AC[Active Challenges]
            CN[Connections]
        end
        
        subgraph "Achievements"
            BD[Badges Earned]
            ML[Milestones]
            CR[Certificates]
        end
    end
```

### Teacher Dashboard

```mermaid
flowchart TB
    subgraph "Teacher Dashboard"
        subgraph "Class Overview"
            CP[Class Progress]
            AD[Activity Distribution]
            TI[Time Investment]
        end
        
        subgraph "Student Analysis"
            SL[Student List]
            SP[Student Profiles]
            CG[Comparison Graphs]
        end
        
        subgraph "Interventions"
            SA[Struggling Alerts]
            DA[Disengaged Alerts]
            RA[Recommended Actions]
        end
        
        subgraph "Curriculum Insights"
            DA2[Difficult Activities]
            EA[Engagement Analysis]
            CI[Content Improvements]
        end
    end
```

### Admin/Superintendent Dashboard

```mermaid
flowchart TB
    subgraph "Admin Dashboard"
        subgraph "District Overview"
            TE[Total Enrollment]
            AC[Active Courses]
            CP[Completion Rates]
            GR[Grade Distribution]
        end
        
        subgraph "School Comparison"
            SC[School Cards]
            RK[Rankings]
            TR[Trends]
        end
        
        subgraph "Cohort Analysis"
            CC[Cohort Comparison]
            DM[Demographics]
            EQ[Equity Metrics]
        end
        
        subgraph "Program Health"
            EN[Engagement Metrics]
            RT[Retention Rates]
            OC[Outcome Correlation]
        end
    end
```

---

## Psychoanalytic Learning Insights

### Learning Pattern Detection

```mermaid
flowchart TB
    subgraph "Data Inputs"
        AT[Activity Timing]
        AR[Attempt Rates]
        RP[Response Patterns]
        TI[Time Investment]
        SE[Session Engagement]
    end
    
    subgraph "Pattern Analysis"
        AT --> LS[Learning Style Detection]
        AR --> PE[Persistence Evaluation]
        RP --> CM[Comprehension Mapping]
        TI --> EF[Effort Analysis]
        SE --> EN[Engagement Scoring]
    end
    
    subgraph "Insights Generated"
        LS --> |"Visual/Auditory/Kinesthetic"| LP[Learning Profile]
        PE --> |"Resilience Score"| LP
        CM --> |"Strength/Gap Areas"| LP
        EF --> |"Optimal Study Times"| LP
        EN --> |"Attention Patterns"| LP
    end
    
    subgraph "Recommendations"
        LP --> RL[Recommended Lessons]
        LP --> RS[Study Strategies]
        LP --> RP2[Peer Pairings]
        LP --> RT[Time Suggestions]
    end
```

### Student Profile Metrics

```javascript
// UserAnalytics document structure
{
  userId: "user123",
  
  // Learning Style (computed from activity patterns)
  learningStyle: {
    primary: "visual",           // visual | auditory | kinesthetic
    secondary: "kinesthetic",
    confidence: 0.82,
    dataPoints: 156
  },
  
  // Strength Areas (based on activity performance)
  strengthAreas: [
    { topic: "variables", score: 0.94, attempts: 23 },
    { topic: "loops", score: 0.88, attempts: 18 },
    { topic: "functions", score: 0.85, attempts: 31 }
  ],
  
  // Growth Areas (areas needing improvement)
  growthAreas: [
    { topic: "recursion", score: 0.52, suggestedResources: [...] },
    { topic: "async", score: 0.61, suggestedResources: [...] }
  ],
  
  // Engagement Patterns
  engagementPatterns: {
    preferredTimes: ["18:00-20:00", "09:00-11:00"],
    avgSessionLength: 34,        // minutes
    peakPerformanceDay: "Tuesday",
    consistencyScore: 0.78,      // 0-1, how regular
    streakRecord: 14,
    currentStreak: 5
  },
  
  // Persistence Metrics
  persistenceMetrics: {
    avgAttemptsBeforeSuccess: 2.3,
    giveUpRate: 0.08,            // How often they abandon
    retryAfterFailure: 0.91,     // How often they retry
    improvementRate: 0.15        // Score improvement per attempt
  },
  
  // Recommended Learning Path
  recommendedPaths: [
    {
      type: "remediation",
      topic: "recursion",
      lessons: ["ch3-magnetism", "ch4-architect"],
      priority: "high"
    },
    {
      type: "advancement",
      topic: "data-structures",
      lessons: ["ch5-capstone1"],
      priority: "medium"
    }
  ],
  
  lastComputed: Timestamp
}
```

---

## Peer Matching Algorithm

### Matching Criteria

```mermaid
flowchart TB
    subgraph "Matching Factors"
        CL[Complementary Learning Styles]
        SS[Similar Skill Levels]
        SG[Shared Goals]
        TZ[Timezone Compatibility]
        IN[Shared Interests]
        AC[Activity Overlap]
    end
    
    subgraph "Scoring Weights"
        CL --> |30%| SCORE
        SS --> |25%| SCORE
        SG --> |20%| SCORE
        TZ --> |10%| SCORE
        IN --> |10%| SCORE
        AC --> |5%| SCORE
    end
    
    SCORE[Compatibility Score] --> |">0.7"| MATCH[Suggest Connection]
```

### Connection Types

```javascript
// Connection recommendation types
const connectionTypes = {
  STUDY_BUDDY: {
    criteria: "similar_level + complementary_styles",
    description: "Great for collaborative learning"
  },
  MENTOR: {
    criteria: "higher_level + teaching_inclination",
    description: "Can help guide your learning"
  },
  MENTEE: {
    criteria: "lower_level + similar_path",
    description: "You can help them grow"
  },
  CHALLENGE_PARTNER: {
    criteria: "competitive_level + similar_interests",
    description: "Perfect for challenges"
  },
  ACCOUNTABILITY: {
    criteria: "similar_goals + similar_engagement",
    description: "Keep each other on track"
  }
};
```

---

## Leaderboard System

### Leaderboard Types

```mermaid
flowchart TB
    subgraph "Global Leaderboards"
        GL[Global Rankings]
        CL[Course Rankings]
        WL[Weekly Champions]
        SL[Streak Leaders]
    end
    
    subgraph "Personal Boards"
        PL[Your Cohort]
        FL[Friends Only]
        ML[Matched Peers]
    end
    
    subgraph "Challenge Boards"
        DCL[Daily Challenge]
        WCL[Weekly Challenge]
        CCL[Community Challenge]
    end
    
    subgraph "Special Boards"
        HL[Helpers Board]
        IL[Improvement Board]
        CRL[Consistency Board]
    end
```

### Leaderboard Data Structure

```javascript
// Leaderboard document
{
  id: "global-weekly-2026-03",
  type: "global",
  period: "weekly",
  startDate: Timestamp,
  endDate: Timestamp,
  
  rankings: [
    {
      rank: 1,
      userId: "user123",
      displayName: "CodeNinja",
      avatar: "url",
      score: 2450,
      metrics: {
        activitiesCompleted: 47,
        challengesWon: 3,
        streakDays: 7,
        helpfulVotes: 12
      },
      change: +2  // Position change from last period
    },
    // ... more rankings
  ],
  
  computedAt: Timestamp,
  expiresAt: Timestamp
}
```

---

## Challenges Dashboard

### Challenge System Architecture

```mermaid
flowchart TB
    subgraph "Challenge Types"
        DC[Daily Challenge]
        WC[Weekly Challenge]
        CC[Community Challenge]
        TC[Team Challenge]
    end
    
    subgraph "Challenge Flow"
        CR[Challenge Created] --> PU[Published]
        PU --> AC[Active]
        AC --> SB[Submissions]
        SB --> VT[Voting Period]
        VT --> RS[Results]
        RS --> AW[Awards]
    end
    
    subgraph "Gamification"
        PT[Points System]
        BG[Badges]
        ST[Streaks]
        LV[Levels]
    end
    
    DC & WC & CC & TC --> CR
    RS --> PT & BG
    ST --> PT
```

### Challenge Dashboard Components

```mermaid
flowchart TB
    subgraph "Challenges Dashboard"
        subgraph "Active Challenges"
            DC[Daily Challenge Card]
            WC[Weekly Challenge Card]
            CC[Community Challenges]
            TM[Time Remaining]
        end
        
        subgraph "Your Stats"
            CH[Challenge History]
            WR[Win Rate]
            SK[Streak Status]
            PT[Points Balance]
        end
        
        subgraph "Community"
            LB[Challenge Leaderboard]
            FS[Featured Submissions]
            VT[Vote on Submissions]
        end
        
        subgraph "Rewards"
            BD[Badges Earned]
            UP[Upcoming Rewards]
            RD[Redeem Points]
        end
    end
```

---

## Discord Integration

### Bot Commands & Features

```mermaid
flowchart TB
    subgraph "Discord Bot"
        subgraph "Commands"
            ST[/stats - Your analytics]
            LB[/leaderboard - View rankings]
            CH[/challenge - Daily challenge]
            CN[/connect - Find peers]
            AC[/achievements - Your badges]
        end
        
        subgraph "Automated Posts"
            DCS[Daily Challenge Announcement]
            LBU[Leaderboard Updates]
            ACA[Achievement Celebrations]
            MLS[Milestone Shoutouts]
        end
        
        subgraph "Notifications"
            NM[New Match Notification]
            CR[Challenge Results]
            ST2[Streak Reminders]
            IV[Intervention Nudges]
        end
    end
```

### Discord Channel Structure

```
📊 ANALYTICS
├── #daily-leaderboard     - Auto-posted daily rankings
├── #weekly-champions      - Weekly winners celebration
├── #achievement-feed      - Live achievement notifications
└── #milestone-celebrations - Big milestone shoutouts

🏆 CHALLENGES
├── #daily-challenge       - Daily challenge posts
├── #challenge-submissions - Student submissions
├── #challenge-discussion  - Strategy talk
└── #hall-of-fame         - Featured winners

🤝 CONNECTIONS
├── #find-a-buddy         - Peer matching suggestions
├── #study-groups         - Form study groups
├── #mentor-matching      - Mentor/mentee connections
└── #accountability-pairs - Accountability partners

📈 PROGRESS
├── #streak-check-in      - Daily streak posts
├── #progress-share       - Share your progress
└── #help-wanted          - Ask for help
```

---

## Reusable Service Architecture

### Analytics Service Layer

```mermaid
flowchart TB
    subgraph "Analytics Services"
        AS[AnalyticsService]
        LS[LeaderboardService]
        RS[RecommendationService]
        MS[MatchingService]
        NS[NotificationService]
    end
    
    subgraph "Data Services"
        DS[DataService]
        CS[CacheService]
        QS[QueryService]
    end
    
    subgraph "External Services"
        FF[Firebase Functions]
        DC[Discord Client]
        EM[Email Service]
    end
    
    AS & LS & RS & MS --> DS & CS
    DS --> QS
    NS --> DC & EM
    FF --> AS & LS & RS & MS
```

### Service Method Signatures

```javascript
// AnalyticsService.js
const AnalyticsService = {
  // User Analytics
  async getUserAnalytics(userId) {},
  async computeUserAnalytics(userId) {},
  async getLearningInsights(userId) {},
  async getRecommendations(userId) {},
  
  // Course Analytics
  async getCourseAnalytics(courseId) {},
  async getLessonAnalytics(courseId, lessonId) {},
  async getActivityAnalytics(activityId) {},
  
  // Cohort Analytics
  async getCohortAnalytics(cohortId) {},
  async getClassAnalytics(teacherId, classId) {},
  async getSchoolAnalytics(schoolId) {},
  async getDistrictAnalytics(districtId) {},
  
  // Comparison & Benchmarks
  async compareToAverage(userId, scope) {},
  async getPercentileRank(userId, metric, scope) {},
  async getBenchmarks(scope) {}
};

// LeaderboardService.js
const LeaderboardService = {
  // Leaderboard Retrieval
  async getLeaderboard(type, period, options) {},
  async getUserRank(userId, type, period) {},
  async getNearbyRanks(userId, type, count) {},
  
  // Leaderboard Computation
  async computeLeaderboard(type, period) {},
  async updateRankings(type) {},
  
  // Personal Boards
  async getCohortLeaderboard(userId) {},
  async getFriendsLeaderboard(userId) {},
  async getMatchedPeersBoard(userId) {}
};

// MatchingService.js
const MatchingService = {
  // Peer Matching
  async findMatches(userId, type, limit) {},
  async computeCompatibility(userId1, userId2) {},
  async getSuggestedConnections(userId) {},
  
  // Connection Management
  async createConnection(userId, targetId, type) {},
  async getConnections(userId, status) {},
  async updateConnectionStatus(connectionId, status) {}
};

// RecommendationService.js
const RecommendationService = {
  // Learning Recommendations
  async getNextLessons(userId) {},
  async getRemediationPath(userId, topic) {},
  async getAdvancementPath(userId) {},
  
  // Study Recommendations
  async getOptimalStudyTimes(userId) {},
  async getStudyStrategies(userId) {},
  async getResourceRecommendations(userId, topic) {}
};
```

---

## Database Operation Patterns

### Smart Queries with Caching

```javascript
// QueryService.js - Efficient data fetching with caching
const QueryService = {
  // Cache-first pattern
  async getWithCache(collection, docId, ttlSeconds = 300) {
    const cacheKey = `${collection}:${docId}`;
    
    // Check cache first
    const cached = await CacheService.get(cacheKey);
    if (cached) return cached;
    
    // Fetch from Firestore
    const doc = await db.collection(collection).doc(docId).get();
    const data = doc.data();
    
    // Cache for future
    await CacheService.set(cacheKey, data, ttlSeconds);
    return data;
  },
  
  // Batch fetching with deduplication
  async batchGet(collection, docIds) {
    const unique = [...new Set(docIds)];
    const refs = unique.map(id => db.collection(collection).doc(id));
    const snapshots = await db.getAll(...refs);
    
    return snapshots.reduce((acc, snap) => {
      if (snap.exists) acc[snap.id] = snap.data();
      return acc;
    }, {});
  },
  
  // Aggregation with pagination
  async aggregateWithPagination(query, pageSize = 100) {
    let lastDoc = null;
    const results = [];
    
    while (true) {
      let q = query.limit(pageSize);
      if (lastDoc) q = q.startAfter(lastDoc);
      
      const snapshot = await q.get();
      if (snapshot.empty) break;
      
      results.push(...snapshot.docs.map(d => d.data()));
      lastDoc = snapshot.docs[snapshot.docs.length - 1];
      
      if (snapshot.docs.length < pageSize) break;
    }
    
    return results;
  }
};
```

### Firestore Security Rules

```javascript
// firestore.rules additions for analytics
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // User can read their own analytics
    match /userAnalytics/{userId} {
      allow read: if request.auth.uid == userId;
      allow write: if false; // Only cloud functions write
    }
    
    // Leaderboards are public read
    match /leaderboards/{leaderboardId} {
      allow read: if request.auth != null;
      allow write: if false; // Only cloud functions write
    }
    
    // Connections require mutual consent
    match /connections/{connectionId} {
      allow read: if request.auth.uid in resource.data.participants;
      allow create: if request.auth.uid == request.resource.data.initiatorId;
      allow update: if request.auth.uid in resource.data.participants;
    }
    
    // Teachers can read their students' analytics
    match /cohortAnalytics/{cohortId} {
      allow read: if request.auth.uid == resource.data.teacherId
                  || request.auth.uid in resource.data.adminIds;
    }
  }
}
```

---

## Implementation Phases

### Phase 1: Core Analytics (Foundation)

```mermaid
gantt
    title Phase 1: Core Analytics
    dateFormat  YYYY-MM-DD
    section Data Layer
    UserAnalytics collection     :a1, 2026-01-27, 3d
    Analytics computation funcs  :a2, after a1, 4d
    Cache layer setup           :a3, after a1, 2d
    section Services
    AnalyticsService            :b1, after a2, 3d
    QueryService optimizations  :b2, after a3, 2d
    section UI
    Student dashboard redesign  :c1, after b1, 5d
    Basic metrics components    :c2, after b1, 3d
```

**Deliverables:**
- [ ] UserAnalytics Firestore collection
- [ ] Cloud Function for analytics computation
- [ ] AnalyticsService with core methods
- [ ] Student dashboard with personal metrics
- [ ] Skill radar chart component
- [ ] Learning path recommendations

### Phase 2: Leaderboards & Gamification

```mermaid
gantt
    title Phase 2: Leaderboards
    dateFormat  YYYY-MM-DD
    section Data Layer
    Leaderboard collections     :a1, 2026-02-03, 2d
    Ranking computation funcs   :a2, after a1, 3d
    section Services
    LeaderboardService          :b1, after a2, 3d
    Achievement system          :b2, after a2, 4d
    section UI
    Leaderboard components      :c1, after b1, 4d
    Achievement displays        :c2, after b2, 3d
    Gamification elements       :c3, after c1, 3d
```

**Deliverables:**
- [ ] Global, course, and personal leaderboards
- [ ] Weekly/monthly ranking computation
- [ ] Achievement/badge system
- [ ] Streak tracking and display
- [ ] Points and levels system

### Phase 3: Community & Matching

```mermaid
gantt
    title Phase 3: Community
    dateFormat  YYYY-MM-DD
    section Data Layer
    Connections collection      :a1, 2026-02-17, 2d
    Matching algorithm          :a2, after a1, 5d
    section Services
    MatchingService             :b1, after a2, 4d
    NotificationService         :b2, after a1, 3d
    section UI
    Peer suggestions UI         :c1, after b1, 4d
    Connection management       :c2, after c1, 3d
    section Discord
    Discord bot setup           :d1, after b2, 5d
    Channel automation          :d2, after d1, 3d
```

**Deliverables:**
- [ ] Peer matching algorithm
- [ ] Connection suggestions UI
- [ ] Discord bot with core commands
- [ ] Automated Discord posts
- [ ] Study buddy finder

### Phase 4: Challenges Dashboard

```mermaid
gantt
    title Phase 4: Challenges
    dateFormat  YYYY-MM-DD
    section Data Layer
    Challenge collections       :a1, 2026-03-03, 3d
    Submission & voting         :a2, after a1, 4d
    section Services
    ChallengeService            :b1, after a2, 4d
    Voting system               :b2, after a2, 3d
    section UI
    Challenges dashboard        :c1, after b1, 5d
    Submission interface        :c2, after c1, 3d
    Voting interface            :c3, after b2, 3d
    section Discord
    Challenge announcements     :d1, after c1, 2d
    Results automation          :d2, after c3, 2d
```

**Deliverables:**
- [ ] Daily/weekly challenge system
- [ ] Submission and voting workflow
- [ ] Challenge leaderboards
- [ ] Featured submissions gallery
- [ ] Discord challenge integration

### Phase 5: Teacher & Admin Dashboards

```mermaid
gantt
    title Phase 5: Educator Tools
    dateFormat  YYYY-MM-DD
    section Data Layer
    Cohort analytics            :a1, 2026-03-17, 3d
    School/district rollups     :a2, after a1, 4d
    section Services
    CohortAnalyticsService      :b1, after a2, 4d
    InterventionService         :b2, after a1, 3d
    section UI
    Teacher dashboard           :c1, after b1, 5d
    Admin dashboard             :c2, after c1, 5d
    Intervention alerts         :c3, after b2, 3d
    Reports & exports           :c4, after c2, 3d
```

**Deliverables:**
- [ ] Teacher class view dashboard
- [ ] Student comparison tools
- [ ] Intervention alert system
- [ ] Admin district overview
- [ ] Progress reports generation
- [ ] Data export capabilities

---

## File Structure

```
courses/
├── shared/
│   ├── js/
│   │   ├── services/
│   │   │   ├── analytics-service.js      # User & course analytics
│   │   │   ├── leaderboard-service.js    # Ranking computations
│   │   │   ├── matching-service.js       # Peer matching
│   │   │   ├── recommendation-service.js # Learning recommendations
│   │   │   ├── challenge-service.js      # Challenge management
│   │   │   ├── notification-service.js   # Push & Discord notifications
│   │   │   └── cache-service.js          # Client-side caching
│   │   └── components/
│   │       ├── analytics/
│   │       │   ├── metric-card.js
│   │       │   ├── skill-radar.js
│   │       │   ├── progress-timeline.js
│   │       │   ├── engagement-heatmap.js
│   │       │   └── comparison-chart.js
│   │       ├── leaderboard/
│   │       │   ├── leaderboard-table.js
│   │       │   ├── rank-card.js
│   │       │   └── position-change.js
│   │       ├── community/
│   │       │   ├── peer-suggestion.js
│   │       │   ├── connection-card.js
│   │       │   └── study-group.js
│   │       └── challenges/
│   │           ├── challenge-card.js
│   │           ├── submission-form.js
│   │           └── voting-interface.js
│   └── css/
│       ├── analytics.css
│       ├── leaderboard.css
│       └── challenges.css
├── dashboard/
│   └── index.html                        # Student dashboard
├── teacher-dashboard/
│   └── index.html                        # Teacher view
├── admin-dashboard/
│   └── index.html                        # Admin view
└── challenges/
    └── index.html                        # Challenges dashboard

firebase-functions/
├── analytics/
│   ├── computeUserAnalytics.js
│   ├── computeCourseAnalytics.js
│   └── computeCohortAnalytics.js
├── leaderboards/
│   ├── computeLeaderboards.js
│   └── updateRankings.js
├── matching/
│   ├── computeMatches.js
│   └── suggestConnections.js
├── challenges/
│   ├── createDailyChallenge.js
│   └── computeResults.js
└── notifications/
    ├── sendAchievement.js
    └── discordWebhook.js

discord-bot/
├── commands/
│   ├── stats.js
│   ├── leaderboard.js
│   ├── challenge.js
│   └── connect.js
├── automations/
│   ├── dailyChallenge.js
│   ├── leaderboardPost.js
│   └── achievementCelebration.js
└── index.js
```

---

## Success Metrics

### Student Engagement
- Daily/weekly active users
- Average session duration increase
- Activity completion rates
- Streak maintenance rates

### Learning Outcomes
- Score improvement over time
- Time to proficiency reduction
- Skill gap closure rates
- Course completion rates

### Community Health
- Connection acceptance rates
- Study group formation
- Challenge participation
- Discord engagement metrics

### Platform Growth
- New user signups
- Retention rates
- Referral rates
- NPS scores

---

## Next Steps

1. **Review this architecture** with team
2. **Prioritize phases** based on impact vs effort
3. **Create GitHub issues** for Phase 1 tasks
4. **Begin UserAnalytics** collection design
5. **Prototype student dashboard** redesign
