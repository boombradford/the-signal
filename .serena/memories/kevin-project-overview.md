# Kevin (kevin.cheap) - AI-Powered RSS Reader

## Project Overview
Kevin is a premium AI-powered RSS reader with an iOS-inspired design philosophy. The project emphasizes Apple-style typography, subtle interactions, and intelligent features.

**Live Domain:** kevin.cheap
**Alternate Name:** The Signal

## Tech Stack
- **Frontend:** React 18 + Vite
- **Styling:** Tailwind CSS + Custom CSS Design System
- **Animations:** Framer Motion
- **Storage:** IndexedDB via Dexie.js
- **AI:** Anthropic Claude API
- **Auth:** Supabase (optional)
- **Deployment:** Vercel

## Design Philosophy
Inspired by: **Jony Ive, Steve Jobs, Alan Dye, Mike Matas**

Core principles:
- Typography is information architecture
- Whitespace is a design element
- Every pixel is intentional
- Restraint over excess
- SF Pro system font with precise letter-spacing
- Dark mode as default (OLED-optimized true black)
- Premium interactions with spring animations and haptic feedback

## Project Structure

### Key Directories
```
src/
├── components/      # React components
├── hooks/           # Custom React hooks
├── styles/          # CSS design system (index.css)
└── utils/           # Utility functions
api/                 # Vercel serverless functions
├── kevin-improvements/  # Archived improvement drafts
public/              # Static assets
```

### Core Components

| Component | Purpose | Location |
|-----------|---------|----------|
| `App.jsx` | Main app, navigation state | `src/App.jsx` |
| `FeedView.jsx` | Main feed with search, filters, daily briefing | `src/components/FeedView.jsx` |
| `ArticleView.jsx` | Reading view with summaries, progress tracking | `src/components/ArticleView.jsx` |
| `ArticleCard.jsx` | Article list items with premium hover effects | `src/components/ArticleCard.jsx` |
| `BottomNav.jsx` | Tab bar with animated indicator | `src/components/BottomNav.jsx` |
| `Header.jsx` | Collapsing nav with glass morphism | `src/components/Header.jsx` |
| `DiscoverFeeds.jsx` | AI-powered feed recommendations | `src/components/DiscoverFeeds.jsx` |
| `SummaryCard.jsx` | AI summary display | `src/components/SummaryCard.jsx` |
| `DailyBriefing.jsx` | "Catch up" AI briefing feature | `src/components/DailyBriefing.jsx` |
| `AddFeedSheet.jsx` | Bottom sheet for adding feeds | `src/components/AddFeedSheet.jsx` |
| `ClipUrl.jsx` | Save any URL feature | `src/components/ClipUrl.jsx` |
| `SearchBar.jsx` | Article search | `src/components/SearchBar.jsx` |
| `FeedSidebar.jsx` | Feed filtering sidebar | `src/components/FeedSidebar.jsx` |

### Key Hooks
- `useDatabase.js` - IndexedDB operations (feeds, articles, settings)
- `useFeedSync.js` - RSS feed syncing
- `useAI.js` - AI integration (tags: AVAILABLE_TAGS)
- `useSummary.js` - Article summarization
- `useSearch.js` - Article search with debouncing
- `useReadingStats.js` - Reading statistics tracking

### API Endpoints (Vercel Serverless)
- `/api/summarize.js` - Article summarization
- `/api/scrape.js` - URL scraping
- `/api/suggestions.js` - AI feed recommendations
- `/api/quick-save.js` - Quick URL saving
- `/api/briefing.js` - Daily briefing generation
- `/api/tag.js` - Article tagging
- `/api/tts.js` - Text-to-speech

## Design System (src/styles/index.css)

### CSS Custom Properties
```css
/* Background hierarchy */
--color-background: #000000;           /* True black */
--color-background-secondary: #0C0C0C;
--color-background-tertiary: #161616;
--color-background-elevated: #1C1C1E;

/* Text hierarchy */
--color-label: #F5F5F7;                /* Primary text */
--color-label-secondary: #86868B;
--color-label-tertiary: #6E6E73;
--color-label-quaternary: #48484A;

/* Accent */
--color-tint: #0A84FF;                 /* Apple blue */
```

### Typography Classes
- `.text-large-title` - 34px, page titles
- `.text-title1` - 28px, section headers
- `.text-title2` - 22px, subsection headers
- `.text-title3` - 20px, component titles
- `.text-headline` - 17px, bold body
- `.text-body` - 17px, standard
- `.text-subhead` - 15px, secondary
- `.text-footnote` - 13px, tertiary
- `.text-caption` - 12px, timestamps
- `.text-caption-caps` - 11px, uppercase labels

