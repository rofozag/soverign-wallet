import './globals.css'
import type { Metadata } from 'next'
import { Chakra_Petch, Outfit } from 'next/font/google'
import { Providers } from './providers'
import MiningTimer from '@/components/MiningTimer'

const chakra = Chakra_Petch({
  weight: ['600', '700'],
  subsets: ['latin'],
  variable: '--font-chakra',
  display: 'swap',
})

const outfit = Outfit({
  weight: ['300', '400', '500'],
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Sovereign Wallet | Digital Naira Mining',
  description:
    'Mine Nigerian Naira digitally. Tier-based earnings. Secure withdrawals.',
  keywords: 'naira mining, digital wallet, Nigeria, passive income',
  openGraph: {
    title: 'Sovereign Wallet',
    description: 'Mine Nigerian Naira digitally',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${chakra.variable} ${outfit.variable}`}>
        <Providers>
          {/*
            MiningTimer sits above the entire page tree.
            It is NEVER unmounted during in-app navigation, so the
            countdown interval keeps running when the user switches pages.
          */}
          <MiningTimer />
          {children}
        </Providers>
      </body>
    </html>
  )
}
