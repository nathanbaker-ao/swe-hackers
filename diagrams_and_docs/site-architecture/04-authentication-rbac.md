# Authentication & RBAC Architecture

> **Purpose:** Deep dive into the authentication system and role-based access control for the SWE Hackers platform.

## System Overview

```mermaid
flowchart TB
    subgraph Client["🌐 Client Layer"]
        AS[AuthService]
        RBAC[RBACService]
        RG[RouteGuard]
    end

    subgraph Firebase["☁️ Firebase"]
        FBA[Firebase Auth]
        FS[(Firestore)]
    end

    subgraph Access["🔐 Access Decisions"]
        AUTH{Authenticated?}
        ROLE{Role Check}
        ORG{Org Check}
        COURSE{Course Access}
    end

    AS --> FBA
    RBAC --> FS
    RG --> AS
    RG --> RBAC

    AUTH --> ROLE
    ROLE --> ORG
    ORG --> COURSE

    style Client fill:#1a1a2e,stroke:#7986cb,color:#fff
    style Firebase fill:#ff6b6b,stroke:#c92a2a,color:#fff
    style Access fill:#51cf66,stroke:#2f9e44,color:#fff
```

## Authentication Flow

### Registration

```mermaid
sequenceDiagram
    participant U as User
    participant F as Register Form
    participant AS as AuthService
    participant FBA as Firebase Auth
    participant FS as Firestore

    U->>F: Enter email, password, name
    F->>F: Validate inputs
    F->>AS: register(email, password, displayName)
    
    AS->>FBA: createUserWithEmailAndPassword()
    
    alt Success
        FBA-->>AS: UserCredential
        AS->>FBA: user.updateProfile({ displayName })
        AS->>AS: createUserDocument(user, { displayName })
        AS->>FS: users/{uid}.set({<br/>  uid, email, displayName,<br/>  role: 'user', createdAt,<br/>  lastLoginAt, settings<br/>})
        AS-->>F: { success: true, user }
        F->>U: Redirect to dashboard
    else Error
        FBA-->>AS: Error
        AS->>AS: getErrorMessage(code)
        AS-->>F: { success: false, error }
        F->>U: Display error message
    end
```

### Login (Email/Password)

```mermaid
sequenceDiagram
    participant U as User
    participant F as Login Form
    participant AS as AuthService
    participant FBA as Firebase Auth
    participant FS as Firestore

    U->>F: Enter credentials
    F->>AS: loginWithEmail(email, password)
    
    AS->>FBA: signInWithEmailAndPassword()
    
    alt Success
        FBA-->>AS: UserCredential
        Note over AS: onAuthStateChanged fires
        AS->>AS: notifyListeners(user)
        AS->>FS: updateUserProfile(user)
        FS->>FS: Update lastLoginAt
        AS-->>F: { success: true, user }
        AS->>AS: getRedirectUrl()
        F->>U: Redirect to stored URL or dashboard
    else Error
        FBA-->>AS: Error
        AS-->>F: { success: false, error }
    end
```

### Login (Google OAuth)

```mermaid
sequenceDiagram
    participant U as User
    participant F as Login Form
    participant AS as AuthService
    participant FBA as Firebase Auth
    participant GP as Google Popup
    participant FS as Firestore

    U->>F: Click "Sign in with Google"
    F->>AS: loginWithGoogle()
    
    AS->>FBA: signInWithPopup(GoogleAuthProvider)
    FBA->>GP: Open Google sign-in popup
    U->>GP: Select Google account
    GP-->>FBA: OAuth credentials
    
    alt Success
        FBA-->>AS: UserCredential + additionalUserInfo
        
        alt New user
            AS->>AS: createUserDocument(user)
            AS->>FS: Create user doc
        else Existing user
            AS->>AS: updateUserProfile(user)
        end
        
        AS-->>F: { success: true, user }
    else Popup closed/cancelled
        FBA-->>AS: Error (popup-closed-by-user)
        AS-->>F: { success: false, error }
    end
```

### Session Restoration

