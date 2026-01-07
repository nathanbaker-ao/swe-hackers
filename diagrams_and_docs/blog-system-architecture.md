# Blog System Architecture

## Current State Analysis

```mermaid
flowchart LR
    subgraph Current["📍 Current State (Broken)"]
        B1["blog/index.html"] --> L1["7 Blog Cards"]
        L1 --> X1["href='#' ❌"]
        X1 --> N1["No Article Pages"]
    end

    style Current fill:#2d1f1f,stroke:#ef5350,stroke-width:2px,color:#fff
    style X1 fill:#ef5350,stroke:#c92a2a,color:#fff
    style N1 fill:#ef5350,stroke:#c92a2a,color:#fff
```

### The Problem

The blog listing page (`blog/index.html`) displays 7 articles:

| #        | Article Title                                                  | Link Status   |
| -------- | -------------------------------------------------------------- | ------------- |
| Featured | How We Built This Learning Platform in 30 Days with AI         | `href="#"` ❌ |
| 1        | Context Engineering: The Skill That Will Define Your AI Career | `href="#"` ❌ |
| 2        | Analyzing Detroit's Traffic Patterns with AI                   | `href="#"` ❌ |
| 3        | The Three Forces: Why We Teach Programming Through Metaphor    | `href="#"` ❌ |
| 4        | Introducing the Cognitive Progress Score                       | `href="#"` ❌ |
| 5        | From 10 Hours to 10 Minutes: Refactoring with Agentic AI       | `href="#"` ❌ |
| 6        | Meet Our Founding Learners                                     | `href="#"` ❌ |

**Result:** Clicking any article does nothing. Users experience a broken blog.

---

## Proposed Architecture

```mermaid
flowchart TB
    subgraph BlogSystem["📝 Blog System Architecture"]
        subgraph FileStructure["📁 File Structure"]
            BI["blog/index.html<br/>(Article Listing)"]
            AT["blog/article-template.html<br/>(Reference Template)"]

            subgraph Articles["📄 Individual Articles"]
                A1["blog/building-platform-30-days.html"]
                A2["blog/context-engineering.html"]
                A3["blog/detroit-traffic-ai.html"]
                A4["blog/three-forces-metaphor.html"]
                A5["blog/cognitive-progress-score.html"]
                A6["blog/refactoring-agentic-ai.html"]
                A7["blog/founding-learners.html"]
            end
        end

        subgraph Shared["🔧 Shared Resources"]
            CSS["shared/css/blog.css"]
            JS["shared/js/blog.js"]
            MCSS["shared/css/marketing.css"]
        end

        subgraph DataLayer["📊 Article Metadata"]
            META["blog/articles.json<br/>(Article Registry)"]
        end
    end

    BI --> META
    META --> Articles
    Articles --> CSS
    Articles --> JS
    Articles --> MCSS
    AT --> Articles

    style BlogSystem fill:#1a1a2e,stroke:#4a9eff,stroke-width:2px,color:#fff
    style FileStructure fill:#16213e,stroke:#00ff88,stroke-width:2px,color:#fff
    style Shared fill:#0f3460,stroke:#ff6b6b,stroke-width:2px,color:#fff
    style DataLayer fill:#1a1a2e,stroke:#ffd93d,stroke-width:2px,color:#fff
```

### Design Decisions

**Why Static HTML over Markdown/CMS?**

| Approach              | Pros                                                               | Cons                                           | Verdict                       |
| --------------------- | ------------------------------------------------------------------ | ---------------------------------------------- | ----------------------------- |
| **Static HTML**       | Full control, no build step, works with GitHub Pages, SEO-friendly | Manual article creation                        | ✅ **Best for current stage** |
| **Markdown + Parser** | Easy writing                                                       | Requires build step or JS parser, SEO concerns | Later phase                   |
| **Headless CMS**      | Non-technical editing                                              | Infrastructure complexity, API dependencies    | Enterprise phase              |

The current site is static HTML hosted on GitHub Pages. Staying consistent with this pattern means:

