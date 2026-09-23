#!/usr/bin/env bash
# PostToolUse (Write|Edit) : formate et autofix le fichier modifié, puis remonte
# à Claude les erreurs de lint restantes (exit 2) pour qu'il les corrige.
set -uo pipefail

file=$(jq -r '.tool_response.filePath // .tool_input.file_path // empty')
[[ -z "$file" || ! -f "$file" ]] && exit 0

root="${CLAUDE_PROJECT_DIR:-$(git -C "$(dirname "$file")" rev-parse --show-toplevel)}"
cd "$root" || exit 0

case "$file" in
  "$root"/node_modules/* | */node_modules/*) exit 0 ;;
esac

case "$file" in
  *.ts | *.tsx | *.js | *.jsx | *.mts | *.cts | *.mjs | *.cjs)
    ./node_modules/.bin/oxfmt "$file" >/dev/null 2>&1
    ./node_modules/.bin/oxlint --fix "$file" >/dev/null 2>&1
    if ! out=$(./node_modules/.bin/oxlint --max-warnings 0 "$file" 2>&1); then
      echo "oxlint : erreurs restantes dans $file, à corriger sans oxlint-disable ni cast :" >&2
      echo "$out" >&2
      exit 2
    fi
    ;;
  *.json | *.jsonc | *.md | *.css | *.html | *.yaml | *.yml)
    ./node_modules/.bin/oxfmt --no-error-on-unmatched-pattern "$file" >/dev/null 2>&1
    ;;
esac

exit 0
