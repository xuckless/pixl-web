// Content for playroom.pixlfoundation.com. The before/after pairs and the hero
// come from pixl-playroom's scripts/site-media.sh; the shots under shots/ and
// shots/tools/ are screenshots of 0.2.0-beta, taken by hand (2× Retina, sRGB);
// the facts on this page are those of 0.3.0-beta (October 4, 2026).

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

/** The current beta build. */
export const BETA = { version: '0.3.0-beta', date: 'October 4, 2026', engine: '0.17.0' }

/** The planned launch price. Checkout isn't built yet; see pixl-playroom TODO.md. */
export const PRICE = { amount: '$69.99', devices: 3, trialDays: 14 }

export type Mark = 'yes' | 'no' | 'part' | 'soon'

export interface Compare {
  apps: { name: string; sub?: string }[]
  groups: { title: string; rows: { label: string; cells: { mark?: Mark; text: string }[] }[] }[]
}

/** One cell per app, in COMPARE.apps' order: [mark, text], or text alone. */
const row = (label: string, ...cells: ([Mark, string] | string)[]) => ({
  label,
  cells: cells.map((c) => (typeof c === 'string' ? { text: c } : { mark: c[0], text: c[1] }))
})

// Checked 2026-10-02 against each vendor's own pages (pricing, help centre,
// release notes): Lightroom Classic 15.6, Capture One Pro 16.8.6, Darkroom 7.4.
// Playroom's column is what 0.3.0-beta does (updated 2026-10-05), with its price
// and trial from 1.0. The other columns were last checked on 2026-10-02.
// TODO before launch: check every row again and re-date the footnote.
export const COMPARE: Compare = {
  apps: [
    { name: 'Pixl Playroom', sub: 'At 1.0' },
    { name: 'Lightroom Classic', sub: 'Adobe Lightroom plan' },
    { name: 'Capture One Pro', sub: 'Perpetual or subscription' },
    { name: 'Darkroom', sub: 'Darkroom+' }
  ],
  groups: [
    {
      title: 'Price and ownership',
      rows: [
        row('Three years of use', ['yes', '$69.99, once'], ['no', '$431.64 ($11.99 a month)'], ['part', '$349 once, or $648 by subscription'], ['part', '$99.99 once, or $119.97 by the year']),
        row('Buy it once, keep it', ['yes', 'Yes, with every 1.x update'], ['no', 'Subscription only'], ['part', 'Yes, but new features are paid upgrades'], ['yes', 'Yes, with future features']),
        row('Computers', `${PRICE.devices} at a time`, 'Active on 2', '3 activations', 'Your Apple devices'),
        row('Platforms', 'macOS and Windows', 'macOS and Windows', 'macOS and Windows', ['part', 'Apple only: Mac, iPhone, iPad']),
        row('Free trial', `${PRICE.trialDays} days, no card. Free beta now`, '7 days', '7 days, card required', 'Edit free; export needs Darkroom+')
      ]
    },
    {
      title: 'Your files',
      rows: [
        row('Works on your folders, no import', ['yes', 'Yes, no catalog'], ['no', 'Imports into a catalog'], ['part', 'Yes in Sessions; Catalogs import'], ['no', 'Apple Photos library only']),
        row('Where your edits live', 'One .pixl file beside each photo', 'A catalog database', 'Session sidecars or a catalog', 'Darkroom\'s database, on each device')
      ]
    },
    {
      title: 'Privacy',
      rows: [
        row('AI runs on your computer', ['yes', 'All of it'], ['part', 'Not Generative Remove or Firefly: cloud'], ['part', 'Masks yes; some add-ons are cloud'], ['yes', 'All of it']),
        row('Usage analytics', ['yes', 'None. Crash reports only if you opt in'], ['part', 'Usage data, with an opt-out'], 'Not documented', ['part', 'Anonymous analytics']),
        row('Account and sign-in', ['part', 'PIXL account; 30 days offline'], ['part', 'Adobe ID; 30 to 99 days offline'], ['part', 'Capture One account; checks every 30 days'], ['yes', 'No account'])
      ]
    },
    {
      title: 'AI and editing',
      rows: [
        row('AI masks', ['yes', 'Subject, background, objects, sky. People soon'], ['yes', 'Subject, sky, background, objects, people'], ['yes', 'Subject, background, objects, people. No sky'], ['part', 'Subject, background, depth; sky on some photos']),
        row('Presets that make their own masks', ['yes', 'Smart looks, among 300+ looks'], ['yes', 'Adaptive presets'], ['yes', 'Styles with AI masks'], ['part', 'Presets can carry masks']),
        row('AI noise reduction', ['yes', 'On your computer'], ['yes', 'On your computer'], ['yes', 'Bayer RAW files only'], ['no', 'No']),
        row('AI upscaling', ['yes', '×2 and ×4, on your computer'], ['part', '×2 only'], ['no', 'No'], ['no', 'No']),
        row('Generative remove', ['soon', 'Planned. Heal, clone and fill now'], ['yes', 'Yes, in the cloud'], ['no', 'No'], ['no', 'No']),
        row('Automatic lens correction', ['yes', 'About 1,500 lenses, offline, and defish'], ['yes', 'Yes'], ['yes', 'Yes'], ['no', 'No']),
        row('Colour grading wheels', ['yes', 'Yes'], ['yes', 'Yes'], ['yes', 'Yes'], ['yes', 'Yes']),
        row('HDR editing and export', ['yes', 'RAW to HDR, gain maps, PQ and HLG. You set white and peak'], ['yes', 'Yes'], ['no', 'No'], ['no', 'No'])
      ]
    },
    {
      title: 'Beyond the edit',
      rows: [
        row('AI agents in control', ['soon', 'Planned before 1.0: any MCP agent, every control, on your own files'], ['no', 'Adobe\'s agents work in its cloud, not in Classic'], ['no', 'No. AppleScript, and cloud Actions on Studio'], ['no', 'No. Apple Shortcuts']),
        row('Tethered shooting', ['no', 'No'], ['yes', 'Yes'], ['yes', 'Yes, 550+ cameras'], ['no', 'No']),
        row('Layers beyond masks', ['no', 'Not yet'], ['no', 'No'], ['yes', 'Yes'], ['no', 'No']),
        row('HDR and panorama merge', ['no', 'No'], ['yes', 'Yes'], ['yes', 'Yes'], ['no', 'No']),
        row('Print', ['no', 'No'], ['yes', 'Print, book, slideshow and web'], ['yes', 'Print'], ['no', 'No'])
      ]
    }
  ]
}

