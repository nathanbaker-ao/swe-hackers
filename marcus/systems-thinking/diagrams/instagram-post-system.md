# Instagram Post System Architecture 📸

A systems-thinking breakdown of how an Instagram post flows through the platform.

---

## 🔭 Zoom Level 1: Organization View

How users and major product areas interact:

```mermaid
flowchart TB
    subgraph Users["👥 Users"]
        Creator["Content Creator"]
        Viewer["Feed Viewer"]
        Advertiser["Advertiser"]
    end
    
    subgraph Products["📱 Product Areas"]
        Feed["Feed Experience"]
        Stories["Stories"]
        Reels["Reels"]
        DM["Direct Messages"]
        Explore["Explore/Discovery"]
    end
    
    subgraph Revenue["💰 Revenue"]
        Ads["Ad Platform"]
        Shopping["Instagram Shopping"]
    end
    
    Creator -->|creates content| Feed
    Creator -->|creates content| Stories
    Creator -->|creates content| Reels
    Viewer -->|consumes| Feed
    Viewer -->|consumes| Stories
    Viewer -->|consumes| Reels
    Viewer -->|discovers| Explore
    Advertiser -->|promotes| Ads
    Ads -->|surfaces in| Feed
    Ads -->|surfaces in| Stories
    Feed <-->|share to| DM
```

---

## 🔍 Zoom Level 2: System/Service Architecture

How services communicate when a user creates and views a post:

```mermaid
flowchart TB
    subgraph Client["📱 Client Layer"]
        App["Instagram App"]
    end
    
    subgraph Edge["🌐 Edge Layer"]
        CDN["CDN<br/>(Media Delivery)"]
        Gateway["API Gateway"]
        LB["Load Balancer"]
    end
    
    subgraph Services["⚙️ Core Services"]
        Auth["Auth Service"]
        Post["Post Service"]
        Media["Media Service"]
        User["User Service"]
        Feed["Feed Service"]
        Social["Social Graph Service"]
        Notify["Notification Service"]
        Search["Search & Discovery"]
    end
    
    subgraph Data["💾 Data Layer"]
        PostDB[(Post Database)]
        UserDB[(User Database)]
        GraphDB[(Social Graph DB)]
        Cache[(Redis Cache)]
        Queue[[Message Queue]]
        ObjectStore[(Object Storage<br/>S3/Blob)]
    end
    
    App --> CDN
    App --> Gateway
    Gateway --> LB
    LB --> Auth
    LB --> Post
    LB --> Feed
    LB --> User
    
    Post --> Media
    Post --> PostDB
    Post --> Queue
    Media --> ObjectStore
    Media --> CDN
    
    Feed --> Cache
    Feed --> Social
    Feed --> PostDB
    
    Social --> GraphDB
    User --> UserDB
    
    Queue --> Notify
    Queue --> Feed
    Queue --> Search
    
    Notify --> App
```

---

## 📤 Creating a Post: Data Flow

What happens when you tap "Share":

```mermaid
sequenceDiagram
    autonumber
    participant U as 📱 User
    participant App as Instagram App
    participant GW as API Gateway
    participant Auth as Auth Service
    participant Media as Media Service
    participant S3 as Object Storage
    participant Post as Post Service
    participant DB as Post Database
    participant Queue as Message Queue
    participant Feed as Feed Service
    participant Notify as Notification Service
    participant CDN as CDN
    
    U->>App: Tap "Share" with photo + caption
    App->>GW: POST /api/posts (image + metadata)
    GW->>Auth: Validate JWT token
    Auth-->>GW: ✓ User authenticated
    
    rect rgb(70, 130, 180)
        Note over GW,S3: Media Upload Pipeline
        GW->>Media: Upload image blob
        Media->>Media: Process image<br/>(resize, compress, filters)
        Media->>S3: Store multiple resolutions
        S3-->>Media: media_id + URLs
        Media->>CDN: Warm cache edges
        Media-->>GW: media_urls[]
    end
    
    rect rgb(60, 179, 113)
        Note over GW,Queue: Post Creation
        GW->>Post: Create post record
        Post->>DB: INSERT post<br/>(user_id, media_urls, caption, timestamp)
        DB-->>Post: post_id
        Post->>Queue: Emit "post.created" event
        Post-->>GW: 201 Created
    end
    
    GW-->>App: ✓ Post published!
    App-->>U: Show success + post preview
    
    rect rgb(255, 165, 0)
        Note over Queue,Notify: Async Fan-out
        Queue->>Feed: Update follower feeds
        Feed->>Feed: Fan-out to all followers
        Queue->>Notify: Notify mentioned users
        Notify->>Notify: Push notifications
    end
```

---

## 📥 Viewing the Feed: Data Flow

What happens when you open Instagram:

```mermaid
sequenceDiagram
    autonumber
    participant U as 📱 User
    participant App as Instagram App
    participant CDN as CDN
    participant GW as API Gateway
    participant Feed as Feed Service
    participant Cache as Redis Cache
    participant Social as Social Graph
    participant Post as Post Service
    participant ML as Ranking ML Model
    
    U->>App: Open Instagram
    App->>GW: GET /api/feed?cursor=0
    GW->>Feed: Fetch personalized feed
    
    alt Cache Hit
        Feed->>Cache: Get cached feed
        Cache-->>Feed: Cached post IDs
    else Cache Miss
        Feed->>Social: Get following list
        Social-->>Feed: user_ids[]
        Feed->>Post: Get recent posts from users
        Post-->>Feed: Raw posts[]
    end
    
    Feed->>ML: Rank posts for user
    Note over ML: Considers:<br/>- Engagement history<br/>- Recency<br/>- Relationship strength<br/>- Content type preference
    ML-->>Feed: Ranked post_ids[]
    
    Feed-->>GW: Feed response (post metadata)
    GW-->>App: JSON feed data
    
    loop For each visible post
        App->>CDN: GET image/video
        CDN-->>App: Media bytes
    end
    
    App-->>U: Render beautiful feed ✨
```

