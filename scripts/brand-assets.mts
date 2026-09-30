// Builds every brand file the sites serve, from the Family Kit marks (src/lib/marks.ts):
//   public/<site>/  favicon.svg, favicon.ico (16/32/48), apple-touch-icon.png (180),
//                   icon-192.png, icon-512-maskable.png, site.webmanifest, og.png (1200×630)
//                   (home, engine, space; Playroom keeps its own icons and link card,
//                   and gets a manifest)
//   public/home/logo.png                   the organisation logo for search engines
//   public/shared/press/<brand>.zip        a press kit per brand
// Layouts follow the kit's boards: FoSmall, EnSmall, SpFavicon (icons) and FoOG,
// EnOG, SpOG (link cards; Space's shows its mark until the app's screenshots exist).
//   node scripts/brand-assets.mts           (needs Google Chrome, ImageMagick and zip)
import { execFileSync } from 'node:child_process'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { chromium, type Page } from 'playwright-core'
import { bitmapSvg, markSvg, type MarkKind } from '../src/lib/marks.ts'

const ROOT = path.resolve(import.meta.dirname, '..')
const PUB = path.join(ROOT, 'public')
const FONTS = path.join(PUB, 'shared', 'fonts')
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'pixl-brand-'))

const CSS = `
@font-face { font-family: 'Space Grotesk'; font-weight: 300 700; src: url('file://${FONTS}/space-grotesk.woff2') format('woff2'); }
@font-face { font-family: 'Manrope'; font-weight: 200 800; src: url('file://${FONTS}/manrope.woff2') format('woff2'); }
@font-face { font-family: 'JetBrains Mono'; font-weight: 100 800; src: url('file://${FONTS}/jetbrains-mono.woff2') format('woff2'); }
html, body { margin: 0; background: transparent; }
.b-wm { font-family: 'Space Grotesk', sans-serif; font-weight: 700; letter-spacing: .28em; text-transform: uppercase; color: #ebe9f3; white-space: nowrap; line-height: 1; }
.b-wm em { font-style: normal; color: #9d8bea; } .b-wm.sp em { color: #93a4ff; } .b-wm.en em { color: #b8b5c7; }
.b-disp { font-family: 'Space Grotesk', sans-serif; font-weight: 600; letter-spacing: -.025em; line-height: 1.02; margin: 0; }
.b-body { font-family: 'Manrope', sans-serif; line-height: 1.55; }
.b-mono { font-family: 'JetBrains Mono', monospace; }
.b-glow { position: absolute; border-radius: 50%; filter: blur(80px); }
.frame { position: relative; overflow: hidden; }
`

let page: Page
/** Renders `body` into a w×h PNG at `out` (transparent unless the markup paints a background). */
async function png(body: string, w: number, h: number, out: string, scale = 1): Promise<void> {
  const file = path.join(TMP, `${path.basename(out)}.html`)
  fs.writeFileSync(file, `<!doctype html><meta charset="utf-8"><style>${CSS}</style><div class="frame" style="width:${w}px;height:${h}px">${body}</div>`)
  await page.setViewportSize({ width: w, height: h })
  await page.goto(`file://${file}`)
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(50)
  fs.mkdirSync(path.dirname(out), { recursive: true })
  await page.locator('.frame').screenshot({ path: out, omitBackground: true, scale: scale === 1 ? 'css' : 'device' })
}

const center = (inner: string, bg = 'transparent'): string =>
  `<div style="position:absolute;inset:0;display:grid;place-items:center;background:${bg}">${inner}</div>`

/** The kit's app-icon tile: a deep gradient with a glow from below. */
function tile(kind: 'engine' | 'space', size: number, markPct: number, id: string): string {
  const g = kind === 'engine' ? ['#231b40', '#0c0a16', '#050409', 'rgba(123,104,216,.5)'] : ['#18204a', '#0a0c18', '#040509', 'rgba(116,134,240,.5)']
  const m = Math.round(size * markPct)
  return `<div style="position:absolute;inset:0;background:radial-gradient(120% 90% at 30% 16%, ${g[0]} 0%, ${g[1]} 46%, ${g[2]} 100%)"></div>
<div style="position:absolute;inset:0;background:radial-gradient(70% 45% at 50% 108%, ${g[3]}, transparent 70%)"></div>
${center(markSvg({ kind, size: m, pixels: false, glow: true, id, label: '' }))}`
}