```mermaid
sequenceDiagram
    participant B as Browser
    participant AS as AuthService
    participant FBA as Firebase Auth
    participant FS as Firestore

    Note over B: Page Load
    B->>AS: AuthService.init()
    AS->>AS: Create _authReadyPromise
    AS->>FBA: onAuthStateChanged(callback)
    
    Note over FBA: Firebase checks IndexedDB for session
    
    alt Session exists
        FBA-->>AS: User object (immediate)
        AS->>AS: currentUser = user
        AS->>AS: _authReadyResolve(user)
        AS->>FS: updateUserProfile()
    else No session
        FBA-->>AS: null (first call)
        AS->>AS: firstCall = true, start 300ms timer
        
        alt Session restored within 300ms
            FBA-->>AS: User object (second call)
            AS->>AS: _authReadyResolve(user)
        else Timeout
            AS->>AS: _authReadyResolve(null)
        end
    end
```

---

## AuthService Architecture

### State Management

```mermaid
stateDiagram-v2
    [*] --> Uninitialized
    
    Uninitialized --> Initializing: init()
    
    Initializing --> WaitingForSession: onAuthStateChanged(null)
    Initializing --> Authenticated: onAuthStateChanged(user)
    
    WaitingForSession --> Authenticated: Session restored
    WaitingForSession --> Anonymous: 300ms timeout
    
    Authenticated --> Anonymous: logout()
    Anonymous --> Authenticated: login()
    
    state Authenticated {
        [*] --> Active
        Active --> ProfileUpdating: updateUserProfile()
        ProfileUpdating --> Active: complete
    }
    
    state Anonymous {
        [*] --> Guest
        Guest --> Redirecting: Access protected page
    }
```

### API Reference

| Method | Returns | Description |
|--------|---------|-------------|
| `init()` | void | Start auth state listener |
| `waitForAuthState()` | `Promise<User\|null>` | Resolves when auth determined |
| `register(email, password, name)` | `Promise<{success, user?, error?}>` | Create new account |
| `loginWithEmail(email, password)` | `Promise<{success, user?, error?}>` | Email/password login |
| `loginWithGoogle()` | `Promise<{success, user?, error?}>` | Google OAuth login |
| `logout()` | `Promise<{success}>` | Sign out current user |
| `resetPassword(email)` | `Promise<{success, error?}>` | Send reset email |
| `isAuthenticated()` | boolean | Check if signed in |
| `getUser()` | `User\|null` | Get current user |
| `onAuthStateChanged(cb)` | `() => void` | Subscribe to changes |
| `setRedirectUrl(url)` | void | Store post-login redirect |
| `getRedirectUrl()` | `string\|null` | Get and clear redirect |

### Error Code Mapping

```mermaid
flowchart LR
    subgraph Codes["Firebase Error Codes"]
        C1[auth/email-already-in-use]
        C2[auth/invalid-email]
        C3[auth/weak-password]
        C4[auth/user-not-found]
        C5[auth/wrong-password]
        C6[auth/too-many-requests]
        C7[auth/popup-closed-by-user]
        C8[auth/network-request-failed]
    end

    subgraph Messages["User-Friendly Messages"]
        M1["Email already registered"]
        M2["Invalid email address"]
        M3["Password too weak (6+ chars)"]
        M4["No account found"]
        M5["Incorrect password"]
        M6["Too many attempts"]
        M7["Sign-in popup closed"]
        M8["Network error"]
    end

    C1 --> M1
    C2 --> M2
    C3 --> M3
    C4 --> M4
    C5 --> M5
    C6 --> M6
    C7 --> M7
    C8 --> M8
```

---

## Role-Based Access Control (RBAC)

### Role Hierarchy

