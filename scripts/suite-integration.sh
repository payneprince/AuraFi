#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TMP_DIR="$(mktemp -d)"

BANK_STATE_FILE="$ROOT_DIR/AuraBank/.data/aurabank-state.json"
WALLET_STATE_FILE="$ROOT_DIR/AuraWallet/.data/aurawallet-state.json"
VEST_STATE_FILE="$ROOT_DIR/AuraVest/.data/auravest-state.json"
LEDGER_STATE_FILE="$ROOT_DIR/.data/aura-unified-ledger-events.json"

backup_file() {
  local source_file="$1"
  local backup_file="$2"
  if [[ -f "$source_file" ]]; then
    cp "$source_file" "$backup_file"
  else
    : > "$backup_file.absent"
  fi
}

restore_file() {
  local source_file="$1"
  local backup_file="$2"
  if [[ -f "$backup_file" ]]; then
    mkdir -p "$(dirname "$source_file")"
    cp "$backup_file" "$source_file"
  else
    rm -f "$source_file"
  fi
}

cleanup() {
  restore_file "$BANK_STATE_FILE" "$TMP_DIR/aurabank-state.json"
  restore_file "$WALLET_STATE_FILE" "$TMP_DIR/aurawallet-state.json"
  restore_file "$VEST_STATE_FILE" "$TMP_DIR/auravest-state.json"
  restore_file "$LEDGER_STATE_FILE" "$TMP_DIR/aura-unified-ledger-events.json"
  rm -rf "$TMP_DIR"
}

trap cleanup EXIT

backup_file "$BANK_STATE_FILE" "$TMP_DIR/aurabank-state.json"
backup_file "$WALLET_STATE_FILE" "$TMP_DIR/aurawallet-state.json"
backup_file "$VEST_STATE_FILE" "$TMP_DIR/auravest-state.json"
backup_file "$LEDGER_STATE_FILE" "$TMP_DIR/aura-unified-ledger-events.json"

require_ok() {
  local label="$1"
  local url="$2"
  local code
  code="$(curl -sS -o /dev/null -w '%{http_code}' "$url" 2>/dev/null || true)"
  code="${code:-000}"
  if [[ "$code" != "200" ]]; then
    echo "[suite-integration] $label failed with HTTP $code" >&2
    exit 1
  fi
}

fetch_json() {
  local url="$1"
  curl -fsS "$url"
}

run_transfer_case() {
  local from_app="$1"
  local to_app="$2"
  local amount="$3"
  local before_file="$TMP_DIR/before-${from_app}-${to_app}.json"
  local after_file="$TMP_DIR/after-${from_app}-${to_app}.json"
  local action_id="integration-${from_app}-to-${to_app}-$(date +%s)"

  fetch_json "http://127.0.0.1:3000/api/suite-balances?userId=1" > "$before_file"
  curl -fsS -X POST 'http://127.0.0.1:3000/api/quick-transfer' \
    -H 'Content-Type: application/json' \
    --data "{\"userId\":\"1\",\"from\":\"${from_app}\",\"to\":\"${to_app}\",\"amount\":${amount},\"actionId\":\"${action_id}\"}" > /dev/null
  fetch_json "http://127.0.0.1:3000/api/suite-balances?userId=1" > "$after_file"

  node - "$before_file" "$after_file" "$from_app" "$to_app" "$amount" <<'NODE'
const fs = require('fs');
const [beforePath, afterPath, fromApp, toApp, amountRaw] = process.argv.slice(2);
const before = JSON.parse(fs.readFileSync(beforePath, 'utf8'));
const after = JSON.parse(fs.readFileSync(afterPath, 'utf8'));
const amount = Number(amountRaw);
const fields = {
  bank: 'bankBalance',
  wallet: 'walletBalance',
  vest: 'vestPortfolioValue',
};

for (const app of Object.keys(fields)) {
  const expected = app === fromApp ? -amount : app === toApp ? amount : 0;
  const actual = Number((Number(after[fields[app]]) - Number(before[fields[app]])).toFixed(2));
  if (Math.abs(actual - expected) > 0.001) {
    console.error(`[suite-integration] transfer ${fromApp}->${toApp} expected ${expected} on ${app}, got ${actual}`);
    process.exit(1);
  }
}
NODE

  echo "[suite-integration] transfer ${from_app}->${to_app} passed"
}

run_ledger_case() {
  local event_id="integration-ledger-$(date +%s)"
  local finance_file="$TMP_DIR/finance-ledger.json"

  curl -fsS -X POST 'http://127.0.0.1:3001/api/unified-ledger' \
    -H 'Content-Type: application/json' \
    --data "{\"userId\":\"1\",\"event\":{\"id\":\"${event_id}\",\"userId\":\"1\",\"app\":\"bank\",\"type\":\"funding.deposit\",\"amount\":1,\"currency\":\"USD\",\"metadata\":{\"source\":\"suite-integration\"}}}" > /dev/null

  fetch_json 'http://127.0.0.1:3000/api/unified-ledger?userId=1' > "$finance_file"

  node - "$finance_file" "$event_id" <<'NODE'
const fs = require('fs');
const [ledgerPath, eventId] = process.argv.slice(2);
const payload = JSON.parse(fs.readFileSync(ledgerPath, 'utf8'));
const events = Array.isArray(payload.events) ? payload.events : [];
const exists = events.some((event) => String(event.id || '') === eventId);
if (!exists) {
  console.error(`[suite-integration] ledger event ${eventId} not visible from AuraFinance`);
  process.exit(1);
}
NODE

  echo "[suite-integration] unified ledger cross-app read passed"
}

echo "[suite-integration] Checking required endpoints"
require_ok "AuraFinance suite balances" "http://127.0.0.1:3000/api/suite-balances?userId=1"
require_ok "AuraFinance unified ledger" "http://127.0.0.1:3000/api/unified-ledger?userId=1"
require_ok "AuraBank unified ledger" "http://127.0.0.1:3001/api/unified-ledger?userId=1"
require_ok "AuraVest unified ledger" "http://127.0.0.1:3002/api/unified-ledger?userId=1"
require_ok "AuraWallet unified ledger" "http://127.0.0.1:3003/api/unified-ledger?userId=1"

echo "[suite-integration] Running transfer propagation checks"
run_transfer_case "bank" "wallet" "1"
run_transfer_case "bank" "vest" "1"
run_transfer_case "wallet" "bank" "1"
run_transfer_case "wallet" "vest" "1"
run_transfer_case "vest" "bank" "1"
run_transfer_case "vest" "wallet" "1"

echo "[suite-integration] Running unified ledger propagation check"
run_ledger_case

echo "[suite-integration] Complete"