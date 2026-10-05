// The gamut chart's geometry, from published chromaticities. PixlRGB's are the
// definition in pixl-engine's docs/pixlrgb (CIE 1931 xy); the others are each
// standard's own. Everything is drawn in CIE 1976 u′v′, where equal distances
// are closer to equally different colours.

type XY = [number, number]

/** CIE 1931 2° spectral locus, 380 to 700 nm in 10 nm steps (standard published chromaticities). */
const LOCUS: XY[] = [
  [0.1741, 0.005], [0.1738, 0.0049], [0.1733, 0.0048], [0.1726, 0.0048], [0.1714, 0.0051],
  [0.1689, 0.0069], [0.1644, 0.0109], [0.1566, 0.0177], [0.144, 0.0297], [0.1241, 0.0578],
  [0.0913, 0.1327], [0.0454, 0.295], [0.0082, 0.5384], [0.0139, 0.7502], [0.0743, 0.8338],
  [0.1547, 0.8059], [0.2296, 0.7543], [0.3016, 0.6923], [0.3731, 0.6245], [0.4441, 0.5547],
  [0.5125, 0.4866], [0.5752, 0.4242], [0.627, 0.3725], [0.6658, 0.334], [0.6915, 0.3083],
  [0.7079, 0.292], [0.719, 0.2809], [0.726, 0.274], [0.73, 0.27], [0.732, 0.268],
  [0.7334, 0.2666], [0.7344, 0.2656], [0.7347, 0.2653]
]

export interface Gamut {
  id: string
  name: string
  /** Red, green, blue primaries in CIE 1931 xy. */
  xy: [XY, XY, XY]
}

export const GAMUTS: Gamut[] = [
  { id: 'srgb', name: 'sRGB', xy: [[0.64, 0.33], [0.3, 0.6], [0.15, 0.06]] },
  { id: 'adobe', name: 'Adobe RGB', xy: [[0.64, 0.33], [0.21, 0.71], [0.15, 0.06]] },
  { id: 'p3', name: 'Display P3', xy: [[0.68, 0.32], [0.265, 0.69], [0.15, 0.06]] },
  { id: 'rec2020', name: 'Rec.2020', xy: [[0.708, 0.292], [0.17, 0.797], [0.131, 0.046]] },
  { id: 'pixlrgb', name: 'PixlRGB', xy: [[0.736, 0.2644], [-0.3256, 1.3204], [0.1414, -0.0105]] }
]

/** The plot window in u′v′, and the pixels per unit. */
const U0 = -0.12
const V1 = 0.66
const K = 1000
export const VIEW = { w: Math.round((0.66 - U0) * K), h: Math.round((V1 + 0.07) * K) }

const uv = ([x, y]: XY): XY => {
  const d = -2 * x + 12 * y + 3
  return [(4 * x) / d, (9 * y) / d]
}
const px = ([u, v]: XY): XY => [Math.round((u - U0) * K * 10) / 10, Math.round((V1 - v) * K * 10) / 10]
const pts = (xy: XY[]): string => xy.map((p) => px(uv(p)).join(',')).join(' ')

export const locusPoints = pts(LOCUS)
export const gamutPoints = (g: Gamut): string => pts(g.xy)
/** Where a gamut's label sits: just outside its green primary, or a side for the others. */
export const at = (p: XY): XY => px(uv(p))

/** Grid lines every 0.1 of u′ and v′, with their labels. */
export const grid = {
  u: [-0.1, 0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6].map((u) => ({ at: px([u, 0])[0], label: u.toFixed(1) })),
  v: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6].map((v) => ({ at: px([0, v])[1], label: v.toFixed(1) }))
}
