import { splitRate } from '../lib/format'

/** A rate shown the way it reads on a dealing screen: big figure small, pips large. */
export function RateFigure({ rate, size = 'lg' }: { rate: number | null; size?: 'lg' | 'sm' }) {
  if (!rate || !isFinite(rate)) {
    return (
      <span className={`rate rate--${size} rate--empty`} aria-label="No rate yet">
        <span className="rate__big">0.00</span>
        <span className="rate__pips">00</span>
      </span>
    )
  }
  const { big, pips } = splitRate(rate)
  return (
    <span className={`rate rate--${size}`} aria-label={`${rate.toFixed(4)} USDC per EURC`}>
      <span className="rate__big">{big}</span>
      <span className="rate__pips">{pips}</span>
    </span>
  )
}
