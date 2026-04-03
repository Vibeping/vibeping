#!/usr/bin/env bash
#
# publish-cdn.sh — Build the VibePing SDK and prepare CDN-ready files
#
# Usage: ./scripts/publish-cdn.sh
#
# Output:
#   cdn/v1.js       — UMD build (for <script> tags)
#   cdn/v1.esm.js   — ESM build (for bundlers / <script type="module">)
#
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SDK_DIR="$REPO_ROOT/packages/sdk"
CDN_DIR="$REPO_ROOT/cdn"

echo "==> Building SDK..."
cd "$SDK_DIR"
pnpm build

echo "==> Preparing cdn/ directory..."
mkdir -p "$CDN_DIR"
cp dist/vibeping.umd.js "$CDN_DIR/v1.js"
cp dist/vibeping.esm.js "$CDN_DIR/v1.esm.js"

echo "==> Generating integrity hashes (sha384)..."
UMD_HASH=$(openssl dgst -sha384 -binary "$CDN_DIR/v1.js" | openssl base64 -A)
ESM_HASH=$(openssl dgst -sha384 -binary "$CDN_DIR/v1.esm.js" | openssl base64 -A)

echo ""
echo "============================================"
echo "  CDN files ready in cdn/"
echo "============================================"
echo ""
echo "UMD (v1.js):"
echo "  Integrity: sha384-$UMD_HASH"
echo ""
echo "ESM (v1.esm.js):"
echo "  Integrity: sha384-$ESM_HASH"
echo ""
echo "--- Script tag (copy/paste) ---"
echo ""
echo "<script src=\"https://cdn.vibeping.dev/v1.js\""
echo "        integrity=\"sha384-$UMD_HASH\""
echo "        crossorigin=\"anonymous\""
echo "        data-id=\"vp_YOUR_PROJECT_ID\"></script>"
echo ""
echo "--- ESM import ---"
echo ""
echo "<script type=\"module\">"
echo "  import { vibeping } from 'https://cdn.vibeping.dev/v1.esm.js';"
echo "  vibeping.init({ id: 'vp_YOUR_PROJECT_ID' });"
echo "</script>"
echo ""
echo "Done! Upload cdn/ contents to your CDN origin."
