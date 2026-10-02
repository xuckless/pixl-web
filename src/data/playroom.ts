// Content for playroom.pixlfoundation.com. The before/after pairs and the hero
// come from pixl-playroom's scripts/site-media.sh; the shots under shots/ and
// shots/tools/ are screenshots of 0.2.0-beta, taken by hand (2× Retina, sRGB).

export interface Tool {
  id: string
  name: string
  /** What it's for, in a photographer's words. */
  pitch: string
  detail: string
  alt: string
  /** The screenshot's size in pixels (it is 2×, so it shows at half this). */
  size: [number, number]
  /** An animated screenshot, with shots/tools/<id>-still.webp for reduced motion. */
  still?: boolean
}

/**
 * The Develop panels, in the order the app stacks them, then the masks and the
 * histogram. Screenshots: shots/tools/<id>.webp, each a crop of the right-hand
 * sidebar. Crop and Heal have no screenshot yet, so the page names them in text.
 */
export const TOOLS: Tool[] = [
  {
    id: 'light',
    name: 'Light',
    pitch: 'Get the exposure right in seconds.',
    detail: 'Colour or B&W, a profile, white balance in real Kelvin on RAW files, then exposure and tone, with a scene-aware Auto that knows a flat, overcast frame needs contrast, not a highlight pull.',
    alt: 'The top of the Develop sidebar: histograms, the Crop, Heal and Masks buttons, Jump to, the Vivid profile, white balance at 5118 K and the Light sliders.',
    size: [718, 1792]
  },
  {
    id: 'presence',
    name: 'Presence & Colour',
    pitch: 'Add bite without the crunch.',
    detail: 'Texture for fine detail, Clarity for midtone contrast and Dehaze to cut through haze, then Vibrance to lift the muted colours before the strong ones.',
    alt: 'The Presence and Colour panels: Texture 11, Clarity 20, Dehaze 40 and Vibrance 9.',
    size: [718, 528]
  },
  {
    id: 'mixer',
    name: 'Colour mixer',
    pitch: 'Pull one colour forward and push the rest back.',
    detail: 'Eight bands of hue, saturation and luminance, point colour for a single sampled shade, and a black-and-white mix when you go monochrome.',
    alt: 'The Colour mixer: the Green and Aqua sliders dragged while the other bands stay at zero.',
    size: [718, 526],
    still: true
  },
  {
    id: 'grade',
    name: 'Colour grading',
    pitch: 'Give every set its own look.',
    detail: 'Shadow, midtone, highlight and global wheels with blending and balance, and Add colour, which tints the light like a gel on a lamp or matches a colour you pick.',
    alt: 'The Colour grading panel: shadow, midtone, highlight and global wheels, Blending and Balance, and Add colour.',
    size: [702, 1292]
  },
  {
    id: 'curve',
    name: 'Tone curve',
    pitch: 'Shape contrast exactly where you want it.',
    detail: 'Curve presets, parametric regions, RGB point curves over the histogram, and a targeted tool that drags the curve at the tone under your pointer.',
    alt: 'The Tone curve panel: a Linear preset, four region sliders and the RGB point curve over the histogram.',
    size: [702, 1472]
  },
  {
    id: 'detail',
    name: 'Detail',
    pitch: 'Clean up high-ISO shots without the plastic look.',
    detail: 'Sharpening with edge masking. AI noise reduction runs once on your own computer and keeps a Strength slider, for the whole photo or inside a mask, or use classic luminance and colour noise reduction.',
    alt: 'The Detail panel switching between AI noise reduction, with the DRUNet model and a Denoise the photo button, and classic noise reduction sliders.',
    size: [702, 830],
    still: true
  },
  {
    id: 'effects',
    name: 'Effects',
    pitch: 'Finish with a vignette and film grain.',
    detail: 'A post-crop vignette fitted to the frame, a colour wash, and grain that stays the same every time you export.',
    alt: 'The Effects panel: post-crop vignette with a Highlight priority style, Colour wash, and grain sliders.',
    size: [702, 912]
  },
  {
    id: 'optics',
    name: 'Optics',
    pitch: 'Undo what the lens did.',
    detail: 'Your lens recognised from the file, with profiles for about 1,500 lenses that work offline, chromatic aberration measured on the photo, defringe with a picker, manual distortion and vignetting, and defish for fisheye lenses.',
    alt: 'The Optics panel: a 50 mm f/1.8 lens recognised, chromatic aberration removal, manual distortion and vignetting, and purple and green defringe.',
    size: [702, 1070]
  },
  {
    id: 'geometry',
    name: 'Geometry & Calibration',
    pitch: 'Straight lines, true colour.',
    detail: 'Upright fixes converging verticals: Auto, Level, Vertical, Full, or Guided from lines you draw, with manual transforms. Calibration tunes the shadow tint and the red, green and blue primaries, the way colourists build a signature look.',
    alt: 'The Geometry panel with Upright modes and Transform sliders, above the Calibration panel with shadow tint and red, green and blue primaries.',
    size: [702, 1606]
  },
  {
    id: 'enhance',
    name: 'Enhance',
    pitch: 'Rescue old JPEGs. Print bigger.',
    detail: 'JPEG repair, motion deblur and AI Super Resolution at ×2 or ×4, run on your own computer. The result is kept in the photo\'s project as a step you can undo, with your edits still live on top. Each model downloads once, the first time you use it.',
    alt: 'The Enhance panel: JPEG restore, Remove motion blur, and Super Resolution at ×2, taking a 6000 × 4000 RAW to 12000 × 8000.',
    size: [702, 1182]
  },
  {
    id: 'masks',
    name: 'Masks',
    pitch: 'Edit just the subject, just the sky, just the berries.',
    detail: 'Subject, Background, Objects (click, box or scribble) and Sky, plus brush, gradients, lasso, and colour and luminance range, with snap to edges. Add, subtract and intersect them, then every panel edits just that mask. People and depth masks are coming.',
    alt: 'The new-mask menu: Subject, Objects, Sky and Background; people masks marked soon; brush, linear, radial and bidirectional gradients and lasso; colour and luminance range.',
    size: [606, 1124]
  },
  {
    id: 'histogram',
    name: 'Histogram',
    pitch: 'See the light and the colour at a glance.',
    detail: 'An RGB histogram with clipping warnings, and a hue chart showing how much of each colour is in the photo, compared with before your edits or measured inside a mask.',
    alt: 'The histogram with shadow and highlight clipping warnings, above a hue chart of a photo of yellow flowers against blue-green foliage.',
    size: [724, 574]
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
    a: 'No. Editing, previews and every AI feature run on your own machine. The AI models download once, when you first use them, and nothing of yours is uploaded.'
  },
  {
    q: 'Will it mess with my folders or my Lightroom catalog?',
    a: 'Never. Playroom works on the folders you already have and never modifies your originals. Each edited photo gets one .pixl project file beside it (or in a folder you choose) holding its edits, history, masks and virtual copies, with a copy of the original inside by default. The .pixl format is documented, and any SQLite tool can read it. It doesn\'t read or change a Lightroom catalog.'
  },
  {
    q: 'What can it open and export?',
    a: 'It opens camera RAW, DNG, JPEG, JPEG XL, HEIC, TIFF, PNG, WebP and AVIF. It exports JPEG, PNG, TIFF, WebP, AVIF and JPEG XL, one photo at a time or in batches. HEIC export is coming.'
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