- Zero build configuration
- Instant deployment via git push
- Full SEO control with proper meta tags
- Mermaid.js diagrams work natively

---

## Article Data Flow

```mermaid
flowchart LR
    subgraph Creation["✍️ Article Creation"]
        W1["1. Copy Template"] --> W2["2. Fill Content"]
        W2 --> W3["3. Add Meta Tags"]
        W3 --> W4["4. Register in JSON"]
    end

    subgraph Runtime["⚡ Runtime Flow"]
        R1["User visits<br/>blog/index.html"] --> R2["JS fetches<br/>articles.json"]
        R2 --> R3["Renders article<br/>cards dynamically"]
        R3 --> R4["User clicks<br/>article card"]
        R4 --> R5["Navigates to<br/>article HTML"]
    end

    subgraph Display["🖥️ Article Display"]
        D1["Static HTML loads"] --> D2["Mermaid.js renders<br/>diagrams"]
        D2 --> D3["anime.js animates<br/>entrance"]
        D3 --> D4["Related articles<br/>loaded from JSON"]
    end

    Creation --> Runtime
    Runtime --> Display

    style Creation fill:#1a472a,stroke:#66bb6a,stroke-width:2px,color:#fff
    style Runtime fill:#1a1a2e,stroke:#4a9eff,stroke-width:2px,color:#fff
    style Display fill:#2d1f47,stroke:#9c27b0,stroke-width:2px,color:#fff
```

### Why `articles.json`?

A central registry enables:

1. **Dynamic Index Page** - The blog listing can render from JSON, making it easy to add new articles without editing `index.html`
2. **Related Articles** - Article pages can show "Read Next" suggestions by querying the JSON
3. **Category Filtering** - Future feature: filter by AI Workflows, Local Research, etc.
4. **RSS Feed Generation** - JSON can be transformed to RSS
5. **Search** - Client-side search across article metadata

---

## File Structure (Proposed)

```mermaid
flowchart TB
    subgraph Root["📁 courses/blog/"]
        I["index.html<br/><em>Article listing page</em>"]
        T["article-template.html<br/><em>Copy for new articles</em>"]
        J["articles.json<br/><em>Article registry</em>"]

        subgraph Posts["📝 Article Files"]
            P1["building-platform-30-days.html"]
            P2["context-engineering.html"]
            P3["detroit-traffic-ai.html"]
            P4["three-forces-metaphor.html"]
            P5["cognitive-progress-score.html"]
            P6["refactoring-agentic-ai.html"]
            P7["founding-learners.html"]
        end

        subgraph Images["🖼️ images/"]
            IM1["featured-hero.png"]
            IM2["detroit-traffic-map.png"]
            IM3["dashboard-preview.png"]
        end
    end

    style Root fill:#1a1a2e,stroke:#7986cb,stroke-width:2px,color:#fff
    style Posts fill:#16213e,stroke:#4db6ac,stroke-width:2px,color:#fff
    style Images fill:#0f3460,stroke:#ffd54f,stroke-width:2px,color:#fff
```

### Naming Convention

Article files use **kebab-case slugs**:

```
[descriptive-slug].html
```

**Examples:**

- `building-platform-30-days.html` ← Featured article
- `context-engineering.html` ← AI Workflows
- `detroit-traffic-ai.html` ← Local Research

**Rules:**

1. Lowercase only
2. Hyphens separate words
3. Max 5 words (40 chars)
4. No dates in filename (dates live in JSON metadata)

---

## Article Template Structure

