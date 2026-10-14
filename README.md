# Outright

**USDC/EURC forward contracts on Arc.** Lock an exchange rate today, settle on the date you choose.

An importer owes a Berlin supplier €10,000 in 30 days. Today's rate is 1.1700. With Outright they
post an offer to buy 10,000 EURC for 11,700 USDC at day 30; an exporter holding EURC accepts. In 30
days each side claims what they bought at the rate agreed today — wherever EUR/USD has moved.

In FX, an *outright forward* is exactly this: one agreement to exchange two currencies at a fixed rate
on a future date.

## Live on Arc mainnet

| | |
|---|---|
| Contract | [`0xa779261fAb077540e49E895027B9A75a9752B5E4`](https://explorer.arc.io/address/0xa779261fAb077540e49E895027B9A75a9752B5E4) |
| Chain | Arc mainnet (5042) |
| Desk | [outright-mu.vercel.app](https://outright-mu.vercel.app) |
| Settled forward #1 | buyer [claimed EURC](https://explorer.arc.io/tx/0xdf0b55bac05527c52028d2f8feb5a72a3646a3a9d1d7e6844c90cd730d21520b) · seller [claimed USDC](https://explorer.arc.io/tx/0x3aa7a504f176d5040e625fd0f0682e788febce73b7270033a51b9e438cf0c6d2) |
| Settled forward #2 | buyer [claimed EURC](https://explorer.arc.io/tx/0xd8a4b448764dc6532200fedc209ac8fcaba275d626269ec23b369ce22c1a72a8) · seller [claimed USDC](https://explorer.arc.io/tx/0x2e366e5ceadd4c702ba5acbaa23f9fef58a5d8bf5c976b89509527c13d3e5581) |
| Open offers | #3–#6, both sides, 1.1170/1.1220 at a week and 1.1145/1.1245 at a month |

Forwards #1 and #2 are complete, physically settled FX trades: each side locked its currency, waited
for the value date, and pulled the other's. The offers still on the book hold $0.84 and €0.75 of live
collateral in the contract.

The trades are deliberately tiny (€0.25) and were posted by us to demonstrate the venue — there is no
third-party flow yet, and none of this is claimed as organic liquidity. Deploying and settling all of
it cost about **$0.08 in gas**, paid in USDC.

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
### Seed the live demo
Two wallets are needed, because a maker can't take its own offer. Both can be yours. Nothing here is
spent: unsold offers are refundable and a settled trade exchanges the two legs at the agreed rate.
About €5 and $6 of working capital, plus gas, covers all of it.

```bash
cd contracts
export OUTRIGHT=<deployed address> PK_A=<maker key> PK_B=<taker key>
export RATE=1170000          # optional: USDC per EURC, 6 decimals. Default 1.1700

forge script script/SeedMainnet.s.sol --sig "settle()" --rpc-url arc_mainnet --broadcast
# two €1 forwards, one each way, maturing in five minutes. Wait ~6 minutes, then:
forge script script/SeedMainnet.s.sol --sig "claim()"  --rpc-url arc_mainnet --broadcast
forge script script/SeedMainnet.s.sol --sig "book()"   --rpc-url arc_mainnet --broadcast
# four standing offers, both sides, 7-day accept window

forge script script/SeedMainnet.s.sol --sig "cancelOpen()" --rpc-url arc_mainnet --broadcast
# later: take the standing offers back and refund the deposits
```

The offers and settled trades on the live desk were posted by us to demonstrate the venue. There is
no third-party flow yet, and none of it is claimed as organic liquidity.

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
- **Arc's USDC is a system contract.** `0x3600…0000` is implemented by the node, so Foundry cannot
  execute it in local simulation and any `forge script` that moves USDC fails with `OpcodeNotFound`
  before broadcasting. `scripts/seed_live.sh` talks to the node directly instead.
- **One pair per deployment:** the two tokens are immutable constructor arguments. Supporting another
  pair means deploying a second instance, so collateral is never shared between pairs and there is no
  token whitelist to maintain.

## Roadmap
- Margined non-deliverable forwards, cash-settled off a USDC/EURC TWAP
- Mark-to-market against a live reference rate
- Event indexing instead of reading every forward
- Invoice/PO references via Arc's Memo contract
