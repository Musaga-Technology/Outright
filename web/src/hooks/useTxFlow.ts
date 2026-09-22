import { useRef, useState } from 'react'
import { erc20Abi, maxUint256, type Address, type Hash } from 'viem'
import { useAccount, usePublicClient, useWriteContract } from 'wagmi'
import { OUTRIGHT_ADDRESS } from '../config'

export type FlowState =
  | { kind: 'idle' }
  | { kind: 'working'; step: string; n?: number; total?: number }
  | { kind: 'done'; hash: Hash; message: string }
  | { kind: 'error'; message: string }

/**
 * Runs a sequence of writes, waiting for each receipt before the next.
 * `ensureAllowance` inserts an approve step only when the current allowance is short.
 */
export function useTxFlow() {
  const [state, setState] = useState<FlowState>({ kind: 'idle' })
  // Set once an approve step runs, so the UI can show "step 2 of 2" for the write that follows.
  const approved = useRef(false)
  const { address } = useAccount()
  const client = usePublicClient()
  const { writeContractAsync } = useWriteContract()

  async function ensureAllowance(token: Address, amount: bigint, symbol: string) {
    if (!client || !address || !OUTRIGHT_ADDRESS) throw new Error('Connect a wallet first.')
    const current = await client.readContract({
      address: token,
      abi: erc20Abi,
      functionName: 'allowance',
      args: [address, OUTRIGHT_ADDRESS],
    })
    if (current >= amount) return
    approved.current = true
    setState({ kind: 'working', step: `Approve ${symbol} in your wallet`, n: 1, total: 2 })
    const hash = await writeContractAsync({
      address: token,
      abi: erc20Abi,
      functionName: 'approve',
      args: [OUTRIGHT_ADDRESS, maxUint256],
    })
    setState({ kind: 'working', step: `Waiting for ${symbol} approval`, n: 1, total: 2 })
    await client.waitForTransactionReceipt({ hash })
  }

  async function run(
    steps: (helpers: {
      ensureAllowance: typeof ensureAllowance
      send: (label: string, write: () => Promise<Hash>) => Promise<Hash>
    }) => Promise<Hash>,
    doneMessage: string,
  ) {
    approved.current = false
    try {
      const send = async (label: string, write: () => Promise<Hash>) => {
        const n = approved.current ? { n: 2, total: 2 } : {}
        setState({ kind: 'working', step: `${label} in your wallet`, ...n })
        const hash = await write()
        setState({ kind: 'working', step: 'Waiting for confirmation', ...n })
        const receipt = await client!.waitForTransactionReceipt({ hash })
        if (receipt.status !== 'success') throw new Error('Transaction reverted on-chain.')
        return hash
      }
      const hash = await steps({ ensureAllowance, send })
      setState({ kind: 'done', hash, message: doneMessage })
      return true
    } catch (e) {
      setState({ kind: 'error', message: readableError(e) })
      return false
    }
  }

  return { state, run, reset: () => setState({ kind: 'idle' }), writeContractAsync }
}

const REVERTS: Record<string, string> = {
  ZeroAmount: 'Both amounts must be greater than zero.',
  BadTimes: 'The accept window must end before maturity, and not in the past.',
  BadCounterparty: "You can't trade with yourself.",
  WrongStatus: 'This forward has changed state. Refresh and try again.',
  OfferExpired: 'This offer is past its accept window.',
  NotAllowed: "Your address isn't allowed to do this on this forward.",
  NotMatured: 'This forward has not reached maturity yet.',
  AlreadyMatured: 'This forward has already matured, so it can no longer be unwound.',
  NothingToClaim: 'You have already claimed your side.',
}

function readableError(e: unknown): string {
  const any = e as { shortMessage?: string; message?: string; cause?: { data?: { errorName?: string } } }
  const name = any?.cause?.data?.errorName
  if (name && REVERTS[name]) return REVERTS[name]
  const msg = any?.shortMessage ?? any?.message ?? 'Something went wrong.'
  if (/User rejected|denied/i.test(msg)) return 'You rejected the request in your wallet.'
  for (const k of Object.keys(REVERTS)) if (msg.includes(k)) return REVERTS[k]
  return msg.split('\n')[0]
}
