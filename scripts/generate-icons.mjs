/**
 * generate-icons.mjs
 * Converts build/icon.svg -> build/icon.png, build/icon.ico and build/installer-icon.ico
 *
 * Usage: node scripts/generate-icons.mjs
 * Requires: @resvg/resvg-js, png-to-ico
 */

import { Resvg } from '@resvg/resvg-js'
import { spawnSync } from 'child_process'
import pngToIco from 'png-to-ico'
import { mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const buildDir = join(root, 'build')

mkdirSync(buildDir, { recursive: true })

const svgPath = join(buildDir, 'icon.svg')
const svgData = readFileSync(svgPath, 'utf-8')

const resvg = new Resvg(svgData, {
  fitTo: { mode: 'width', value: 1024 },
  font: { loadSystemFonts: false },
})

const pngData = resvg.render().asPng()
const pngPath = join(buildDir, 'icon.png')
writeFileSync(pngPath, pngData)
console.log(`Generated build/icon.png (${pngData.length} bytes)`)

const icoPath = join(buildDir, 'icon.ico')
const installerIcoPath = join(buildDir, 'installer-icon.ico')
const pythonResult = spawnSync(
  'python',
  ['-'],
  {
    stdio: 'pipe',
    encoding: 'utf-8',
    input: [
      'from PIL import Image',
      `img = Image.open(r"${pngPath.replace(/\\/g, '\\\\')}").convert("RGBA")`,
      `img.save(r"${icoPath.replace(/\\/g, '\\\\')}", format="ICO", sizes=[(16,16),(24,24),(32,32),(48,48),(64,64),(128,128),(256,256)])`,
      `img.save(r"${installerIcoPath.replace(/\\/g, '\\\\')}", format="ICO", sizes=[(16,16),(24,24),(32,32),(48,48)])`,
      "print('ok')",
    ].join('\n'),
  }
)

if (pythonResult.status === 0) {
  console.log('Generated build/icon.ico with Pillow')
  console.log('Generated build/installer-icon.ico with Pillow')
} else {
  const icoData = await pngToIco([pngPath])
  writeFileSync(icoPath, icoData)
  console.log(`Generated build/icon.ico with png-to-ico (${icoData.length} bytes)`)
}

console.log('Icon generation complete.')