```mermaid
flowchart TB
    subgraph Template["📄 article-template.html"]
        subgraph Head["<head>"]
            M1["SEO Meta Tags"]
            M2["OpenGraph Tags"]
            M3["Twitter Cards"]
            M4["Fonts + CSS"]
            M5["Mermaid.js + anime.js"]
        end

        subgraph Body["<body>"]
            N["Navigation Bar"]

            subgraph Article["<article>"]
                H["Article Header<br/><em>Title, Author, Date, Category</em>"]
                C["Article Content<br/><em>Paragraphs, Code, Mermaid</em>"]
                F["Article Footer<br/><em>Tags, Share Buttons</em>"]
            end

            R["Related Articles<br/><em>Loaded from JSON</em>"]
            CTA["Newsletter CTA"]
            FT["Footer"]
        end
    end

    Head --> Body
    N --> Article
    Article --> R
    R --> CTA
    CTA --> FT

    style Template fill:#1a1a2e,stroke:#4a9eff,stroke-width:2px,color:#fff
    style Head fill:#16213e,stroke:#66bb6a,stroke-width:2px,color:#fff
    style Body fill:#0f3460,stroke:#ff6b6b,stroke-width:2px,color:#fff
    style Article fill:#2d1f47,stroke:#9c27b0,stroke-width:2px,color:#fff
```

### Article Sections

| Section              | Purpose                       | Implementation                                     |
| -------------------- | ----------------------------- | -------------------------------------------------- |
| **Header**           | Grab attention, show metadata | Title, emoji icon, category badge, date, read time |
| **Hero Image**       | Visual interest (optional)    | `<img class="article-hero-image">`                 |
| **Content**          | Main article body             | Standard HTML + Mermaid code blocks                |
| **Code Blocks**      | Syntax-highlighted code       | `<pre><code class="language-python">`              |
| **Mermaid Diagrams** | Visual explanations           | `<pre class="mermaid">` blocks                     |
| **Callouts**         | Highlight key points          | `<aside class="callout callout-info">`             |
| **Footer**           | Engagement                    | Tags, share buttons, author bio                    |
| **Related**          | Keep users reading            | 3 related articles from same category              |

---

## articles.json Schema

```mermaid
flowchart LR
    subgraph Schema["📊 articles.json Structure"]
        ROOT["{ articles: [...] }"]

        subgraph Article["Article Object"]
            S["slug: string<br/><em>URL-friendly ID</em>"]
            T["title: string<br/><em>Display title</em>"]
            E["excerpt: string<br/><em>Short description</em>"]
            C["category: string<br/><em>AI Workflows | Local Research | etc</em>"]
            D["date: string<br/><em>ISO date</em>"]
            R["readTime: number<br/><em>Minutes</em>"]
            I["icon: string<br/><em>Emoji for card</em>"]
            F["featured: boolean<br/><em>Show in hero?</em>"]
            TG["tags: string[]<br/><em>Search keywords</em>"]
        end

        ROOT --> Article
    end

    style Schema fill:#1a1a2e,stroke:#ffd93d,stroke-width:2px,color:#fff
    style Article fill:#16213e,stroke:#4db6ac,stroke-width:2px,color:#fff
```

### Example JSON

```json
{
  "articles": [
    {
      "slug": "building-platform-30-days",
      "title": "How We Built This Learning Platform in 30 Days with AI",
      "excerpt": "A behind-the-scenes look at building AutoNateAI — from architecture decisions to AI-assisted coding.",
      "category": "Platform Updates",
      "date": "2026-01-04",
      "readTime": 12,
      "icon": "🏗️",
      "featured": true,
      "tags": ["ai", "development", "cursor", "architecture"]
    },
    {
      "slug": "context-engineering",
      "title": "Context Engineering: The Skill That Will Define Your AI Career",
      "excerpt": "Prompt engineering was just the beginning. Learn why context engineering is the real differentiator.",
      "category": "AI Workflows",
      "date": "2025-12-28",
      "readTime": 8,
      "icon": "🤖",
      "featured": false,
      "tags": ["ai", "prompts", "context", "career"]
    }
  ]
}
```

---

## Blog Index Page Flow

```mermaid
sequenceDiagram
    participant U as User
    participant I as index.html
    participant JS as blog.js
    participant JSON as articles.json
    participant DOM as DOM

    U->>I: Visit /blog/
    I->>JS: DOMContentLoaded
    JS->>JSON: fetch('articles.json')
    JSON-->>JS: Article data
    JS->>JS: Find featured article
    JS->>DOM: Render featured hero
    JS->>JS: Filter remaining articles
    JS->>DOM: Render article grid
    JS->>DOM: anime.js entrance
    U->>DOM: Click article card
    DOM->>U: Navigate to article page
```

