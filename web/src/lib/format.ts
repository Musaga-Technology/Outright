import { formatUnits, parseUnits } from 'viem'
import { TOKEN_DECIMALS } from '../config'

export function fmtAmount(v: bigint, dp = 2) {
  const n = Number(formatUnits(v, TOKEN_DECIMALS))
  return n.toLocaleString(undefined, { minimumFractionDigits: dp, maximumFractionDigits: dp })
}

/** USDC per 1 EURC, as a JS number for display only. */
export function rateOf(usdc: bigint, eurc: bigint) {
  if (eurc === 0n) return 0
  return Number((usdc * 1_000_000n) / eurc) / 1_000_000
}

/** Split a 4dp rate the way FX dealers read it: big figure "1.17" + pips "00". */
export function splitRate(rate: number) {
  const s = rate.toFixed(4)
  return { big: s.slice(0, -2), pips: s.slice(-2) }
}

/** Parse a user-typed decimal into 6-dp units; returns null when invalid. */
export function toUnits(s: string): bigint | null {
  const t = s.trim().replace(/,/g, '')
  if (!/^\d*\.?\d*$/.test(t) || t === '' || t === '.') return null
  try {
    return parseUnits(t, TOKEN_DECIMALS)
  } catch {
    return null
  }
}

/** usdc = eurc × rate, both 6-dp; rate typed as a decimal string. Rounds down. */
export function usdcFor(eurcUnits: bigint, rate: string): bigint | null {
  const r = toUnits(rate)
  if (r === null) return null
  return (eurcUnits * r) / 10n ** BigInt(TOKEN_DECIMALS)
}

export function fmtDate(sec: number | bigint) {
  return new Date(Number(sec) * 1000).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function fmtCountdown(secs: number) {
  if (secs <= 0) return 'now'
  const d = Math.floor(secs / 86400)
  const h = Math.floor((secs % 86400) / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = Math.floor(secs % 60)
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

export const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`
