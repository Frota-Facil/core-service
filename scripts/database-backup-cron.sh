#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRIPT_PATH="${PROJECT_ROOT}/scripts/database-backup-cron.sh"

CRON_MARKER="sif-core-service-database-backup"
CRON_SCHEDULE="${CRON_SCHEDULE:-59 23 * * *}"

ENV_FILE="${ENV_FILE:-}"
BACKUP_DIR="${BACKUP_DIR:-${PROJECT_ROOT}/backups/database}"
LOG_FILE="${LOG_FILE:-${PROJECT_ROOT}/backups/database-backup.log}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"

usage() {
	cat <<EOF
Usage:
  $0 install    Instala o backup do cron job diariamente às 23:59
  $0 run        Roda o backup do banco
  $0 status     Mostra se cron tá instalado
  $0 uninstall  Remove o cron jojb já instalado

Variáveis de ambiente opcionais:
  ENV_FILE        Caminho pro arquivo .env. Padrão é .env, depois .env.dev
  BACKUP_DIR      Diretório do backup. Default é backups/database
  LOG_FILE        Arquivo de log do cron. Default é backups/database-backup.log
  RETENTION_DAYS  Quantidade de dias que mantemos os arquivos de backup. Defaults é 14 dias
  CRON_SCHEDULE   Define a frequência de execução do cron job. Defaults to "59 23 * * *" Nesse caso, é de 23:59
EOF
}

load_env() {
	if [[ -z "${ENV_FILE}" ]]; then
		if [[ -f "${PROJECT_ROOT}/.env" ]]; then
			ENV_FILE="${PROJECT_ROOT}/.env"
		elif [[ -f "${PROJECT_ROOT}/.env.dev" ]]; then
			ENV_FILE="${PROJECT_ROOT}/.env.dev"
		else
			ENV_FILE="${PROJECT_ROOT}/.env.example"
		fi
	fi

	if [[ -f "${ENV_FILE}" ]]; then
		set -a
		# shellcheck disable=SC1090
		source "${ENV_FILE}"
		set +a
	fi

	: "${POSTGRES_USER:?POSTGRES_USER is required}"
	: "${POSTGRES_PASSWORD:?POSTGRES_PASSWORD is required}"
	: "${POSTGRES_DB:?POSTGRES_DB is required}"
	: "${POSTGRES_HOST:=localhost}"
	: "${POSTGRES_PORT:=5432}"
}

docker_container_is_running() {
	local container_name="$1"

	if ! command -v docker >/dev/null 2>&1; then
		return 1
	fi

	docker ps --format '{{.Names}}' | grep -Fxq "${container_name}"
}

run_backup_with_docker() {
	local container_name="$1"
	local backup_file="$2"

	docker exec \
		-e PGPASSWORD="${POSTGRES_PASSWORD}" \
		"${container_name}" \
		pg_dump \
		--username="${POSTGRES_USER}" \
		--dbname="${POSTGRES_DB}" \
		--format=custom \
		--no-owner \
		--no-privileges >"${backup_file}"
}

run_backup_with_local_pg_dump() {
	local backup_file="$1"

	if ! command -v pg_dump >/dev/null 2>&1; then
		echo "pg_dump não foi encontrado localmente e não foi encontrado nenhum container do Postgres rodando." >&2
		echo "Instale postgresql-client ou inicie o container do banco de dados antes de rodar o backup." >&2
		return 1
	fi

	PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump \
		--host="${POSTGRES_HOST}" \
		--port="${POSTGRES_PORT}" \
		--username="${POSTGRES_USER}" \
		--dbname="${POSTGRES_DB}" \
		--format=custom \
		--no-owner \
		--no-privileges >"${backup_file}"
}

run_backup() {
	load_env
	mkdir -p "${BACKUP_DIR}" "$(dirname "${LOG_FILE}")"

	local timestamp
	local backup_file
	local container_name

	timestamp="$(date +%Y%m%d_%H%M%S)"
	backup_file="${BACKUP_DIR}/${POSTGRES_DB}_${timestamp}.dump"
	container_name="${POSTGRES_CONTAINER:-${POSTGRES_HOST}}"

	echo "[$(date --iso-8601=seconds)] Iniciando backup do banco: ${POSTGRES_DB}"

	if docker_container_is_running "${container_name}"; then
		run_backup_with_docker "${container_name}" "${backup_file}"
	else
		run_backup_with_local_pg_dump "${backup_file}"
	fi

	find "${BACKUP_DIR}" \
		-type f \
		-name "${POSTGRES_DB}_*.dump" \
		-mtime +"${RETENTION_DAYS}" \
		-delete

	echo "[$(date --iso-8601=seconds)] Backup criado: ${backup_file}"
}

install_cron() {
	mkdir -p "$(dirname "${LOG_FILE}")"

	local cron_line
	cron_line="${CRON_SCHEDULE} cd \"${PROJECT_ROOT}\" && \"${SCRIPT_PATH}\" run >> \"${LOG_FILE}\" 2>&1 # ${CRON_MARKER}"

	(
		crontab -l 2>/dev/null | grep -Fv "# ${CRON_MARKER}" || true
		echo "${cron_line}"
	) | crontab -

	echo "Cron job instalado:"
	echo "${cron_line}"
}

uninstall_cron() {
	(crontab -l 2>/dev/null | grep -Fv "# ${CRON_MARKER}" || true) | crontab -
	echo "Cron job removido: ${CRON_MARKER}"
}

show_status() {
	if crontab -l 2>/dev/null | grep -F "# ${CRON_MARKER}"; then
		return 0
	fi

	echo "Nenhum cron job instalado para ${CRON_MARKER}."
}

case "${1:-}" in
	install)
		install_cron
		;;
	run)
		run_backup
		;;
	status)
		show_status
		;;
	uninstall)
		uninstall_cron
		;;
	-h | --help | help)
		usage
		;;
	*)
		usage
		exit 1
		;;
esac