/** Foundation's P at whole pixels per cell, centred on black. */
const pTile = (size: number, cell: number, ink = '#ebe9f3', bg = '#000'): string => center(bitmapSvg({ text: 'P', cell, ink, label: '' }), bg)

const MANIFEST = (name: string, short: string, desc: string): string =>
  JSON.stringify(
    {
      name,
      short_name: short,
      description: desc,
      start_url: '/',
      scope: '/',
      display: 'browser',
      background_color: '#000000',
      theme_color: '#000000',
      icons: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' }
      ]
    },
    null,
    2
  ) + '\n'

async function ico(dir: string, draw: (size: number) => string): Promise<void> {
  const parts: string[] = []
  for (const s of [16, 32, 48]) {
    const f = path.join(TMP, `${path.basename(dir)}-fav-${s}.png`)
    await png(draw(s), s, s, f)
    parts.push(f)
  }
  execFileSync('magick', [...parts, path.join(dir, 'favicon.ico')])
}

// ── the sites' icons ──────────────────────────────────────────────────────────
async function homeIcons(): Promise<void> {
  const dir = path.join(PUB, 'home')
  fs.mkdirSync(dir, { recursive: true })
  // Dark tabs get the white P, light ones the black: the kit's two favicon grounds.
  const svg = bitmapSvg({ text: 'P', pad: 1, label: 'PIXL Foundation' }).replace(
    '<g fill="#ebe9f3">',
    '<style>g{fill:#ebe9f3}@media (prefers-color-scheme:light){g{fill:#000}}</style><g fill="#ebe9f3">'
  )
  fs.writeFileSync(path.join(dir, 'favicon.svg'), svg + '\n')
  // 2 px a cell at 16, 4 at 32, 6 at 48: the P always lands on whole pixels.
  await ico(dir, (s) => pTile(s, s / 8))
  await png(pTile(180, 16), 180, 180, path.join(dir, 'apple-touch-icon.png'))
  await png(pTile(192, 16), 192, 192, path.join(dir, 'icon-192.png'))
  await png(pTile(512, 32), 512, 512, path.join(dir, 'icon-512-maskable.png'))
  fs.writeFileSync(path.join(dir, 'site.webmanifest'), MANIFEST('PIXL Foundation', 'PIXL', 'Imaging software, from the pixel up.'))
  // For search engines: the word on white, where logos are shown.
  await png(center(bitmapSvg({ cell: 20, ink: '#000000', label: '' }), '#ffffff'), 512, 512, path.join(dir, 'logo.png'))
}

async function productIcons(kind: 'engine' | 'space', name: string, desc: string): Promise<void> {
  const dir = path.join(PUB, kind)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, 'favicon.svg'), markSvg({ kind, detail: 'small', id: 'f', label: name }) + '\n')
  await ico(dir, (s) => center(markSvg({ kind, detail: 'small', size: s, id: `i${s}`, label: '' })))
  await png(tile(kind, 180, 136 / 180, 't180'), 180, 180, path.join(dir, 'apple-touch-icon.png'))
  await png(tile(kind, 192, 136 / 180, 't192'), 192, 192, path.join(dir, 'icon-192.png'))
  // Maskable: the mark inside the 80 % safe zone.
  await png(tile(kind, 512, 0.62, 't512'), 512, 512, path.join(dir, 'icon-512-maskable.png'))
  fs.writeFileSync(path.join(dir, 'site.webmanifest'), MANIFEST(name, name, desc))
}

