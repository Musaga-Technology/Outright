import { explorerTx } from '../config'
import type { FlowState } from '../hooks/useTxFlow'

export function FlowStatus({ state, onDismiss }: { state: FlowState; onDismiss: () => void }) {
  if (state.kind === 'idle') return null
  return (
    <div className={`flow flow--${state.kind}`} role="status" aria-live="polite">
      {state.kind === 'working' && (
        <>
          <span className="spinner" aria-hidden />
          <span>{state.step}…</span>
        </>
      )}
      {state.kind === 'done' && (
        <>
          <span>{state.message}</span>
          <a href={explorerTx(state.hash)} target="_blank" rel="noreferrer">
            View transaction
          </a>
          <button className="linklike" onClick={onDismiss}>
            Dismiss
          </button>
        </>
      )}
      {state.kind === 'error' && (
        <>
          <span>{state.message}</span>
          <button className="linklike" onClick={onDismiss}>
            Dismiss
          </button>
        </>
      )}
    </div>
  )
}
