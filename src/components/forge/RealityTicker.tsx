'use client'

import { motion } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'
import type { ForgeEvent } from '@/types'

export default function RealityTicker({ events }: Readonly<{ events: ForgeEvent[] }>) {
  if (events.length === 0) return null

  // Ensure string interpolation works for long marquee
  const items = [...events, ...events, ...events] // duplicate for infinite looping illusion

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 h-8 bg-[#0c0c14]/90 backdrop-blur-md border-t border-[var(--border)] overflow-hidden flex items-center">
      <div className="flex-shrink-0 px-4 h-full bg-gradient-to-r from-[#f43f5e] to-[#e11d48] flex items-center justify-center text-white text-[10px] font-black tracking-[0.2em] uppercase z-10 shadow-[4px_0_12px_rgba(244,63,94,0.3)]">
        <AlertTriangle className="w-3.5 h-3.5 mr-2" /> LIVE FEED
      </div>
      <div className="flex-1 relative overflow-hidden h-full flex items-center glass">
        <motion.div
           initial={{ x: 0 }}
           animate={{ x: '-50%' }}
           transition={{
             repeat: Infinity,
             ease: 'linear',
             duration: Math.max(20, events.length * 8)
           }}
           className="whitespace-nowrap flex items-center px-4"
        >
          {items.map((e, i) => (
             <span key={e.id + '-' + i} className="text-[11px] font-mono flex items-center">
               <span className="text-[var(--text-muted)] mr-3 opacity-70">[DAY {e.day}]</span>
               <span className={e.impact > 0 ? 'text-[#06b6d4]' : 'text-[#f43f5e]'}>■</span>
               <span className="text-[var(--text-primary)] font-bold ml-2 tracking-wide text-shadow-sm">{e.label.toUpperCase()}:</span>
               <span className="text-[var(--text-secondary)] ml-1.5">{e.description}</span>
               <span className="text-[#f43f5e]/40 mx-6 tracking-tight">{'///'}</span>
             </span>
          ))}
        </motion.div>
      </div>
    </div>
  )
}
