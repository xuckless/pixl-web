// Keeps the version facts on the Playroom site in step. The one source is BETA
// in src/data/playroom.ts; this fails (exit 1) if another file says something
// different about the current build. Run by `pnpm check`.
//
// 1. src/data/releases.ts starts with BETA.version.
// 2. public/playroom/llms.txt and llms-full.txt name BETA.version as the
//    current build, and the engine version it ships on (BETA.engine).
// 3. No Playroom page or data file writes out a beta version of its own
//    (other than BETA itself, comments, the historical beta-page note and the
//    release notes): they say {BETA.version}.
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { BETA } from '../src/data/playroom.ts'
import { RELEASES } from '../src/data/releases.ts'

const root = new URL('..', import.meta.url).pathname
const read = (p: string) => readFileSync(join(root, p), 'utf8')
const errors: string[] = []
const VERSION = /\b\d+\.\d+\.\d+-beta(?:\.\d+)?\b/g

if (RELEASES[0].version !== BETA.version) {
  errors.push(`src/data/releases.ts starts with ${RELEASES[0].version}, but BETA.version is ${BETA.version}`)
}

for (const f of ['public/playroom/llms.txt', 'public/playroom/llms-full.txt']) {
  const text = read(f)
  const current = text.match(/current (?:beta )?build (?:is )?\**(\d+\.\d+\.\d+-beta)/i)?.[1]
  if (current !== BETA.version) errors.push(`${f} says the current build is ${current ?? 'nothing'}, not ${BETA.version}`)
  if (!text.includes(`Engine ${BETA.engine}`)) errors.push(`${f} does not mention PIXL Engine ${BETA.engine}`)
}

function* files(dir: string): Generator<string> {
  for (const name of readdirSync(join(root, dir))) {
    const rel = `${dir}/${name}`
    if (statSync(join(root, rel)).isDirectory()) yield* files(rel)
    else if (rel.endsWith('.astro') || rel.endsWith('.ts')) yield rel
  }
}
const skip = new Set(['src/pages/playroom/beta/index.astro', 'src/pages/playroom/whats-new/index.astro', 'src/data/releases.ts'])
for (const f of [...files('src/pages/playroom'), 'src/data/playroom.ts']) {
  if (skip.has(f)) continue
  read(f).split('\n').forEach((line, i) => {
    const code = line.trim()
    if (code.startsWith('//') || code.startsWith('*') || code.startsWith('/*') || code.includes('export const BETA')) return
    if (VERSION.test(line)) errors.push(`${f}:${i + 1} writes a beta version out; use {BETA.version}`)
    VERSION.lastIndex = 0
  })
}

if (errors.length) {
  console.error(`check-facts: ${errors.length} problem(s)\n- ${errors.join('\n- ')}`)
  process.exit(1)
}
console.log(`check-facts: ok (Playroom ${BETA.version} on PIXL Engine ${BETA.engine})`)
