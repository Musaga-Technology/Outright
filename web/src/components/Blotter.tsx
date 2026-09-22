import { useAccount } from 'wagmi'
import { phaseLabel, phaseOf, roleOf, same, Side, type Deal } from '../lib/deal'
import { fmtAmount, fmtCountdown, fmtDate, rateOf } from '../lib/format'
import { useNow } from '../hooks/useNow'
import { EmptyTicket } from './Illustrations'
import { RateFigure } from './RateFigure'

export type Tab = 'offers' | 'mine' | 'all'

export function Blotter({
  deals,
  loading,
  selected,
  onSelect,
  tab,
  onTab,
}: {
  deals: Deal[]
  loading: boolean
  selected: bigint | null
  onSelect: (id: bigint) => void
  tab: Tab
  onTab: (t: Tab) => void
}) {
  const { address } = useAccount()
  const now = useNow()

  const rows = deals.filter((d) => {
    if (tab === 'offers') return phaseOf(d, now) === 'open'
    if (tab === 'mine') return same(d.maker, address) || same(d.taker, address)
    return true
  })

  const counts = {
    offers: deals.filter((d) => phaseOf(d, now) === 'open').length,
    mine: address ? deals.filter((d) => same(d.maker, address) || same(d.taker, address)).length : 0,
    all: deals.length,
  }

  return (
    <section className="blotter card" aria-labelledby="blotter-title">
      <div className="blotter__head">
        <h2 id="blotter-title">Forwards</h2>
        <div className="tabs" role="tablist">
          {(
            [
              ['offers', 'Open offers'],
              ['mine', 'My forwards'],
              ['all', 'All'],
            ] as const
          ).map(([k, label]) => (
            <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => onTab(k)}>
              {label} <span className="count">{counts[k]}</span>
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="empty">
          <span className="spinner" aria-hidden />
          <p>Loading forwards from Arc…</p>
        </div>
      )}
      {!loading && rows.length === 0 && (
        <div className="empty">
          <EmptyTicket />
          <p>
            {tab === 'offers' && 'No open offers right now. Post one from the ticket.'}
            {tab === 'mine' && (address ? "You haven't made or taken any forwards yet." : 'Connect a wallet to see your forwards.')}
            {tab === 'all' && 'No forwards have been created on this contract yet.'}
          </p>
        </div>
      )}

      {rows.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">Deal</th>
                <th scope="col">Maker</th>
                <th scope="col" className="num">EURC</th>
                <th scope="col" className="num">Rate</th>
                <th scope="col" className="num">USDC</th>
                <th scope="col">Settles</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((d) => {
                const phase = phaseOf(d, now)
                const role = roleOf(d, address)
                const left = Number(d.maturity) - now
                return (
                  <tr
                    key={d.id.toString()}
                    className={selected === d.id ? 'selected' : ''}
                    onClick={() => onSelect(d.id)}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect(d.id)}
                    tabIndex={0}
                    aria-selected={selected === d.id}
                  >
                    <td>
                      #{d.id.toString()}
                      {role && <span className={`role role--${role}`}>you</span>}
                    </td>
                    <td>{d.makerSide === Side.BuyEURC ? 'Buys EURC' : 'Sells EURC'}</td>
                    <td className="num eur">{fmtAmount(d.eurcAmount)}</td>
                    <td className="num">
                      <RateFigure rate={rateOf(d.usdcAmount, d.eurcAmount)} size="sm" />
                    </td>
                    <td className="num usd">{fmtAmount(d.usdcAmount)}</td>
                    <td title={fmtDate(d.maturity)}>{left > 0 ? `in ${fmtCountdown(left)}` : fmtDate(d.maturity)}</td>
                    <td>
                      <span className={`phase phase--${phase}`}>{phaseLabel[phase]}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
