#!/usr/bin/env bash
# Commit and push the site.
#
#   ./deploy.sh "commit message"

set -euo pipefail
cd "$(dirname "$0")"

if ! git diff --quiet || ! git diff --cached --quiet; then
  git add -A
  git commit -q -m "${1:-Update site}"
  echo "committed: ${1:-Update site}"
else
  echo "no local changes to commit"
fi

git push -q origin main
echo "pushed $(git rev-parse --short HEAD)"
