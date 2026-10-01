#!/usr/bin/env bash
# Creates the pixl-reports R2 bucket the Worker keeps reports in (worker/api.ts,
# binding REPORTS), with a lifecycle rule per prefix that deletes reports once
# the retention period is over. Run once before the first deploy that binds it
# (`wrangler deploy` fails while the bucket is missing); running it again
# replaces the rules, so changing a period is: edit below, run, and update
# the privacy policy (src/legal/privacy.md).
#
#   scripts/reports-bucket.sh
#
# Needs `wrangler login`. Symbols (symbols/, uploaded by pixl-playroom's
# release build) are kept as long as the releases they belong to.
set -euo pipefail

BUCKET=pixl-reports
# Retention, in days. The privacy policy must say the same.
CRASH_DAYS=90
REPORT_DAYS=365

cd "$(dirname "$0")/.."
wrangler() { pnpm exec wrangler "$@"; }

wrangler r2 bucket info "$BUCKET" >/dev/null 2>&1 || wrangler r2 bucket create "$BUCKET"
for rule in crash minidump report; do
  wrangler r2 bucket lifecycle remove "$BUCKET" --name "$rule-expiry" >/dev/null 2>&1 || true
done
wrangler r2 bucket lifecycle add "$BUCKET" crash-expiry crash/ --expire-days "$CRASH_DAYS" --force
wrangler r2 bucket lifecycle add "$BUCKET" minidump-expiry minidump/ --expire-days "$CRASH_DAYS" --force
wrangler r2 bucket lifecycle add "$BUCKET" report-expiry report/ --expire-days "$REPORT_DAYS" --force
wrangler r2 bucket lifecycle list "$BUCKET"
