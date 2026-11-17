#!/usr/bin/env bash
# Deploy the committed HEAD to a Docker host over SSH.
#
# The Next.js build runs on the host inside a throwaway container with HARD resource
# limits (memory without swap + CPU), so a heavy build can never starve other services:
# if it exceeds the limit, only the build is OOM-killed. `docker build` afterwards only
# copies the prebuilt output (Dockerfile.runtime).
#
# Usage: scripts/deploy.sh [user@host] [remote_dir]
set -euo pipefail

TARGET="${1:-root@your-server}"
REMOTE_DIR="${2:-/opt/lovedays}"
REV="$(git rev-parse --short HEAD)"
ARCHIVE="lovedays-${REV}.tar.gz"
BUILD_MEMORY="${BUILD_MEMORY:-2g}"
BUILD_CPUS="${BUILD_CPUS:-2}"

git archive --format=tar.gz -o "$ARCHIVE" HEAD
trap 'rm -f "$ARCHIVE"' EXIT
scp "$ARCHIVE" "$TARGET:/tmp/$ARCHIVE"

ssh "$TARGET" bash -s -- "$REMOTE_DIR" "$ARCHIVE" "$REV" "$BUILD_MEMORY" "$BUILD_CPUS" <<'REMOTE'
set -euo pipefail
DIR="$1"; ARCHIVE="$2"; REV="$3"; MEM="$4"; CPUS="$5"
mkdir -p "$DIR"
cd "$DIR"

# Replace sources but keep the host-only .env
find . -mindepth 1 -maxdepth 1 ! -name .env -exec rm -rf {} +
tar -xzf "/tmp/$ARCHIVE" && rm -f "/tmp/$ARCHIVE"
echo "$REV" > REVISION

if [ ! -s .env ]; then
  echo "==> Creating .env with fresh secrets"
  sed -e "s|^BETTER_AUTH_SECRET=.*|BETTER_AUTH_SECRET=$(openssl rand -base64 32)|" \
      -e "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$(openssl rand -hex 24)|" \
      .env.production.example > .env.tmp
  chmod 600 .env.tmp && mv .env.tmp .env
fi
set -a; . ./.env; set +a

echo "==> Building in a capped container (memory=$MEM, no swap, cpus=$CPUS)"
docker run --rm \
  --memory="$MEM" --memory-swap="$MEM" --cpus="$CPUS" --pids-limit=512 \
  -v "$DIR":/app -w /app \
  -v lovedays-pnpm-store:/pnpm-store \
  -e npm_config_registry="${NPM_REGISTRY:-https://registry.npmjs.org/}" \
  -e npm_config_store_dir=/pnpm-store \
  -e NODE_OPTIONS=--max-old-space-size=1280 \
  -e NEXT_BUILD_CPUS=1 \
  -e NEXT_TELEMETRY_DISABLED=1 \
  -e DATABASE_URL=postgres://build:build@127.0.0.1:5432/build \
  -e BETTER_AUTH_SECRET=build-time-placeholder-not-used-at-runtime \
  node:24-slim \
  sh -c "npm install -g pnpm@12.16.1 >/dev/null && pnpm install --frozen-lockfile && pnpm build"

echo "==> Packaging runtime image and starting"
docker compose up -d --build
docker image prune -f >/dev/null
docker compose ps
REMOTE
