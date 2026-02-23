/**
 * Generate a PNG OG image from the SVG source.
 *
 * Usage: node scripts/generate-og-image.mjs
 *
 * SVG OG images are not rendered by social platforms (Twitter, Facebook,
 * LinkedIn, Discord, Slack). This script converts the existing SVG to a
 * 1200x630 PNG at high quality for maximum compatibility.
 */

import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..')

const svgPath = resolve(rootDir, 'public/og-image.svg')
const pngPath = resolve(rootDir, 'public/og-image.png')

const svgBuffer = readFileSync(svgPath)

await sharp(svgBuffer)
  .resize(1200, 630)
  .png({ quality: 95, compressionLevel: 6 })
  .toFile(pngPath)

console.log(`Generated ${pngPath} (1200x630 PNG)`)
