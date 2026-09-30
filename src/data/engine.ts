// Content for engine.pixlfoundation.com. Every figure is from pixl-engine's
// README ("Measured": Apple M2 Pro, release build; the live-preview row on a
// 28-core x86-64 box). Re-check them against the README when the engine changes.

export const FUNCTIONS = [
  { name: 'probe', sig: 'probe(source) → SourceInfo', what: 'What is this file? Format, size, depth, colour and where that colour description came from.' },
  { name: 'analyze', sig: 'analyze(request) → ImageStats', what: 'What do its pixels look like? Histograms, clipping and white-balance gains.' },
  { name: 'suggest_encode', sig: 'suggest_encode(info) → Encode', what: 'How was it made? The settings that produced this file, as advice you can edit or ignore.' },
  { name: 'convert', sig: 'convert(request) → ConvertReport', what: 'Do the work, exactly as asked, and report what actually happened.' },
]

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
  { name: 'HEIC & AVIF', note: '8, 10 and 12-bit, HDR kept' },
  { name: 'JPEG XL', note: 'lossy, lossless and bit-exact JPEG repack' },
  { name: 'TIFF', note: 'up to 16-bit' },
  { name: 'WebP', note: 'lossy and lossless' },
  { name: 'RAW', note: 'CR2, CR3, ARW, NEF, RAF, RW2, ORF and more, in' },
  { name: 'DNG', note: 'RAW in, lossless DNG out, mosaic preserved' },
]

export const OPS = [
  'White balance',
  'Exposure, lift, gamma, gain',
  'Highlights, shadows, whites, blacks',
  'Curves',
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
  'Masks and layers',
]

export const BINDINGS = [
  { name: 'Rust', note: 'the engine itself' },
  { name: 'Swift', note: 'iOS and macOS' },
  { name: 'Kotlin', note: 'Android' },
  { name: 'Node & Electron', note: 'macOS and Windows' },
  { name: 'Command line', note: 'pixl convert, probe, suggest' },
]
