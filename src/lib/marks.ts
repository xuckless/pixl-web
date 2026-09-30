// The PIXL marks as SVG strings: a port of the PIXL Family Kit's two source
// components (claude.ai/artifact/8hRAPFk6HhJmpXHUCnfusc, page "Components"):
//   Mark: kind (playroom, engine, space) × tone (glass, flat, mono) × detail (full, small)
//   Bitmap: the PIXL Foundation word drawn in pixels, or its P
// The geometry and colours are the kit's, number for number. Pure, so the
// pages (components/brand/) and the asset scripts (scripts/) share it.

export type MarkKind = 'playroom' | 'engine' | 'space'
export type MarkTone = 'glass' | 'flat' | 'mono'
export type MarkDetail = 'full' | 'small'

export interface MarkOptions {
  kind: MarkKind
  /** Rendered width and height in CSS px; omit for a fluid SVG. */
  size?: number
  tone?: MarkTone
  detail?: MarkDetail
  /** The colour of a mono mark. */
  ink?: string
  /** The loose and trailing pixels (full detail only). */
  pixels?: boolean
  /** Playroom's loose pixels drift (needs brand.css's .b-drift). */
  drift?: boolean
  glow?: boolean
  /** Fills Playroom's lens (the hexagon); transparent by default. */
  lens?: string
  /** Prefix for the SVG ids, unique per instance on a page. */
  id?: string
  /** Accessible name; defaults to the product's. Pass '' for a decorative mark. */
  label?: string
  class?: string
}

const GEO = {
  full: {
    outer:
      'M16 80 L16 160 L32 160 L32 192 L48 192 L48 208 L80 208 L80 224 L160 224 L160 208 L192 208 L192 192 L208 192 L208 160 L224 160 L224 80 L208 80 L208 48 L192 48 L192 32 L160 32 L160 16 L80 16 L80 32 L48 32 L48 48 L32 48 L32 80 Z',
    hex: 'M170 120 L145 163.3 L95 163.3 L70 120 L95 76.7 L145 76.7 Z',
    blades: [
      'M145 163.3 L208 163.3 L208 160 L224 160 L224 80 L208 80 L208 54.18 Z',
      'M95 163.3 L130.04 224 L160 224 L160 208 L192 208 L192 192 L208 192 L208 163.3 L145 163.3 Z',
      'M70 120 L32 185.82 L32 192 L48 192 L48 208 L80 208 L80 224 L130.04 224 L95 163.3 Z',
      'M95 76.7 L32 76.7 L32 80 L16 80 L16 160 L32 160 L32 185.82 Z',
      'M145 76.7 L109.96 16 L80 16 L80 32 L48 32 L48 48 L32 48 L32 76.7 Z',
      'M170 120 L208 54.18 L208 48 L192 48 L192 32 L160 32 L160 16 L109.96 16 Z'
    ],
    seams: [
      [170, 120, 208, 54.18],
      [145, 163.3, 208, 163.3],
      [95, 163.3, 130.04, 224],
      [70, 120, 32, 185.82],
      [95, 76.7, 32, 76.7],
      [145, 76.7, 109.96, 16]
    ],
    gap: 2.6,
    sph: 38
  },
  small: {
    outer: 'M30 60 L30 180 L60 180 L60 210 L180 210 L180 180 L210 180 L210 60 L180 60 L180 30 L60 30 L60 60 Z',
    hex: 'M180 120 L150 171.96 L90 171.96 L60 120 L90 68.04 L150 68.04 Z',
    blades: [
      'M150 171.96 L210 171.96 L210 68.04 L180 120 Z',
      'M90 171.96 L111.96 210 L180 210 L180 180 L210 180 L210 171.96 Z',
      'M60 120 L30 171.96 L30 180 L60 180 L60 210 L111.96 210 Z',
      'M90 68.04 L30 68.04 L30 171.96 L60 120 Z',
      'M150 68.04 L128.04 30 L60 30 L60 60 L30 60 L30 68.04 L90 68.04 Z',
      'M180 120 L210 68.04 L210 60 L180 60 L180 30 L128.04 30 L150 68.04 Z'
    ],
    seams: [
      [180, 120, 210, 68.04],
      [150, 171.96, 210, 171.96],
      [90, 171.96, 111.96, 210],
      [60, 120, 30, 171.96],
      [90, 68.04, 30, 68.04],
      [150, 68.04, 128.04, 30]
    ],
    gap: 5,
    sph: 48
  }
} as const