```mermaid
flowchart TB
    subgraph Roles["🎭 Role Hierarchy"]
        ADMIN[admin]
        ENT[enterprise]
        USER[user]
        GUEST[guest]
    end

    ADMIN -->|"includes"| ENT
    ENT -->|"includes"| USER
    USER -->|"includes"| GUEST

    subgraph Permissions["🔐 Permissions"]
        P1[All courses]
        P2[All organizations]
        P3[User management]
        P4[Course management]
        P5[Partner courses]
        P6[Public courses]
        P7[Basic access]
    end

    ADMIN --> P1
    ADMIN --> P2
    ADMIN --> P3
    ADMIN --> P4
    ENT --> P5
    USER --> P6
    GUEST --> P7

    style ADMIN fill:#ff6b6b,stroke:#c92a2a
    style ENT fill:#ffd93d,stroke:#f59f00
    style USER fill:#51cf66,stroke:#2f9e44
    style GUEST fill:#7986cb,stroke:#3949ab
```

### Permission Model

```mermaid
classDiagram
    class UserPermissions {
        +string role
        +string[] organizationAccess
        +string[] courseAccess
        +boolean isAdmin
        +boolean isEnterprise
    }

    class CourseConfig {
        +string visibility
        +string[] organizations
        +string displayName
    }

    class AccessDecision {
        +canAccessCourse()
        +hasRole()
        +belongsToOrganization()
    }

    UserPermissions --> AccessDecision
    CourseConfig --> AccessDecision
```

### Course Visibility Types

| Visibility | Who Can Access | Check Method |
|------------|----------------|--------------|
| `public` | Everyone | Always true |
| `authenticated` | Logged-in users | `AuthService.isAuthenticated()` |
| `organization` | Org members | `permissions.organizationAccess.includes(org)` |
| `admin` | Admin role only | `permissions.isAdmin` |

### Course Registry

```javascript
// RBACService.COURSE_REGISTRY
{
  // Public free courses
  'apprentice': { visibility: 'public', organizations: [] },
  'junior': { visibility: 'public', organizations: [] },
  'senior': { visibility: 'public', organizations: [] },
  'undergrad': { visibility: 'public', organizations: [] },
  
  // Partner courses (organization-specific)
  'endless-opportunities': {
    visibility: 'organization',
    organizations: ['endless-opportunities'],
    displayName: 'Endless Opportunities AI Bootcamp',
    partnerLogo: '/assets/partners/eo-logo.png'
  }
}
```

---

## RBAC Access Check Flow

### Course Access Check

```mermaid
flowchart TD
    START[canAccessCourse called]
    START --> PERM[getUserPermissions]
    
    PERM --> ADMIN{Is admin?}
    ADMIN -->|Yes| ALLOW[✅ Allow access]
    ADMIN -->|No| EXPLICIT{Has explicit<br/>course access?}
    
    EXPLICIT -->|Yes| ALLOW
    EXPLICIT -->|No| CONFIG[Get course config]
    
    CONFIG --> VIS{Visibility type?}
    
    VIS -->|public| ALLOW
    VIS -->|authenticated| AUTH{Is authenticated?}
    VIS -->|organization| ORG{Belongs to org?}
    VIS -->|admin| DENY[❌ Deny access]
    
    AUTH -->|Yes| ALLOW
    AUTH -->|No| DENY
    
    ORG -->|Yes| ALLOW
    ORG -->|No| DENY

    style ALLOW fill:#51cf66,stroke:#2f9e44
    style DENY fill:#ff6b6b,stroke:#c92a2a
```

### Permission Loading

```mermaid
sequenceDiagram
    participant C as Caller
    participant RBAC as RBACService
    participant Cache as Permission Cache
    participant FS as Firestore

    C->>RBAC: getUserPermissions()
    
    RBAC->>Cache: Check cache
    
    alt Cache valid (< 5 min)
        Cache-->>RBAC: Cached permissions
        RBAC-->>C: Return permissions
    else Cache expired/empty
        RBAC->>FS: users/{uid}.get()
        FS-->>RBAC: User document
        
        RBAC->>RBAC: Check super admin emails
        
        alt Is super admin
            RBAC->>RBAC: Force role = 'admin'
            RBAC->>FS: Auto-promote in DB
        end
        
        RBAC->>RBAC: Build permissions object
        RBAC->>Cache: Store with 5-min expiry
        RBAC-->>C: Return permissions
    end
```

