

## Problem Analysis

The `LessonMediaPlayer` component only triggers animations for 2 specific lesson titles (those containing "wuḍūʾ" or "ghusl"). All other 31 lessons fall through to the placeholder "Video binnenkort beschikbaar" because:

1. `getStepsForLesson()` only matches on "wuḍūʾ"/"wudu" and "ghusl" in the title
2. All `media_urls` in the database are empty arrays `[]`, so the video path never triggers
3. The fallback is a static placeholder with no interactive content

## Plan

### 1. Expand hardcoded animation sets for key ritual lessons

Add animation step sets for more lesson topics that deserve dedicated visual guidance:
- **Tayammum** (droge reiniging) — 4-5 stappen
- **Ṣalāh** (gebed stap voor stap) — 8-10 stappen (qiyām, rukūʿ, sujūd, etc.)
- **Shahāda** — 3 stappen
- **Wuḍūʾ-gerelateerde lessen** (voorwaarden, verbrekers) — expand title matching to cover "Voorwaarden", "Verbreken", "Onderdelen", "Farḍ" etc.
- **Ghusl-gerelateerde lessen** — match "Plekken", "Onderdelen", "Categorieën"

### 2. Auto-generate animation steps from lesson content

For lessons without a hardcoded animation set, parse the lesson's own content to create interactive steps:
- Split content on section markers (headers, bullet lists, numbered items)
- Each section becomes an animation "step" with title + description
- Assign contextual icons based on keywords (water, hand, eye, book, etc.)
- Label steps as informational rather than farḍ/sunnah

This ensures **every lesson** gets an interactive player instead of a static placeholder.

### 3. Update LessonMediaPlayer component

- Refactor `getStepsForLesson()` to accept both `title` and `content` parameters
- Add a `generateStepsFromContent(content: string)` function that parses lesson text into steps
- Priority order: video URL → hardcoded animation → auto-generated content steps → minimal fallback
- Pass `lesson.content` from `CursusLes.tsx` to the media player

### 4. Update CursusLes.tsx

- Pass `lessonContent={lesson.content}` as a new prop to `LessonMediaPlayer`
- This allows the player to auto-generate steps from the lesson text when no hardcoded animation exists

### Technical Details

**New prop on LessonMediaPlayer:**
```typescript
interface LessonMediaPlayerProps {
  lessonTitle: string;
  lessonContent?: string;  // NEW
  mediaUrls?: any;
  onComplete?: () => void;
  autoplayNext?: boolean;
}
```

**Content-to-steps parser logic:**
- Split on double newlines or section headers
- Take first sentence as step title, rest as description
- Cap at 8-10 steps for usability
- Assign icons from a keyword map (reinheid→Droplets, gebed→Hand, geloof→Eye, etc.)

**Expanded title matching** covers all 33 lessons so every student sees interactive content.

