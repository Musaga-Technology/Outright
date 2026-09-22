/* Inline SVG drawings. Colours come from CSS tokens (.il-* rules in styles.css), so every
   drawing follows light and dark mode. All are decorative (aria-hidden) unless they carry a caption. */

export function Mark() {
  return (
    <svg className="mark" viewBox="0 0 32 32" aria-hidden>
      <rect width="32" height="32" rx="7" />
      <path className="mark__fwd" d="M8 19.5h15m-3.5-3.5 3.5 3.5-3.5 3.5" />
      <path className="mark__back" d="M24 12.5H9m3.5-3.5L9 12.5l3.5 3.5" />
    </svg>
  )
}

/**
 * Guilloché rosette — the fine interlaced engraving printed on banknotes and share certificates.
 * Each ring is a circle whose radius waves `lobes` times around; offsetting the phase ring by ring
 * weaves the lattice. Computed at render, so there is no image to ship.
 */
function rings(r: number, amp: number, lobes: number, count: number, step: number, twist: number, samples = 180) {
  const out: string[] = []
  for (let i = 0; i < count; i++) {
    const base = r - i * step
    let d = ''
    for (let k = 0; k <= samples; k++) {
      const t = (k / samples) * Math.PI * 2
      const rad = base + amp * Math.sin(lobes * t + i * twist)
      d += `${k ? 'L' : 'M'}${(rad * Math.cos(t)).toFixed(1)} ${(rad * Math.sin(t)).toFixed(1)}`
    }
    out.push(d + 'Z')
  }
  return out
}

