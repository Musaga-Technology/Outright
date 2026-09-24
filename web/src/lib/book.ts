import { rateOf } from './format'
import { Side, type Deal } from './deal'

/**
 * Open offers, arranged the way a dealer reads a market: by tenor, with the best price
 * on each side of the group. Everything is from the taker's point of view — an offer whose
 * maker sells EURC is one you can buy EURC from.
 */
export const takerBuysEURC = (d: Deal) => d.makerSide === Side.SellEURC

// A touch of slack on each edge, so an offer posted "in 7 days" seconds ago still reads as a
// one-week tenor rather than falling into the next band.
const SLACK = 1.01

const BUCKETS = [
  { key: 'day', label: 'Up to a day', max: 86400 * SLACK },
  { key: 'week', label: 'Up to a week', max: 7 * 86400 * SLACK },
  { key: 'month', label: 'Up to a month', max: 30 * 86400 * SLACK },
  { key: 'quarter', label: 'Up to three months', max: 90 * 86400 * SLACK },
  { key: 'long', label: 'Longer dated', max: Infinity },
] as const

export type BookGroup = {
  key: string
  label: string
  offers: Deal[]
  /** Cheapest rate you can buy EURC at, and the highest you can sell at. */
  bestBuy: Deal | null
  bestSell: Deal | null
}

export function groupOffers(offers: Deal[], now: number): BookGroup[] {
  return BUCKETS.map((b, i) => {
    const min = i === 0 ? -Infinity : BUCKETS[i - 1].max
    const inBucket = offers.filter((d) => {
      const left = Number(d.maturity) - now
      return left > min && left <= b.max
    })

    const buys = inBucket.filter(takerBuysEURC)
    const sells = inBucket.filter((d) => !takerBuysEURC(d))
    const bestBuy = buys.reduce<Deal | null>((best, d) => (!best || rate(d) < rate(best) ? d : best), null)
    const bestSell = sells.reduce<Deal | null>((best, d) => (!best || rate(d) > rate(best) ? d : best), null)

    // Best price first on each side, buys before sells.
    const offersSorted = [
      ...buys.sort((a, b2) => rate(a) - rate(b2)),
      ...sells.sort((a, b2) => rate(b2) - rate(a)),
    ]
    return { key: b.key, label: b.label, offers: offersSorted, bestBuy, bestSell }
  }).filter((g) => g.offers.length > 0)
}

const rate = (d: Deal) => rateOf(d.usdcAmount, d.eurcAmount)
