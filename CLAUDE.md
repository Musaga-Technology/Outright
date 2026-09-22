# CLAUDE.md — Outright

Context for Claude Code working in this repo.

## What this is
Outright: fully collateralized, physically settled USDC/EURC forward contracts on Circle's Arc chain,
plus a dealing-desk frontend. Entry for **Arc Microgrants** (500 USDC grants, submissions close
Oct 14 2026, rolling review). The project must be **live on Arc mainnet** for the submission.
Reviewers weigh: relevance to Arc, technical credibility, quality of what's built, and whether it's
worth taking further. Favor correctness and a clean live demo over breadth.

## Layout
- `contracts/` — Foundry. `src/Outright.sol` is the only production contract.
  - `test/Outright.t.sol` — unit + fuzz tests. `test/mocks/` — 6-dec MockStable (with blocklist) and
    Multicall3Lite (local-only).
  - `script/Deploy.s.sol` — mainnet deploy (asserts both tokens report 6 decimals).
  - `script/LocalDemo.s.sol` — anvil-only: mock tokens + seeded forwards in several states.
  - `lib/` is vendored (forge-std, OpenZeppelin v5.1.0 `contracts/` only). No `forge install` needed.
- `web/` — Next.js (App Router) + React 19 + TypeScript + wagmi v2 + viem. `/` is the landing page (server-rendered, `src/app/page.tsx` + `landing.css`); `/desk` is the app, client-only (`src/app/desk/desk-client.tsx` loads `src/App.tsx` with `ssr: false`). Illustrations are inline SVGs in `src/components/Illustrations.tsx`, coloured by CSS tokens. No UI framework; plain CSS in `src/styles.css`.
  - `src/config.ts` — chain definition (env-overridable), contract address, wagmi config.
  - `src/abi/outright.ts` — GENERATED. After any contract change: `cd contracts && forge build && cd ../web && npm run abi`.
  - `src/hooks/useOutright.ts` — reads (tokens, balances, all deals via multicall, polling 4s).
  - `src/hooks/useTxFlow.ts` — approve-if-needed + write + wait-for-receipt, with readable revert messages.
  - `src/lib/deal.ts` — `Deal` type and `phaseOf()`: UI phase derived from on-chain status + clock.
  - `src/components/` — Header, Ticket (create), Blotter (table), DealDetail (actions, shown in a slide-over drawer), RateFigure, WalletButton (primary button that walks connect → switch chain → action), WalletPicker (modal listing EIP-6963 browser wallets, plus WalletConnect when `NEXT_PUBLIC_WC_PROJECT_ID` is set), Overlay (Drawer/Modal with focus handling).
- `scripts/local.sh` — starts anvil, installs Multicall3 at the canonical address, deploys the demo,
  writes `web/.env.local`.

## Commands
```bash
cd contracts && forge test                 # must stay green
cd contracts && forge fmt
./scripts/local.sh                         # local chain for frontend work (keep running)
cd web && npm run dev                      # http://localhost:3000
cd web && npm run build                    # next build (type-checks); must pass
```

## Invariants — do not break
- Tokens are always touched via the **6-decimal ERC-20 interfaces**. Never use `msg.value` or native
  balances for USDC (native is 18 decimals on Arc).
- Payouts are **pull-based** (`claim`), one leg per party, so a blocklisted party can't lock the other.
- Offers store `eurcAmount` and `usdcAmount` explicitly; the rate is derived for display only.
- Mainnet EURC is `0xbEf5f6d51CB62b58e6A8f77868681825C6fe21c1`. `0x89B5…D72a` is TESTNET EURC — a common
  mistake in other Arc repos.
- The frontend reads USDC/EURC addresses from the contract (`usdc()`, `eurc()`), not from config.
- Every contract change needs tests, and the fuzz conservation test must keep passing.

## Contract surface
`create(side, eurcAmount, usdcAmount, acceptBy, maturity, counterparty)`, `accept(id)`, `cancel(id)`,
`requestUnwind(id)`, `revokeUnwind(id)`, `claim(id)`; views `getForward`, `buyerOf`, `sellerOf`,
`strike` (USDC per EURC, 1e18), `nextId`. Struct includes `createdAt` and `acceptedAt` for the UI timeline.
Side: 0 = maker buys EURC (locks USDC), 1 = maker sells EURC (locks EURC).
Status: 0 None, 1 Open, 2 Active, 3 Cancelled, 4 Unwound.

## Frontend conventions
- Design: a dealing desk, not a crypto dashboard. Cool ledger-paper background, navy ink, dollar green
  (`--usd`) for USDC amounts, euro blue (`--eur`) for EURC, amber only for things waiting on the clock.
  Fonts: Schibsted Grotesk for UI and all numbers; Newsreader (serif) for display headlines only.
  Hairline rules over shadows, squared buttons, no gradients or glow. Landing art is a specimen trade
  confirmation over a guilloché rosette (computed SVG) — keep it banknote/term-sheet, not crypto-cartoon.
  Don't set `tabular-nums` broadly: this face widens `.` and `,` under it.
- Rates render with `RateFigure`: big figure small, pips large (how FX dealers read quotes). Keep it
  the one bold element on screen.
- Copy is plain, sentence case, from the user's side ("You lock now", "Claim 3,000.00 EURC").
  Button labels match their success messages.
- Keep it responsive (single column under 900px), keyboard-accessible, and respect reduced motion.

## Next tasks (in priority order)
1. Deploy to Arc mainnet; seed 2–3 tiny live forwards (e.g. €1, 5-minute maturity) so reviewers see
   real settled trades on the explorer.
2. Deploy the frontend (Vercel/Netlify) with `NEXT_PUBLIC_OUTRIGHT_ADDRESS` set; verify on mainnet with a
   real wallet.
3. Mark-to-market panel: show a reference USDC/EURC rate and each running forward's P&L vs strike.
   Candidate source: the Uniswap V3 USDC/EURC pool on Arc (TWAP via `observe()`); display only,
   never used for settlement in the collateralized version.
4. Replace full-scan reads with event indexing (`Created`/`Accepted`/`Claimed` logs) for scale.
5. Stretch: margined non-deliverable forward contract, cash-settled off a TWAP, with its own tests.
6. Submission assets: README screenshots, 2-minute demo video, explorer links to live settlements.
