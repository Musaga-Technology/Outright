import { useAccount, useChainId, useConnect, useDisconnect, useSwitchChain } from 'wagmi'
import { arc } from '../config'
import { useBalances } from '../hooks/useOutright'
import { fmtAmount, short } from '../lib/format'

export function Header() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const { switchChain } = useSwitchChain()
  const bal = useBalances()
  const wrongChain = isConnected && chainId !== arc.id

  return (
    <header className="masthead">
      <div className="masthead__brand">
        <svg className="mark" viewBox="0 0 32 32" aria-hidden>
          <path d="M5 20h22M20 13l7 7-7 7" />
          <path d="M27 12H5M12 5l-7 7 7 7" className="mark__back" />
        </svg>
        <div>
          <h1>Outright</h1>
          <p>Lock a USDC/EURC rate today. Settle on the date you choose.</p>
        </div>
      </div>

      <div className="masthead__wallet">
        {isConnected && !wrongChain && (
          <dl className="balances">
            <div>
              <dt>USDC</dt>
              <dd className="usd">{bal.usdc !== undefined ? fmtAmount(bal.usdc) : '…'}</dd>
            </div>
            <div>
              <dt>EURC</dt>
              <dd className="eur">{bal.eurc !== undefined ? fmtAmount(bal.eurc) : '…'}</dd>
            </div>
          </dl>
        )}
        {!isConnected && (
          <button
            className="btn btn--ink"
            disabled={isPending || connectors.length === 0}
            onClick={() => connect({ connector: connectors[0] })}
          >
            {connectors.length === 0 ? 'No wallet found' : isPending ? 'Connecting…' : 'Connect wallet'}
          </button>
        )}
        {wrongChain && (
          <button className="btn btn--amber" onClick={() => switchChain({ chainId: arc.id })}>
            Switch to Arc
          </button>
        )}
        {isConnected && (
          <button className="wallet-chip" onClick={() => disconnect()} title="Disconnect">
            {short(address!)}
          </button>
        )}
      </div>
    </header>
  )
}