### Dynamic Rendering Benefits

1. **Single Source of Truth** - Add article to JSON, it appears on index
2. **No Index Editing** - `index.html` becomes a shell that JS populates
3. **Filtering Ready** - Category buttons can filter without page reload
4. **Easy Sorting** - Sort by date, read time, or popularity

---

## SEO & Social Sharing

```mermaid
flowchart TB
    subgraph SEO["🔍 SEO Strategy"]
        subgraph PerArticle["Per-Article Meta"]
            M1["<title>Article Title | Blog | AutoNateAI</title>"]
            M2["<meta name='description' content='...'>"]
            M3["<link rel='canonical' href='...'>"]
        end

        subgraph OpenGraph["OpenGraph Tags"]
            O1["og:title"]
            O2["og:description"]
            O3["og:image<br/><em>1200x630 preview</em>"]
            O4["og:type = article"]
            O5["og:published_time"]
        end

        subgraph Twitter["Twitter Cards"]
            T1["twitter:card = summary_large_image"]
            T2["twitter:title"]
            T3["twitter:image"]
        end

        subgraph Structured["Structured Data"]
            SD["JSON-LD Article Schema"]
        end
    end

    PerArticle --> OpenGraph
    OpenGraph --> Twitter
    Twitter --> Structured

    style SEO fill:#1a1a2e,stroke:#4a9eff,stroke-width:2px,color:#fff
    style PerArticle fill:#16213e,stroke:#66bb6a,stroke-width:2px,color:#fff
    style OpenGraph fill:#0f3460,stroke:#ff6b6b,stroke-width:2px,color:#fff
    style Twitter fill:#1a472a,stroke:#4db6ac,stroke-width:2px,color:#fff
    style Structured fill:#2d1f47,stroke:#ffd54f,stroke-width:2px,color:#fff
```

### Article OG Image Strategy

Each article should have a preview image for social sharing:

| Option           | Approach                                    | Effort         |
| ---------------- | ------------------------------------------- | -------------- |
| **Default**      | Use site OG image for all articles          | Zero effort    |
| **Per-Category** | One image per category (AI, Research, etc.) | 5 images       |
| **Per-Article**  | Custom hero image per article               | Most impactful |

**Recommendation:** Start with default, upgrade to per-category once content stabilizes.

---

## Implementation Phases

```mermaid
%%{init: {'gantt': {'barHeight': 30, 'fontSize': 12, 'sectionFontSize': 14, 'leftPadding': 150, 'barGap': 8}}}%%
gantt
    title Blog System Implementation
    dateFormat YYYY-MM-DD

    section Foundation
    articles.json           :p1a, 2026-01-07, 1d
    blog.css                :p1b, 2026-01-07, 1d
    article-template.html   :p1c, after p1a, 1d

    section Articles
    Featured article        :p2a, after p1c, 1d
    Context engineering     :p2b, after p2a, 1d
    Detroit traffic         :p2c, after p2b, 1d
    Remaining 4 articles    :p2d, after p2c, 2d

    section Dynamic Index
    blog.js JSON rendering  :p3a, after p2d, 1d
    Update index.html       :p3b, after p3a, 1d
    Category filtering      :p3c, after p3b, 1d

    section Polish
    SEO meta tags           :p4a, after p3c, 1d
    Related articles        :p4b, after p4a, 1d
    Testing & launch        :p4c, after p4b, 1d
```

---

## Adding a New Article (Workflow)

There are two ways to create articles: **Manual** (copy template) or **AI-Assisted** (Cursor rule).

### Option A: Manual Workflow

```mermaid
flowchart TB
    subgraph Workflow["📝 Manual Article Workflow"]
        S1["1️⃣ Copy article-template.html"]
        S2["2️⃣ Rename to slug.html"]
        S3["3️⃣ Update meta tags"]
        S4["4️⃣ Fill content manually"]
        S5["5️⃣ Add to articles.json"]
        S6["6️⃣ git push → Live!"]
    end

    S1 --> S2 --> S3 --> S4 --> S5 --> S6

    style Workflow fill:#1a1a2e,stroke:#66bb6a,stroke-width:2px,color:#fff
```

