# Parallel Lesson Upgrade Agents

## Overview

33 lessons across 5 courses need activity carousel upgrades. This document provides ready-to-copy prompts for parallel Cursor agent execution.

## Agent Strategy

### Recommended: 5 Agents (One Per Course)

This approach keeps each agent focused on one course's content, maintaining consistency in tone and difficulty progression.

| Agent | Course | Lessons | Issues |
|-------|--------|---------|--------|
| Agent 1 | Endless Opportunities | 5 | #25-29 |
| Agent 2 | Apprentice | 7 | #30-36 |
| Agent 3 | Junior | 7 | #37-43 |
| Agent 4 | Senior | 7 | #44-50 |
| Agent 5 | Undergrad | 7 | #51-57 |

### Alternative: 7 Agents (Faster)

If you want more parallelism, split the larger courses.

---

## Copy-Paste Agent Prompts

---

### 🟢 Agent 1: Endless Opportunities (5 lessons)

```
I'm upgrading lessons with activity carousels for the SWE Hackers platform.

## My Course: Endless Opportunities
This is a beginner-friendly course about AI-assisted development, split into 5 weeks.

## Read These Files First:
1. @upgrade-lesson-activities - The cursor rule with full instructions
2. @diagrams_and_docs/enhanced-lesson-architecture.md - Activity system architecture
3. @courses/shared/demo-activity-carousel.html - Working examples

## My Assigned Issues (do in order):
- #25: Week 0 (Intro) - https://github.com/nathanbaker-ao/swe-hackers/issues/25
- #26: Week 1 (Questions) - https://github.com/nathanbaker-ao/swe-hackers/issues/26
- #27: Week 2 (Data) - https://github.com/nathanbaker-ao/swe-hackers/issues/27
- #28: Week 3 (Building) - https://github.com/nathanbaker-ao/swe-hackers/issues/28
- #29: Week 4 (Portfolio) - https://github.com/nathanbaker-ao/swe-hackers/issues/29

## For Each Lesson:
1. Read the index.html and story.json
2. Design 3 carousels × 6+ activities = 18+ activities per lesson
3. Activities must connect to the video content
4. Include professional scenarios
5. Commit with "Closes #XX" to auto-close the issue
6. Move to next lesson

## Course Theme:
Endless Opportunities focuses on empowering beginners to use AI tools effectively. Activities should:
- Build confidence with achievable challenges
- Emphasize practical, job-ready skills
- Connect AI capabilities to real work scenarios

Start with #25 (Week 0) now.
```

---

### 🟡 Agent 2: Apprentice Course (7 lessons)

```
I'm upgrading lessons with activity carousels for the SWE Hackers platform.

## My Course: Apprentice
This is the foundational course teaching computing history through storytelling - Stone, Lightning, Magnetism.

## Read These Files First:
1. @upgrade-lesson-activities - The cursor rule with full instructions
2. @diagrams_and_docs/enhanced-lesson-architecture.md - Activity system architecture
3. @courses/shared/demo-activity-carousel.html - Working examples

## My Assigned Issues (do in order):
- #30: Ch 0: Origins - https://github.com/nathanbaker-ao/swe-hackers/issues/30
- #31: Ch 1: Stone - https://github.com/nathanbaker-ao/swe-hackers/issues/31
- #32: Ch 2: Lightning - https://github.com/nathanbaker-ao/swe-hackers/issues/32
- #33: Ch 3: Magnetism - https://github.com/nathanbaker-ao/swe-hackers/issues/33
- #34: Ch 4: Architect - https://github.com/nathanbaker-ao/swe-hackers/issues/34
- #35: Ch 5: Capstone 1 - https://github.com/nathanbaker-ao/swe-hackers/issues/35
- #36: Ch 6: Capstone 2 - https://github.com/nathanbaker-ao/swe-hackers/issues/36

## For Each Lesson:
1. Read the index.html and story.json
2. Design 3 carousels × 6+ activities = 18+ activities per lesson
3. Activities must connect to the video content
4. Include professional scenarios
5. Commit with "Closes #XX" to auto-close the issue
6. Move to next lesson

## Course Theme:
Apprentice uses storytelling to teach computing fundamentals. Activities should:
- Reinforce the "Three Forces" metaphor (Stone/Silicon, Lightning/Electricity, Magnetism/Storage)
- Build intuition before technical depth
- Connect historical context to modern applications

Start with #30 (Ch 0: Origins) now.
```

---

### 🟡 Agent 3: Junior Course (7 lessons)

