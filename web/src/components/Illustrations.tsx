/* Inline SVG illustrations. Colours come from CSS tokens (see .il-* in landing.css / styles.css),
   so every drawing follows light and dark mode. All are decorative: aria-hidden. */

export function Mark() {
  return (
    <svg className="mark" viewBox="0 0 32 32" aria-hidden>
      <rect width="32" height="32" rx="8" />
      <path className="mark__fwd" d="M8 19.5h15m-4-4 4 4-4 4" />
      <path className="mark__back" d="M24 12.5H9m4-4-4 4 4 4" />
    </svg>
  )
}

function Coin({ cx, cy, r, kind }: { cx: number; cy: number; r: number; kind: 'usd' | 'eur' }) {
  return (
    <g className={`il-coin il-coin--${kind}`}>
      <circle cx={cx} cy={cy + r * 0.12} r={r} className="il-coin__edge" />
      <circle cx={cx} cy={cy} r={r} className="il-coin__face" />
      <circle cx={cx} cy={cy} r={r * 0.78} className="il-coin__ring" />
      <text x={cx} y={cy} dy="0.36em" textAnchor="middle" fontSize={r * 0.95} className="il-coin__glyph">
        {kind === 'usd' ? '$' : '€'}
      </text>
    </g>
  )
}

function Lock({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} className="il-lock">
      <path d="M-7 -4v-5a7 7 0 0 1 14 0v5" className="il-lock__shackle" />
      <rect x="-11" y="-4" width="22" height="17" rx="4" className="il-lock__body" />
      <circle cx="0" cy="3.5" r="2.4" className="il-lock__hole" />
    </g>
  )
}

/** Hero: a live forward ticket, the two coins it swaps, and the lock that holds them. */
export function HeroIllustration() {
  return (
    <svg viewBox="0 0 560 480" className="il il-hero" aria-hidden>
      <defs>
        <pattern id="il-dots" width="18" height="18" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.2" className="il-dot" />
        </pattern>
        <linearGradient id="il-progress" x1="0" x2="1">
          <stop offset="0" className="il-stop-a" />
          <stop offset="1" className="il-stop-b" />
        </linearGradient>
        <filter id="il-shadow" x="-20%" y="-20%" width="140%" height="160%">
          <feDropShadow dx="0" dy="18" stdDeviation="18" className="il-shadow" />
        </filter>
      </defs>

      <circle cx="290" cy="240" r="210" className="il-blob" />
      <rect x="40" y="30" width="500" height="420" rx="40" fill="url(#il-dots)" opacity="0.7" />

      <path d="M96 392C40 250 150 70 300 64" className="il-path il-path--usd" />
      <path d="M482 96c60 140-40 330-196 336" className="il-path il-path--eur" />

      {/* the ticket */}
      <g filter="url(#il-shadow)">
        <rect x="100" y="112" width="370" height="252" rx="22" className="il-card" />
      </g>
      <text x="128" y="152" className="il-label">EUR/USD forward · 30 days</text>
      <rect x="370" y="134" width="74" height="26" rx="13" className="il-pill" />
      <circle cx="384" cy="147" r="3.5" className="il-pill__dot" />
      <text x="394" y="151.5" className="il-pill__text">Running</text>

      <text x="126" y="228" className="il-rate">
        <tspan className="il-rate__big">1.17</tspan>
        <tspan className="il-rate__pips" dx="2">00</tspan>
      </text>
      <text x="128" y="252" className="il-label">USDC per EURC, locked today</text>

      <rect x="128" y="290" width="314" height="8" rx="4" className="il-track" />
      <rect x="128" y="290" width="196" height="8" rx="4" fill="url(#il-progress)" />
      <circle cx="324" cy="294" r="7" className="il-knob" />
      <text x="128" y="330" className="il-small">Today</text>
      <text x="442" y="330" textAnchor="end" className="il-small">Settles in 11d 4h</text>

      <Coin cx={96} cy={384} r={46} kind="usd" />
      <Coin cx={478} cy={96} r={42} kind="eur" />

      <g filter="url(#il-shadow)">
        <circle cx="468" cy="372" r="34" className="il-card" />
      </g>
      <Lock x={468} y={372} s={1.25} />

      <g className="il-spark">
        <path d="M60 170v14M53 177h14" />
        <path d="M512 250v10M507 255h10" />
        <path d="M240 440v10M235 445h10" />
      </g>
    </svg>
  )
}

/** A rate chart: the market wanders, the locked rate doesn't. */
export function HedgeChart() {
  const spot =
    'M40 150 C70 140 90 162 118 150 S160 118 190 128 S240 150 262 120 S310 92 336 104 S388 70 414 78 S460 52 480 58'
  return (
    <svg viewBox="0 0 520 260" className="il il-chart" aria-hidden>
      <defs>
        <linearGradient id="il-saved" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" className="il-saved-a" />
          <stop offset="1" className="il-saved-b" />
        </linearGradient>
      </defs>
      {[60, 100, 140, 180, 220].map((y) => (
        <line key={y} x1="40" x2="490" y1={y} y2={y} className="il-grid" />
      ))}
      <path d={`${spot} L480 150 L40 150 Z`} fill="url(#il-saved)" />
      <path d={spot} className="il-spot" />
      <line x1="40" x2="480" y1="150" y2="150" className="il-strike" />
      <circle cx="40" cy="150" r="6" className="il-strike-dot" />
      <circle cx="480" cy="58" r="6" className="il-spot-dot" />
      <circle cx="480" cy="150" r="6" className="il-strike-dot" />

      <g transform="translate(330 22)">
        <rect width="146" height="26" rx="13" className="il-tag il-tag--spot" />
        <text x="73" y="17.5" textAnchor="middle" className="il-tag__text">Market at day 30: 1.2140</text>
      </g>
      <g transform="translate(290 162)">
        <rect width="186" height="26" rx="13" className="il-tag il-tag--strike" />
        <text x="93" y="17.5" textAnchor="middle" className="il-tag__text">Your locked rate: 1.1700</text>
      </g>
      <text x="40" y="244" className="il-small">Today</text>
      <text x="480" y="244" textAnchor="end" className="il-small">Day 30</text>
    </svg>
  )
}