/* PIXL Engine: core r, render ring radius, stroke, arc in degrees from 12 o'clock
   clockwise, head pixel size, and the pixels still to render (angle, size, opacity). */
const EN = {
  full: { r: 84, R: 106, w: 4, arc: 300, head: 14, trail: [[316, 9, 0.6], [331, 6, 0.3]] },
  small: { r: 72, R: 100, w: 14, arc: 300, head: 28, trail: [] as number[][] }
}
/* Space Pixl: core r, orbit radii, stroke, front pixels (ellipse angle, size, opacity), back pixel. */
const SP = {
  full: { r: 66, rx: 112, ry: 30, w: 3.2, front: [[24, 16, 1], [40, 10, 0.6], [53, 6, 0.3]], back: [[200, 10, 0.7]] },
  small: { r: 64, rx: 114, ry: 36, w: 12, front: [[30, 28, 1]], back: [] as number[][] }
}
const OPS = [1, 0.82, 0.92, 0.74, 0.88, 0.8]
const FLAT = ['#6a58c8', '#4c3d9e', '#5b4ab3', '#43358f', '#5f4dbd', '#483a98']

function polar(R: number, deg: number): [number, number] {
  const a = (deg * Math.PI) / 180
  return [120 + R * Math.sin(a), 120 - R * Math.cos(a)]
}
function onOrbit(o: { rx: number; ry: number }, deg: number): [number, number] {
  const t = (deg * Math.PI) / 180
  const A = (-20 * Math.PI) / 180
  const xp = o.rx * Math.cos(t)
  const yp = o.ry * Math.sin(t)
  return [120 + xp * Math.cos(A) - yp * Math.sin(A), 120 + xp * Math.sin(A) + yp * Math.cos(A)]
}
function mix(a: string, b: string, t: number): string {
  const h = (x: string): number[] => [1, 3, 5].map((i) => parseInt(x.slice(i, i + 2), 16))
  const A = h(a)
  const B = h(b)
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('')
}
function sq(c: [number, number], s: number, fill: string, op: number): string {
  return `<rect x="${(c[0] - s / 2).toFixed(2)}" y="${(c[1] - s / 2).toFixed(2)}" width="${s}" height="${s}" fill="${fill}" opacity="${op}"/>`
}
const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

let counter = 0
/** A fresh id prefix, for callers that don't pass one. */
export function nextId(prefix = 'pxm'): string {
  counter += 1
  return `${prefix}${counter}`
}

export const MARK_LABEL: Record<MarkKind, string> = {
  playroom: 'Pixl Playroom',
  engine: 'PIXL Engine',
  space: 'Space Pixl'
}

