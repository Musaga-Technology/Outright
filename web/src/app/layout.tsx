import type { Metadata } from 'next'
import { Newsreader, Schibsted_Grotesk } from 'next/font/google'
import '../styles.css'

const sans = Schibsted_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
})

// Display serif for headlines only; every number and control stays in the grotesk.
const serif = Newsreader({
  subsets: ['latin'],
  weight: ['400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
})

const icon =
  "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='7' fill='%23101C2C'/><path d='M8 20h16M18 14l6 6-6 6' stroke='%23F2F4F1' stroke-width='2.5' fill='none' stroke-linecap='round'/></svg>"

export const metadata: Metadata = {
  title: 'Outright — USDC/EURC forwards on Arc',
  description:
    'Lock a USDC/EURC exchange rate today and settle on the date you choose. Fully collateralized forwards on Arc.',
  icons: { icon },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <body>{children}</body>
    </html>
  )
}
