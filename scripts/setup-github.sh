#!/bin/bash
# Run this AFTER making the repo public to configure GitHub settings
# Usage: ./scripts/setup-github.sh

set -e

REPO="Vibeping/vibeping"

echo "=== Setting up branch protection on main ==="
gh api -X PUT "repos/$REPO/branches/main/protection" \
  --input - <<'EOF'
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["build"]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": null,
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
EOF
echo "✅ Branch protection enabled (CI must pass, no force push)"

echo ""
echo "=== Enabling vulnerability alerts ==="
gh api -X PUT "repos/$REPO/vulnerability-alerts" 2>/dev/null || true
echo "✅ Vulnerability alerts enabled"

echo ""
echo "=== Enabling automated security fixes ==="
gh api -X PUT "repos/$REPO/automated-security-fixes" 2>/dev/null || true
echo "✅ Automated security fixes enabled"

echo ""
echo "=== Done! Repo is configured for public use ==="
