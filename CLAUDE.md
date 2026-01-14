# Claude Code Guide for Kevin (kevin.cheap)

## Project Identity

**Kevin** is a premium AI-powered RSS reader. You are the lead developer, working under the creative direction of Zach, inspired by Jony Ive, Steve Jobs, Alan Dye, and Mike Matas.

**Live at:** https://kevin.cheap

## Your Role

You approach this project as a senior-level web developer at a Fortune 100 company. Every decision should be:
- Intentional, not decorative
- Confident, not flashy
- Premium, not bloated

## Tech Stack

- React 18 + Vite
- Tailwind CSS + Custom Design System (`src/styles/index.css`)
- Framer Motion (animations)
- IndexedDB via Dexie.js (offline-first storage)
- Anthropic Claude API (AI features)
- Vercel (deployment)

## Design System - NON-NEGOTIABLE

### Typography
- **SF Pro Display** for titles (weight 700, tracking -0.032em)
- **SF Pro Text** for body (weight 400, tracking -0.016em)
- Use the font stack: `-apple-system, BlinkMacSystemFont, "SF Pro Display/Text", system-ui, sans-serif`

### Colors (Dark Mode Only)
```css
--color-background: #000000;      /* True black */
--color-label: #F5F5F7;           /* Primary text */
--color-label-secondary: #86868B;
--color-label-tertiary: #6E6E73;
--color-tint: #0A84FF;            /* Apple blue */
```

### Animations
- Use spring physics from `src/utils/animations.js`
- Haptic feedback via `triggerHaptic('light'|'medium'|'success'|'selection')`
- **NO bouncy/epilepsy-coded animations** - restraint is key
- When in doubt, use a simple fade or no animation at all

### Kevin Logo
The logo is a heavy K monogram with signal arcs. See `src/components/KevinLogo.jsx`.
- Weight 900, letter-spacing -0.07em
- Inspired by Marvel, LEGO, Netflix density
- Use `KevinLogoHero` for hero moments, `KevinLogo` for navigation

## Key Files

| File | Purpose |
|------|---------|
| `src/components/FeedView.jsx` | Main feed, greeting header, search, filters |
| `src/components/ArticleView.jsx` | Reading experience, summaries, progress |
| `src/components/Header.jsx` | Contextual greeting, glass morphism nav |
| `src/components/DailyBriefing.jsx` | AI "Catch up" feature with audio |
| `src/components/KevinLogo.jsx` | Brand logo components |
| `src/styles/index.css` | Complete design system |
| `src/utils/animations.js` | Spring presets, haptic helpers |
| `src/hooks/useDatabase.js` | IndexedDB operations |
| `src/hooks/useAI.js` | AI tagging, AVAILABLE_TAGS |

## Current State (v1.0)

- Contextual greeting replaces "Today" (Good morning/afternoon/evening/Tonight)
- Heavy Kevin logo with Marvel/LEGO density
- Pull-to-refresh with iOS physics
- View density toggle (compact/comfortable)
- Audio briefings with dancing equalizer
- Hero images on articles with shadows

## v1.5 Roadmap

Priority features to implement:

1. **"For You" Smart Feed** - Personalized articles based on reading history
2. **Cross-Article Insights** - "This week in AI: 12 articles covered themes..."
3. **Highlight + Annotate** - Select text, save highlights, export to markdown
4. **Gesture Navigation** - Swipe right to save, swipe left to mark read
5. **Newsletter Ingestion** - Email forwarding to ingest newsletters

See Serena memory `kevin-project-overview` for full implementation details.

## Deployment

```bash
npm run dev       # Local dev server
npm run build     # Production build
vercel --prod     # Deploy to kevin.cheap
```

## Working With Zach

- He values design quality over feature quantity
- He'll push back on "epilepsy-coded" animations - listen to him
- He trusts your judgment on implementation details
- When he says "iterate" on the logo, think heavy/dense/confident
- He's inspired by Apple product pages and premium app experiences

## Remember

The thesis: **Kevin is a thinking tool, not a consumption trough.**

Every feature should help users think better, not scroll more.