### Option B: AI-Assisted Storytelling Workflow (Recommended)

```mermaid
flowchart TB
    subgraph Discovery["🎯 Discovery Phase"]
        D1["Invoke @create-blog rule"]
        D2["AI asks about topic"]
        D3["AI asks about audience"]
        D4["AI asks about key points"]
        D5["AI asks about desired blocks"]
        D6["AI asks about protagonist"]
    end

    subgraph Creation["✍️ Creation Phase"]
        C1["AI crafts story arc"]
        C2["AI selects block types"]
        C3["AI writes narrative content"]
        C4["AI generates diagrams"]
        C5["AI adds animations"]
        C6["AI outputs complete HTML"]
    end

    subgraph Refinement["🔄 Refinement Phase"]
        R1["Review in browser"]
        R2["Request changes conversationally"]
        R3["AI iterates on specific blocks"]
        R4["Finalize and approve"]
    end

    subgraph Publish["🚀 Publish Phase"]
        P1["AI adds to articles.json"]
        P2["git push → Live!"]
    end

    Discovery --> Creation --> Refinement --> Publish

    style Discovery fill:#1a1a2e,stroke:#4a9eff,stroke-width:2px,color:#fff
    style Creation fill:#2d1f47,stroke:#9c27b0,stroke-width:2px,color:#fff
    style Refinement fill:#0f3460,stroke:#ffd54f,stroke-width:2px,color:#fff
    style Publish fill:#1a472a,stroke:#66bb6a,stroke-width:2px,color:#fff
```

### The Storytelling Philosophy

Every blog post is a **story** where the reader is the **protagonist**. The AI guides them through:

```mermaid
flowchart LR
    subgraph Story["📖 Story Arc"]
        A1["🌅 The Hook<br/><em>Relatable problem</em>"]
        A2["🔥 The Struggle<br/><em>Failed attempts</em>"]
        A3["💡 The Discovery<br/><em>Key insight</em>"]
        A4["🛠️ The Journey<br/><em>Step-by-step</em>"]
        A5["🏆 The Triumph<br/><em>Transformation</em>"]
        A6["🚀 The Call<br/><em>Reader's next step</em>"]
    end

    A1 --> A2 --> A3 --> A4 --> A5 --> A6

    style Story fill:#1a1a2e,stroke:#ff6b6b,stroke-width:2px,color:#fff
```

| Story Beat        | Purpose                 | Example                                                              |
| ----------------- | ----------------------- | -------------------------------------------------------------------- |
| **The Hook**      | Make them feel seen     | "You've tried learning AI tools 5 times. Each time, you hit a wall." |
| **The Struggle**  | Build empathy           | "Copy-paste prompts. Generic outputs. Frustration."                  |
| **The Discovery** | Introduce the insight   | "Then I realized: it's not about prompts. It's about context."       |
| **The Journey**   | Teach through narrative | "Here's exactly what I did..." (with diagrams, code, visuals)        |
| **The Triumph**   | Show transformation     | "Now my AI outputs are 10x better. Here's proof."                    |
| **The Call**      | Invite action           | "Ready to try? Start with this one exercise..."                      |

---

## Block Component Library

Each blog is composed of **blocks** — modular components that can be mixed freely while maintaining AutoNateAI branding.