function Vault({ check = false }: { check?: boolean }) {
  return (
    <g>
      <rect x="78" y="46" width="84" height="70" rx="14" className="il-card il-card--stroke" />
      <rect x="92" y="60" width="56" height="42" rx="9" className="il-vault-door" />
      {check ? (
        <path d="M108 81l8 8 16-16" className="il-check" />
      ) : (
        <Lock x={120} y={80} s={0.9} />
      )}
    </g>
  )
}

export function StepPost() {
  return (
    <svg viewBox="0 0 240 140" className="il il-step" aria-hidden>
      <circle cx="120" cy="80" r="62" className="il-blob" />
      <Vault />
      <Coin cx={120} cy={17} r={13} kind="usd" />
      <path d="M120 34v7m-4-4 4 4 4-4" className="il-arrow" />
      <g className="il-spark">
        <path d="M44 40v10M39 45h10" />
        <path d="M194 30v8M190 34h8" />
      </g>
    </svg>
  )
}

export function StepAccept() {
  return (
    <svg viewBox="0 0 240 140" className="il il-step" aria-hidden>
      <circle cx="120" cy="80" r="62" className="il-blob" />
      <Vault />
      <Coin cx={36} cy={80} r={18} kind="usd" />
      <Coin cx={204} cy={80} r={18} kind="eur" />
      <path d="M58 80h14m-5-5 5 5-5 5" className="il-arrow" />
      <path d="M182 80h-14m5-5-5 5 5 5" className="il-arrow" />
    </svg>
  )
}

export function StepClaim() {
  return (
    <svg viewBox="0 0 240 140" className="il il-step" aria-hidden>
      <circle cx="120" cy="80" r="62" className="il-blob" />
      <Vault check />
      <path d="M72 80H58m5-5-5 5 5 5" className="il-arrow" />
      <path d="M168 80h14m-5-5 5 5-5 5" className="il-arrow" />
      <Coin cx={36} cy={80} r={18} kind="eur" />
      <Coin cx={204} cy={80} r={18} kind="usd" />
    </svg>
  )
}

/** Empty blotter: a blank ticket waiting for its first trade. */
export function EmptyTicket() {
  return (
    <svg viewBox="0 0 200 120" className="il il-empty" aria-hidden>
      <circle cx="100" cy="64" r="52" className="il-blob" />
      <rect x="50" y="26" width="100" height="72" rx="12" className="il-card il-card--stroke" />
      <rect x="64" y="42" width="40" height="7" rx="3.5" className="il-line" />
      <rect x="64" y="58" width="72" height="12" rx="4" className="il-line il-line--soft" />
      <rect x="64" y="78" width="30" height="7" rx="3.5" className="il-line il-line--soft" />
      <Coin cx={150} cy={28} r={14} kind="eur" />
      <Coin cx={52} cy={96} r={12} kind="usd" />
    </svg>
  )
}

/* Small line icons for feature cards */
export function Icon({ name }: { name: 'chain' | 'gas' | 'final' | 'pull' | 'exact' | 'contract' | 'shield' | 'test' }) {
  const paths: Record<typeof name, React.ReactNode> = {
    chain: (
      <>
        <circle cx="8" cy="12" r="5" />
        <circle cx="16" cy="12" r="5" />
      </>
    ),
    gas: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7v10M14.8 9.2c-.6-.8-1.6-1.2-2.8-1.2-1.6 0-2.8.8-2.8 2s1.2 1.7 2.8 2 2.8.8 2.8 2-1.2 2-2.8 2c-1.2 0-2.3-.5-2.9-1.3" />
      </>
    ),
    final: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M8 12.2l2.7 2.7L16.2 9.4" />
      </>
    ),
    pull: (
      <>
        <path d="M12 4v11m-4.5-4.5L12 15l4.5-4.5" />
        <path d="M5 19h14" />
      </>
    ),
    exact: (
      <>
        <path d="M5 9h14M5 15h14" />
      </>
    ),
    contract: (
      <>
        <rect x="5" y="3.5" width="14" height="17" rx="2.5" />
        <path d="M9 9h6M9 13h6M9 17h3" />
      </>
    ),
    shield: (
      <>
        <path d="M12 3.5l7 2.8v5.2c0 4.3-2.9 7.6-7 9-4.1-1.4-7-4.7-7-9V6.3z" />
        <path d="M9 12l2.2 2.2L15.5 10" />
      </>
    ),
    test: (
      <>
        <path d="M9.5 3.5h5M10.5 3.5v6L5.4 18a1.7 1.7 0 0 0 1.5 2.5h10.2a1.7 1.7 0 0 0 1.5-2.5l-5.1-8.5v-6" />
        <path d="M7.6 14.5h8.8" />
      </>
    ),
  }
  return (
    <svg viewBox="0 0 24 24" className="icon" aria-hidden>
      {paths[name]}
    </svg>
  )
}
