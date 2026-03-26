import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'FutureForge — Pairwise Future Conflict Engine',
  description: 'Simulate what happens when two forces collide. Inject real-world events, explore branching timelines, and watch futures unfold through a connected causal outcome graph.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}