### Super Admin Detection

```mermaid
flowchart TD
    CHECK[Check user email]
    CHECK --> SUPER{"Email in SUPER_ADMIN_EMAILS?
    • autonate.ai@gmail.com
    • autonateai@gmail.com"}
    
    SUPER -->|Yes| PROMOTE[Auto-promote to admin]
    SUPER -->|No| NORMAL[Use DB role]
    
    PROMOTE --> PERSIST{Role in DB != admin?}
    PERSIST -->|Yes| UPDATE[Update DB role to admin]
    PERSIST -->|No| RETURN[Return admin permissions]
    UPDATE --> RETURN
    
    NORMAL --> RETURN2[Return DB-based permissions]
```

---

## Route Guard System

### Protected Page Detection

```mermaid
flowchart TD
    PAGE[Current Page URL]
    PAGE --> CHECK{Path contains?}
    
    CHECK -->|"/ch0-" to "/ch6-"| PROTECTED[Protected: Lesson page]
    CHECK -->|"/dashboard/"| PROTECTED2[Protected: Dashboard]
    CHECK -->|Public paths| PUBLIC[Not protected]
    
    subgraph PublicPaths["Public Paths"]
        P1["/index.html"]
        P2["/auth/*"]
        P3["/course/*"]
        P4["/catalog.html"]
        P5["/enterprise.html"]
        P6["/consulting.html"]
        P7["/blog/*"]
        P8["/challenges.html"]
    end
    
    PUBLIC --> PublicPaths
    
    style PROTECTED fill:#ff6b6b,stroke:#c92a2a
    style PROTECTED2 fill:#ff6b6b,stroke:#c92a2a
    style PUBLIC fill:#51cf66,stroke:#2f9e44
```

### Route Guard Initialization

```mermaid
sequenceDiagram
    participant DOM as DOMContentLoaded
    participant RG as RouteGuard
    participant AS as AuthService
    participant RBAC as RBACService

    Note over DOM,RG: After 100ms delay
    DOM->>RG: RouteGuard.init()
    
    RG->>AS: waitForAuthState()
    AS-->>RG: User or null
    
    alt No user + protected page
        RG->>AS: setRedirectUrl(current page)
        RG->>RG: redirectToLogin()
    else User exists
        RG->>RBAC: checkRBACAccess()
        
        alt Partner course page
            RBAC->>RBAC: getCourseFromPath()
            RBAC->>RBAC: getCourseRequirements()
            RBAC->>RBAC: canAccessCourse()
            
            alt Access denied
                RBAC->>RBAC: handleAccessDenied('organization')
                Note over RG: Redirect to enterprise.html
            end
        end
    end
    
    Note over RG: Set up auth state listener
    RG->>AS: onAuthStateChanged(callback)
```

### Access Denial Handling

```mermaid
flowchart LR
    DENY[handleAccessDenied called]
    DENY --> REASON{Reason?}
    
    REASON -->|unauthenticated| LOGIN["Store redirect URL
    → /auth/login.html"]
    REASON -->|unauthorized| CAT["→ /catalog.html?error=unauthorized"]
    REASON -->|organization| ENT["→ /enterprise.html?error=organization"]
    REASON -->|default| HOME["→ /index.html"]

    style LOGIN fill:#ffd93d,stroke:#f59f00
    style CAT fill:#7986cb,stroke:#3949ab
    style ENT fill:#ff6b6b,stroke:#c92a2a
```

---

## Admin Operations

### User Role Management

```mermaid
sequenceDiagram
    participant A as Admin
    participant RBAC as RBACService
    participant FS as Firestore

    A->>RBAC: setUserRole(userId, 'enterprise')
    
    RBAC->>RBAC: getUserPermissions()
    
    alt Not admin
        RBAC-->>A: { success: false, error: 'Unauthorized' }
    else Is admin
        RBAC->>RBAC: Validate role in ROLE_HIERARCHY
        RBAC->>FS: users/{userId}.update({<br/>  role: 'enterprise',<br/>  updatedAt,<br/>  updatedBy<br/>})
        FS-->>RBAC: Success
        RBAC-->>A: { success: true }
    end
```

