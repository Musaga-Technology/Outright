import { useEffect, useRef, useState } from 'react'
import { Blotter, type Tab } from './components/Blotter'
import { DealDetail } from './components/DealDetail'
import { Header } from './components/Header'
import { Ticket } from './components/Ticket'
import { explorerAddress, OUTRIGHT_ADDRESS } from './config'
import { useDeals } from './hooks/useOutright'

export default function App() {
  const { deals, isLoading, refetch } = useDeals()
  const [selected, setSelected] = useState<bigint | null>(null)
  const [tab, setTab] = useState<Tab>('offers')
  const deal = deals.find((d) => d.id === selected) ?? null

  return (
    <>
      <Header />
      <div className="page">
        {!OUTRIGHT_ADDRESS && (
          <p className="banner">
            No contract configured. Copy <code>.env.example</code> to <code>.env.local</code> and set{' '}
            <code>NEXT_PUBLIC_OUTRIGHT_ADDRESS</code>.
          </p>
        )}
        <div className="page__intro">
          <div>
            <h1>Desk</h1>
            <p>Post a new forward, or pick an open offer to accept.</p>
          </div>
        </div>
        <main className="desk">
          <Ticket
            onPosted={() => {
              refetch()
              setTab('mine')
            }}
          />
          <div className="desk__right">
            <Blotter deals={deals} loading={isLoading} selected={selected} onSelect={setSelected} tab={tab} onTab={setTab} />
          </div>
        </main>
      </div>
      <footer className="foot">
        <p>
          Every forward is fully collateralized: both sides lock their leg in the contract, so settlement can&rsquo;t
          fail. No oracle, no margin calls.
        </p>
        {OUTRIGHT_ADDRESS && (
          <a href={explorerAddress(OUTRIGHT_ADDRESS)} target="_blank" rel="noreferrer">
            Contract on Arc Explorer
          </a>
        )}
      </footer>

      {deal && (
        <Drawer onClose={() => setSelected(null)}>
          <DealDetail key={deal.id.toString()} deal={deal} onChanged={refetch} onClose={() => setSelected(null)} />
        </Drawer>
      )}
    </>
  )
}

/** Slide-over panel: Esc or the backdrop closes it, focus moves in and returns to the row that opened it. */
function Drawer({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  const panel = useRef<HTMLDivElement>(null)
  // The parent re-renders on every poll; keep the latest onClose without re-running the effect.
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

  return (
    <div className="drawer" role="dialog" aria-modal="true" aria-labelledby="detail-title">
      <div className="drawer__backdrop" onClick={onClose} />
      <div className="drawer__panel" ref={panel}>
        {children}
      </div>
    </div>
  )
}