```mermaid
flowchart TB
    subgraph Blocks["🧱 Available Block Types"]
        subgraph Structural["Structure"]
            B1["hero-block<br/><em>Full-width intro</em>"]
            B2["section-block<br/><em>Story chapter</em>"]
            B3["divider-block<br/><em>Visual break</em>"]
        end

        subgraph Content["Content"]
            B4["text-block<br/><em>Narrative paragraphs</em>"]
            B5["quote-block<br/><em>Pull quotes</em>"]
            B6["callout-block<br/><em>Info/warning/tip</em>"]
        end

        subgraph Visual["Visual"]
            B7["image-block<br/><em>Single image + caption</em>"]
            B8["gallery-block<br/><em>Image grid/carousel</em>"]
            B9["video-block<br/><em>Embedded video</em>"]
            B10["mermaid-block<br/><em>Interactive diagram</em>"]
        end

        subgraph Code["Code"]
            B11["code-block<br/><em>Syntax highlighted</em>"]
            B12["comparison-block<br/><em>Before/after code</em>"]
            B13["terminal-block<br/><em>CLI output style</em>"]
        end

        subgraph Interactive["Interactive"]
            B14["poll-block<br/><em>Vote + see results</em>"]
            B15["quiz-block<br/><em>Test understanding</em>"]
            B16["reveal-block<br/><em>Click to show</em>"]
        end

        subgraph Stats["Data"]
            B17["stats-block<br/><em>Big numbers</em>"]
            B18["timeline-block<br/><em>Chronological events</em>"]
            B19["comparison-table<br/><em>Feature comparison</em>"]
        end

        subgraph CTA["Engagement"]
            B20["cta-block<br/><em>Call to action</em>"]
            B21["author-block<br/><em>Author bio</em>"]
            B22["related-block<br/><em>Read next</em>"]
        end
    end

    style Blocks fill:#1a1a2e,stroke:#4a9eff,stroke-width:2px,color:#fff
    style Structural fill:#16213e,stroke:#66bb6a,stroke-width:2px,color:#fff
    style Content fill:#0f3460,stroke:#ff6b6b,stroke-width:2px,color:#fff
    style Visual fill:#1a472a,stroke:#ffd54f,stroke-width:2px,color:#fff
    style Code fill:#2d1f47,stroke:#9c27b0,stroke-width:2px,color:#fff
    style Interactive fill:#1f2d47,stroke:#4db6ac,stroke-width:2px,color:#fff
    style Stats fill:#2d2d1f,stroke:#ffb74d,stroke-width:2px,color:#fff
    style CTA fill:#1f1f2d,stroke:#7986cb,stroke-width:2px,color:#fff
```

### Block Composition Rules

| Rule             | Description                                                   |
| ---------------- | ------------------------------------------------------------- |
| **Never stack**  | Don't put 3+ text blocks in a row — break with visual         |
| **Rhythm**       | Alternate between dense (text/code) and light (image/diagram) |
| **Entrance**     | Every block has an anime.js entrance animation                |
| **Scroll-aware** | Animations trigger on scroll into viewport                    |
| **Mobile-first** | All blocks responsive, touch-friendly                         |

---

## AI Discovery Questions

When you invoke the `@create-blog` Cursor rule, it will ask:

```mermaid
sequenceDiagram
    participant You
    participant AI as Cursor AI

    AI->>You: What's the topic? Give me the core idea.
    You->>AI: Context engineering for AI tools

    AI->>You: Who's the protagonist? Who will read this?
    You->>AI: Junior devs who've tried prompting but hit a wall

    AI->>You: What's their current pain? What have they tried?
    You->>AI: Copy-paste prompts, generic outputs, frustration

    AI->>You: What's the key insight that changes everything?
    You->>AI: Context > prompts. Structure your inputs deliberately.

    AI->>You: What transformation should they experience?
    You->>AI: Go from frustrated to confident, with a framework

    AI->>You: What blocks do you want? (visuals, code, polls, etc.)
    You->>AI: Mermaid diagram comparing approaches, code example, poll

    AI->>You: Any assets? Images, videos, data?
    You->>AI: I have a screenshot of a good vs bad prompt

    AI->>AI: Crafting story arc...
    AI->>You: Here's your blog: context-engineering.html
```

---

## Example: Block Composition

Here's how a blog might be composed from blocks:

