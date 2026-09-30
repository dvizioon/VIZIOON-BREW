#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export DEPLOY_DIR="production"
export COMPOSE_FILE="${COMPOSE_FILE:-production/docker-compose.yaml}"

exec bash "$SCRIPT_DIR/../deploy.sh"
