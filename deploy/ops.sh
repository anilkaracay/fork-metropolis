#!/bin/sh
set -eu
cd "$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
compose() { docker compose --env-file image.env -p fork-metropolis-prod -f compose.yaml "$@"; }
case "${1:-status}" in
  deploy)
    compose config --quiet
    compose up -d --wait --wait-timeout 120 postgres
    compose run --rm --no-deps migrate
    compose up -d --wait --wait-timeout 120 app
    ;;
  status) compose ps ;;
  logs) compose logs --tail 100 app postgres ;;
  restart)
    compose restart postgres app
    compose up -d --wait --wait-timeout 120 postgres app
    ;;
  backup)
    umask 077
    mkdir -p backups
    backup="backups/fork-prod-$(date -u +%Y%m%dT%H%M%SZ).dump"
    compose exec -T postgres pg_dump -U fork_prod -d fork_prod -Fc > "$backup"
    test -s "$backup"
    printf 'Backup saved in %s\n' "$backup"
    ;;
  *) printf 'Use deploy, status, logs, restart or backup.\n' >&2; exit 1 ;;
esac
