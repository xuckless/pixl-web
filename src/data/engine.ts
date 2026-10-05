// Content for engine.pixlfoundation.com. Every figure is from pixl-engine's
// README ("Measured": Apple M2 Pro, release build; the live-preview row on a
// 28-core x86-64 box). Re-check them against the README when the engine changes,
// and keep public/engine/llms-full.txt in step.

export const STATS = [
  { value: '75 ms', label: 'a full live-preview render, grade included, on 28 cores' },
  { value: '0.51 s', label: 'a 35.6 MB Canon CR2 to a lossless DNG' },
  { value: '−19%', label: 'JPEG to JPEG XL, reversible bit for bit' },
  { value: '1', label: 'rounding to integers, however many operations you stack' },
]

export const MEASURED = [
  { what: 'JPEG → JPEG XL, repack (bit-exact)', from: '8.04 MB', to: '6.55 MB', time: '0.33 s' },
  { what: 'JPEG → AVIF q60', from: '8.04 MB', to: '2.58 MB', time: '1.28 s' },
  { what: '16-bit PNG → AVIF 10-bit 4:4:4', from: '104.05 MB', to: '4.92 MB', time: '2.28 s' },
  { what: '16-bit PNG → HEIC 10-bit 4:4:4', from: '104.05 MB', to: '16.93 MB', time: '8.49 s' },
  { what: 'CR2 → DNG (lossless)', from: '35.67 MB', to: '30.77 MB', time: '0.51 s' },
  { what: 'CR2 → develop → JPEG q92', from: '35.67 MB', to: '5.40 MB', time: '0.83 s' },
]

export const FORMATS = [
  { name: 'JPEG', note: 'libjpeg-turbo, SIMD' },
  { name: 'PNG', note: '8 and 16-bit, native colour type kept' },
  { name: 'HEIC & AVIF', note: '8, 10 and 12-bit, HDR kept (HEIC writing needs an HEVC-enabled build)' },
  { name: 'JPEG XL', note: 'lossy, lossless and bit-exact JPEG repack' },
  { name: 'TIFF', note: '8 and 16-bit, and 32-bit float' },
  { name: 'WebP', note: 'lossy and lossless' },
  { name: 'RAW', note: 'CR2, CR3, ARW, NEF, RAF, RW2, ORF and more, in' },
  { name: 'DNG', note: 'RAW in, lossless DNG out, mosaic preserved' },
]

export const OPS = [
  'White balance',
  'Exposure, lift, gamma, gain',
  'Highlights, shadows, whites, blacks',
  'Point and parametric curves',
  'HSL bands',
  'Vibrance with skin protection',
  'Colour qualifiers',
  'ASC CDL',
  '.cube LUTs',
  'Noise reduction',
  'Sharpening',
  'Clarity and texture',
  'Dehaze',
  'Vignette',
  'Seeded grain',
  'Colour-grading wheels',
  'Channel mixer',
  'Defringe',
  'Add colour',
  'Masks and layers',
]

/** What the engine does beyond the grade itself. */
export const BEYOND = [
  'Lens corrections: distortion, lateral CA, vignetting',
  'Upright perspective, with automatic suggestions',
  'Heal, clone and content-aware fill; red eye',
  'On-device AI: super resolution ×2 and ×4, denoise, JPEG restore, deblur, subject masks',
  'HDR: PQ and HLG, tone mapping, gain maps in and out',
  'RAW develop in linear Rec.2020, with highlight handling',
]

export const BINDINGS = [
  { name: 'Rust', note: 'the engine itself' },
  { name: 'Node & Electron', note: 'macOS (Apple silicon and Intel) and Windows x64, what the apps use' },
  { name: 'Swift', note: 'through UniFFI, tested on macOS' },
]
