import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'DuetSim - Pairwise Future Outcome Engine',
  description: 'Simulate the future between two forces. Predict how entities interact, adapt, and reshape each other\'s future.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}