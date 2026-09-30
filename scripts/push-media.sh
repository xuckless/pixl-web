#!/usr/bin/env bash
# Uploads media/ to the pixl-media R2 bucket, served at https://media.pixlfoundation.com.
# Video lives there rather than in the Worker's static assets because assets
# don't answer Range requests, and Safari won't play a video without them.
#
#   scripts/push-media.sh [file ...]      (default: everything under media/)
#
# media/playroom/hero.mp4 → https://media.pixlfoundation.com/playroom/hero.mp4
# Needs `wrangler login`. Objects keep their key, so browsers may hold a
# replaced file for up to a day (Cache-Control below): give a changed video a
# new name if it has to show at once.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BUCKET=pixl-media
cd "$ROOT/media"

files=("$@")
[ "${#files[@]}" -gt 0 ] || while IFS= read -r f; do files+=("${f#./}"); done < <(find . -type f ! -name '.*' | sort)

for f in "${files[@]}"; do
  f="${f#media/}"
  case "$f" in
    *.mp4) type=video/mp4 ;;
    *.webm) type=video/webm ;;
    *.webp) type=image/webp ;;
    *.jpg) type=image/jpeg ;;
    *) echo "skip $f: unknown type" >&2; continue ;;
  esac
  echo "put $f"
  (cd "$ROOT" && pnpm exec wrangler r2 object put "$BUCKET/$f" --file "media/$f" --remote \
    --content-type "$type" --cache-control 'public, max-age=86400')
done
