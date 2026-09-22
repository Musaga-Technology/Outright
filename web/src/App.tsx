import { useState } from 'react'
import { Blotter } from './components/Blotter'
import { DealDetail } from './components/DealDetail'
import { Header } from './components/Header'
import { Ticket } from './components/Ticket'
import { explorerAddress, OUTRIGHT_ADDRESS } from './config'
import { useDeals } from './hooks/useOutright'

export default function App() {
  const { deals, isLoading, refetch } = useDeals()
  const [selected, setSelected] = useState<bigint | null>(null)
  const deal = deals.find((d) => d.id === selected) ?? null

  return (
    <div className="page">
      <Header />
      {!OUTRIGHT_ADDRESS && (
        <p className="banner">
          No contract configured. Copy <code>.env.example</code> to <code>.env.local</code> and set{' '}
          <code>NEXT_PUBLIC_OUTRIGHT_ADDRESS</code>.
        </p>
      )}
      <main className="desk">
        <Ticket onPosted={refetch} />
        <div className="desk__right">
          {deal && <DealDetail key={deal.id.toString()} deal={deal} onChanged={refetch} onClose={() => setSelected(null)} />}
          <Blotter deals={deals} loading={isLoading} selected={selected} onSelect={setSelected} />
        </div>
      </main>
      <footer className="foot">
        <p>
          Every forward is fully collateralized: both sides lock their leg in the contract, so settlement can't fail.
          No oracle, no margin calls.
        </p>
        {OUTRIGHT_ADDRESS && (
          <a href={explorerAddress(OUTRIGHT_ADDRESS)} target="_blank" rel="noreferrer">
            Contract on Arc Explorer
          </a>
        )}
      </footer>
    </div>
  )
}