/** One PIXL mark as an SVG element string (viewBox 0 0 240 240). */
export function markSvg(opts: MarkOptions): string {
  const kind = opts.kind
  const tone = opts.tone ?? 'glass'
  const ink = opts.ink ?? '#ebe9f3'
  const glass = tone === 'glass'
  const flat = tone === 'flat'
  const mono = tone === 'mono'
  const small = (opts.detail ?? 'full') === 'small'
  const lvl = small ? 'small' : 'full'
  const geo = GEO[lvl]
  const u = opts.id ?? nextId()
  const id = (k: string): string => `${u}${k}`
  const url = (k: string): string => `url(#${u}${k})`
  const e = EN[lvl]
  const o = SP[lvl]
  const isPl = kind === 'playroom'
  const isEn = kind === 'engine'
  const isSp = kind === 'space'
  const r = isEn ? e.r : isSp ? o.r : geo.sph
  const s = r * 0.24
  const sph = { r, s: s.toFixed(2), x: (120 - r * 0.42 - s / 2).toFixed(2), y: (120 - r * 0.44 - s / 2).toFixed(2) }
  const accent = isSp ? '#93a4ff' : '#9d8bea'
  const pixFill = mono ? ink : accent
  const showTrail = opts.pixels !== false && !small
  const size = opts.size
  const label = opts.label ?? MARK_LABEL[kind]
  const glowPx = Math.max(2, Math.round((size ?? 240) * 0.05))
  const glowCss =
    opts.glow && !mono
      ? `filter:drop-shadow(0 0 ${glowPx}px ${isSp ? 'rgba(147,164,255,.45)' : 'rgba(157,139,234,.45)'});`
      : ''

  const seams = geo.seams.map((q, i) => ({ x1: q[0], y1: q[1], x2: q[2], y2: q[3], gid: id(`s${i}`) }))
  const gapW = mono ? geo.gap + 1.4 : geo.gap
  const orbit = glass ? url('or') : mono ? ink : '#93a4ff'
  const spW = mono ? o.w + 3 : o.w
  const sp = { cut: spW + (small ? 12 : 10), obR: r + (small ? 10 : 5) }
  const ellipse = (stroke: string, width: number, extra = ''): string =>
    `<ellipse cx="120" cy="120" rx="${o.rx}" ry="${o.ry}" transform="rotate(-20 120 120)" fill="none" stroke="${stroke}" stroke-width="${width}"${extra}/>`

  const d: string[] = []
  d.push(
    `<radialGradient id="${id('sp')}" cx="36%" cy="30%" r="75%"><stop offset="0" stop-color="#f1ecff"/><stop offset="0.22" stop-color="#bba9ff"/><stop offset="0.55" stop-color="#7b68d8"/><stop offset="0.85" stop-color="#2b1f66"/><stop offset="1" stop-color="#0d0a1f"/></radialGradient>`,
    `<radialGradient id="${id('rim')}" cx="50%" cy="50%" r="50%"><stop offset="0.8" stop-color="#c8b9ff" stop-opacity="0"/><stop offset="0.97" stop-color="#c8b9ff" stop-opacity="0.5"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient>`
  )
  if (isPl)
    d.push(
      `<radialGradient id="${id('bl')}" gradientUnits="userSpaceOnUse" cx="96" cy="84" r="150"><stop offset="0" stop-color="#7d69dc"/><stop offset="0.45" stop-color="#3f3290"/><stop offset="1" stop-color="#120e28"/></radialGradient>`
    )
  if (isSp)
    d.push(
      `<linearGradient id="${id('or')}" gradientUnits="userSpaceOnUse" x1="14" y1="160" x2="226" y2="82"><stop offset="0" stop-color="#93a4ff" stop-opacity="0.12"/><stop offset="0.55" stop-color="#93a4ff" stop-opacity="0.6"/><stop offset="1" stop-color="#e3e8ff"/></linearGradient>`,
      `<clipPath id="${id('fc')}"><rect x="-200" y="0" width="400" height="200" transform="translate(120 120) rotate(-20)"/></clipPath>`,
      `<mask id="${id('ob')}" maskUnits="userSpaceOnUse" x="-20" y="-20" width="280" height="280"><rect x="-20" y="-20" width="280" height="280" fill="#ffffff"/><circle cx="120" cy="120" r="${sp.obR}" fill="#000000"/></mask>`
    )
  if (isPl) {
    if (glass && !small)
      for (const sm of seams)
        d.push(
          `<linearGradient id="${sm.gid}" gradientUnits="userSpaceOnUse" x1="${sm.x1}" y1="${sm.y1}" x2="${sm.x2}" y2="${sm.y2}"><stop offset="0" stop-color="#e6dfff"/><stop offset="0.35" stop-color="#9d8bea" stop-opacity="0.55"/><stop offset="1" stop-color="#9d8bea" stop-opacity="0"/></linearGradient>`
        )
    d.push(
      `<mask id="${id('rm')}" maskUnits="userSpaceOnUse" x="0" y="0" width="240" height="240"><path d="${geo.outer}" fill="#ffffff"/>${seams
        .map((sm) => `<line x1="${sm.x1}" y1="${sm.y1}" x2="${sm.x2}" y2="${sm.y2}" stroke="#000000" stroke-width="${gapW}" stroke-linecap="square"/>`)
        .join('')}<path d="${geo.hex}" fill="#000000"/></mask>`
    )
  }
  // The sphere's mask: the orbit's front half cuts it (Space); a mono mark cuts out its highlight.
  d.push(
    `<mask id="${id('sm')}" maskUnits="userSpaceOnUse" x="0" y="0" width="240" height="240"><rect x="0" y="0" width="240" height="240" fill="#ffffff"/>${
      isSp ? `<g clip-path="${url('fc')}">${ellipse('#000000', sp.cut)}</g>` : ''
    }${mono ? `<rect x="${sph.x}" y="${sph.y}" width="${sph.s}" height="${sph.s}" fill="#000000"/>` : ''}</mask>`
  )

  const b: string[] = []
  if (isEn) {
    const circ = 2 * Math.PI * e.R
    const NSEG = 12
    const segDeg = e.arc / NSEG
    const dash = `${((circ * segDeg) / 360 + 0.4).toFixed(2)} ${circ.toFixed(1)}`
    const w = mono ? e.w + 3 : e.w
    // The render ring as 12 abutting arcs; in glass each is a little brighter than the last, so it reads as progress.
    for (let i = 0; i < NSEG; i++) {
      const k = (i + 1) / NSEG
      const c = glass ? mix('#7b68d8', '#e6dfff', Math.pow(k, 1.4)) : mono ? ink : '#9d8bea'
      const op = glass ? (small ? 0.4 + 0.6 * k : 0.12 + 0.88 * Math.pow(k, 1.3)).toFixed(3) : 1
      b.push(
        `<circle cx="120" cy="120" r="${e.R}" fill="none" stroke="${c}" stroke-opacity="${op}" stroke-width="${w}" stroke-dasharray="${dash}" transform="rotate(${(-90 + i * segDeg).toFixed(2)} 120 120)"/>`
      )
    }
    const headFill = mono ? ink : glass ? '#e6dfff' : '#ebe9f3'
    b.push(sq(polar(e.R, e.arc), e.head, headFill, 1))
    if (showTrail) for (const q of e.trail) b.push(sq(polar(e.R, q[0]), q[1], pixFill, q[2]))
  }
  if (isSp) {
    b.push(ellipse(orbit, spW, ` mask="${url('ob')}"`))
    if (showTrail) for (const q of o.back) b.push(sq(onOrbit(o, q[0]), q[1], pixFill, q[2]))
  }
  if (isPl) {
    b.push(`<path d="${geo.hex}" fill="${opts.lens ?? 'transparent'}"/>`)
    const ringBase = glass ? '#0b0816' : flat ? '#4c3d9e' : ink
    const blades = mono
      ? ''
      : geo.blades.map((p, i) => `<path d="${p}" fill="${glass ? url('bl') : FLAT[i]}" opacity="${glass ? OPS[i] : 1}"/>`).join('')
    b.push(`<g mask="${url('rm')}"><path d="${geo.outer}" fill="${ringBase}"/>${blades}</g>`)
    if (glass && !small) {
      for (const sm of seams)
        b.push(`<line x1="${sm.x1}" y1="${sm.y1}" x2="${sm.x2}" y2="${sm.y2}" stroke="url(#${sm.gid})" stroke-width="2.2" stroke-linecap="square"/>`)
      b.push(`<path d="${geo.outer}" fill="none" stroke="#ffffff" stroke-opacity="0.14" stroke-width="1"/>`)
    }
    if (opts.pixels !== false && !small)
      b.push(
        `<g${opts.drift ? ' class="b-drift"' : ''}><rect x="200" y="24" width="12" height="12" fill="${pixFill}"/><rect x="218" y="10" width="8" height="8" fill="${pixFill}" opacity="0.6"/><rect x="230" y="2" width="5" height="5" fill="${pixFill}" opacity="0.3"/></g>`
      )
  }
  const sphereFill = glass ? url('sp') : flat ? '#9d8bea' : ink
  b.push(
    `<g mask="${url('sm')}"><circle cx="120" cy="120" r="${sph.r}" fill="${sphereFill}"/>${
      glass ? `<circle cx="120" cy="120" r="${sph.r}" fill="${url('rim')}"/>` : ''
    }</g>`
  )
  if (!mono)
    b.push(`<rect x="${sph.x}" y="${sph.y}" width="${sph.s}" height="${sph.s}" fill="${glass ? '#ffffff' : '#f1ecff'}" opacity="0.94"/>`)
  if (isSp) {
    b.push(`<g clip-path="${url('fc')}">${ellipse(orbit, spW)}</g>`)
    o.front.forEach((q, i) => {
      if (i === 0 || showTrail) b.push(sq(onOrbit(o, q[0]), q[1], i === 0 && glass ? '#c4cdff' : pixFill, q[2]))
    })
  }

  const dims = size ? ` width="${size}" height="${size}"` : ''
  const a11y = label ? ` role="img" aria-label="${esc(label)}"` : ' aria-hidden="true" focusable="false"'
  const cls = opts.class ? ` class="${esc(opts.class)}"` : ''
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240"${dims}${a11y}${cls} style="display:block;overflow:visible;${glowCss}"><defs>${d.join('')}</defs>${b.join('')}</svg>`
}

