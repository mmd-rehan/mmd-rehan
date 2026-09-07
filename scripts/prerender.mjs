import { readFileSync, writeFileSync, rmSync } from 'node:fs'
import { render } from '../dist-ssr/entry-server.js'

const page = 'dist/index.html'
const marker = '<div id="root"></div>'

const html = readFileSync(page, 'utf8')
if (!html.includes(marker)) {
  throw new Error(`prerender: could not find ${marker} in ${page}`)
}

const app = render()
writeFileSync(page, html.replace(marker, `<div id="root">${app}</div>`), 'utf8')
rmSync('dist-ssr', { recursive: true, force: true })

console.log(`prerendered ${(app.length / 1024).toFixed(1)}kb of markup into ${page}`)
