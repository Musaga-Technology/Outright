import { erc20Abi, type Address } from 'viem'
import { useAccount, useReadContract, useReadContracts } from 'wagmi'
import { outrightAbi } from '../abi/outright'
import { OUTRIGHT_ADDRESS } from '../config'
import type { Deal } from '../lib/deal'

const POLL = 4000

/** Token addresses come from the contract itself, so the frontend can't point at the wrong EURC. */
export function useTokens() {
  const { data } = useReadContracts({
    contracts: [
      { address: OUTRIGHT_ADDRESS, abi: outrightAbi, functionName: 'usdc' },
      { address: OUTRIGHT_ADDRESS, abi: outrightAbi, functionName: 'eurc' },
    ],
    query: { enabled: !!OUTRIGHT_ADDRESS, staleTime: Infinity },
  })
  return {
    usdc: data?.[0]?.result as Address | undefined,
    eurc: data?.[1]?.result as Address | undefined,
  }
}

export function useBalances() {
  const { address } = useAccount()
  const { usdc, eurc } = useTokens()
  const { data, refetch } = useReadContracts({
    contracts: [
      { address: usdc, abi: erc20Abi, functionName: 'balanceOf', args: [address!] },
      { address: eurc, abi: erc20Abi, functionName: 'balanceOf', args: [address!] },
    ],
    query: { enabled: !!address && !!usdc && !!eurc, refetchInterval: POLL },
  })
  return {
    usdc: data?.[0]?.result as bigint | undefined,
    eurc: data?.[1]?.result as bigint | undefined,
    refetch,
  }
}

/** Reads every forward via multicall. Fine for a proof of concept; switch to event indexing at scale. */
export function useDeals() {
  const { data: nextId, refetch: refetchNext } = useReadContract({
    address: OUTRIGHT_ADDRESS,
    abi: outrightAbi,
    functionName: 'nextId',
    query: { enabled: !!OUTRIGHT_ADDRESS, refetchInterval: POLL },
  })
  const count = nextId ? Number(nextId) - 1 : 0
  const ids = Array.from({ length: count }, (_, i) => BigInt(i + 1))

  const { data, isLoading, refetch } = useReadContracts({
    contracts: ids.map((id) => ({
      address: OUTRIGHT_ADDRESS,
      abi: outrightAbi,
      functionName: 'getForward' as const,
      args: [id] as const,
    })),
    query: { enabled: count > 0, refetchInterval: POLL },
  })

  const deals: Deal[] = (data ?? [])
    .map((r, i) => (r.status === 'success' ? ({ id: ids[i], ...(r.result as object) } as Deal) : null))
    .filter((d): d is Deal => d !== null)
    .reverse()

  return {
    deals,
    isLoading: isLoading && count > 0,
    refetch: () => {
      refetchNext()
      refetch()
    },
  }
}
