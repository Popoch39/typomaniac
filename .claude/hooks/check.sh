#!/usr/bin/env bash
# Stop : lance `bun run check` (format, lint, types) avant de rendre la main.
# En cas d'échec, bloque l'arrêt (exit 2) et renvoie la sortie à Claude.
set -uo pipefail

input=$(cat)
cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0

if out=$(bun run check 2>&1); then
  exit 0
fi

# Déjà relancé par ce hook une fois : on n'enchaîne pas en boucle, on prévient.
if [[ "$(jq -r '.stop_hook_active // false' <<<"$input")" == "true" ]]; then
  jq -n --arg msg "bun run check échoue encore, voir la sortie ci-dessus." '{systemMessage: $msg}'
  exit 0
fi

echo "bun run check a échoué. Corrige avant de rendre la main :" >&2
echo "$out" | tail -60 >&2
exit 2
