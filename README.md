# The Signal

An AI-powered RSS news reader with iOS-inspired design.

![The Signal](https://img.shields.io/badge/The%20Signal-AI%20News%20Reader-blue)

## Features

- **AI Summaries** - Get quick, accurate summaries of articles in multiple styles (concise, detailed, or key points)
- **iOS-Inspired Design** - Clean, modern interface with smooth animations and intuitive navigation
- **WCAG AA Accessible** - Full accessibility compliance with proper contrast ratios and screen reader support
- **Offline-First** - All data stored locally in IndexedDB for fast, reliable access
- **Dark Mode** - Automatic dark/light mode based on system preferences
- **Keyboard Navigation** - Full keyboard support for power users

## Tech Stack

- **React 18** - UI framework
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Dexie.js** - IndexedDB wrapper
- **Vite** - Build tool
- **Anthropic Claude API** - AI summaries

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Anthropic API key (for AI summaries)

### Installation

```bash
# Clone the repository
git clone https://github.com/boombradford/the-signal.git
cd the-signal

# Install dependencies
npm install

# Start development server
npm run dev
```

### Configuration

1. Open the app in your browser
2. Go to Settings
3. Add your Anthropic API key (get one at [console.anthropic.com](https://console.anthropic.com))

## Deployment

### Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/boombradford/the-signal)

Or deploy manually:

```bash
npm install -g vercel
vercel
```

### Manual Build

```bash
npm run build
# Output will be in the dist/ folder
```

## Usage

1. **Add Feeds** - Click the + button to add RSS feed URLs
2. **Read Articles** - Tap any article to open the reading view
3. **Generate Summaries** - Click "Generate Summary" for AI-powered summaries
4. **Save for Later** - Bookmark articles to read later
5. **Organize** - Use categories to organize your feeds

## License

MIT

---

Built with Claude Code
