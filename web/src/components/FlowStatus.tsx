import { explorerTx } from '../config'
import type { FlowState } from '../hooks/useTxFlow'

export function FlowStatus({ state, onDismiss }: { state: FlowState; onDismiss: () => void }) {
  if (state.kind === 'idle') return null
  return (
    <div className={`flow flow--${state.kind}`} role="status" aria-live="polite">
      {state.kind === 'working' && (
        <>
          <span className="spinner" aria-hidden />
          <span className="flow__text">
            {state.n && state.total && (
              <span className="flow__step">
                Step {state.n} of {state.total}
              </span>
            )}
            {state.step}…
          </span>
        </>
      )}
      {state.kind === 'done' && (
        <>
          <span className="flow__icon" aria-hidden>
            ✓
          </span>
          <span className="flow__text">{state.message}</span>
          <a href={explorerTx(state.hash)} target="_blank" rel="noreferrer">
            View transaction
          </a>
          <button className="flow__close" onClick={onDismiss} aria-label="Dismiss">
            ×
          </button>
        </>
      )}
      {state.kind === 'error' && (
        <>
          <span className="flow__text">{state.message}</span>
          <button className="flow__close" onClick={onDismiss} aria-label="Dismiss">
            ×
          </button>
        </>
      )}
    </div>
  )
}
