// The engine site's chart palette and type, shared by LineChart and BarChart.
// PIXL's own series take the accent; everything it is compared with takes a
// grey. Square panel, no shadows.

export type Tone = 'accent' | 'highlight' | 'muted' | 'dim' | 'light'

export const TONE: Record<Tone, string> = {
  accent: '#bba9ff',
  highlight: '#e6dfff',
  muted: '#8e8aa6',
  dim: '#6e6a84',
  light: '#b8b5c7'
}

export const CHART = {
  panel: '#050507',
  border: 'rgba(255,255,255,.08)',
  grid: 'rgba(255,255,255,.06)',
  axis: '#8e8aa6',
  value: '#ebe9f3',
  label: "'Space Grotesk', system-ui, sans-serif",
  number: "'JetBrains Mono', ui-monospace, monospace",
  caption: "'Manrope', system-ui, sans-serif"
} as const

/** A tick: a value on the axis, and what to print there (the value itself when omitted). */
export type Tick = number | { value: number; label: string }

export const tickValue = (t: Tick): number => (typeof t === 'number' ? t : t.value)
export const tickLabel = (t: Tick): string => (typeof t === 'number' ? String(t) : t.label)
