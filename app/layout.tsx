import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-mono' })

export const metadata: Metadata = {
  title: 'PROBABYLON - Multi-Agent Prediction Markets',
  description:
    'AI-powered prediction markets with multi-agent simulation using LMSR mechanism',
  generator: 'v0.app',
  icons: {
    icon: [
      { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-background text-foreground font-sans antialiased">
        {/* GLOBAL LAYOUT CONTAINER FIX (THIS FIXES YOUR UI) */}
        <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-6">
          {children}
        </div>

        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}