---

## 💔 When Things Break: Failure Modes

```mermaid
flowchart TB
    subgraph Failures["🔥 What Can Fail?"]
        F1["CDN Down"]
        F2["Media Service Down"]
        F3["Database Overloaded"]
        F4["Feed Service Slow"]
        F5["Notification Service Down"]
    end
    
    subgraph Impact["💥 User Impact"]
        I1["Images won't load<br/>(skeleton placeholders)"]
        I2["Can't upload new posts<br/>(queue for later)"]
        I3["Posts disappear temporarily<br/>(serve from cache)"]
        I4["Feed loads slowly<br/>(show cached/stale)"]
        I5["No push notifications<br/>(silent failure OK)"]
    end
    
    subgraph Mitigation["🛡️ How It's Handled"]
        M1["Multiple CDN providers<br/>Edge failover"]
        M2["Retry queue<br/>Client-side retry"]
        M3["Read replicas<br/>Aggressive caching"]
        M4["Precomputed feeds<br/>Fallback to chronological"]
        M5["Fire-and-forget<br/>Not critical path"]
    end
    
    F1 --> I1 --> M1
    F2 --> I2 --> M2
    F3 --> I3 --> M3
    F4 --> I4 --> M4
    F5 --> I5 --> M5
```

---

## 🔬 Zoom Level 3: Inside the Post Service

Component-level architecture:

```mermaid
flowchart TB
    subgraph PostService["Post Service"]
        subgraph API["API Layer"]
            Create["POST /posts"]
            Read["GET /posts/:id"]
            Delete["DELETE /posts/:id"]
            Like["POST /posts/:id/like"]
        end
        
        subgraph Business["Business Logic"]
            Validate["Validator<br/>(caption length, media type)"]
            Moderate["Content Moderation<br/>(ML model check)"]
            Enrich["Enricher<br/>(extract hashtags, mentions)"]
            Persist["Persistence Manager"]
        end
        
        subgraph Outbound["Outbound"]
            Events["Event Publisher"]
            Metrics["Metrics Emitter"]
        end
    end
    
    subgraph External["External Dependencies"]
        MediaSvc["Media Service"]
        UserSvc["User Service"]
        DB[(PostgreSQL)]
        MQ[[Kafka]]
        Datadog["Datadog"]
    end
    
    Create --> Validate
    Validate -->|valid| Moderate
    Validate -->|invalid| Create
    Moderate -->|approved| Enrich
    Moderate -->|flagged| Create
    Enrich --> Persist
    Persist --> DB
    Persist --> Events
    Events --> MQ
    
    Read --> DB
    Like --> Persist
    Delete --> Persist
    
    Validate --> MediaSvc
    Enrich --> UserSvc
    Metrics --> Datadog
```

---

## 📊 Key Data Objects

```mermaid
erDiagram
    USER ||--o{ POST : creates
    USER ||--o{ FOLLOW : follows
    USER ||--o{ LIKE : likes
    POST ||--o{ MEDIA : contains
    POST ||--o{ LIKE : receives
    POST ||--o{ COMMENT : has
    
    USER {
        uuid user_id PK
        string username
        string display_name
        string profile_pic_url
        timestamp created_at
    }
    
    POST {
        uuid post_id PK
        uuid user_id FK
        string caption
        string[] hashtags
        uuid[] mentioned_users
        timestamp created_at
        int like_count
        int comment_count
    }
    
    MEDIA {
        uuid media_id PK
        uuid post_id FK
        string type
        string url_thumbnail
        string url_standard
        string url_full
        int width
        int height
    }
    
    FOLLOW {
        uuid follower_id FK
        uuid following_id FK
        timestamp created_at
    }
    
    LIKE {
        uuid user_id FK
        uuid post_id FK
        timestamp created_at
    }
    
    COMMENT {
        uuid comment_id PK
        uuid post_id FK
        uuid user_id FK
        string text
        timestamp created_at
    }
```

---

## 🧠 Key Insights

### Inputs, Outputs & Side Effects

| Component | Inputs | Outputs | Side Effects |
|-----------|--------|---------|--------------|
| **Media Service** | Raw image/video bytes | Processed media URLs | Writes to Object Storage, warms CDN |
| **Post Service** | User ID, caption, media refs | Post ID, confirmation | Writes to DB, emits events |
| **Feed Service** | User ID, cursor | Ranked post list | Cache updates |
| **Notification Service** | Event (post.created) | Push notification | External API calls (APNs/FCM) |

### Design Principles Observed

1. **Async where possible** - Post creation returns fast, fan-out happens in background
2. **Cache aggressively** - Feed pre-computation, CDN for media
3. **Graceful degradation** - Notifications failing doesn't break posting
4. **Event-driven** - Services communicate via events, not direct calls
5. **Read/Write separation** - Optimized paths for each use case

---

*Diagram created as part of Systems Thinking challenge*

