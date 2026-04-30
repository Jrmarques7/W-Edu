#!/usr/bin/env bash
set -Eeuo pipefail

# Generic deploy/update script for systemd-based projects.
#
# W-Edu default usage on the server:
#   sudo bash deploy/update.sh
#
# Reusable usage for other projects:
#   sudo APP_DIR=/var/www/my-app \
#     BRANCH=main \
#     BACKEND_DIR=api \
#     FRONTEND_DIR=web \
#     BACKEND_SERVICE=my-api \
#     FRONTEND_SERVICE=my-web \
#     MIGRATE_CMD="PYTHONPATH=/var/www/my-app/api .venv/bin/alembic --config alembic.ini upgrade head" \
#     FRONTEND_BUILD_CMD="npm ci && npm run build" \
#     bash deploy/update.sh

APP_DIR="${APP_DIR:-/var/www/W-Edu}"
BRANCH="${BRANCH:-main}"
REMOTE="${REMOTE:-origin}"

BACKEND_DIR="${BACKEND_DIR:-backend}"
FRONTEND_DIR="${FRONTEND_DIR:-frontend}"

BACKEND_SERVICE="${BACKEND_SERVICE:-wedu-backend}"
FRONTEND_SERVICE="${FRONTEND_SERVICE:-wedu-frontend}"
RELOAD_NGINX="${RELOAD_NGINX:-true}"

PYTHON_BIN="${PYTHON_BIN:-python3}"
PIP_INSTALL_CMD="${PIP_INSTALL_CMD:-.venv/bin/pip install -r requirements.txt}"
MIGRATE_CMD="${MIGRATE_CMD:-PYTHONPATH=$APP_DIR/$BACKEND_DIR .venv/bin/alembic --config alembic.ini upgrade head}"
FRONTEND_BUILD_CMD="${FRONTEND_BUILD_CMD:-npm ci && npm run build}"

RUN_BACKEND="${RUN_BACKEND:-true}"
RUN_FRONTEND="${RUN_FRONTEND:-true}"
RUN_GIT_PULL="${RUN_GIT_PULL:-true}"

log() {
  printf '\n==> %s\n' "$*"
}

run() {
  printf '+ %s\n' "$*"
  "$@"
}

run_shell() {
  local command="$1"
  printf '+ %s\n' "$command"
  bash -lc "$command"
}

require_dir() {
  local path="$1"
  if [[ ! -d "$path" ]]; then
    echo "Directory not found: $path" >&2
    exit 1
  fi
}

restart_service() {
  local service="$1"
  if [[ -n "$service" ]]; then
    run systemctl restart "$service"
  fi
}

status_service() {
  local service="$1"
  if [[ -n "$service" ]]; then
    run systemctl --no-pager --lines=20 status "$service"
  fi
}

if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
  echo "This script should run as root because it restarts systemd services." >&2
  echo "Use: sudo bash deploy/update.sh" >&2
  exit 1
fi

require_dir "$APP_DIR"

log "Deploy configuration"
cat <<EOF
APP_DIR=$APP_DIR
REMOTE=$REMOTE
BRANCH=$BRANCH
BACKEND_DIR=$BACKEND_DIR
FRONTEND_DIR=$FRONTEND_DIR
BACKEND_SERVICE=$BACKEND_SERVICE
FRONTEND_SERVICE=$FRONTEND_SERVICE
RELOAD_NGINX=$RELOAD_NGINX
EOF

cd "$APP_DIR"

if [[ "$RUN_GIT_PULL" == "true" ]]; then
  log "Updating source"
  run git fetch "$REMOTE" "$BRANCH"
  run git checkout "$BRANCH"
  run git pull --ff-only "$REMOTE" "$BRANCH"
fi

if [[ "$RUN_BACKEND" == "true" ]]; then
  require_dir "$APP_DIR/$BACKEND_DIR"
  log "Updating backend"
  cd "$APP_DIR/$BACKEND_DIR"

  if [[ ! -d ".venv" ]]; then
    run "$PYTHON_BIN" -m venv .venv
  fi

  run_shell "$PIP_INSTALL_CMD"
  run_shell "$MIGRATE_CMD"
  restart_service "$BACKEND_SERVICE"
fi

if [[ "$RUN_FRONTEND" == "true" ]]; then
  require_dir "$APP_DIR/$FRONTEND_DIR"
  log "Building frontend"
  cd "$APP_DIR/$FRONTEND_DIR"
  run_shell "$FRONTEND_BUILD_CMD"
  restart_service "$FRONTEND_SERVICE"
fi

if [[ "$RELOAD_NGINX" == "true" ]]; then
  log "Reloading nginx"
  run nginx -t
  run systemctl reload nginx
fi

log "Service status"
status_service "$BACKEND_SERVICE" || true
status_service "$FRONTEND_SERVICE" || true

log "Deploy finished"
