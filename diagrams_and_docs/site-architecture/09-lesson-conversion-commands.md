# Interactive Lesson Conversion Commands

Quick reference for converting all SWE Hackers lessons to the interactive format using the `@convert-lesson` Cursor rule.

## Usage

Copy any command below and paste it into a Cursor agent chat. Each agent can work independently on a single lesson.

---

## ✅ Completed Conversions

| Course     | Lesson      | Status      |
| ---------- | ----------- | ----------- |
| Apprentice | ch0-origins | ✅ Complete |

---

## Apprentice Course (6 remaining)

```
@convert-lesson Convert @swe-hackers/courses/apprentice/ch1-stone/index.html
```

```
@convert-lesson Convert @swe-hackers/courses/apprentice/ch2-lightning/index.html
```

```
@convert-lesson Convert @swe-hackers/courses/apprentice/ch3-magnetism/index.html
```

```
@convert-lesson Convert @swe-hackers/courses/apprentice/ch4-architect/index.html
```

```
@convert-lesson Convert @swe-hackers/courses/apprentice/ch5-capstone1/index.html
```

```
@convert-lesson Convert @swe-hackers/courses/apprentice/ch6-capstone2/index.html
```

---

## Junior Course (7 lessons)

```
@convert-lesson Convert @swe-hackers/courses/junior/ch0-origins/index.html
```

```
@convert-lesson Convert @swe-hackers/courses/junior/ch1-stone/index.html
```

```
@convert-lesson Convert @swe-hackers/courses/junior/ch2-lightning/index.html
```

```
@convert-lesson Convert @swe-hackers/courses/junior/ch3-magnetism/index.html
```

```
@convert-lesson Convert @swe-hackers/courses/junior/ch4-architect/index.html
```

```
@convert-lesson Convert @swe-hackers/courses/junior/ch5-capstone1/index.html
```

```
@convert-lesson Convert @swe-hackers/courses/junior/ch6-capstone2/index.html
```

---

## Senior Course (7 lessons)

```
@convert-lesson Convert @swe-hackers/courses/senior/ch0-origins/index.html
```

```
@convert-lesson Convert @swe-hackers/courses/senior/ch1-stone/index.html
```

```
@convert-lesson Convert @swe-hackers/courses/senior/ch2-lightning/index.html
```

```
@convert-lesson Convert @swe-hackers/courses/senior/ch3-magnetism/index.html
```

```
@convert-lesson Convert @swe-hackers/courses/senior/ch4-architect/index.html
```

```
@convert-lesson Convert @swe-hackers/courses/senior/ch5-capstone1/index.html
```

```
@convert-lesson Convert @swe-hackers/courses/senior/ch6-capstone2/index.html
```

---

## Undergrad Course (7 lessons)

```
@convert-lesson Convert @swe-hackers/courses/undergrad/ch0-origins/index.html
```

```
@convert-lesson Convert @swe-hackers/courses/undergrad/ch1-stone/index.html
```

```
@convert-lesson Convert @swe-hackers/courses/undergrad/ch2-lightning/index.html
```

```
@convert-lesson Convert @swe-hackers/courses/undergrad/ch3-magnetism/index.html
```

```
@convert-lesson Convert @swe-hackers/courses/undergrad/ch4-architect/index.html
```

```
@convert-lesson Convert @swe-hackers/courses/undergrad/ch5-capstone1/index.html
```

```
@convert-lesson Convert @swe-hackers/courses/undergrad/ch6-capstone2/index.html
```

---

## Endless Opportunities Course (5 lessons)

```
@convert-lesson Convert @swe-hackers/courses/endless-opportunities/week0-intro/index.html
```

```
@convert-lesson Convert @swe-hackers/courses/endless-opportunities/week1-chatgpt/index.html
```

```
@convert-lesson Convert @swe-hackers/courses/endless-opportunities/week2-visual/index.html
```

```
@convert-lesson Convert @swe-hackers/courses/endless-opportunities/week3-claude/index.html
```

```
@convert-lesson Convert @swe-hackers/courses/endless-opportunities/week4-launch/index.html
```

---

## Summary

| Course                    | Lessons | Status                   |
| ------------------------- | ------- | ------------------------ |
| **Apprentice**            | 7       | 1 done, 6 remaining      |
| **Junior**                | 7       | 0 done, 7 remaining      |
| **Senior**                | 7       | 0 done, 7 remaining      |
| **Undergrad**             | 7       | 0 done, 7 remaining      |
| **Endless Opportunities** | 5       | 0 done, 5 remaining      |
| **Total**                 | **33**  | **1 done, 32 remaining** |

---

## Batch Execution Strategy

### Option 1: By Chapter (Maximum Parallelism)

Run 4-5 agents at once, each converting the same chapter across courses:

**Batch 1 - All ch0-origins:**

- Junior, Senior, Undergrad (Apprentice already done)

**Batch 2 - All ch1-stone:**

- Apprentice, Junior, Senior, Undergrad

**Batch 3 - All ch2-lightning:**

- Apprentice, Junior, Senior, Undergrad

_(Continue for ch3-ch6...)_

### Option 2: By Course (Focused)

Complete one course at a time:

1. Finish Apprentice (6 remaining)
2. Convert Junior (7)
3. Convert Senior (7)
4. Convert Undergrad (7)
5. Convert Endless Opportunities (5)

---

## Post-Conversion Checklist

After each conversion, verify:

- [ ] `index.html` - Clean rebuild with interactive elements only
- [ ] `story.json` - Valid JSON with 2-4 stories
- [ ] `audio/manifest.json` - Contains voice data for this lesson
- [ ] `audio/ballad/` - All step MP3s present
- [ ] `audio/echo/` - All step MP3s present
- [ ] Local test - Diagrams render, audio plays, quizzes work

---

_Generated: January 2026_
_Rule: `@autonateai-cursor-rules/.cursor/rules/convert-lesson.mdc`_
