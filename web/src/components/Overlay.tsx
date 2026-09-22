import { useEffect, useRef } from 'react'

/**
 * Shared behaviour for modal overlays: Esc closes, the page behind stops scrolling,
 * focus moves into the panel and returns to whatever opened it.
 */
function useOverlay(onClose: () => void) {
  const panel = useRef<HTMLDivElement>(null)
  // Parents re-render on every poll; keep the latest onClose without re-running the effect.
  const close = useRef(onClose)
  close.current = onClose
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    panel.current?.querySelector<HTMLElement>('button, a')?.focus()
    document.body.classList.add('no-scroll')
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close.current()
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.classList.remove('no-scroll')
      opener?.focus()
    }
  }, [])
  return panel
}

/** Slide-over panel from the right. */
export function Drawer({ children, onClose, labelledBy }: { children: React.ReactNode; onClose: () => void; labelledBy: string }) {
  const panel = useOverlay(onClose)
  return (
    <div className="drawer" role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
      <div className="drawer__backdrop" onClick={onClose} />
      <div className="drawer__panel" ref={panel}>
        {children}
      </div>
    </div>
  )
}

/** Centred dialog. */
export function Modal({ children, onClose, labelledBy }: { children: React.ReactNode; onClose: () => void; labelledBy: string }) {
  const panel = useOverlay(onClose)
  return (
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
      <div className="drawer__backdrop" onClick={onClose} />
      <div className="modal__panel card" ref={panel}>
        {children}
      </div>
    </div>
  )
}
