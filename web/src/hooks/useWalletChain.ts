import { useAccount } from 'wagmi'
import { arc } from '../config'

/**
 * The chain the *wallet* is on.
 *
 * Don't use wagmi's useChainId() for this: it reports the app's configured chain, so a wallet
 * sitting on a network Outright doesn't list (Ethereum, say) still reads as Arc, and the desk
 * would offer to post an offer that can't succeed.
 */
export function useWalletChain() {
  const { isConnected, chainId } = useAccount()
  return {
    isConnected,
    chainId,
    onArc: isConnected && chainId === arc.id,
    wrongChain: isConnected && chainId !== arc.id,
  }
}
