import { useAccount, useChainId, useSwitchChain } from 'wagmi'
import { arc } from '../config'
import { useWalletPicker } from './WalletPicker'

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
  const { isConnected } = useAccount()
  const chainId = useChainId()
  const openPicker = useWalletPicker()
  const { switchChain, isPending: switching } = useSwitchChain()

  if (!isConnected)
    return (
      <button className="btn btn--ink btn--wide" onClick={openPicker}>
        Connect wallet
      </button>
    )
  if (chainId !== arc.id)
    return (
      <button className="btn btn--amber btn--wide" disabled={switching} onClick={() => switchChain({ chainId: arc.id })}>
        {switching ? 'Switching…' : 'Switch to Arc'}
      </button>
    )
  return (
    <button className={`btn btn--${variant} btn--wide`} disabled={disabled} onClick={onClick}>
      {label}
    </button>
  )
}
