/**
 * Backt den Production-Build zu einer einzigen HTML-Datei zusammen:
 * CSS, JS und Schriften wandern inline bzw. als data:-URI hinein.
 *
 * Zweck: eine Datei, die sich ohne Server öffnen und verschicken lässt –
 * praktisch, um nach jedem Schritt schnell drüberzuschauen.
 *
 *   node scripts/build-standalone.mjs [ziel.html]
 *
 * Erwartet einen fertigen `npm run build` in dist/.
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const DIST = 'dist'
const out = process.argv[2] ?? 'dist/antipode-standalone.html'

const assets = readdirSync(join(DIST, 'assets'))
const cssFile = assets.find((f) => f.endsWith('.css'))
const jsFiles = assets.filter((f) => f.endsWith('.js'))

if (!cssFile) throw new Error('Kein CSS-Bundle in dist/assets gefunden.')
if (jsFiles.length !== 1) {
  throw new Error(
    `Erwartet genau ein JS-Bundle, gefunden: ${jsFiles.length}. ` +
      'Code-Splitting müsste hier erst eingebaut werden.',
  )
}

let css = readFileSync(join(DIST, 'assets', cssFile), 'utf8')
const js = readFileSync(join(DIST, 'assets', jsFiles[0]), 'utf8')

// Schriften als data:-URI einbetten, damit die Datei ohne /fonts/ auskommt.
let embedded = 0
css = css.replace(/url\(\s*["']?\/fonts\/([^"')]+)["']?\s*\)/g, (_m, file) => {
  const b64 = readFileSync(join(DIST, 'fonts', file)).toString('base64')
  embedded++
  return `url(data:font/woff2;base64,${b64})`
})

if (embedded === 0) throw new Error('Keine Schrift-URLs im CSS gefunden – Pfade geprüft?')

// `</script>` im Bundle würde den umschließenden Tag vorzeitig schließen.
const safeJs = js.replace(/<\/script/gi, '<\\/script')

const html = `<meta charset="utf-8" />
<title>Was ist unter mir?</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
<style>
${css}
</style>
<div id="root"></div>
<script type="module">
${safeJs}
</script>
`

writeFileSync(out, html)

const kb = (n) => `${(n / 1024).toFixed(1)} kB`
console.log(`${out}  ${kb(Buffer.byteLength(html))}  (${embedded} Schriften eingebettet)`)