export function Guilloche({ className = '', size = 520 }: { className?: string; size?: number }) {
  const r = size / 2 - 8
  const outer = rings(r, 9, 18, 10, 3.2, 0.32)
  const inner = rings(r * 0.62, 12, 11, 12, 3.6, -0.42)
  const core = rings(r * 0.26, 7, 7, 8, 3, 0.5, 120)
  return (
    <svg viewBox={`${-size / 2} ${-size / 2} ${size} ${size}`} className={`il il-guilloche ${className}`} aria-hidden>
      <g className="il-g il-g--eur">
        {outer.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
      <g className="il-g il-g--usd">
        {inner.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
      <g className="il-g il-g--eur">
        {core.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
    </svg>
  )
}

/** Ink stamp for the specimen confirmation. */
export function SettledStamp() {
  return (
    <svg viewBox="0 0 140 140" className="il il-stamp" aria-hidden>
      <defs>
        <path id="stamp-arc" d="M70 70m-49 0a49 49 0 1 1 98 0a49 49 0 1 1-98 0" />
      </defs>
      <circle cx="70" cy="70" r="64" className="il-stamp__ring" />
      <circle cx="70" cy="70" r="59" className="il-stamp__ring il-stamp__ring--thin" />
      <circle cx="70" cy="70" r="37" className="il-stamp__ring il-stamp__ring--thin" />
      <text className="il-stamp__arc">
        <textPath href="#stamp-arc" startOffset="0" textLength="302" lengthAdjust="spacing">
          SETTLED IN FULL · PHYSICALLY DELIVERED ·
        </textPath>
      </text>
      <path d="M55 70.5l10 10 20-21" className="il-stamp__check" />
    </svg>
  )
}

/** The market wanders; the locked rate doesn't. Annotated like a printed chart, with leader lines. */
export function HedgeChart() {
  const spot =
    'M48 172 C78 162 98 184 126 172 S168 140 198 150 S248 172 270 142 S318 114 344 126 S396 92 422 100 S468 74 488 80'
  return (
    <svg viewBox="0 0 540 250" className="il il-chart" role="img" aria-labelledby="chart-title">
      <title id="chart-title">
        Over 30 days the market rate rises from 1.1700 to 1.2140 while the forward stays locked at 1.1700.
      </title>
      <defs>
        <pattern id="il-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" className="il-hatch" />
        </pattern>
      </defs>
      {[72, 112, 152, 192].map((y) => (
        <line key={y} x1="48" x2="500" y1={y} y2={y} className="il-grid" />
      ))}
      <line x1="48" x2="500" y1="212" y2="212" className="il-axis" />
      <path d={`${spot} L488 172 L48 172 Z`} fill="url(#il-hatch)" />
      <path d={spot} className="il-spot" />
      <line x1="48" x2="488" y1="172" y2="172" className="il-strike" />
      <circle cx="488" cy="80" r="4" className="il-spot-dot" />
      <circle cx="488" cy="172" r="4" className="il-strike-dot" />

      <line x1="488" y1="80" x2="488" y2="40" className="il-leader" />
      <text x="484" y="36" textAnchor="end" className="il-note">
        Market at day 30 <tspan className="il-note__num">1.2140</tspan>
      </text>
      <line x1="300" y1="172" x2="300" y2="236" className="il-leader" />
      <text x="306" y="240" className="il-note">
        Your forward <tspan className="il-note__num">1.1700</tspan>
      </text>
      <text x="400" y="138" textAnchor="middle" className="il-note il-note--muted">
        440 USDC saved
      </text>
      <text x="48" y="232" className="il-tick">Today</text>
    </svg>
  )
}

/**
 * Settlement mechanics: two parties, one contract, three moments. The bar shows what the contract
 * holds over time — USDC from the post, EURC from acceptance — and the arrows show who gets what.
 */
export function FlowDiagram() {
  const X = { post: 250, accept: 480, settle: 800 }
  return (
    <svg viewBox="0 0 960 330" className="il il-flow" role="img" aria-labelledby="flow-title">
      <title id="flow-title">
        The buyer locks USDC when posting, the seller locks EURC when accepting, and at the value date the buyer
        claims the EURC and the seller claims the USDC.
      </title>
      <defs>
        {(['usd', 'eur'] as const).map((c) => (
          <marker key={c} id={`arr-${c}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
            <path d="M0 0L10 5L0 10z" className={`il-arrowhead--${c}`} />
          </marker>
        ))}
      </defs>

      {/* stations */}
      {(
        [
          [X.post, 'Day 0', 'Offer posted'],
          [X.accept, 'Any time before the offer closes', 'Accepted'],
          [X.settle, 'Value date', 'Each side claims'],
        ] as const
      ).map(([x, small, big]) => (
        <g key={x}>
          <line x1={x} x2={x} y1="52" y2="300" className="il-guide" />
          <text x={x} y="22" textAnchor="middle" className="il-tick">
            {small}
          </text>
          <text x={x} y="40" textAnchor="middle" className="il-station">
            {big}
          </text>
        </g>
      ))}

      {/* lanes */}
      <text x="20" y="92" className="il-lane">Buyer of EURC</text>
      <line x1="170" x2="930" y1="88" y2="88" className="il-lane-line" />
      <text x="20" y="272" className="il-lane">Seller of EURC</text>
      <line x1="170" x2="930" y1="268" y2="268" className="il-lane-line" />

      {/* the contract, and what it holds */}
      <rect x="170" y="134" width="760" height="88" rx="6" className="il-contract" />
      <text x="186" y="182" className="il-lane il-lane--muted">Outright</text>
      <rect x={X.post} y="148" width={X.settle - X.post} height="24" rx="3" className="il-held il-held--usd" />
      <text x={X.post + 12} y="164.5" className="il-held__text il-held__text--usd">USDC held · 11,700.00</text>
      <rect x={X.accept} y="180" width={X.settle - X.accept} height="24" rx="3" className="il-held il-held--eur" />
      <text x={X.accept + 12} y="196.5" className="il-held__text il-held__text--eur">EURC held · 10,000.00</text>

      {/* legs in */}
      <line x1={X.post} y1="96" x2={X.post} y2="144" className="il-leg il-leg--usd" markerEnd="url(#arr-usd)" />
      <text x={X.post + 10} y="122" className="il-leg__text">locks USDC</text>
      <line x1={X.accept} y1="260" x2={X.accept} y2="208" className="il-leg il-leg--eur" markerEnd="url(#arr-eur)" />
      <text x={X.accept + 10} y="240" className="il-leg__text">locks EURC</text>

      {/* legs out */}
      <line x1={X.settle + 22} y1="180" x2={X.settle + 22} y2="96" className="il-leg il-leg--eur" markerEnd="url(#arr-eur)" />
      <text x={X.settle + 32} y="122" className="il-leg__text">claims EURC</text>
      <line x1={X.settle + 22} y1="176" x2={X.settle + 22} y2="260" className="il-leg il-leg--usd" markerEnd="url(#arr-usd)" />
      <text x={X.settle + 32} y="240" className="il-leg__text">claims USDC</text>
    </svg>
  )
}

/** Empty blotter: a blank confirmation slip. */
export function EmptyTicket() {
  return (
    <svg viewBox="0 0 160 110" className="il il-empty" aria-hidden>
      <rect x="30" y="10" width="100" height="84" rx="6" className="il-slip" />
      <line x1="44" x2="84" y1="28" y2="28" className="il-rule il-rule--strong" />
      <line x1="44" x2="116" y1="44" y2="44" className="il-rule" />
      <line x1="44" x2="116" y1="56" y2="56" className="il-rule" />
      <line x1="44" x2="96" y1="68" y2="68" className="il-rule" />
      <line x1="30" x2="130" y1="80" y2="80" className="il-perf" />
      <circle cx="112" cy="30" r="10" className="il-stamp__ring il-stamp__ring--thin" />
    </svg>
  )
}
