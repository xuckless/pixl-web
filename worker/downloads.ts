// Download links that always point at the newest build, read from the update
// feeds in the pixl-updates bucket (updates.pixlfoundation.com, laid out by
// pixl-playroom's release workflow):
//   playroom/latest.yml, latest-mac.yml   the stable feeds (electron-updater)
//   playroom/beta.yml, beta-mac.yml       the beta feeds (always the newest of beta and stable)
//   playroom/<version>/<file>             that version's installers
//
//   GET playroom.pixlfoundation.com/download/<platform>[?channel=beta]   → 302 to the installer
//   GET /api/downloads/playroom[?channel=beta]                          → { version, files: { platform: url } }

const UPDATES = 'https://updates.pixlfoundation.com'

/** Each platform's feed (mac or windows) and installer name, which carries no version. */
const PLATFORMS: Record<string, { mac: boolean; file: string }> = {
  'mac-arm64': { mac: true, file: 'pixl-playroom-mac-arm64.dmg' },
  'mac-x64': { mac: true, file: 'pixl-playroom-mac-x64.dmg' },
  'win-x64': { mac: false, file: 'pixl-playroom-win-x64-setup.exe' }
}

type Channel = 'latest' | 'beta'

/** The version a feed names (its top-level `version:` line), or null while there's no feed. */
async function feedVersion(channel: Channel, mac: boolean): Promise<string | null> {
  const res = await fetch(`${UPDATES}/playroom/${channel}${mac ? '-mac' : ''}.yml`, { cf: { cacheTtl: 60, cacheEverything: true } })
  if (!res.ok) return null
  const v = /^version:\s*['"]?([0-9A-Za-z.+-]+)['"]?\s*$/m.exec(await res.text())?.[1]
  return v ?? null
}

const channelOf = (url: URL): Channel => (url.searchParams.get('channel') === 'beta' ? 'beta' : 'latest')

/** The newest build's version and installer links for a channel; nulls before the first release. */
async function downloads(channel: Channel): Promise<{ version: string | null; files: Record<string, string> }> {
  const [mac, win] = await Promise.all([feedVersion(channel, true), feedVersion(channel, false)])
  const files: Record<string, string> = {}
  for (const [platform, p] of Object.entries(PLATFORMS)) {
    const v = p.mac ? mac : win
    if (v) files[platform] = `${UPDATES}/playroom/${v}/${p.file}`
  }
  return { version: mac ?? win, files }
}

export async function handleDownloadApi(url: URL): Promise<Response> {
  return Response.json(await downloads(channelOf(url)), { headers: { 'Cache-Control': 'public, max-age=60' } })
}

/** playroom…/download/<platform>: the installer, or back to the page when there's none yet. */
export async function handleDownload(url: URL): Promise<Response> {
  const platform = url.pathname.replace(/^\/download\//, '').replace(/\/$/, '')
  const p = PLATFORMS[platform]
  const channel = channelOf(url)
  const fallback = new URL(channel === 'beta' ? '/beta/?download=soon' : '/#pricing', url)
  if (!p) return Response.redirect(fallback.toString(), 302)
  const v = await feedVersion(channel, p.mac)
  const to = v ? `${UPDATES}/playroom/${v}/${p.file}` : fallback.toString()
  return new Response(null, { status: 302, headers: { Location: to, 'Cache-Control': 'public, max-age=60' } })
}