// ── link cards (the kit's OG boards) ───────────────────────────────────────────
async function ogCards(): Promise<void> {
  await png(
    `<div style="position:absolute;inset:0;background:#000"></div>
<div style="position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.05) 1px,transparent 1px);background-size:24px 24px;background-position:72px 96px"></div>
<div style="position:absolute;left:0;right:0;bottom:0;height:300px;background:linear-gradient(0deg,#000 50%,transparent)"></div>
<div style="position:absolute;left:72px;top:96px">${bitmapSvg({ cell: 24, label: '' })}</div>
<div style="position:absolute;left:72px;right:72px;bottom:72px;display:flex;align-items:flex-end;justify-content:space-between;gap:40px;color:#ebe9f3">
  <h1 class="b-disp" style="font-size:54px">Imaging software,<br>from the pixel up.</h1>
  <div style="display:flex;flex-direction:column;align-items:flex-end;gap:18px">
    <div style="display:flex;gap:16px">${markSvg({ kind: 'playroom', size: 40, pixels: false, id: 'o1', label: '' })}${markSvg({ kind: 'engine', size: 40, id: 'o2', label: '' })}${markSvg({ kind: 'space', size: 40, id: 'o3', label: '' })}</div>
    <span class="b-mono" style="font-size:15px;color:#8e8aa6">pixlfoundation.com</span>
  </div>
</div>`,
    1200,
    630,
    path.join(PUB, 'home', 'og.png')
  )
  const card = (kind: 'engine' | 'space', title: string, line: string, domain: string, glow: string, bigLeft: number, bigTop: number, bigSize: number): string =>
    `<div style="position:absolute;inset:0;background:#000"></div>
<div class="b-glow" style="width:900px;height:700px;left:450px;top:-80px;background:radial-gradient(circle,${glow},transparent 62%)"></div>
<div style="position:absolute;left:${bigLeft}px;top:${bigTop}px">${markSvg({ kind, size: bigSize, glow: true, id: 'big', label: '' })}</div>
<div style="position:absolute;left:72px;top:72px;bottom:72px;width:560px;display:flex;flex-direction:column;gap:24px;color:#ebe9f3">
  <div style="display:flex;align-items:center;gap:14px">${markSvg({ kind, size: 42, detail: 'small', id: 'sm', label: '' })}${
    kind === 'space' ? '<span class="b-wm sp" style="font-size:15px"><em>SPACE</em> PIXL</span>' : '<span class="b-wm en" style="font-size:15px">PIXL <em>ENGINE</em></span>'
  }</div>
  <span style="flex-grow:1"></span>
  <h1 class="b-disp" style="font-size:62px">${title}</h1>
  <span class="b-body" style="font-size:19px;color:#b8b5c7">${line}</span>
  <span class="b-mono" style="font-size:15px;color:#8e8aa6">${domain}</span>
</div>`
  await png(card('engine', 'One engine.<br>Every pixel.', 'The Rust imaging core under every PIXL app.', 'engine.pixlfoundation.com', 'rgba(106,77,255,.42)', 700, 110, 440), 1200, 630, path.join(PUB, 'engine', 'og.png'))
  await png(
    card('space', 'More space.<br><span style="color:#93a4ff">Same pixels.</span>', 'Make a photo library smaller. Your originals are never touched.', 'space.pixlfoundation.com', 'rgba(116,134,240,.42)', 690, 105, 440),
    1200,
    630,
    path.join(PUB, 'space', 'og.png')
  )
}

// ── press kits ────────────────────────────────────────────────────────────────
const COLOURS = `PIXL colours (sRGB hex)

#EBE9F3  Foundation, and every PIXL word: always this white on dark grounds
#7B68D8  Engine core
#9D8BEA  Pixl Playroom
#93A4FF  Space Pixl
#B8B5C7  The engine's product word (grey)
#000000  Ground
`
const RULES = (brand: string, extra: string): string => `${brand} press kit

Naming: PIXL is always written in capitals and always white. The product word
takes the product's colour (PLAYROOM violet, SPACE blue); the engine's stays grey.
${extra}
Please don't recolour, stretch, rotate, outline or add effects to the marks, and
keep clear space around them of at least a quarter of the mark's width.

The SVGs are the masters; the PNGs are for places that can't take SVG.
Questions: hello@pixlfoundation.com
`

async function pressKit(slug: string, files: Record<string, string | (() => Promise<void>)>): Promise<void> {
  const dir = path.join(TMP, 'press', slug)
  fs.mkdirSync(dir, { recursive: true })
  for (const [name, content] of Object.entries(files)) {
    if (typeof content === 'string') fs.writeFileSync(path.join(dir, name), content)
    else await content()
  }
  const out = path.join(PUB, 'shared', 'press', `${slug}.zip`)
  fs.mkdirSync(path.dirname(out), { recursive: true })
  fs.rmSync(out, { force: true })
  execFileSync('zip', ['-qrX', out, '.'], { cwd: dir })
}

