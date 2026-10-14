#!/usr/bin/env bash
# Seeds a live Outright deployment with real, tiny trades.
#
# Why cast and not `forge script`: Arc's USDC at 0x3600…0000 is a system contract implemented by
# the node, so Foundry can't execute it in local simulation — every script that moves USDC reverts
# with OpcodeNotFound before it is ever sent. These calls go straight to the node instead.
#
# Usage:  OUTRIGHT=0x… ./scripts/seed_live.sh fund|settle|claim|book
# Needs:  contracts/.env with PK_A (maker) and PK_B (taker), both funded with USDC for gas.
set -euo pipefail
cd "$(dirname "$0")/.."
set -a; source contracts/.env; set +a
export ETH_RPC_URL="${ETH_RPC_URL:-https://rpc.mainnet.arc.io}"

USDC=0x3600000000000000000000000000000000000000
EURC=0xbEf5f6d51CB62b58e6A8f77868681825C6fe21c1
C=${OUTRIGHT:?set OUTRIGHT to the deployed address}
A=$(cast wallet address --private-key "$PK_A")
B=$(cast wallet address --private-key "$PK_B")
SIZE=${SIZE:-250000}                 # €0.25
RATE=${RATE:-1119468}                # USDC per EURC, 6dp — read from the Uniswap pool on the day
usd() { python3 -c "print(int($1*$RATE/1000000))"; }          # USDC for an EURC amount
pips() { python3 -c "print(int($1*($RATE+$2*100)/1000000))"; } # …shifted by n pips

send() { # send <label> <key> <to> <sig> [args…]
  local label=$1 key=$2; shift 2
  local out; out=$(cast send "$@" --private-key "$key" --json)
  python3 - "$label" "$out" <<'PY'
import sys, json
# cast can print more than one JSON document (and warnings); take the first.
label = sys.argv[1]
raw, _ = json.JSONDecoder().raw_decode(sys.argv[2].lstrip()[sys.argv[2].lstrip().find('{'):])
ok = raw.get("status") == "0x1"
print(f"{'ok ' if ok else 'FAIL'} {label:34} {raw.get('transactionHash')}")
sys.exit(0 if ok else 1)
PY
}

approve() { # approve <key> <owner>
  local key=$1 owner=$2
  for t in $USDC $EURC; do
    if [ "$(cast call $t 'allowance(address,address)(uint256)' "$owner" "$C" | awk '{print $1}')" = "0" ]; then
      send "approve $( [ "$t" = "$USDC" ] && echo USDC || echo EURC )" "$key" "$t" "approve(address,uint256)" "$C" \
        115792089237316195423570985008687907853269984665640564039457584007913129639935
    fi
  done
}

case "${1:-}" in
  fund)
    send "fund taker USDC" "$PK_A" $USDC "transfer(address,uint256)" "$B" "${FUND_USDC:-600000}"
    send "fund taker EURC" "$PK_A" $EURC "transfer(address,uint256)" "$B" "${FUND_EURC:-350000}"
    approve "$PK_A" "$A"; approve "$PK_B" "$B"
    ;;
  settle) # two €0.25 forwards, one each way, maturing in five minutes, reserved for the taker
    T=$(cast block latest --field timestamp)
    send "post buy-EURC forward"  "$PK_A" "$C" "create(uint8,uint128,uint128,uint64,uint64,address)" 0 "$SIZE" "$(usd "$SIZE")" $((T+120)) $((T+300)) "$B"
    send "post sell-EURC forward" "$PK_A" "$C" "create(uint8,uint128,uint128,uint64,uint64,address)" 1 "$SIZE" "$(usd "$SIZE")" $((T+120)) $((T+300)) "$B"
    ID=$(( $(cast call "$C" "nextId()(uint256)" | awk '{print $1}') - 2 ))
    send "accept #$ID"      "$PK_B" "$C" "accept(uint256)" "$ID"
    send "accept #$((ID+1))" "$PK_B" "$C" "accept(uint256)" "$((ID+1))"
    echo "forwards $ID and $((ID+1)) mature at $((T+300)) — run: $0 claim"
    ;;
  claim) # each side pulls its own leg; ids given as arguments, or the last two
    LAST=$(( $(cast call "$C" "nextId()(uint256)" | awk '{print $1}') - 1 ))
    IDS=${*:2}; IDS=${IDS:-"$((LAST-1)) $LAST"}
    for id in $IDS; do
      send "claim #$id as maker" "$PK_A" "$C" "claim(uint256)" "$id" || true
      send "claim #$id as taker" "$PK_B" "$C" "claim(uint256)" "$id" || true
    done
    ;;
  book) # four standing offers at a dealer's spread, open for 7 days
    T=$(cast block latest --field timestamp)
    W=$((T+604800))
    send "offer: buy €0.50, 1w"  "$PK_A" "$C" "create(uint8,uint128,uint128,uint64,uint64,address)" 0 $((SIZE*2)) "$(pips $((SIZE*2)) -25)" "$W" $((T+604800))  0x0000000000000000000000000000000000000000
    send "offer: buy €0.25, 1m"  "$PK_A" "$C" "create(uint8,uint128,uint128,uint64,uint64,address)" 0 "$SIZE"     "$(pips "$SIZE" -50)"   "$W" $((T+2592000)) 0x0000000000000000000000000000000000000000
    send "offer: sell €0.50, 1w" "$PK_A" "$C" "create(uint8,uint128,uint128,uint64,uint64,address)" 1 $((SIZE*2)) "$(pips $((SIZE*2)) 25)"  "$W" $((T+604800))  0x0000000000000000000000000000000000000000
    send "offer: sell €0.25, 1m" "$PK_A" "$C" "create(uint8,uint128,uint128,uint64,uint64,address)" 1 "$SIZE"     "$(pips "$SIZE" 50)"    "$W" $((T+2592000)) 0x0000000000000000000000000000000000000000
    ;;
  *) echo "usage: OUTRIGHT=0x… $0 fund|settle|claim|book"; exit 1 ;;
esac
