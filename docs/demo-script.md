# Outright — 2-minute demo video

Target: **2:00**, ~300 words of voiceover at a measured pace. Written for Arc Microgrant reviewers,
who are judging relevance to Arc, technical credibility, quality of execution, and whether this is
worth taking further. Every one of those is addressed explicitly below.

The strongest asset is that it is **live on Arc mainnet with real settled trades**. Lead with the
problem, prove the settlement, then close on what's next.

---

## Voiceover (for ElevenLabs)

Paste each block separately so you can re-generate a single line without redoing the whole take.
Suggested voice: calm, mid-paced, British or neutral American. Avoid an excitable "crypto" read —
this is a finance product, and restraint sells it.

**1 — The problem (0:00–0:12)**
> An importer owes a supplier in Berlin ten thousand euros, due in thirty days. If the euro moves two
> percent in that time, it costs them two hundred dollars. On one invoice.

**2 — The instrument (0:12–0:24)**
> Banks have solved this for a century with an outright forward: fix the rate today, exchange on the
> day you choose. Outright is that contract, on Arc.

**3 — Why Arc (0:24–0:38)**
> Arc is the first chain where both currencies are native. USDC and EURC, both issued by Circle, both
> here. So a forward is simply one contract holding two tokens. No bridge. No wrapped asset. No oracle.

**4 — The live market (0:38–0:52)**
> This is the desk, reading Arc mainnet right now. Four open offers, quoted the way an FX desk quotes:
> buy euros at one-twelve-twenty, sell at one-eleven-seventy.

**5 — Posting (0:52–1:06)**
> I'll post one myself. Deliberately tiny, because this is real money on mainnet. I choose the amount,
> the rate, and the settlement date — and the moment I post, my dollars move into the contract.

**6 — The core idea (1:06–1:22)**
> That's the whole design. Both sides fund their leg up front, so there is nothing to default on. No
> margin calls. No liquidations. Nobody is trusted. If no one takes my offer, I cancel it and every
> cent comes back.

**7 — Settlement (1:22–1:36)**
> On the value date, each side claims its own currency, separately — so if one address is ever blocked
> by the issuer, the other party can still be paid. These two forwards settled earlier today, on
> mainnet. Both legs claimed. Final.

**8 — Credibility (1:36–1:50)**
> One contract, fully tested, including fuzz tests that prove every token deposited leaves to the right
> party. Offers store amounts, not rates, so settlement never rounds. And the currency pair is fixed at
> deployment, so there's no token list to get wrong.

**9 — What's next (1:50–2:00)**
> Next, mark-to-market against the euro pool on Arc, and a margined version for desks that don't want
> to post full collateral. Outright. Fix the rate today, exchange on the day you choose.

---

## Shot list

Record at **1440×900**, light theme, bookmarks bar hidden, no other tabs. Move the cursor slowly and
deliberately; pause a beat after every click so the edit has room to breathe.

| Time | Voiceover | On screen |
|---|---|---|
| 0:00 | 1 — the problem | Landing hero, slow scroll stopping on the specimen confirmation slip |
| 0:12 | 2 — the instrument | Scroll to "An invoice in euros, a budget in dollars" and hold on the rate chart |
| 0:24 | 3 — why Arc | Scroll through the settlement-flow diagram, left to right |
| 0:38 | 4 — the live market | Cut to `/desk`. Hold on the Market panel: tenor bands, two-sided quotes, "best" tags |
| 0:52 | 5 — posting | Type 0.25 into Amount, then the rate. Click "30 days". Point at "You lock now". Click Post offer, approve in MetaMask |
| 1:06 | 6 — the core idea | New row appears in the book. Open it in the drawer, showing the locked legs and the timeline |
| 1:22 | 7 — settlement | Switch to the "All" tab, click a **Settled** forward, then cut to the explorer showing both claim transactions |
| 1:36 | 8 — credibility | GitHub: `Outright.sol` scrolling, then the green test run (`forge test`, 17 passed) |
| 1:50 | 9 — what's next | Back to the desk, full market view. End on the landing hero with the URL on screen |

**End card (hold 3 seconds, silent):**
```
outright-mu.vercel.app
0xa779261fAb077540e49E895027B9A75a9752B5E4 · Arc mainnet
github.com/Musaga-Technology/Outright
```

---

## Notes that matter

- **Show the MetaMask popup.** Judges have seen plenty of mock demos. A real signature is proof.
- **Don't hide the size.** €0.25 trades look honest, not weak — say "deliberately tiny, real money".
- **Don't claim liquidity.** The offers were posted by us to demonstrate the venue. If the video implies
  a busy market, the first reviewer who checks will discount everything else.
- **The explorer shot is the single most persuasive frame.** Hold it for a full three seconds.
- Keep the rate figure (big figure small, pips large) visible whenever possible — it is the one piece
  of visual identity that says "FX desk" rather than "crypto app".

## If you only get 30 seconds

Blocks 2, 6 and 7, over: the desk → posting → the explorer. Problem, design, proof.
