import type { Address } from 'viem'

export const Side = { BuyEURC: 0, SellEURC: 1 } as const
export const ChainStatus = { None: 0, Open: 1, Active: 2, Cancelled: 3, Unwound: 4 } as const

export type Deal = {
  id: bigint
  maker: Address
  taker: Address
  eurcAmount: bigint
  usdcAmount: bigint
  createdAt: bigint
  acceptBy: bigint
  acceptedAt: bigint
  maturity: bigint
  makerSide: number
  status: number
  buyerClaimed: boolean
  sellerClaimed: boolean
  makerUnwind: boolean
  takerUnwind: boolean
}

/** What the user sees. Derived from on-chain status plus the clock. */
export type Phase = 'open' | 'expired' | 'running' | 'matured' | 'settled' | 'cancelled' | 'unwound' | 'closed'

export const ZERO: Address = '0x0000000000000000000000000000000000000000'

export function phaseOf(d: Deal, nowSec: number): Phase {
  switch (d.status) {
    case ChainStatus.Open:
      return nowSec > Number(d.acceptBy) ? 'expired' : 'open'
    case ChainStatus.Active:
      if (nowSec < Number(d.maturity)) return 'running'
      return d.buyerClaimed && d.sellerClaimed ? 'settled' : 'matured'
    case ChainStatus.Cancelled:
      return 'cancelled'
    case ChainStatus.Unwound:
      return d.buyerClaimed && d.sellerClaimed ? 'closed' : 'unwound'
    default:
      return 'cancelled'
  }
}

export const phaseLabel: Record<Phase, string> = {
  open: 'Open offer',
  expired: 'Offer expired',
  running: 'Running',
  matured: 'Ready to settle',
  settled: 'Settled',
  cancelled: 'Cancelled',
  unwound: 'Unwound',
  closed: 'Unwound',
}

export const buyerOf = (d: Deal) => (d.makerSide === Side.BuyEURC ? d.maker : d.taker)
export const sellerOf = (d: Deal) => (d.makerSide === Side.SellEURC ? d.maker : d.taker)

export const same = (a?: string, b?: string) => !!a && !!b && a.toLowerCase() === b.toLowerCase()

export function roleOf(d: Deal, me?: Address): 'buyer' | 'seller' | null {
  if (!me) return null
  if (same(buyerOf(d), me)) return 'buyer'
  if (same(sellerOf(d), me)) return 'seller'
  return null
}