// ── The PIXL Foundation bitmap wordmark ──────────────────────────────────────

/* Four letters on a 7-row grid, one empty column between letters:
   P 5 wide · I 3 wide · X 5 wide · L 4 wide = 20 × 7 cells. */
const GLYPHS: Record<string, string[]> = {
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  I: ['111', '010', '010', '010', '010', '010', '111'],
  X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
  L: ['1000', '1000', '1000', '1000', '1000', '1000', '1111']
}

export interface BitmapCell {
  x: number
  y: number
}

/** The cells that are on, and the grid's width in cells. */
export function bitmapCells(text: 'PIXL' | 'P' = 'PIXL'): { cells: BitmapCell[]; cols: number } {
  const cells: BitmapCell[] = []
  let x0 = 0
  text.split('').forEach((ch, li) => {
    const g = GLYPHS[ch]
    g.forEach((row, y) => row.split('').forEach((v, x) => v === '1' && cells.push({ x: x0 + x, y })))
    x0 += g[0].length + (li < text.length - 1 ? 1 : 0)
  })
  return { cells, cols: x0 }
}

export interface BitmapOptions {
  text?: 'PIXL' | 'P'
  /** Pixels per cell; keep it a whole number so edges stay crisp. Omit for a fluid SVG. */
  cell?: number
  ink?: string
  /** Empty cells of margin on every side. */
  pad?: number
  label?: string
  class?: string
  /** Each cell gets data-i (its scan order), for the reveal. */
  indexed?: boolean
}

