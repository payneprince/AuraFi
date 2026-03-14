#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
MODE="lint"
if [[ "${1:-}" == "--build" ]]; then
  MODE="build"
fi

apps=(
  "AuraFinance:3000"
  "AuraBank:3001"
  "AuraVest:3002"
  "AuraWallet:3003"
)

echo "[suite-health] Mode: $MODE"
echo "[suite-health] Root: $ROOT_DIR"

run_task() {
  local app="$1"
  local task="$2"
  echo
  echo "==> $app :: npm run $task"
  (cd "$ROOT_DIR/$app" && npm run "$task")
}

check_port() {
  local app="$1"
  local port="$2"
  local code
  code="$(curl -sS -o /dev/null -w '%{http_code}' "http://127.0.0.1:${port}/" || echo "000")"
  echo "- $app @ :$port -> HTTP $code"
}

for entry in "${apps[@]}"; do
  IFS=':' read -r app _port <<< "$entry"
  run_task "$app" lint
done

if [[ "$MODE" == "build" ]]; then
  for entry in "${apps[@]}"; do
    IFS=':' read -r app _port <<< "$entry"
    run_task "$app" build
  done
fi

echo

echo "[suite-health] Port checks"
for entry in "${apps[@]}"; do
  IFS=':' read -r app port <<< "$entry"
  check_port "$app" "$port"
done

echo
echo "[suite-health] Complete"