### Component Classes
- `.navbar`, `.tabbar` - Navigation
- `.button-primary`, `.button-secondary`, `.button-ghost` - Buttons
- `.card`, `.list-group`, `.list-item` - Lists
- `.sheet`, `.sheet-handle` - Bottom sheets
- `.textfield` - Inputs
- `.reading-content` - Long-form typography

### Animation Utilities (src/utils/animations.js)
- `springSnappy` - Quick interactions
- `springTactile` - Button feedback
- `springGentle` - Smooth transitions
- `triggerHaptic('light'|'medium'|'success'|'selection')` - Haptic feedback

## Current Features
1. **RSS Feed Management** - Add, sync, delete feeds
2. **Article Reading** - Clean reader with progress tracking
3. **AI Summaries** - Concise/detailed/key points styles
4. **Daily Briefing** - "Catch up" feature for AI-generated overview
5. **Feed Discovery** - AI-powered recommendations based on reading history
6. **Search** - Full-text article search
7. **Tag Filtering** - Filter by AI-assigned categories
8. **Save for Later** - Bookmark articles
9. **Clip URL** - Save any webpage
10. **Keyboard Shortcuts** - Power user navigation
11. **Reading Statistics** - Track reading habits

## Recent Updates (January 2026)

### Session: Design Overhaul

**Completed:**
1. **Kevin Logo Redesign** (`src/components/KevinLogo.jsx`)
   - Dense K monogram with integrated signal/broadcast aesthetic
   - Inspired by Apple Watch, Vision Pro, AirPods branding
   - Two variants: `wordmark` (icon + text) and `icon` (monogram only)
   - Premium spring animations and haptic feedback

2. **Pull-to-Refresh** 
   - New hook: `src/hooks/usePullToRefresh.js`
   - New component: `src/components/PullToRefreshIndicator.jsx`
   - iOS-style rubber-band physics with haptic feedback at threshold
   - Integrated into FeedView

3. **View Density Options** (`src/components/ArticleCard.jsx`)
   - `comfortable`: Full card with description, 88x88 thumbnail
   - `compact`: Tighter layout, no description, 60x60 thumbnail
   - Toggle button in FeedView header
   - Skeleton loader also supports density

4. **Animation System Upgrade** (`src/utils/animations.js`)
   - Expanded spring presets: springTactile, springMicro, springHeavy, springRubberBand
   - New ease curves: easeIOS, easeQuick
   - Complex animation presets: pageTransition, articleTransition, sheetContent
   - Enhanced haptic feedback patterns

5. **View Transitions**
   - ArticleView: iOS-style slide-in from right with spring physics
   - FeedView: Smooth fade transitions
   - Proper AnimatePresence handling

---

## Version 1.0 Complete (January 2026)

### Final Session Updates

**1. Kevin Logo v4** (`src/components/KevinLogo.jsx`)
- Heavy block typography inspired by Marvel, LEGO, Netflix
- K stem: 6px stroke, arms: 5px stroke, signal arcs: 4px
- Font weight 900, letter-spacing -0.07em
- Hero variant for welcome screen at 160px

**2. Welcome Page Redesign** (`src/components/FeedView.jsx`)
- Uses KevinLogoHero as hero moment
- "Get Started" CTA with Apple-style button
- Subtle hint text below
- No RSS icon - pure brand moment

**3. Contextual Greeting Header** (`src/components/Header.jsx`)
- Replaced generic "Today" with time-aware greeting:
  - "Good morning" (5am–12pm)
  - "Good afternoon" (12pm–5pm)
  - "Good evening" (5pm–9pm)
  - "Tonight" (9pm–5am)
- Layout: Greeting (34px bold) → Date · Article count (inline, secondary)
- No animation - static, confident typography
- Scrolled header also shows greeting

**4. Sidebar Polish** (`src/components/FeedSidebar.jsx`, `src/styles/index.css`)
- Added `.ios-badge`, `.ios-list-item`, `.ios-list-group` CSS components
- Proper badge sizing (22px height, 13px font)
- Title truncation with `min-width: 0`
- SF Pro Text 15px for feed titles

**5. Audio Overview Animations** (`src/components/DailyBriefing.jsx`)
- AudioEqualizer component - 5 dancing bars when playing
- Pulsing glow radiating from play button
- Waveform background in content area during playback
- Smooth stop button entrance/exit

**6. Hero Images on Articles** (`src/components/ArticleView.jsx`)
- Prominent presentation with deep shadow
- Subtle gradient overlay for depth
- Scale animation (1.05 → 1) on load
- Content images have hover effects

### Brand Guidelines - LOCKED IN

