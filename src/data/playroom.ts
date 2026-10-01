// Content for playroom.pixlfoundation.com. The media behind it are rebuilt by
// pixl-playroom's scripts/site-media.sh (pairs, shots, tools, hero).

export interface Tool {
  id: string
  name: string
  /** What it's for, in a photographer's words. */
  pitch: string
  detail: string
  alt: string
}

/** The Develop wheel, in the order the app turns through it. Screenshots: shots/tools/<id>.webp. */
export const TOOLS: Tool[] = [
  {
    id: 'basic',
    name: 'Basic',
    pitch: 'Get the exposure right in seconds.',
    detail: 'Profile, white balance in real Kelvin, tone and presence, with a scene-aware Auto that knows a flat, overcast frame needs contrast, not a highlight pull.',
    alt: 'The Basic panel on a lake shot: exposure raised, highlights pulled back and shadows lifted, with the histogram above.'
  },
  {
    id: 'curve',
    name: 'Tone Curve',
    pitch: 'Shape contrast exactly where you want it.',
    detail: 'Parametric regions with movable splits, RGB point curves, saved curve presets, and a targeted tool that drags the curve at the tone under your pointer.',
    alt: 'The Tone Curve panel with a gentle S-curve applied to a lakeside photo.'
  },
  {
    id: 'hsl',
    name: 'HSL / Colour',
    pitch: 'Pull one colour forward and push the rest back.',
    detail: 'Eight bands of hue, saturation and luminance, point colour for a single sampled shade, and a black-and-white mix when you go monochrome.',
    alt: 'The HSL panel on orange wildflowers: the greens shifted and muted so the petals stand out.'
  },
  {
    id: 'grade',
    name: 'Colour Grading',
    pitch: 'Give every set its own look.',
    detail: 'Shadow, midtone, highlight and global wheels, with blending and balance, for the cinematic split-tones you would otherwise buy as presets.',
    alt: 'The Colour Grading wheels on a portrait: cool shadows and warm highlights.'
  },
  {
    id: 'detail',
    name: 'Detail',
    pitch: 'Clean up high-ISO shots without the plastic look.',
    detail: 'Sharpening with edge masking, and noise reduction tuned to the noise it measures in your photo.',
    alt: 'The Detail panel on an ISO 3200 photo of rowan berries, with sharpening and noise reduction applied.'
  },
  {
    id: 'effects',
    name: 'Effects',
    pitch: 'Finish with a vignette and film grain.',
    detail: 'A post-crop vignette fitted to the frame, and grain that stays the same every time you export.',
    alt: 'The Effects panel on a portrait, with a soft vignette and fine grain.'
  },
  {
    id: 'masks',
    name: 'Masks',
    pitch: 'Edit just the subject, just the sky, just the berries.',
    detail: 'Brush, linear and radial gradients, lasso, colour range and luminance range, combined by adding, subtracting and intersecting. Each mask has its own sliders.',
    alt: 'The Masks tool: a colour-range mask picks out red berries, shown as a violet overlay, with its own sliders.'
  },
  {
    id: 'crop',
    name: 'Crop & Rotate',
    pitch: 'Straighten the horizon, frame the moment.',
    detail: 'Aspect presets, straighten by dragging, quarter turns and flips, with thirds, golden and diagonal guides.',
    alt: 'The crop tool on two people pointing across a lake, with a 3:2 frame and rule-of-thirds guides.'
  },
  {
    id: 'calibration',
    name: 'Calibration',
    pitch: 'Tune how your camera sees colour.',
    detail: 'Shadow tint and the hue and saturation of the red, green and blue primaries, the way colourists build a signature look.',
    alt: 'The Calibration panel on wildflowers, with the red and blue primaries adjusted.'
  },
  {
    id: 'advanced',
    name: 'Engine',
    pitch: 'See exactly what was done to every pixel.',
    detail: 'The engine report for the last render: every step of the compiled grade, its timings and its numbers, plus custom layers for advanced users.',
    alt: 'The Engine panel listing each step of the compiled grade for a portrait: denoise, white balance, exposure, dehaze and curves.'
  }
]

export interface Pair {
  id: number
  alt: string
  cap: string
}