```
I'm upgrading lessons with activity carousels for the SWE Hackers platform.

## My Course: Junior
This is the intermediate course building on Apprentice with deeper technical content.

## Read These Files First:
1. @upgrade-lesson-activities - The cursor rule with full instructions
2. @diagrams_and_docs/enhanced-lesson-architecture.md - Activity system architecture
3. @courses/shared/demo-activity-carousel.html - Working examples

## My Assigned Issues (do in order):
- #37: Ch 0: Origins - https://github.com/nathanbaker-ao/swe-hackers/issues/37
- #38: Ch 1: Stone - https://github.com/nathanbaker-ao/swe-hackers/issues/38
- #39: Ch 2: Lightning - https://github.com/nathanbaker-ao/swe-hackers/issues/39
- #40: Ch 3: Magnetism - https://github.com/nathanbaker-ao/swe-hackers/issues/40
- #41: Ch 4: Architect - https://github.com/nathanbaker-ao/swe-hackers/issues/41
- #42: Ch 5: Capstone 1 - https://github.com/nathanbaker-ao/swe-hackers/issues/42
- #43: Ch 6: Capstone 2 - https://github.com/nathanbaker-ao/swe-hackers/issues/43

## For Each Lesson:
1. Read the index.html and story.json
2. Design 3 carousels × 6+ activities = 18+ activities per lesson
3. Activities must connect to the video content
4. Include professional scenarios
5. Commit with "Closes #XX" to auto-close the issue
6. Move to next lesson

## Course Theme:
Junior builds practical skills for early-career developers. Activities should:
- Include more complex scenarios than Apprentice
- Introduce debugging and troubleshooting challenges
- Connect to real junior developer tasks

Start with #37 (Ch 0: Origins) now.
```

---

### 🟡 Agent 4: Senior Course (7 lessons)

```
I'm upgrading lessons with activity carousels for the SWE Hackers platform.

## My Course: Senior
This is the advanced course for experienced developers deepening their fundamentals.

## Read These Files First:
1. @upgrade-lesson-activities - The cursor rule with full instructions
2. @diagrams_and_docs/enhanced-lesson-architecture.md - Activity system architecture
3. @courses/shared/demo-activity-carousel.html - Working examples

## My Assigned Issues (do in order):
- #44: Ch 0: Origins - https://github.com/nathanbaker-ao/swe-hackers/issues/44
- #45: Ch 1: Stone - https://github.com/nathanbaker-ao/swe-hackers/issues/45
- #46: Ch 2: Lightning - https://github.com/nathanbaker-ao/swe-hackers/issues/46
- #47: Ch 3: Magnetism - https://github.com/nathanbaker-ao/swe-hackers/issues/47
- #48: Ch 4: Architect - https://github.com/nathanbaker-ao/swe-hackers/issues/48
- #49: Ch 5: Capstone 1 - https://github.com/nathanbaker-ao/swe-hackers/issues/49
- #50: Ch 6: Capstone 2 - https://github.com/nathanbaker-ao/swe-hackers/issues/50

## For Each Lesson:
1. Read the index.html and story.json
2. Design 3 carousels × 6+ activities = 18+ activities per lesson
3. Activities must connect to the video content
4. Include professional scenarios
5. Commit with "Closes #XX" to auto-close the issue
6. Move to next lesson

## Course Theme:
Senior is for developers who want to understand the "why" behind systems. Activities should:
- Present complex system design scenarios
- Include performance and optimization challenges
- Reference real-world architecture decisions

Start with #44 (Ch 0: Origins) now.
```

---

### 🔴 Agent 5: Undergrad Course (7 lessons)

```
I'm upgrading lessons with activity carousels for the SWE Hackers platform.

## My Course: Undergrad
This is the college-level course with academic rigor and theoretical depth.

## Read These Files First:
1. @upgrade-lesson-activities - The cursor rule with full instructions
2. @diagrams_and_docs/enhanced-lesson-architecture.md - Activity system architecture
3. @courses/shared/demo-activity-carousel.html - Working examples

## My Assigned Issues (do in order):
- #51: Ch 0: Origins - https://github.com/nathanbaker-ao/swe-hackers/issues/51
- #52: Ch 1: Stone - https://github.com/nathanbaker-ao/swe-hackers/issues/52
- #53: Ch 2: Lightning - https://github.com/nathanbaker-ao/swe-hackers/issues/53
- #54: Ch 3: Magnetism - https://github.com/nathanbaker-ao/swe-hackers/issues/54
- #55: Ch 4: Architect - https://github.com/nathanbaker-ao/swe-hackers/issues/55
- #56: Ch 5: Capstone 1 - https://github.com/nathanbaker-ao/swe-hackers/issues/56
- #57: Ch 6: Capstone 2 - https://github.com/nathanbaker-ao/swe-hackers/issues/57

## For Each Lesson:
1. Read the index.html and story.json
2. Design 3 carousels × 6+ activities = 18+ activities per lesson
3. Activities must connect to the video content
4. Include professional scenarios
5. Commit with "Closes #XX" to auto-close the issue
6. Move to next lesson

## Course Theme:
Undergrad targets CS students wanting practical foundations. Activities should:
- Include academic-style analysis questions
- Reference computer science theory
- Bridge classroom concepts to industry practice

Start with #51 (Ch 0: Origins) now.
```

