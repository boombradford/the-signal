import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

// Read the SVG favicon
const svgBuffer = readFileSync(join(publicDir, 'favicon.svg'));

// Icon sizes to generate
const icons = [
  { name: 'pwa-192x192.png', size: 192 },
  { name: 'pwa-512x512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'og-image.png', size: 1200, height: 630 } // OG image is rectangular
];

async function generateIcons() {
  console.log('Generating PWA icons from favicon.svg...\n');

  for (const icon of icons) {
    try {
      const width = icon.size;
      const height = icon.height || icon.size;

      if (icon.name === 'og-image.png') {
        // For OG image, create a branded social card
        const svgWithBackground = `
          <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#007AFF"/>
                <stop offset="100%" style="stop-color:#5856D6"/>
              </linearGradient>
            </defs>
            <rect width="${width}" height="${height}" fill="url(#bg)"/>
            <g transform="translate(${width/2 - 100}, ${height/2 - 120})">
              <rect width="200" height="200" rx="44" fill="rgba(255,255,255,0.2)"/>
              <g fill="none" stroke="white" stroke-width="12" stroke-linecap="round" transform="translate(50, 50)">
                <path d="M0 55 a50 50 0 0 1 50 50"/>
                <path d="M0 5 a100 100 0 0 1 100 100"/>
                <circle cx="6" cy="100" r="10" fill="white"/>
              </g>
            </g>
            <text x="${width/2}" y="${height/2 + 130}" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="64" font-weight="700" fill="white">The Signal</text>
            <text x="${width/2}" y="${height/2 + 180}" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="28" fill="rgba(255,255,255,0.8)">AI-Powered News Reader</text>
          </svg>
        `;
        await sharp(Buffer.from(svgWithBackground))
          .png()
          .toFile(join(publicDir, icon.name));
      } else {
        // For app icons, resize the SVG favicon
        await sharp(svgBuffer)
          .resize(width, height)
          .png()
          .toFile(join(publicDir, icon.name));
      }

      console.log(`✓ Generated ${icon.name} (${width}x${height})`);
    } catch (error) {
      console.error(`✗ Failed to generate ${icon.name}:`, error.message);
    }
  }

  console.log('\nDone! Icons saved to public/');
}

generateIcons();
