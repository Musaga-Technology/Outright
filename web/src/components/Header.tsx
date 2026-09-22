import Link from 'next/link'
import { useAccount, useChainId, useConnect, useDisconnect, useSwitchChain } from 'wagmi'
import { arc } from '../config'
import { useBalances } from '../hooks/useOutright'
import { fmtAmount, short } from '../lib/format'
import { Mark } from './Illustrations'

export function Header() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const { switchChain } = useSwitchChain()
  const bal = useBalances()
  const wrongChain = isConnected && chainId !== arc.id

  return (
    <header className="topbar">
      <div className="topbar__inner">
        <div className="topbar__left">
          <Link href="/" className="brand">
            <Mark />
            Outright
          </Link>
          <span className="topbar__tag">{arc.name}</span>
        </div>

        <div className="topbar__wallet">
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
              className="btn btn--ink btn--sm"
              disabled={isPending || connectors.length === 0}
              onClick={() => connect({ connector: connectors[0] })}
            >
              {connectors.length === 0 ? 'No wallet found' : isPending ? 'Connecting…' : 'Connect wallet'}
            </button>
          )}
          {wrongChain && (
            <button className="btn btn--amber btn--sm" onClick={() => switchChain({ chainId: arc.id })}>
              Switch to Arc
            </button>
          )}
          {isConnected && (
            <button className="wallet-chip" onClick={() => disconnect()} title="Disconnect">
              {short(address!)}
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
