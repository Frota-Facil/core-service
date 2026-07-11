#!/usr/bin/env bash
set -euo pipefail

COMPOSE_FILE="compose.dev.yml"
SERVICE_NAME="app-dev"

run_step() {
  local script_name="$1"
  echo ""
  echo "> docker compose -f ${COMPOSE_FILE} exec -T ${SERVICE_NAME} npm run ${script_name}"
  docker compose -f "${COMPOSE_FILE}" exec -T "${SERVICE_NAME}" npm run "${script_name}"
}

run_step "db:generate"
run_step "db:migrate"
run_step "db:seed"

echo ""
echo "Database migration, generation and seed completed."
