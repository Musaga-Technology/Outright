import type { Metadata } from 'next'
import { DeskClient } from './desk-client'

export const metadata: Metadata = {
  title: 'Desk — Outright',
  description: 'Post and accept USDC/EURC forwards on Arc.',
}

export default function DeskPage() {
  return <DeskClient />
}
