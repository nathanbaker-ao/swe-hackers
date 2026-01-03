# Progress Tracking Data Flow Analysis

## The Problem
The dashboard shows `lessons: {}` (empty) even though lesson progress IS being saved. There's a disconnect between where data is written and where it's read.

---

## Current Architecture

```mermaid
flowchart TB
    subgraph Firestore["☁️ Firestore Database"]
        subgraph UserDoc["users/{uid}"]
            subgraph CourseProgress["courseProgress/{courseId}"]
                CP_Fields["📄 Course Document Fields:
                • completedLessons: number
                • progressPercent: number
                • lessons: { } ← EMPTY!
                • lastLesson: string
                • totalLessons: 7"]
                
                subgraph LessonProgress["lessonProgress/{lessonId}"]
                    LP_Fields["📄 Lesson Document Fields:
                    • sections: array
                    • viewedSections: number
                    • totalSections: number
                    • progressPercent: number
                    • completed: boolean ← DATA HERE!"]
                end
            end
        end
    end
    
    style CP_Fields fill:#ff6b6b,stroke:#c92a2a,color:#fff
    style LP_Fields fill:#51cf66,stroke:#2f9e44,color:#fff
```

---

## Dashboard Read Flow

```mermaid
sequenceDiagram
    participant D as 📊 Dashboard
    participant DS as 🔧 DataService
    participant FS as ☁️ Firestore
    
    Note over D: User opens dashboard
    
    D->>DS: getEnrolledCourses()
    DS->>FS: collection('users/{uid}/courseProgress').get()
    FS-->>DS: [{ courseId, lessons: {}, completedLessons: 0, ... }]
    DS-->>D: courses array
    
    Note over D: createCourseCard(progress)
    
    D->>D: progress.lessons['ch0-origins']
    Note over D,D: ❌ Returns UNDEFINED!<br/>lessons object is empty
    
    D->>D: Display: "0/7 Complete"
```

---

## Lesson Save Flow

```mermaid
sequenceDiagram
    participant L as 📖 Lesson Page
    participant PT as 🎯 ProgressTracker
    participant DS as 🔧 DataService
    participant FS as ☁️ Firestore
    
    Note over L: User scrolls through sections
    
    L->>PT: setCurrentSection(section)
    PT->>PT: Mark section as viewed
    PT->>PT: Check if all sections complete
    
    alt All sections viewed (100%)
        PT->>DS: saveLessonProgress(courseId, lessonId, data)
        
        Note over DS: SAVE #1: Subcollection
        DS->>FS: courseProgress/{courseId}/lessonProgress/{lessonId}.set(data)
        FS-->>DS: ✅ Success
        
        Note over DS: SAVE #2: Parent Document
        DS->>FS: courseProgress/{courseId}.set({<br/>  lessons.{lessonId}: lessonData<br/>}, {merge: true})
        FS-->>DS: ✅ Success (but data not persisting?)
        
        DS->>DS: recalculateCourseProgress()
        DS->>FS: courseProgress/{courseId}.update({<br/>  completedLessons, progressPercent<br/>})
    end
```

---

## Lesson Load Flow

```mermaid
sequenceDiagram
    participant L as 📖 Lesson Page
    participant PT as 🎯 ProgressTracker
    participant DS as 🔧 DataService
    participant FS as ☁️ Firestore
    
    Note over L: User opens lesson
    
    L->>PT: init('apprentice', 'ch0-origins')
    PT->>DS: getLessonProgress(courseId, lessonId)
    
    Note over DS: Reads from SUBCOLLECTION
    DS->>FS: courseProgress/{courseId}/lessonProgress/{lessonId}.get()
    FS-->>DS: { sections, viewedSections, completed: true, ... }
    DS-->>PT: ✅ Progress data found!
    
    PT->>PT: Restore viewed sections
    PT->>PT: Scroll to lastSection
```

---

## The Data Model Mismatch

```mermaid
flowchart LR
    subgraph Write["✍️ What Gets Written"]
        W1["lessonProgress/{lessonId}
        ✅ Full section data
        ✅ completed: true
        ✅ progressPercent: 100"]
        
        W2["courseProgress/{courseId}
        lessons.ch0-origins: {...}
        ❓ May not be persisting"]
    end
    
    subgraph Read["👁️ What Gets Read"]
        R1["Dashboard reads:
        courseProgress/{courseId}
        → lessons['ch0-origins']
        ❌ Returns undefined"]
        
        R2["Lesson page reads:
        lessonProgress/{lessonId}
        ✅ Returns full data"]
    end
    
    W1 --> R2
    W2 -.->|"Not working?"| R1
    
    style W1 fill:#51cf66,stroke:#2f9e44
    style W2 fill:#fcc419,stroke:#f59f00
    style R1 fill:#ff6b6b,stroke:#c92a2a
    style R2 fill:#51cf66,stroke:#2f9e44
```

---

## Method Call Chain

```mermaid
flowchart TD
    subgraph Dashboard["📊 Dashboard (index.html)"]
        DL[loadEnrolledCourses]
        CC[createCourseCard]
        DL -->|"courses.forEach"| CC
    end
    
    subgraph Lesson["📖 Lesson Page"]
        PTI[ProgressTracker.init]
        SCS[setCurrentSection]
        SP[saveProgress]
        
        PTI -->|"scroll observer"| SCS
        SCS -->|"if stateChanged"| SP
    end
    
    subgraph DataService["🔧 DataService"]
        GEC[getEnrolledCourses]
        GLP[getLessonProgress]
        SLP[saveLessonProgress]
        RCP[recalculateCourseProgress]
        
        SLP -->|"if isComplete"| RCP
    end
    
    subgraph Firestore["☁️ Firestore"]
        CP[courseProgress/apprentice]
        LP[lessonProgress/ch0-origins]
    end
    
    DL --> GEC
    GEC --> CP
    CC -->|"reads lessons field"| CP
    
    PTI --> GLP
    GLP --> LP
    SP --> SLP
    SLP --> LP
    SLP --> CP
    RCP --> CP
    
    style CP fill:#ff6b6b,stroke:#c92a2a
    style LP fill:#51cf66,stroke:#2f9e44
```

---

## Proposed Fix Options

### Option 1: Dashboard reads from subcollection
```mermaid
flowchart LR
    D[Dashboard] -->|"Read each lesson"| LP[lessonProgress subcollection]
    LP -->|"Aggregate completed count"| D
```

**Pros:** Data is definitely there
**Cons:** Multiple reads (one per lesson), slower

### Option 2: Fix the parent document write
```mermaid
flowchart LR
    S[saveProgress] -->|"Debug why"| CP[courseProgress doc]
    CP -->|"lessons.ch0-origins"| D[Dashboard]
```

**Pros:** Single read, faster
**Cons:** Need to find why write isn't working

### Option 3: Dual-source with fallback
```mermaid
flowchart TD
    D[Dashboard] --> CP{courseProgress.lessons?}
    CP -->|"Empty"| LP[Read lessonProgress subcollection]
    CP -->|"Has data"| Use[Use parent doc data]
    LP --> Use
```

**Pros:** Works with existing data
**Cons:** More complex, technical debt

---

## Recommended Fix: Option 2

The write SHOULD work. Need to verify:
1. Is `saveLessonProgress` actually being called?
2. Is the `courseRef.set()` succeeding?
3. Is Firestore security rules blocking the write?
4. Is there a field name issue with hyphens?

**Debug steps:**
1. Add console.log before and after courseRef.set()
2. Check Firestore console directly to see if field exists
3. Test with a simple field name (no hyphens)