```
┌─────────────────────────────────────────┐
│           HERO BLOCK                    │
│  "Context Engineering: The Skill..."    │
│  Category badge | Date | Read time      │
│  Animated particles background          │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│           TEXT BLOCK (Lead)             │
│  "You've copied prompts from Twitter.   │
│   Pasted them into ChatGPT. And got...  │
│   garbage. Sound familiar?"             │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│           POLL BLOCK                    │
│  "How many times have you tried to      │
│   'learn AI tools' and given up?"       │
│  ○ 1-2 times  ○ 3-5 times  ○ 6+ times  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│           MERMAID BLOCK                 │
│  ┌──────────┐     ┌──────────┐         │
│  │ Prompts  │ vs  │ Context  │         │
│  └──────────┘     └──────────┘         │
│  (Interactive diagram with hover)       │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│           TEXT BLOCK                    │
│  "The difference isn't what you ask.    │
│   It's what you provide BEFORE asking." │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│         COMPARISON BLOCK                │
│  ┌─────────────┐  ┌─────────────┐       │
│  │ ❌ BAD      │  │ ✅ GOOD     │       │
│  │ "Fix bug"   │  │ [context... │       │
│  │             │  │  + request] │       │
│  └─────────────┘  └─────────────┘       │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│           STATS BLOCK                   │
│     3x              85%          10min  │
│  Productivity    Accuracy      Saved    │
│  (Count-up animation on scroll)         │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│           CTA BLOCK                     │
│  "Ready to master context engineering?" │
│  [Start the Course →]                   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│         RELATED BLOCK                   │
│  ┌─────┐ ┌─────┐ ┌─────┐               │
│  │ 📝  │ │ 📝  │ │ 📝  │               │
│  └─────┘ └─────┘ └─────┘               │
│  3 related articles from same category  │
└─────────────────────────────────────────┘
```

---

## Cursor Rule: `@create-blog`

The rule lives at: `autonateai-cursor-rules/.cursor/rules/create-blog.mdc`

It contains:

1. **Discovery prompts** — Questions to ask the user
2. **Block library reference** — HTML/CSS for each block type
3. **Storytelling framework** — The 6-beat arc structure
4. **Brand guidelines** — Colors, fonts, animation timing
5. **Output instructions** — Where to save, JSON registry update

### Checklist for New Articles

```markdown
## New Article Checklist

- [ ] Copy `article-template.html` to `blog/[slug].html`
- [ ] Update `<title>` tag
- [ ] Update `<meta name="description">`
- [ ] Update all `og:` meta tags
- [ ] Update all `twitter:` meta tags
- [ ] Set article title in `<h1>`
- [ ] Set category badge
- [ ] Set date and read time
- [ ] Write article content
- [ ] Add Mermaid diagrams if applicable
- [ ] Add entry to `articles.json`
- [ ] Test locally
- [ ] Commit and push
```

---

## CSS Component Classes

```mermaid
flowchart LR
    subgraph BlogCSS["🎨 blog.css Classes"]
        subgraph Layout["Layout"]
            L1[".article-container"]
            L2[".article-header"]
            L3[".article-content"]
            L4[".article-footer"]
        end

        subgraph Typography["Typography"]
            T1[".article-title"]
            T2[".article-meta"]
            T3[".article-body"]
            T4[".article-lead<br/><em>First paragraph</em>"]
        end

        subgraph Components["Components"]
            C1[".category-badge"]
            C2[".read-time"]
            C3[".share-buttons"]
            C4[".related-articles"]
        end

        subgraph Content["Content Blocks"]
            B1[".callout<br/><em>.callout-info, .callout-warning</em>"]
            B2[".code-block"]
            B3[".image-caption"]
            B4["pre.mermaid"]
        end
    end

    style BlogCSS fill:#1a1a2e,stroke:#ff6b6b,stroke-width:2px,color:#fff
    style Layout fill:#16213e,stroke:#4a9eff,stroke-width:2px,color:#fff
    style Typography fill:#0f3460,stroke:#66bb6a,stroke-width:2px,color:#fff
    style Components fill:#1a472a,stroke:#ffd54f,stroke-width:2px,color:#fff
    style Content fill:#2d1f47,stroke:#9c27b0,stroke-width:2px,color:#fff
```

