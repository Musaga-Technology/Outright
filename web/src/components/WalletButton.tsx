import { useSwitchChain } from 'wagmi'
import { arc } from '../config'
import { useWalletChain } from '../hooks/useWalletChain'
import { useWalletPicker } from './WalletPicker'

/**
 * Moves the wallet to Arc, adding the network first if the wallet doesn't have it yet
 * (wagmi turns the wallet's "unrecognized chain" error into an add-network request,
 * using the RPC, explorer and currency from config.ts).
 */
export function SwitchChainButton({ size }: { size?: 'sm' }) {
  const { switchChain, isPending, error, reset } = useSwitchChain()
  return (
    <div className="switcher">
      <button
        className={`btn btn--amber ${size === 'sm' ? 'btn--sm' : 'btn--wide'}`}
        disabled={isPending}
        onClick={() => {
          reset()
          switchChain({ chainId: arc.id })
        }}
      >
        {isPending ? 'Check your wallet…' : `Switch to ${arc.name}`}
      </button>
      {error && <p className="hint hint--warn">{switchMessage(error)}</p>}
    </div>
  )
}

function switchMessage(error: Error): string {
  const msg = `${(error as { shortMessage?: string }).shortMessage ?? error.message}`
  if (/rejected|denied/i.test(msg)) return 'You declined in your wallet. Outright only works on Arc.'
  if (/unrecognized|4902|add.*chain/i.test(msg)) return `Your wallet doesn't know Arc yet — approve “Add network” when it asks.`
  return msg.split('\n')[0]
}

/**
 * The one primary button on a panel. It always offers the next thing the user can do:
 * connect a wallet, then switch to Arc, then the action itself.
 */
export function WalletButton({
  label,
  onClick,
  disabled,
  variant = 'ink',
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  variant?: 'ink' | 'ghost'
}) {
  const { isConnected, wrongChain } = useWalletChain()
  const openPicker = useWalletPicker()


  if (!isConnected)
    return (
      <button className="btn btn--ink btn--wide" onClick={openPicker}>
        Connect wallet
      </button>
    )
  if (wrongChain) return <SwitchChainButton />
  return (
    <button className={`btn btn--${variant} btn--wide`} disabled={disabled} onClick={onClick}>
      {label}
    </button>
  )
}
