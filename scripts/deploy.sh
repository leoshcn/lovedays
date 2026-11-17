#!/usr/bin/env bash
# Deploy the committed HEAD to a Docker host over SSH.
# Usage: scripts/deploy.sh [user@host] [remote_dir]
set -euo pipefail

TARGET="${1:-root@your-server}"
REMOTE_DIR="${2:-/opt/lovedays}"
REV="$(git rev-parse --short HEAD)"
ARCHIVE="lovedays-${REV}.tar.gz"

git archive --format=tar.gz -o "$ARCHIVE" HEAD
trap 'rm -f "$ARCHIVE"' EXIT
scp "$ARCHIVE" "$TARGET:/tmp/$ARCHIVE"

ssh "$TARGET" bash -s -- "$REMOTE_DIR" "$ARCHIVE" "$REV" <<'REMOTE'
set -euo pipefail
DIR="$1"; ARCHIVE="$2"; REV="$3"
mkdir -p "$DIR"
cd "$DIR"
# Replace sources but keep the host-only .env
find . -mindepth 1 -maxdepth 1 ! -name .env -exec rm -rf {} +
tar -xzf "/tmp/$ARCHIVE" && rm -f "/tmp/$ARCHIVE"
echo "$REV" > REVISION

if [ ! -f .env ]; then
  echo "Creating .env with fresh secrets"
  sed -e "s|^BETTER_AUTH_SECRET=.*|BETTER_AUTH_SECRET=$(openssl rand -base64 32)|" \
      -e "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$(openssl rand -hex 24)|" \
      .env.production.example > .env
  chmod 600 .env
fi

docker compose up -d --build
docker image prune -f >/dev/null
docker compose ps
REMOTE
