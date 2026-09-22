import { useState } from 'react'
import { Blotter, type Tab } from './components/Blotter'
import { DealDetail } from './components/DealDetail'
import { Header } from './components/Header'
import { Drawer } from './components/Overlay'
import { Ticket } from './components/Ticket'
import { WalletPickerProvider } from './components/WalletPicker'
import { explorerAddress, OUTRIGHT_ADDRESS } from './config'
import { useDeals } from './hooks/useOutright'

export default function App() {
  const { deals, isLoading, refetch } = useDeals()
  const [selected, setSelected] = useState<bigint | null>(null)
  const [tab, setTab] = useState<Tab>('offers')
  const deal = deals.find((d) => d.id === selected) ?? null

  return (
    <WalletPickerProvider>
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
        <Drawer onClose={() => setSelected(null)} labelledBy="detail-title">
          <DealDetail key={deal.id.toString()} deal={deal} onChanged={refetch} onClose={() => setSelected(null)} />
        </Drawer>
      )}
    </WalletPickerProvider>
  )
}