/** Before/after pairs: pairs/<id>-{before,after}-{1200,2400}.{webp,jpg} and <id>-thumb.webp. */
export const PAIRS: Pair[] = [
  { id: 3218, alt: 'rowan berries hanging from a branch against a softly blurred forest', cap: 'IMG_3218 · Canon EOS Rebel SL2 · 50 mm · f/1.8 · 1/1600 s · ISO 3200' },
  { id: 3252, alt: 'a man with long dark hair and glasses, in front of trees', cap: 'IMG_3252 · Canon EOS Rebel SL2 · 50 mm · f/1.8 · 1/125 s · ISO 100' },
  { id: 3223, alt: 'small orange-yellow flowers on a stem against dark foliage', cap: 'IMG_3223 · Canon EOS Rebel SL2 · 50 mm · f/4.5 · 1/1250 s · ISO 3200' },
  { id: 3291, alt: 'two men beside a tree, pointing into the distance', cap: 'IMG_3291 · Canon EOS Rebel SL2 · 50 mm · f/2.5 · 1/640 s · ISO 160' },
  { id: 3258, alt: 'a smiling man in a grey hoodie in front of evergreens', cap: 'IMG_3258 · Canon EOS Rebel SL2 · 50 mm · f/1.8 · 1/320 s · ISO 100' },
  { id: 3271, alt: 'a man with glasses and a blue shirt in front of a spruce', cap: 'IMG_3271 · Canon EOS Rebel SL2 · 50 mm · f/1.8 · 1/500 s · ISO 250' },
  { id: 3272, alt: 'a close portrait of a bearded man with glasses', cap: 'IMG_3272 · Canon EOS Rebel SL2 · 50 mm · f/1.8 · 1/500 s · ISO 250' },
  { id: 3273, alt: 'a man in a grey hoodie standing in front of evergreens', cap: 'IMG_3273 · Canon EOS Rebel SL2 · 50 mm · f/1.8 · 1/500 s · ISO 250' },
  { id: 3274, alt: 'a man in a grey hoodie, framed from the chest up, in front of evergreens', cap: 'IMG_3274 · Canon EOS Rebel SL2 · 50 mm · f/1.8 · 1/500 s · ISO 200' },
  { id: 3292, alt: 'a man in a grey hoodie looking down, with people blurred behind him', cap: 'IMG_3292 · Canon EOS Rebel SL2 · 50 mm · f/2.5 · 1/640 s · ISO 250' },
  { id: 3293, alt: 'a man with glasses looking down at his phone in a park', cap: 'IMG_3293 · Canon EOS Rebel SL2 · 50 mm · f/2.5 · 1/640 s · ISO 250' }
]

export const FORMATS = [
  { id: 'raw', label: 'RAW' },
  { id: 'dng', label: 'DNG' },
  { id: 'jxl', label: 'JPEG XL' },
  { id: 'heic', label: 'HEIC' },
  { id: 'jpg', label: 'JPEG' },
  { id: 'tiff', label: 'TIFF' }
]

/** The planned launch price. Checkout isn't built yet; see pixl-playroom TODO.md. */
export const PRICE = { amount: '$69.99', devices: 3, trialDays: 14 }

// Competitor prices from vendor pages, gathered September 2026.
// TODO before launch: re-check every figure and date the footnote.
export const COST_3Y = [
  { name: 'Pixl Playroom', model: 'Pay once', total: '$69.99', ours: true },
  { name: 'Lightroom (Photography 20 GB)', model: '$9.99 a month', total: '$359.64' },
  { name: 'Capture One Pro', model: '$349 one-time, or subscription', total: '$349' },
  { name: 'Darkroom', model: '$39.99 a year, or $99.99 lifetime', total: '$99.99+' }
]

export const FAQ = [
  {
    q: 'Is Playroom a subscription?',
    a: 'No. You buy a licence once and keep it. Every 1.x update is included. Optional cloud and AI-agent add-ons will be sold separately later, and the app never needs them.'
  },
  {
    q: 'How many computers can I use it on?',
    a: `Up to ${PRICE.devices} at a time, on macOS or Windows. Replacing a computer? Remove the old one from your account and add the new one.`
  },
  {
    q: 'Do my photos get uploaded anywhere?',
    a: 'No. Editing, previews and Super Resolution all run on your own machine, and nothing is uploaded unless you choose a cloud feature.'
  },
  {
    q: 'Will it mess with my folders or my Lightroom catalog?',
    a: 'Never. Playroom works on the folders you already have. It saves each edit as a small recipe file beside the photo, and writes titles, captions and keywords to standard XMP sidecars that other apps can read. Your originals are never modified.'
  },
  {
    q: 'What can it open and export?',
    a: 'It opens camera RAW, DNG, JPEG, JPEG XL, HEIC, TIFF, PNG, WebP and AVIF. It exports JPEG, PNG, TIFF, WebP, AVIF, JPEG XL and HEIC, one photo at a time or in batches.'
  },
  {
    q: 'Can I try it first?',
    a: `Yes. The beta is open now and free: every tool, on up to ${PRICE.devices} computers, until 1.0 ships. Join at playroom.pixlfoundation.com/beta with a free PIXL account. From 1.0 there is a free ${PRICE.trialDays}-day trial with every tool unlocked.`
  },
  {
    q: 'When can I buy it?',
    a: 'When 1.0 ships, soon. Until then the beta is free, and everyone who tests it gets a code for 30% off the full version.'
  }
]