export const FAQ = [
  {
    q: 'Is Playroom a subscription?',
    a: 'No. You buy a licence once and keep it. Every 1.x update is included. Bringing your own AI agent will be included. Optional cloud add-ons may be sold separately later, and the app never needs them.'
  },
  {
    q: 'How many computers can I use it on?',
    a: `Up to ${PRICE.devices} at a time, on macOS or Windows. Replacing a computer? Remove the old one from your account and add the new one.`
  },
  {
    q: 'Where does Playroom\'s colour come from?',
    a: 'From the demosaic onward, from PIXL. LibRaw decodes the RAW and demosaics it; after that the colour is PIXL\'s own: a camera profile fitted by PIXL for each of 46 camera bodies (other cameras use the colour the file carries), editing in PixlRGB, our own working space that holds every colour a camera records, and our own gamut compression, tone mapping and output conversion. PixlRGB is an open specification, published on the PIXL Engine site. Photos you edited in 0.2 can shift a little in 0.3, so Playroom keeps the old preview for you to compare, and you can switch any photo back to the file\'s own colour.'
  },
  {
    q: 'Can it edit and export HDR?',
    a: 'Yes. You can grade a RAW above white and export it as HDR, choosing the white level and the peak brightness in nits: PQ or HLG in AVIF, JPEG XL and PNG, or an SDR picture with a gain map (an Ultra HDR JPEG or an AVIF). Gain-map photos such as an iPhone HEIC open too, and you can edit on their SDR picture or on the HDR one. The editor shows HDR tone-mapped to a standard screen; showing it on an HDR display is planned.'
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
    a: 'It opens camera RAW, DNG, JPEG, JPEG XL, HEIC, TIFF, PNG, WebP and AVIF. It exports JPEG, PNG, TIFF, WebP, AVIF and JPEG XL, one photo at a time or in batches, in sRGB, Display P3, Adobe RGB or Rec.2020. HEIC files open, but export is AVIF instead.'
  },
  {
    q: 'Can an AI agent edit my photos?',
    a: 'Not yet; it\'s planned before 1.0. Playroom will open itself to AI agents through MCP (the Model Context Protocol), so any agent that speaks it can browse your library and use every control, by conversation or on a whole shoot. Every change it makes will be a normal history step, exactly like one you made, that you can review and undo. It\'s included with the app. What you let an agent see goes wherever that agent runs, so a cloud agent means its provider sees it.'
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
