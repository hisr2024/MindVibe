/**
 * Generate Google Play Store assets from HTML designs.
 *
 * Usage:
 *   npx playwright install chromium   # one-time setup
 *   node store-assets/generate-assets.mjs
 *
 * Output: store-assets/output/
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
import { resolve, dirname } from 'path';
import { mkdirSync } from 'fs';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outputDir = resolve(__dirname, 'output');
mkdirSync(outputDir, { recursive: true });

const assets = [
  // App Icon — 512x512
  {
    name: 'app-icon-512x512.png',
    file: 'app-icon.html',
    width: 512,
    height: 512,
  },
  // Feature Graphic — 1024x500
  {
    name: 'feature-graphic-1024x500.png',
    file: 'feature-graphic.html',
    width: 1024,
    height: 500,
  },
  // Phone Screenshots — 1080x1920
  {
    name: 'screenshot-01-welcome.png',
    file: 'screenshots/01-welcome.html',
    width: 1080,
    height: 1920,
  },
  {
    name: 'screenshot-02-sakha-chat.png',
    file: 'screenshots/02-sakha-chat.html',
    width: 1080,
    height: 1920,
  },
  {
    name: 'screenshot-03-gita-verse.png',
    file: 'screenshots/03-gita-verse.html',
    width: 1080,
    height: 1920,
  },
  {
    name: 'screenshot-04-mood-tracking.png',
    file: 'screenshots/04-mood-tracking.html',
    width: 1080,
    height: 1920,
  },
  {
    name: 'screenshot-05-sadhana.png',
    file: 'screenshots/05-sadhana.html',
    width: 1080,
    height: 1920,
  },
  {
    name: 'screenshot-06-journeys.png',
    file: 'screenshots/06-journeys.html',
    width: 1080,
    height: 1920,
  },
];

async function generate() {
  console.log('Launching browser...');
  const browser = await chromium.launch();

  for (const asset of assets) {
    const filePath = resolve(__dirname, asset.file);
    const outputPath = resolve(outputDir, asset.name);

    console.log(`Generating ${asset.name} (${asset.width}x${asset.height})...`);

    const page = await browser.newPage({
      viewport: { width: asset.width, height: asset.height },
      deviceScaleFactor: 1,
    });

    await page.goto(`file://${filePath}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: outputPath,
      type: 'png',
      clip: { x: 0, y: 0, width: asset.width, height: asset.height },
    });

    await page.close();
    console.log(`  ✓ Saved: ${outputPath}`);
  }

  await browser.close();

  console.log('\n=== All assets generated! ===');
  console.log(`Output directory: ${outputDir}`);
  console.log('\nFiles ready to upload to Google Play Console:');
  console.log('  • app-icon-512x512.png        → App Icon');
  console.log('  • feature-graphic-1024x500.png → Feature Graphic');
  console.log('  • screenshot-01-*.png          → Phone Screenshots (upload all 6)');
  console.log('\nFor tablet screenshots, these phone screenshots will work as placeholders.');
  console.log('For best results, create tablet-specific layouts at 1200x1920 (7") and 1920x1200 (10").');
}

generate().catch(console.error);
