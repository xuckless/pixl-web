// Content for engine.pixlfoundation.com. Every figure is from pixl-engine's
// CLAUDE.md and docs/ (the engine's own measurements: an Intel i7-14700F on
// Linux, 8 threads, unless a line says otherwise). Re-check them against the
// engine when it changes, and keep public/engine/llms*.txt in step.

export const STATS = [
  { value: '100%', label: 'of visible colours inside PixlRGB, the open working space every edit runs in' },
  { value: '46', label: 'cameras developed through colour PIXL fitted itself, from measured spectra' },
  { value: '1', label: 'rounding to integers, however many operations you stack' },
  { value: '0.31 s', label: 'a 35.6 MB Canon CR2 to a lossless DNG, the mosaic bit for bit' },
]

export const MEASURED = [
  { what: 'Canon CR2 → DNG, whole sensor (lossless)', from: '35.6 MB', to: '28.3 MB', time: '0.31 s' },
  { what: 'JPEG → JPEG XL repack, reversible to the byte', from: '8.0 MB', to: '6.5 MB', time: '—' },
  { what: '16-bit PNG → AVIF 10-bit 4:4:4, Iq q90', from: '104 MB', to: '10.8 MB', time: '3.6 s' },
  { what: '24 MP JPEG → AVIF, Iq q70, speed 6', from: '8.04 MB', to: '4.30 MB', time: '1.9 s' },
  { what: '102 MP Fujifilm RAF → scene-linear develop', from: '101.7 MP', to: '1.49 GB peak', time: '4.9 s' },
  { what: 'Master cache → 2048 px HDR preview (JPEG XL, PQ)', from: '24 MP', to: '1.2 MB', time: '0.49 s' },
]

export const FORMATS = [
  { name: 'Camera RAW', note: 'CR2, CR3, ARW, NEF, RAF, RW2, ORF and more through LibRaw, developed by PIXL' },
  { name: 'DNG', note: 'PIXL’s own DNG 1.7.1 reader and writer: every compression, opcodes, lossless out' },
  { name: 'AVIF', note: '8, 10 and 12-bit, HDR and gain maps, grids to 102 MP and beyond' },
  { name: 'HEIC', note: 'read exactly as Apple renders it, iPhone gain maps included' },
  { name: 'JPEG XL', note: 'lossy, lossless, 32-bit float, and the bit-exact JPEG repack' },
  { name: 'JPEG', note: 'libjpeg-turbo, with Ultra HDR gain maps in and out' },
  { name: 'PNG · TIFF · WebP', note: '16-bit and HDR PNG, float TIFF, lossy and lossless WebP' },
]

export const OPS = [
  'White balance',
  'Exposure, lift, gamma, gain',
  'Highlights, shadows, whites, blacks',
  'Point and parametric curves',
  'Perceptual HSL',
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
  'PixlRGB colour science: fitted camera colour, the visible-range guard, gamut compression',
  'One HDR master: PQ, HLG, gain maps and floats from one render',
  'RAW develop in scene-linear light, with four highlight modes',
  'Lens corrections: distortion, fisheye, lateral CA, vignetting, flat-field',
  'Upright perspective, with automatic suggestions',
  'Heal, clone and content-aware fill; red and pet eye',
  'On-device AI: super resolution, denoise, JPEG restore, deblur, subject and prompted masks',
]

export const BINDINGS = [
  { name: 'Rust', note: 'the engine itself' },
  { name: 'Node & Electron', note: 'macOS (Apple silicon and Intel) and Windows x64, what the apps use' },
]
