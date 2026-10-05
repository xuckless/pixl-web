// What each Playroom release brought, from the app's own What's new notes
// (pixl-playroom, src/shared/releasenotes.ts). Newest first. Keep the first
// entry's version equal to BETA.version in playroom.ts; `pnpm check` tests it.

export interface Release {
  version: string
  date: string
  headline: string
  sections: { title: string; items: string[] }[]
}

export const RELEASES: Release[] = [
  {
    version: '0.3.0-beta',
    date: 'October 4, 2026',
    headline: 'PIXL’s own colour, a clearer way to export, and scopes at full size.',
    sections: [
      {
        title: 'Colour',
        items: [
          'The engine now works in PixlRGB, PIXL’s own wide working space.',
          'Edits that act on the colour channels themselves (curves, colour mixing, per-channel gain, HSL) can look a little different. Open any photo you edited before to see it before and after; remove the old previews whenever you like.',
          'HDR exports use the engine’s own tone mapping, gamut compression and gain maps.',
          'RAW files use PIXL’s own camera colour for the 46 bodies it knows (the others keep the file’s own). RAWs you edited before can shift a little, and heals, denoise and enhance made on the old colour are marked, because their pixels moved. Your white balance keeps its look. Switch any photo back under Colour in the develop panel.'
        ]
      },
      {
        title: 'Export',
        items: [
          'Export in four steps: Format, Size & colour, Metadata & HDR, and Review, built from the editor’s own cards and sliders.',
          'Review shows the first photo as it will be exported, and what would go wrong before it does: a setting that cannot work, a folder that cannot be written, a full disk, files that would be replaced.',
          'Fit a photo inside a width and height, and read what each rendering intent does next to the choice.'
        ]
      },
      {
        title: 'Scopes',
        items: [
          'The histogram and the colour chart open at full size: overlay, parade, one channel or luma, with the before picture behind and HDR in stops.',
          'A CIE 1976 chart with PixlRGB and the gamuts you compare it to.',
          'Metrics before and after (range, contrast, clipping, colour cast), the photo’s dominant colours with their values, and how it reads with a colour-vision deficiency.'
        ]
      },
      {
        title: 'Masks',
        items: [
          'Object detection has its own button beside the brush, gradients and lasso.',
          'A mask’s edge is one crisp line at any zoom.',
          'The pins over the photo are gone; gradient and lasso handles show when the pointer is over the photo.'
        ]
      },
      {
        title: 'Changes',
        items: [
          'HEIC export is replaced by AVIF (HEIC files still open).',
          'Select Subject is moving to one smaller model (U²-Netp). If you already have U²-Net or the exact JPEG repair, they are listed under AI models as being retired: U²-Net keeps making Subject and Background masks until the next update, and either can be removed to free the space.'
        ]
      }
    ]
  },
  {
    version: '0.2.0-beta',
    date: 'October 2, 2026',
    headline: 'Looks, a new way to make masks, and a new RAW engine.',
    sections: [
      {
        title: 'Looks',
        items: [
          'Over 300 looks, from film stocks and cinema to camera makers’ own, browsed on your photo with live previews, search and shelves.',
          'Hover a look to see it on the photo, then dial it in with Amount. Clicking another swaps it.',
          'Smart looks find the subject, the sky or an object and adjust just that part.',
          'Save your own looks with their masks and AI steps: they are made again on every photo you use them on.'
        ]
      },
      {
        title: 'Masks',
        items: [
          'Objects: point at anything and Playroom selects it. Hover and click, draw a box or scribble over it; Shift adds a part, Alt takes one away.',
          'The sky in a click, and a lasso that finds the object inside it.',
          'Snap to edges for brushes, lassos and AI masks, and crisper Subject and Background edges.',
          'A bidirectional gradient, and gradients that stay exact at any size.',
          'A clearer masks panel, and Molten glass draws a solid line along sharp edges.'
        ]
      },
      {
        title: 'Develop',
        items: [
          'A new RAW engine (LibRaw): more cameras, and RAW files that would not open before are tried again.',
          'Sharp 1:1 zoom on straightened, cropped and lens-corrected photos.',
          'Defish fisheye lenses with their lens profiles.',
          'Faster RAW previews, using a third of the memory on large files.',
          'New sliders: drag the bar, click the value to type one, double-click to reset.'
        ]
      }
    ]
  }
]
