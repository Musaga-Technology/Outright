import { createContext, useContext, useState } from 'react'
import { useAccount, useConnect, type Connector } from 'wagmi'
import { Modal } from './Overlay'

const Ctx = createContext<() => void>(() => {})

/** Any "Connect wallet" button calls this to open the picker. */
export const useWalletPicker = () => useContext(Ctx)

export function WalletPickerProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <Ctx.Provider value={() => setOpen(true)}>
      {children}
      {open && <WalletPicker onClose={() => setOpen(false)} />}
    </Ctx.Provider>
  )
}

/**
 * wagmi lists the generic `injected` connector plus one connector per wallet that announces
 * itself (EIP-6963), each with a name and icon. Show the announced wallets; fall back to the
 * generic one only for older wallets that just set window.ethereum.
 */
function useWallets(): Connector[] {
  const { connectors } = useConnect()
  const announced = connectors.filter((c) => c.type === 'injected' && c.id !== 'injected')
  const hasLegacy = typeof window !== 'undefined' && !!(window as { ethereum?: unknown }).ethereum
  const browser = announced.length > 0 ? announced : hasLegacy ? connectors.filter((c) => c.id === 'injected') : []
  // Present only when NEXT_PUBLIC_WC_PROJECT_ID is set (see config.ts).
  const phone = connectors.filter((c) => c.type === 'walletConnect')
  return [...browser, ...phone]
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <rect x="7" y="3" width="10" height="18" rx="2.5" />
      <path d="M11 18h2" />
    </svg>
  )
}

function WalletPicker({ onClose }: { onClose: () => void }) {
  const wallets = useWallets()
  const { isConnected } = useAccount()
  const { connect, isPending, variables, error, reset } = useConnect({
    mutation: { onSuccess: onClose },
  })
  const hasBrowserWallet = wallets.some((c) => c.type === 'injected')
  const pendingId = isPending ? (variables?.connector as Connector | undefined)?.uid : undefined

  return (
    <Modal onClose={onClose} labelledBy="picker-title">
      <div className="picker__head">
        <h2 id="picker-title">Connect a wallet</h2>
        <button className="detail__close" onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>

      {wallets.length > 0 && (
        <ul className="picker__list">
          {wallets.map((c) => (
            <li key={c.uid}>
              <button
                className="picker__wallet"
                aria-busy={pendingId === c.uid}
                disabled={isPending || isConnected}
                onClick={() => {
                  reset()
                  // WalletConnect opens its own QR dialog; step aside so the two don't stack.
                  if (c.type === 'walletConnect') onClose()
                  connect({ connector: c })
                }}
              >
                {c.icon ? (
                  <img src={c.icon} alt="" width={30} height={30} />
                ) : (
                  <span className="picker__blank" aria-hidden>
                    {c.type === 'walletConnect' && <PhoneIcon />}
                  </span>
                )}
                <span className="picker__name">
                  {c.type === 'walletConnect' ? 'Phone wallet' : c.id === 'injected' ? 'Browser wallet' : c.name}
                  {c.type === 'walletConnect' && <small>Scan a QR code with WalletConnect</small>}
                </span>
                <span className="picker__state">{pendingId === c.uid ? 'Check your wallet…' : ''}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {!hasBrowserWallet && (
        <div className="picker__none">
          <p>No wallet found in this browser. Install one, then reload this page.</p>
          <div className="picker__links">
            <a className="btn btn--ghost btn--sm" href="https://metamask.io/download/" target="_blank" rel="noreferrer">
              Get MetaMask
            </a>
            <a className="btn btn--ghost btn--sm" href="https://rabby.io/" target="_blank" rel="noreferrer">
              Get Rabby
            </a>
          </div>
        </div>
      )}

      {error && (
        <p className="flow flow--error" role="alert">
          {/rejected|denied/i.test(error.message) ? 'You rejected the request in your wallet.' : error.message.split('\n')[0]}
        </p>
      )}
      <p className="picker__note">Outright never holds your keys. Your wallet asks you to approve every transaction.</p>
    </Modal>
  )
}