**Typography:**
- SF Pro Display for titles (bold 700, tight tracking -0.032em)
- SF Pro Text for body (regular 400, -0.016em)
- Heavy wordmark: weight 900, -0.07em tracking

**Color:**
- True black background (#000000)
- Apple blue accent (#0A84FF)
- Warm off-white text (#F5F5F7)

**Interactions:**
- Spring physics for tactile feedback
- Haptic feedback on key interactions
- No bouncy/epilepsy-coded animations
- Confidence through restraint

**Logo:**
- K monogram with signal arcs
- Heavy strokes (5-6px at 32px size)
- Marvel/LEGO density inspiration

---

## Version 1.5 Roadmap

### Priority 1: Core Features

**1. "For You" Smart Feed**
Location: New component `src/components/ForYouSection.jsx`

Implementation:
- Use existing AI tags from `useAI.js` (AVAILABLE_TAGS)
- Track reading patterns in IndexedDB (add `readingHistory` table)
- Score articles by: tag match to history, recency, source diversity
- Show below greeting: "For You" section with top 5-7 articles
- Horizontal scroll cards or condensed list

Database additions:
```js
// In useDatabase.js
readingHistory: '++id, articleId, tagId, feedId, readAt, duration'
```

API: May need `/api/personalize.js` for server-side scoring if complex

**2. Cross-Article Insights**
Location: Enhance `src/components/DailyBriefing.jsx` or new `src/components/WeeklyInsights.jsx`

Implementation:
- New briefing style: "themes" 
- Group articles by AI-detected topics
- Synthesize: "This week in AI: 12 articles covered similar themes..."
- Show connections between sources
- API: Enhance `/api/briefing.js` with `style: 'themes'`

Prompt strategy:
```
Given these articles from the past week, identify:
1. Common themes (3-5 max)
2. Contrasting viewpoints
3. Key developments
4. What this means for the reader
```

**3. Highlight + Annotate**
Location: New hook `src/hooks/useHighlights.js`, enhance `ArticleView.jsx`

Implementation:
- Text selection handler in reading view
- Popup menu: Highlight | Note | Copy
- Store in IndexedDB: `highlights: '++id, articleId, text, note, color, position, createdAt'`
- Highlight colors: Yellow (default), Blue, Green, Pink
- Show highlights count on ArticleCard
- Export to markdown button in article footer

UI:
- Highlighted text shows with background color
- Tap highlight to edit/delete
- Highlights panel in article (slide-in from right)

**4. Gesture Navigation**
Location: Enhance `src/components/ArticleCard.jsx`

Implementation:
- Use Framer Motion drag gestures
- Swipe right (>80px): Save article, show bookmark icon
- Swipe left (>80px): Mark as read, fade out
- Visual feedback: Icons peek from sides during swipe
- Haptic at threshold
- Spring back if cancelled

```jsx
<motion.div
  drag="x"
  dragConstraints={{ left: 0, right: 0 }}
  onDragEnd={(e, info) => {
    if (info.offset.x > 80) handleSave();
    if (info.offset.x < -80) handleMarkRead();
  }}
>
```

### Priority 2: Growth Features

**5. Newsletter Ingestion**
Technical approach options:

Option A: Email forwarding
- User gets unique kevin email: `user123@inbox.kevin.cheap`
- Mailgun/Sendgrid inbound webhook
- Parse email HTML → article format
- Store as special feed type

Option B: Gmail/Outlook integration
- OAuth connection
- Scan for newsletter senders
- Import on schedule
- Privacy concerns - may not be worth it

Option C: RSS-to-email services
- Recommend kill-the-newsletter.com or similar
- One-click setup flow in app
- Less seamless but simpler

Recommendation: Start with Option A (email forwarding) for v1.5

**6. iOS Widget**
Requires: React Native or native Swift widget
Scope: Out of scope for web-only, but design the data flow

Widget types:
- Small: Greeting + unread count
- Medium: Greeting + top 3 articles
- Large: Full "For You" preview

API needed: `/api/widget-data.js` returns minimal payload

### Technical Debt for 1.5

- [ ] Code splitting (bundle is 641kb)
- [ ] Service worker for offline articles
- [ ] Better error boundaries
- [ ] Rate limiting on AI endpoints
- [ ] Analytics (simple, privacy-respecting)

---

## Development Commands

```bash
npm run dev      # Local development
npm run build    # Production build
vercel --prod    # Deploy to production
```

## Deployment

- **Domain:** kevin.cheap (Vercel)
- **Environment:** Vercel serverless
- **API Keys:** Stored in Vercel environment variables

---

*Last updated: January 2026 - v1.0 complete, v1.5 roadmap defined*