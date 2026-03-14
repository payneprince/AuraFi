#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
MODE="lint"
for arg in "$@"; do
  case "$arg" in
    --build)
      MODE="build"
      ;;
    --runtime-only)
      MODE="runtime-only"
      ;;
  esac
done

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
  code="$(curl -sS -o /dev/null -w '%{http_code}' "http://127.0.0.1:${port}/" 2>/dev/null || true)"
  code="${code:-000}"
  echo "- $app @ :$port -> HTTP $code"
}

check_endpoint() {
  local label="$1"
  local url="$2"
  local code
  code="$(curl -sS -o /dev/null -w '%{http_code}' "$url" 2>/dev/null || true)"
  code="${code:-000}"
  echo "- $label -> HTTP $code"
  if [[ "$code" != "200" ]]; then
    return 1
  fi
}

if [[ "$MODE" != "runtime-only" ]]; then
  for entry in "${apps[@]}"; do
    IFS=':' read -r app _port <<< "$entry"
    run_task "$app" lint
  done
fi

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
echo "[suite-health] API checks"
check_endpoint "AuraFinance state" "http://127.0.0.1:3000/api/state?userId=1"
check_endpoint "AuraFinance suite balances" "http://127.0.0.1:3000/api/suite-balances?userId=1"
check_endpoint "AuraFinance unified ledger" "http://127.0.0.1:3000/api/unified-ledger?userId=1"
check_endpoint "AuraBank state" "http://127.0.0.1:3001/api/state?userId=1"
check_endpoint "AuraBank unified ledger" "http://127.0.0.1:3001/api/unified-ledger?userId=1"
check_endpoint "AuraVest state" "http://127.0.0.1:3002/api/state?userId=1"
check_endpoint "AuraVest unified ledger" "http://127.0.0.1:3002/api/unified-ledger?userId=1"
check_endpoint "AuraWallet state" "http://127.0.0.1:3003/api/state?userId=1"
check_endpoint "AuraWallet unified ledger" "http://127.0.0.1:3003/api/unified-ledger?userId=1"

echo
echo "[suite-health] Complete"
