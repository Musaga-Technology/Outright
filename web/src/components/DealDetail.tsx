import { useAccount } from 'wagmi'
import { outrightAbi } from '../abi/outright'
import { explorerAddress, OUTRIGHT_ADDRESS } from '../config'
import { useNow } from '../hooks/useNow'
import { useTokens } from '../hooks/useOutright'
import { useWalletChain } from '../hooks/useWalletChain'
import { useTxFlow } from '../hooks/useTxFlow'
import { buyerOf, phaseLabel, phaseOf, roleOf, same, sellerOf, Side, ZERO, type Deal } from '../lib/deal'
import { fmtAmount, fmtCountdown, fmtDate, rateOf, short } from '../lib/format'
import { FlowStatus } from './FlowStatus'
import { RateFigure } from './RateFigure'
import { WalletButton } from './WalletButton'

export function DealDetail({ deal, onChanged, onClose }: { deal: Deal; onChanged: () => void; onClose: () => void }) {
  const { address } = useAccount()
  const { isConnected, wrongChain } = useWalletChain()
  const now = useNow()
  const { usdc, eurc } = useTokens()
  const flow = useTxFlow()

  const phase = phaseOf(deal, now)
  const role = roleOf(deal, address)
  const isMaker = same(deal.maker, address)
  const isTaker = same(deal.taker, address)
  const restricted = deal.status === 1 && deal.taker !== ZERO
  const canAccept = phase === 'open' && isConnected && !isMaker && (!restricted || isTaker)
  const busy = flow.state.kind === 'working'

  const buyer = buyerOf(deal)
  const seller = sellerOf(deal)
  const myClaimed = role === 'buyer' ? deal.buyerClaimed : role === 'seller' ? deal.sellerClaimed : true
  const myConsent = isMaker ? deal.makerUnwind : isTaker ? deal.takerUnwind : false
  const theirConsent = isMaker ? deal.takerUnwind : isTaker ? deal.makerUnwind : false

  // Before acceptance the bar tracks the offer window; afterwards it tracks the run to maturity.
  const accepted = deal.acceptedAt > 0n
  const start = Number(accepted ? deal.acceptedAt : deal.createdAt)
  const end = Number(accepted ? deal.maturity : deal.acceptBy)
  const progress = end > start ? Math.min(1, Math.max(0, (now - start) / (end - start))) : 1

  const call = (fn: 'accept' | 'cancel' | 'requestUnwind' | 'revokeUnwind' | 'claim', label: string, done: string) =>
    flow
      .run(async ({ ensureAllowance, send }) => {
        if (fn === 'accept') {
          // Taker escrows the leg opposite to the maker's.
          if (deal.makerSide === Side.BuyEURC) await ensureAllowance(eurc!, deal.eurcAmount, 'EURC')
          else await ensureAllowance(usdc!, deal.usdcAmount, 'USDC')
        }
        return send(label, () =>
          flow.writeContractAsync({ address: OUTRIGHT_ADDRESS!, abi: outrightAbi, functionName: fn, args: [deal.id] }),
        )
      }, done)
      .then((ok) => ok && onChanged())

  const takerLeg =
    deal.makerSide === Side.BuyEURC ? `${fmtAmount(deal.eurcAmount)} EURC` : `${fmtAmount(deal.usdcAmount)} USDC`
  const claimWhat =
    phase === 'unwound'
      ? role === 'buyer'
        ? `${fmtAmount(deal.usdcAmount)} USDC back`
        : `${fmtAmount(deal.eurcAmount)} EURC back`
      : role === 'buyer'
        ? `${fmtAmount(deal.eurcAmount)} EURC`
        : `${fmtAmount(deal.usdcAmount)} USDC`

  return (
    <section className="detail">
      <div className="detail__top">
        <h2 id="detail-title">Deal #{deal.id.toString()}</h2>
        <span className={`phase phase--${phase}`}>{phaseLabel[phase]}</span>
        <button className="detail__close" onClick={onClose} aria-label="Close deal">
          ×
        </button>
      </div>

      <div className="detail__rate">
        <RateFigure rate={rateOf(deal.usdcAmount, deal.eurcAmount)} />
        <span className="ticket__pair">USDC per EURC</span>
      </div>

      <div className="confirm">
        <div className="confirm__row">
          <span>EURC buyer</span>
          <span>{buyer === ZERO ? 'Awaiting taker' : <a href={explorerAddress(buyer)} target="_blank" rel="noreferrer">{same(buyer, address) ? 'You' : short(buyer)}</a>}</span>
          <strong className="usd">pays {fmtAmount(deal.usdcAmount)} USDC</strong>
          <span className="tick">{deal.buyerClaimed ? 'claimed' : ''}</span>
        </div>
        <div className="confirm__row">
          <span>EURC seller</span>
          <span>{seller === ZERO ? 'Awaiting taker' : <a href={explorerAddress(seller)} target="_blank" rel="noreferrer">{same(seller, address) ? 'You' : short(seller)}</a>}</span>
          <strong className="eur">delivers {fmtAmount(deal.eurcAmount)} EURC</strong>
          <span className="tick">{deal.sellerClaimed ? 'claimed' : ''}</span>
        </div>
      </div>

      <div className="timeline" aria-label="Timeline">
        <div className="timeline__bar">
          <div className="timeline__fill" style={{ width: `${progress * 100}%` }} />
        </div>
        <div className="timeline__ends">
          <span>
            {accepted ? 'Accepted' : 'Posted'}
            <br />
            <b>{fmtDate(start)}</b>
          </span>
          {accepted ? (
            <span className="right">
              Settles
              <br />
              <b>{fmtDate(deal.maturity)}</b>
              {now < end && <em> in {fmtCountdown(end - now)}</em>}
            </span>
          ) : (
            <span className="right">
              Offer closes
              <br />
              <b>{fmtDate(deal.acceptBy)}</b>
              {now < end && deal.status === 1 && <em> in {fmtCountdown(end - now)}</em>}
              <br />
              Settles {fmtDate(deal.maturity)}
            </span>
          )}
        </div>
      </div>

      <div className="actions">
        {wrongChain && phase !== 'open' && <WalletButton label="" onClick={() => {}} />}

        {phase === 'open' && (!isConnected || wrongChain || canAccept) && !isMaker && (
          <WalletButton
            label={`Accept and lock ${takerLeg}`}
            disabled={busy || !canAccept}
            onClick={() => call('accept', 'Confirm acceptance', 'Forward accepted.')}
          />
        )}
        {phase === 'open' && restricted && !isTaker && !isMaker && (
          <p className="hint">This offer is reserved for {short(deal.taker)}.</p>
        )}
        {phase === 'open' && isMaker && (
          <button className="btn btn--ghost btn--wide" disabled={busy || wrongChain} onClick={() => call('cancel', 'Confirm cancellation', 'Offer cancelled and refunded.')}>
            Cancel offer and refund
          </button>
        )}
        {phase === 'expired' && isConnected && (
          <button className="btn btn--ghost btn--wide" disabled={busy || wrongChain} onClick={() => call('cancel', 'Confirm refund', 'Maker refunded.')}>
            {isMaker ? 'Refund my deposit' : "Return the maker's deposit"}
          </button>
        )}

        {phase === 'running' && role && (
          <>
            {!myConsent ? (
              <button className="btn btn--ghost btn--wide" disabled={busy || wrongChain} onClick={() => call('requestUnwind', 'Confirm unwind request', 'Unwind requested.')}>
                {theirConsent ? 'Agree to unwind' : 'Ask to unwind early'}
              </button>
            ) : (
              <button className="btn btn--ghost btn--wide" disabled={busy || wrongChain} onClick={() => call('revokeUnwind', 'Confirm withdrawal', 'Unwind request withdrawn.')}>
                Withdraw unwind request
              </button>
            )}
            <p className="hint">
              {theirConsent && !myConsent && 'Your counterparty wants to unwind. If you agree, each side gets its own deposit back.'}
              {myConsent && !theirConsent && 'Waiting for your counterparty to agree. The forward runs to maturity unless they do.'}
              {!myConsent && !theirConsent && 'Unwinding needs both sides to agree; each side then gets its own deposit back.'}
            </p>
          </>
        )}

        {(phase === 'matured' || phase === 'unwound') && role && !myClaimed && (
          <button className="btn btn--ink btn--wide" disabled={busy || wrongChain} onClick={() => call('claim', 'Confirm claim', 'Claimed.')}>
            Claim {claimWhat}
          </button>
        )}
        {(phase === 'matured' || phase === 'unwound') && role && myClaimed && (
          <p className="hint">You've claimed your side.</p>
        )}
        {!isConnected && phase !== 'open' && <p className="hint">Connect a wallet to act on this forward.</p>}
      </div>

      <FlowStatus state={flow.state} onDismiss={flow.reset} />
    </section>
  )
}
