'use client'

import dynamic from 'next/dynamic'
import { Providers } from '../providers'

// The desk reads the wallet, the chain and the clock, none of which exist on the server,
// so render it client-only rather than hydrating a server snapshot that's already stale.
const App = dynamic(() => import('../../App'), {
  ssr: false,
  loading: () => <div className="desk-loading"><span className="spinner" aria-hidden /> Loading the desk…</div>,
})

export function DeskClient() {
  return (
    <Providers>
      <App />
    </Providers>
  )
}
