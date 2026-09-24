# Outright

**USDC/EURC forward contracts on Arc.** Lock an exchange rate today, settle on the date you choose.

An importer owes a Berlin supplier €10,000 in 30 days. Today's rate is 1.1700. With Outright they
post an offer to buy 10,000 EURC for 11,700 USDC at day 30; an exporter holding EURC accepts. In 30
days each side claims what they bought at the rate agreed today — wherever EUR/USD has moved.

In FX, an *outright forward* is exactly this: one agreement to exchange two currencies at a fixed rate
on a future date.

## Why Arc
- USDC and EURC are both native Circle stablecoins on one chain, so a forward is a single-chain,
  two-token escrow. No bridges, no wrapped assets.
- Gas is paid in USDC, so neither side needs a volatile token to hedge a currency.
- Deterministic finality: a settlement is final when it's claimed.

## How it works
Fully collateralized and physically settled. Both parties lock their leg in the contract, so
settlement can't fail: no oracle, no margin calls, no default.

| Step | Who | Effect |
|---|---|---|
| Post offer | maker | locks their leg (USDC if buying EURC, EURC if selling) |
| Accept | anyone, or a named counterparty | locks the other leg |
| Cancel | maker any time before acceptance; anyone after the offer window | refunds the maker |
| Unwind | both parties, before maturity | mutual early exit; each gets their own deposit back |
| Claim | each party, at maturity | buyer pulls EURC, seller pulls USDC |

## Repo
```
contracts/   Foundry — Outright.sol, tests (17 incl. fuzz), deploy + local demo scripts
web/         Next.js + wagmi/viem dealing-desk frontend
scripts/     local.sh — anvil + seeded demo state for frontend work
```

## Quickstart
```bash
# contracts
cd contracts && forge test

# frontend against a local chain with demo data
./scripts/local.sh              # terminal 1: anvil + deploy + seed, writes web/.env.local
cd web && npm install && npm run dev   # terminal 2
```

### Deploy to Arc mainnet (chain 5042)
```bash
cd contracts
forge script script/Deploy.s.sol --rpc-url arc_mainnet --private-key $PRIVATE_KEY --broadcast
# then in web/.env.local:  NEXT_PUBLIC_OUTRIGHT_ADDRESS=<deployed address>
```
Defaults: USDC ERC-20 interface `0x3600000000000000000000000000000000000000`,
EURC `0xbEf5f6d51CB62b58e6A8f77868681825C6fe21c1`. For testnet, set
`EURC_ADDRESS=0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a` and the frontend's `NEXT_PUBLIC_ARC_*` overrides.

## Design notes
- **Decimals:** Arc's native USDC gas token has 18 decimals; its ERC-20 interface has 6. Outright
  uses only the ERC-20 interfaces and never reads `msg.value`, so the two are never mixed.
- **Pull payouts:** Circle tokens can blocklist addresses. Each side claims independently, so a
  blocked counterparty can't freeze the other side's funds (tested).
- **Exact legs:** offers store the EURC and USDC amounts, not a rate, so settlement never rounds.
- **The frontend reads token addresses from the contract**, so it can't be pointed at the wrong EURC.
- **One pair per deployment:** the two tokens are immutable constructor arguments. Supporting another
  pair means deploying a second instance, so collateral is never shared between pairs and there is no
  token whitelist to maintain.

## Roadmap
- Margined non-deliverable forwards, cash-settled off a USDC/EURC TWAP
- Mark-to-market against a live reference rate
- Event indexing instead of reading every forward
- Invoice/PO references via Arc's Memo contract