---

## Related Articles Component

```mermaid
sequenceDiagram
    participant A as Article Page
    participant JS as blog.js
    participant JSON as articles.json
    participant DOM as Related Section

    A->>JS: Page loads
    JS->>A: Get current article slug
    JS->>JSON: Fetch all articles
    JSON-->>JS: Article array
    JS->>JS: Filter: same category, exclude current
    JS->>JS: Sort by date, take top 3
    JS->>DOM: Render related cards
```

### Related Articles Logic

```javascript
function getRelatedArticles(currentSlug, allArticles, limit = 3) {
  const current = allArticles.find((a) => a.slug === currentSlug);
  if (!current) return [];

  return allArticles
    .filter((a) => a.slug !== currentSlug)
    .filter(
      (a) =>
        a.category === current.category ||
        a.tags.some((t) => current.tags.includes(t))
    )
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, limit);
}
```

---

## Future Enhancements

```mermaid
flowchart TB
    subgraph Future["🚀 Future Enhancements"]
        subgraph V2["Version 2"]
            F1["Category Filter Buttons"]
            F2["Search by Keyword"]
            F3["Reading Progress Bar"]
        end

        subgraph V3["Version 3"]
            F4["Comments via Giscus<br/><em>GitHub Discussions</em>"]
            F5["Estimated Read Time<br/><em>Based on word count</em>"]
            F6["Table of Contents<br/><em>Auto-generated</em>"]
        end

        subgraph V4["Version 4 (Enterprise)"]
            F7["Markdown Authoring<br/><em>marked.js parser</em>"]
            F8["Headless CMS<br/><em>Strapi/Sanity</em>"]
            F9["RSS Feed Generation"]
        end
    end

    V2 --> V3 --> V4

    style Future fill:#1a1a2e,stroke:#4a9eff,stroke-width:2px,color:#fff
    style V2 fill:#16213e,stroke:#66bb6a,stroke-width:2px,color:#fff
    style V3 fill:#0f3460,stroke:#ffd54f,stroke-width:2px,color:#fff
    style V4 fill:#2d1f47,stroke:#9c27b0,stroke-width:2px,color:#fff
```

---

## Summary: What Gets Built

| File                                  | Purpose                              |
| ------------------------------------- | ------------------------------------ |
| `blog/articles.json`                  | Central article registry             |
| `blog/article-template.html`          | Copy this for new articles           |
| `shared/css/blog.css`                 | Article page styles                  |
| `shared/js/blog.js`                   | Dynamic rendering + related articles |
| `blog/building-platform-30-days.html` | Featured article                     |
| `blog/context-engineering.html`       | AI Workflows article                 |
| `blog/detroit-traffic-ai.html`        | Local Research article               |
| `blog/three-forces-metaphor.html`     | Learning Tips article                |
| `blog/cognitive-progress-score.html`  | Platform Updates article             |
| `blog/refactoring-agentic-ai.html`    | AI Workflows article                 |
| `blog/founding-learners.html`         | Community article                    |

---

## Decision: Static HTML with JSON Registry

This architecture:

✅ **Fits current stack** — Static HTML, GitHub Pages, no build step  
✅ **SEO-friendly** — Full meta tags, no client-side rendering issues  
✅ **Easy to author** — Copy template, fill content, add to JSON  
✅ **Mermaid-native** — Diagrams render without extra config  
✅ **Scalable path** — Can migrate to markdown/CMS later  
✅ **Team-friendly** — Anyone can add articles via git

The JSON registry adds just enough abstraction to avoid editing `index.html` for every new article while keeping the simplicity of static HTML.

---

## Next Steps

1. **Create `articles.json`** with the 7 article entries
2. **Create `shared/css/blog.css`** for article styling
3. **Create `shared/js/blog.js`** for dynamic index rendering
4. **Build `article-template.html`** as the base template
5. **Create the 7 article HTML files** with real content
6. **Update `blog/index.html`** to render from JSON
7. **Test all links and SEO meta tags**