async function markKit(kind: MarkKind, slug: string, name: string, word: string): Promise<void> {
  const dir = path.join(TMP, 'press', slug)
  const files: Record<string, string | (() => Promise<void>)> = { 'colours.txt': COLOURS, 'README.txt': RULES(name, '') }
  for (const detail of ['full', 'small'] as const) {
    for (const tone of ['glass', 'flat'] as const)
      files[`${slug}-mark-${tone}-${detail}.svg`] = markSvg({ kind, tone, detail, size: 480, id: `${tone[0]}${detail[0]}`, label: name }) + '\n'
    for (const [ink, inkName] of [['#ebe9f3', 'white'], ['#000000', 'black']] as const)
      files[`${slug}-mark-mono-${inkName}-${detail}.svg`] = markSvg({ kind, tone: 'mono', detail, ink, size: 480, id: `m${inkName[0]}${detail[0]}`, label: name }) + '\n'
  }
  files['png'] = async () => {
    for (const s of [512, 1024]) await png(markSvg({ kind, size: s, id: `p${s}`, label: '' }), s, s, path.join(dir, `${slug}-mark-glass-${s}.png`))
    await png(markSvg({ kind, size: 1024, tone: 'flat', id: 'pf', label: '' }), 1024, 1024, path.join(dir, `${slug}-mark-flat-1024.png`))
    await png(
      `<div style="position:absolute;inset:0;display:flex;align-items:center;gap:40px;padding:0 48px">${markSvg({ kind, size: 180, id: 'lk', label: '' })}${word}</div>`,
      1100,
      260,
      path.join(dir, `${slug}-lockup-dark-bg.png`),
      2
    )
  }
  await pressKit(slug, files)
}

async function foundationKit(): Promise<void> {
  const dir = path.join(TMP, 'press', 'foundation')
  await pressKit('foundation', {
    'colours.txt': COLOURS,
    'README.txt': RULES(
      'PIXL Foundation',
      'The Foundation mark is the word PIXL drawn on a seven-row pixel grid. Below 60 px\nwide, use the P. Render both at whole pixels per cell so no edge is blurred.\n'
    ),
    'pixl-wordmark-white.svg': bitmapSvg({ cell: 24, label: 'PIXL' }) + '\n',
    'pixl-wordmark-black.svg': bitmapSvg({ cell: 24, ink: '#000000', label: 'PIXL' }) + '\n',
    'pixl-p-white.svg': bitmapSvg({ text: 'P', cell: 24, label: 'PIXL' }) + '\n',
    'pixl-p-black.svg': bitmapSvg({ text: 'P', cell: 24, ink: '#000000', label: 'PIXL' }) + '\n',
    png: async () => {
      await png(bitmapSvg({ cell: 50, label: '' }), 1000, 350, path.join(dir, 'pixl-wordmark-white-1000.png'))
      await png(bitmapSvg({ cell: 50, ink: '#000000', label: '' }), 1000, 350, path.join(dir, 'pixl-wordmark-black-1000.png'))
      await png(
        `<div style="position:absolute;inset:0;display:flex;align-items:center;gap:36px;padding:0 48px">${bitmapSvg({ cell: 12, label: '' })}<span class="b-wm" style="font-size:44px;color:#b8b5c7">FOUNDATION</span></div>`,
        900,
        180,
        path.join(dir, 'pixl-foundation-lockup-dark-bg.png'),
        2
      )
    }
  })
}

// ── run ──────────────────────────────────────────────────────────────────────
const browser = await chromium.launch({ channel: 'chrome' })
page = await browser.newPage({ deviceScaleFactor: 1 })
try {
  await homeIcons()
  await productIcons('engine', 'PIXL Engine', 'The Rust imaging core behind every PIXL app.')
  await productIcons('space', 'Space Pixl', 'Makes a photo library smaller.')
  fs.writeFileSync(path.join(PUB, 'playroom', 'site.webmanifest'), MANIFEST('Pixl Playroom', 'Playroom', 'A RAW photo editor you pay for once.'))
  await ogCards()
  await foundationKit()
  await markKit('engine', 'engine', 'PIXL Engine', '<span class="b-wm en" style="font-size:64px">PIXL <em>ENGINE</em></span>')
  await markKit('space', 'space', 'Space Pixl', '<span class="b-wm sp" style="font-size:64px"><em>SPACE</em> PIXL</span>')
  await markKit('playroom', 'playroom', 'Pixl Playroom', '<span class="b-wm" style="font-size:64px">PIXL <em>PLAYROOM</em></span>')
} finally {
  await browser.close()
  fs.rmSync(TMP, { recursive: true, force: true })
}
console.log('brand-assets: icons, manifests, link cards and press kits written under public/')
