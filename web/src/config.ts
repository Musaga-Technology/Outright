import { defineChain, type Address } from 'viem'
import { createConfig, http } from 'wagmi'
import { injected } from 'wagmi/connectors'

const chainId = Number(process.env.NEXT_PUBLIC_ARC_CHAIN_ID ?? 5042)
// Multicall3 is predeployed on Arc mainnet and testnet. A plain local Anvil node doesn't
// have it, so leave it out there and let wagmi fall back to individual reads.
const isLocal = chainId === 31337

export const arc = defineChain({
  id: chainId,
  name: isLocal ? 'Anvil (local)' : 'Arc',
  // Arc's native gas token is USDC at 18 decimals. Balances and transfers in this app
  // always go through the 6-decimal ERC-20 interface instead — never mix the two.
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  rpcUrls: { default: { http: [process.env.NEXT_PUBLIC_ARC_RPC_URL ?? 'https://rpc.mainnet.arc.io'] } },
  blockExplorers: {
    default: { name: 'Arc Explorer', url: process.env.NEXT_PUBLIC_ARC_EXPLORER_URL ?? 'https://explorer.arc.io' },
  },
  contracts: isLocal ? {} : { multicall3: { address: '0xcA11bde05977b3631167028862bE2a173976CA11' } },
})

export const OUTRIGHT_ADDRESS = (process.env.NEXT_PUBLIC_OUTRIGHT_ADDRESS || undefined) as Address | undefined

export const TOKEN_DECIMALS = 6 // USDC ERC-20 interface and EURC are both 6 decimals

export const wagmiConfig = createConfig({
  chains: [arc],
  connectors: [injected()],
  transports: { [arc.id]: http() },
})

export const explorerTx = (hash: string) => `${arc.blockExplorers.default.url}/tx/${hash}`
export const explorerAddress = (a: string) => `${arc.blockExplorers.default.url}/address/${a}`

declare module 'wagmi' {
  interface Register {
    config: typeof wagmiConfig
  }
}
