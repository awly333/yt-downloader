/**
 * generate-icons.mjs
 * Converts build/icon.svg → build/icon.png (1024×1024) and build/icon.ico
 *
 * Usage: node scripts/generate-icons.mjs
 * Requires: @resvg/resvg-js, png-to-ico  (dev dependencies)
 */

import { Resvg } from '@resvg/resvg-js'
import pngToIco from 'png-to-ico'
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const buildDir = join(root, 'build')

mkdirSync(buildDir, { recursive: true })

// ─── 1. Render SVG → 1024×1024 PNG ──────────────────────────────────────────
const svgPath = join(buildDir, 'icon.svg')
const svgData = readFileSync(svgPath, 'utf-8')

const resvg = new Resvg(svgData, {
  fitTo: { mode: 'width', value: 1024 },
  font: { loadSystemFonts: false },
})

const pngData = resvg.render().asPng()
const pngPath = join(buildDir, 'icon.png')
writeFileSync(pngPath, pngData)
console.log(`✓ build/icon.png  (${pngData.length} bytes)`)

// ─── 2. PNG → ICO (multi-size: 16, 32, 48, 64, 128, 256) ────────────────────
// Render SVG at each ICO size for crisp icons at every scale
const icoSizes = [16, 32, 48, 64, 128, 256]
const pngBuffers = icoSizes.map((size) => {
  const r = new Resvg(svgData, {
    fitTo: { mode: 'width', value: size },
    font: { loadSystemFonts: false },
  })
  return r.render().asPng()
})

const icoData = await pngToIco(pngBuffers)
const icoPath = join(buildDir, 'icon.ico')
writeFileSync(icoPath, icoData)
console.log(`✓ build/icon.ico  (${icoData.length} bytes, sizes: ${icoSizes.join(', ')}px)`)

console.log('\nIcon generation complete.')
