#!/usr/bin/env bash
# Commit and push the site.
#
#   ./deploy.sh "commit message"

set -euo pipefail
cd "$(dirname "$0")"

# The invoicing quiz goes live with any push, so it has to be finished first.
placeholder='\[(À ÉCRIRE|GOOGLE_BOOKING_URL|APPS_SCRIPT_URL)\]'
if grep -qE "$placeholder" facturation/patterns.json; then
  echo "facturation/patterns.json still has placeholders, fill them before deploying:" >&2
  grep -nE "$placeholder" facturation/patterns.json >&2
  exit 1
fi
if ! node --test facturation/quiz.test.js >/dev/null 2>&1; then
  echo "facturation tests fail, run: node --test facturation/quiz.test.js" >&2
  exit 1
fi

if ! git diff --quiet || ! git diff --cached --quiet; then
  git add -A
  git commit -q -m "${1:-Update site}"
  echo "committed: ${1:-Update site}"
else
  echo "no local changes to commit"
fi

git push -q origin main
echo "pushed $(git rev-parse --short HEAD)"
