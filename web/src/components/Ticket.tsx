import { useMemo, useState } from 'react'
import { isAddress, type Address } from 'viem'
import { useAccount, useChainId } from 'wagmi'
import { outrightAbi } from '../abi/outright'
import { arc, OUTRIGHT_ADDRESS } from '../config'
import { useTokens } from '../hooks/useOutright'
import { useTxFlow } from '../hooks/useTxFlow'
import { Side, ZERO } from '../lib/deal'
import { fmtAmount, fmtDate, rateOf, toUnits, usdcFor } from '../lib/format'
import { FlowStatus } from './FlowStatus'
import { RateFigure } from './RateFigure'

const TENORS = [
  { label: '5 min', secs: 5 * 60, hint: 'for demos' },
  { label: '1 day', secs: 86400 },
  { label: '1 week', secs: 7 * 86400 },
  { label: '30 days', secs: 30 * 86400 },
  { label: '90 days', secs: 90 * 86400 },
]
const WINDOWS = [
  { label: '2 min', secs: 120 },
  { label: '1 hour', secs: 3600 },
  { label: '1 day', secs: 86400 },
]

export function Ticket({ onPosted }: { onPosted: () => void }) {
  const { isConnected } = useAccount()
  const chainId = useChainId()
  const { usdc, eurc } = useTokens()
  const flow = useTxFlow()

  const [side, setSide] = useState<number>(Side.BuyEURC)
  const [eurStr, setEurStr] = useState('')
  const [rateStr, setRateStr] = useState('')
  const [tenor, setTenor] = useState(TENORS[3].secs)
  const [acceptWindow, setAcceptWindow] = useState(WINDOWS[1].secs)
  const [cpty, setCpty] = useState('')

  const eurUnits = toUnits(eurStr)
  const usdUnits = eurUnits !== null ? usdcFor(eurUnits, rateStr) : null
  const rate = eurUnits && usdUnits ? rateOf(usdUnits, eurUnits) : toUnits(rateStr) ? Number(rateStr) : null
  const cptyValid = cpty.trim() === '' || isAddress(cpty.trim())

  const now = Math.floor(Date.now() / 1000)
  const maturity = now + tenor
  const acceptBy = Math.min(now + acceptWindow, maturity)

  const problem = useMemo(() => {
    if (!OUTRIGHT_ADDRESS) return 'Set NEXT_PUBLIC_OUTRIGHT_ADDRESS to the deployed contract.'
    if (!isConnected) return 'Connect a wallet to post an offer.'
    if (chainId !== arc.id) return 'Switch your wallet to Arc.'
    if (!eurUnits) return 'Enter the EURC amount.'
    if (!usdUnits) return 'Enter the rate in USDC per EURC.'
    if (!cptyValid) return 'Counterparty must be a valid address, or left blank.'
    return null
  }, [isConnected, chainId, eurUnits, usdUnits, cptyValid])

  const buying = side === Side.BuyEURC

  async function post() {
    if (problem || !usdc || !eurc || !eurUnits || !usdUnits) return
    const nowAtSend = Math.floor(Date.now() / 1000)
    const m = BigInt(nowAtSend + tenor)
    const a = BigInt(Math.min(nowAtSend + acceptWindow, nowAtSend + tenor))
    const ok = await flow.run(async ({ ensureAllowance, send }) => {
      if (buying) await ensureAllowance(usdc, usdUnits, 'USDC')
      else await ensureAllowance(eurc, eurUnits, 'EURC')
      return send('Confirm the offer', () =>
        flow.writeContractAsync({
          address: OUTRIGHT_ADDRESS!,
          abi: outrightAbi,
          functionName: 'create',
          args: [side, eurUnits, usdUnits, a, m, (cpty.trim() || ZERO) as Address],
        }),
      )
    }, 'Offer posted.')
    if (ok) {
      setEurStr('')
      onPosted()
    }
  }

  return (
    <section className="ticket" aria-labelledby="ticket-title">
      <h2 id="ticket-title">New forward</h2>

      <div className="segmented" role="radiogroup" aria-label="Direction">
        <button role="radio" aria-checked={buying} className={buying ? 'on' : ''} onClick={() => setSide(Side.BuyEURC)}>
          Buy EURC
        </button>
        <button role="radio" aria-checked={!buying} className={!buying ? 'on' : ''} onClick={() => setSide(Side.SellEURC)}>
          Sell EURC
        </button>
      </div>

      <div className="ticket__rate">
        <RateFigure rate={rate} />
        <span className="ticket__pair">USDC per EURC</span>
      </div>

      <div className="fields">
        <label className="field">
          <span>Amount</span>
          <span className="field__input">
            <input inputMode="decimal" placeholder="10,000" value={eurStr} onChange={(e) => setEurStr(e.target.value)} />
            <em className="eur">EURC</em>
          </span>
        </label>
        <label className="field">
          <span>Rate, USDC per EURC</span>
          <span className="field__input">
            <input inputMode="decimal" placeholder="1.1700" value={rateStr} onChange={(e) => setRateStr(e.target.value)} />
            <em>USDC</em>
          </span>
        </label>
      </div>

      <fieldset className="chips">
        <legend>Settles in</legend>
        {TENORS.map((t) => (
          <button key={t.secs} className={tenor === t.secs ? 'on' : ''} onClick={() => setTenor(t.secs)} title={t.hint}>
            {t.label}
          </button>
        ))}
      </fieldset>

      <fieldset className="chips">
        <legend>Offer open for</legend>
        {WINDOWS.map((w) => (
          <button key={w.secs} className={acceptWindow === w.secs ? 'on' : ''} onClick={() => setAcceptWindow(w.secs)}>
            {w.label}
          </button>
        ))}
      </fieldset>

      <label className="field field--quiet">
        <span>Only this counterparty can accept (optional)</span>
        <input
          className={cptyValid ? '' : 'invalid'}
          placeholder="0x… leave blank to let anyone accept"
          value={cpty}
          onChange={(e) => setCpty(e.target.value)}
          spellCheck={false}
        />
      </label>

      <div className="legs" aria-label="Summary">
        <div className="leg">
          <span>You lock now</span>
          <strong className={buying ? 'usd' : 'eur'}>
            {buying ? (usdUnits ? fmtAmount(usdUnits) : '0.00') + ' USDC' : (eurUnits ? fmtAmount(eurUnits) : '0.00') + ' EURC'}
          </strong>
        </div>
        <div className="leg">
          <span>You receive on {fmtDate(maturity)}</span>
          <strong className={buying ? 'eur' : 'usd'}>
            {buying ? (eurUnits ? fmtAmount(eurUnits) : '0.00') + ' EURC' : (usdUnits ? fmtAmount(usdUnits) : '0.00') + ' USDC'}
          </strong>
        </div>
        <p className="legs__note">
          Anyone can accept until {fmtDate(acceptBy)}. You can cancel for a full refund until someone does.
        </p>
      </div>

      <button className="btn btn--ink btn--wide" disabled={!!problem || flow.state.kind === 'working'} onClick={post}>
        Post offer
      </button>
      {problem && flow.state.kind === 'idle' && <p className="hint">{problem}</p>}
      <FlowStatus state={flow.state} onDismiss={flow.reset} />
    </section>
  )
}
