// Rasterizes assets/icon.svg into the PNG icons used by every client.
// Usage: npm install --no-save sharp && node scripts/build-icons.mjs
import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'node:fs';

const svg = readFileSync(new URL('../assets/icon.svg', import.meta.url));

// All current icon slots are 512x512 (browsers downscale per the manifest map).
const targets = [
  'chrome/prod/imgs/logo.png',
  'chrome/prod/imgs/logo2.png',
  'chrome/prod/imgs/logo3.png',
  'firefox/prod/imgs/logo.png',
  'firefox/prod/imgs/logo2.png',
  'firefox/prod/imgs/logo3.png',
  'microsoft_rewards_app/assets/images/auto_search.png',
];

const png = await sharp(svg, { density: 288 }) // supersample, then downscale for crisp edges
  .resize(512, 512)
  .png()
  .toBuffer();

for (const t of targets) writeFileSync(t, png);
console.log(`wrote ${targets.length} icons`);