/** The PIXL word (or its P) as an SVG element string. */
export function bitmapSvg(opts: BitmapOptions = {}): string {
  const text = opts.text ?? 'PIXL'
  const { cells, cols } = bitmapCells(text)
  const pad = opts.pad ?? 0
  const ink = opts.ink ?? '#ebe9f3'
  const cell = opts.cell
  const w = cols + pad * 2
  const h = 7 + pad * 2
  const dims = cell ? ` width="${w * cell}" height="${h * cell}"` : ''
  // Row by row, left to right: the order the reveal scans them in.
  const ordered = [...cells].sort((a, b) => a.y - b.y || a.x - b.x)
  // Each cell grows 0.02 so neighbours overlap and no hairline seams show.
  const rects = ordered
    .map((c, i) => `<rect x="${c.x - 0.02}" y="${c.y - 0.02}" width="1.04" height="1.04"${opts.indexed ? ` data-i="${i}"` : ''}/>`)
    .join('')
  const label = opts.label ?? 'PIXL'
  const a11y = label ? ` role="img" aria-label="${esc(label)}"` : ' aria-hidden="true" focusable="false"'
  const cls = opts.class ? ` class="${esc(opts.class)}"` : ''
  const crisp = !cell || cell >= 3 ? 'crispEdges' : 'geometricPrecision'
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-pad} ${-pad} ${w} ${h}"${dims}${a11y}${cls} shape-rendering="${crisp}" style="display:block;overflow:visible"><g fill="${ink}">${rects}</g></svg>`
}
