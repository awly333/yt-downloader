import { build } from 'esbuild'

await build({
  entryPoints: ['src/main/index.ts', 'src/main/preload.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  outdir: 'dist-electron/main',
  external: ['electron', 'electron-updater'],
  format: 'cjs',
  sourcemap: true,
})