---

## Quick Reference: All Issues

### Endless Opportunities
| # | Lesson | Link |
|---|--------|------|
| 25 | Week 0: Intro | https://github.com/nathanbaker-ao/swe-hackers/issues/25 |
| 26 | Week 1: Questions | https://github.com/nathanbaker-ao/swe-hackers/issues/26 |
| 27 | Week 2: Data | https://github.com/nathanbaker-ao/swe-hackers/issues/27 |
| 28 | Week 3: Building | https://github.com/nathanbaker-ao/swe-hackers/issues/28 |
| 29 | Week 4: Portfolio | https://github.com/nathanbaker-ao/swe-hackers/issues/29 |

### Apprentice
| # | Lesson | Link |
|---|--------|------|
| 30 | Ch 0: Origins | https://github.com/nathanbaker-ao/swe-hackers/issues/30 |
| 31 | Ch 1: Stone | https://github.com/nathanbaker-ao/swe-hackers/issues/31 |
| 32 | Ch 2: Lightning | https://github.com/nathanbaker-ao/swe-hackers/issues/32 |
| 33 | Ch 3: Magnetism | https://github.com/nathanbaker-ao/swe-hackers/issues/33 |
| 34 | Ch 4: Architect | https://github.com/nathanbaker-ao/swe-hackers/issues/34 |
| 35 | Ch 5: Capstone 1 | https://github.com/nathanbaker-ao/swe-hackers/issues/35 |
| 36 | Ch 6: Capstone 2 | https://github.com/nathanbaker-ao/swe-hackers/issues/36 |

### Junior
| # | Lesson | Link |
|---|--------|------|
| 37 | Ch 0: Origins | https://github.com/nathanbaker-ao/swe-hackers/issues/37 |
| 38 | Ch 1: Stone | https://github.com/nathanbaker-ao/swe-hackers/issues/38 |
| 39 | Ch 2: Lightning | https://github.com/nathanbaker-ao/swe-hackers/issues/39 |
| 40 | Ch 3: Magnetism | https://github.com/nathanbaker-ao/swe-hackers/issues/40 |
| 41 | Ch 4: Architect | https://github.com/nathanbaker-ao/swe-hackers/issues/41 |
| 42 | Ch 5: Capstone 1 | https://github.com/nathanbaker-ao/swe-hackers/issues/42 |
| 43 | Ch 6: Capstone 2 | https://github.com/nathanbaker-ao/swe-hackers/issues/43 |

### Senior
| # | Lesson | Link |
|---|--------|------|
| 44 | Ch 0: Origins | https://github.com/nathanbaker-ao/swe-hackers/issues/44 |
| 45 | Ch 1: Stone | https://github.com/nathanbaker-ao/swe-hackers/issues/45 |
| 46 | Ch 2: Lightning | https://github.com/nathanbaker-ao/swe-hackers/issues/46 |
| 47 | Ch 3: Magnetism | https://github.com/nathanbaker-ao/swe-hackers/issues/47 |
| 48 | Ch 4: Architect | https://github.com/nathanbaker-ao/swe-hackers/issues/48 |
| 49 | Ch 5: Capstone 1 | https://github.com/nathanbaker-ao/swe-hackers/issues/49 |
| 50 | Ch 6: Capstone 2 | https://github.com/nathanbaker-ao/swe-hackers/issues/50 |

### Undergrad
| # | Lesson | Link |
|---|--------|------|
| 51 | Ch 0: Origins | https://github.com/nathanbaker-ao/swe-hackers/issues/51 |
| 52 | Ch 1: Stone | https://github.com/nathanbaker-ao/swe-hackers/issues/52 |
| 53 | Ch 2: Lightning | https://github.com/nathanbaker-ao/swe-hackers/issues/53 |
| 54 | Ch 3: Magnetism | https://github.com/nathanbaker-ao/swe-hackers/issues/54 |
| 55 | Ch 4: Architect | https://github.com/nathanbaker-ao/swe-hackers/issues/55 |
| 56 | Ch 5: Capstone 1 | https://github.com/nathanbaker-ao/swe-hackers/issues/56 |
| 57 | Ch 6: Capstone 2 | https://github.com/nathanbaker-ao/swe-hackers/issues/57 |

---

## Expected Output

Each agent will produce:
- **18+ activities per lesson** (6 per carousel × 3 carousels)
- **33 lessons × 18 activities = 594+ activities total**

When all agents complete:
- All 33 issues will be closed
- Every lesson will have 3 activity carousels
- Full Bloom's Taxonomy coverage across all content