### Organization Access Management

```mermaid
flowchart TD
    subgraph Grant["Grant Organization Access"]
        G1[Admin calls grantOrganizationAccess]
        G2[Check admin permission]
        G3[arrayUnion to organizationAccess]
        G4[User can now access org courses]
    end

    subgraph Revoke["Revoke Organization Access"]
        R1[Admin calls revokeOrganizationAccess]
        R2[Check admin permission]
        R3[arrayRemove from organizationAccess]
        R4[User loses org course access]
    end

    subgraph Bulk["Bulk Operations"]
        B1[Admin calls bulkGrantOrganizationAccess]
        B2[Parallel process all user IDs]
        B3[Return results array]
    end

    G1 --> G2 --> G3 --> G4
    R1 --> R2 --> R3 --> R4
    B1 --> B2 --> B3
```

---

## Security Considerations

### Client-Side vs Server-Side

```mermaid
flowchart TB
    subgraph Client["🌐 Client-Side (UI Only)"]
        C1[RBACService checks]
        C2[RouteGuard redirects]
        C3[UI hiding/showing]
    end

    subgraph Server["☁️ Server-Side (Enforcement)"]
        S1[Firestore Security Rules]
        S2[Firebase Auth]
        S3[Cloud Functions]
    end

    Note1[⚠️ Client checks can be bypassed]
    Note2[✅ Server rules are the real gate]

    Client --> Note1
    Server --> Note2

    style Client fill:#ffd93d,stroke:#f59f00
    style Server fill:#51cf66,stroke:#2f9e44
```

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper: Check if user is admin
    function isAdmin() {
      return request.auth != null && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Helper: Check organization membership
    function belongsToOrg(orgId) {
      return request.auth != null &&
             orgId in get(/databases/$(database)/documents/users/$(request.auth.uid)).data.organizationAccess;
    }
    
    // Users can only access their own data
    match /users/{userId} {
      allow read: if request.auth.uid == userId || isAdmin();
      allow write: if request.auth.uid == userId;
      
      // Admin can modify roles
      allow update: if isAdmin() && 
                      request.resource.data.diff(resource.data).affectedKeys()
                        .hasOnly(['role', 'organizationAccess', 'courseAccess', 'updatedAt', 'updatedBy']);
      
      match /{subcollection}/{document=**} {
        allow read, write: if request.auth.uid == userId;
      }
    }
    
    // Course configs
    match /courses/{courseId} {
      allow read: if request.auth != null;
      allow write: if isAdmin();
    }
  }
}
```

---

## Debugging & Testing

### Console Commands

```javascript
// Check current auth state
AuthService.getUser()

// Get current permissions
await RBACService.debug()
// Output: { role, organizationAccess, courseAccess, isAdmin, isEnterprise }

// Check course access
await RBACService.canAccessCourse('endless-opportunities')

// Check organization membership
await RBACService.belongsToOrganization('endless-opportunities')

// Get accessible courses
await RBACService.getAccessibleCourses()

// Force clear permission cache
RBACService.clearCache()
```

### Common Issues

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| Always redirected to login | Auth state race condition | Check `waitForAuthState()` timing |
| Partner course shows access denied | Org not in `organizationAccess` | Admin adds via `grantOrganizationAccess()` |
| Super admin not recognized | Email case mismatch | Check lowercase comparison |
| Permission cache stale | Changes not reflected | Call `clearCache()` |
| Route guard not firing | Script load order | Ensure services load before guard |

### Test Scenarios

```mermaid
flowchart TB
    subgraph Tests["Test Scenarios"]
        T1["1. Guest → Public page ✅"]
        T2["2. Guest → Protected page → Login redirect ✅"]
        T3["3. User → Public course lesson ✅"]
        T4["4. User → Partner course → Denied ✅"]
        T5["5. Enterprise user → Partner course ✅"]
        T6["6. Admin → Any course ✅"]
        T7["7. Session restore → No re-auth ✅"]
    end
```
