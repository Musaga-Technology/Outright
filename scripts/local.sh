#!/usr/bin/env bash
# Local dev loop: anvil + canonical Multicall3 + demo deploy with seeded forwards,
# then writes web/.env.local so `npm run dev` points at it.
# Usage: ./scripts/local.sh   (leave it running; Ctrl-C stops anvil)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/contracts"

anvil --silent &
ANVIL=$!
trap 'kill $ANVIL' EXIT
sleep 2

forge build --quiet
MC=$(python3 -c "import json;print(json.load(open('out/Multicall3Lite.sol/Multicall3Lite.json'))['deployedBytecode']['object'])")
cast rpc anvil_setCode 0xcA11bde05977b3631167028862bE2a173976CA11 "$MC" > /dev/null

# anvil default accounts #0 (maker) and #1 (taker)
ADDR=$(PK_B=0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d \
  forge script script/LocalDemo.s.sol --rpc-url http://127.0.0.1:8545 --broadcast 2>&1 \
  | awk '/OUTRIGHT/ {print $2}')

cat > "$ROOT/web/.env.local" <<ENV
NEXT_PUBLIC_OUTRIGHT_ADDRESS=$ADDR
NEXT_PUBLIC_ARC_CHAIN_ID=31337
NEXT_PUBLIC_ARC_RPC_URL=http://127.0.0.1:8545
ENV

echo "Outright deployed at $ADDR — web/.env.local written."
echo "Import anvil keys #0 and #1 into your wallet, add network 127.0.0.1:8545 (chain 31337), then: cd web && npm run dev"
wait $ANVIL
