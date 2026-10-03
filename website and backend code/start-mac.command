#!/bin/bash
set -e
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo 'Install Node.js 22.13 or newer from nodejs.org, then run this script again.'
  exit 1
fi
node -e 'const [a,b]=process.versions.node.split(".").map(Number);if(a<22||(a===22&&b<13)){console.error("Node 22.13 or newer is required.");process.exit(1)}'
npx --yes pnpm@11.25.0 install --frozen-lockfile
npx --yes pnpm@11.25.0 dev
