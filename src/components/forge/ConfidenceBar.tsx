'use client'

import { motion } from 'framer-motion'

interface ConfidenceBarProps {
  scoreA: number
  scoreB: number
  nameA: string
  nameB: string
}

export default function ConfidenceBar({ scoreA, scoreB, nameA, nameB }: ConfidenceBarProps) {
  const total = scoreA + scoreB || 1
  const percentA = (scoreA / total) * 100

  return (
    <div className="glass-strong rounded-2xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#06b6d4]" />
          <span className="text-xs font-semibold text-[#06b6d4]">{nameA}</span>
          <motion.span
            key={Math.round(percentA)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs font-bold text-[#06b6d4]"
          >
            {Math.round(percentA)}%
          </motion.span>
        </div>
        <div className="flex items-center gap-2">
          <motion.span
            key={Math.round(100 - percentA)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs font-bold text-[#f43f5e]"
          >
            {Math.round(100 - percentA)}%
          </motion.span>
          <span className="text-xs font-semibold text-[#f43f5e]">{nameB}</span>
          <div className="w-2 h-2 rounded-full bg-[#f43f5e]" />
        </div>
      </div>

      {/* Bar */}
      <div className="relative h-3 bg-[var(--bg)] rounded-full overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            background: 'linear-gradient(90deg, #06b6d4, #6366f1)',
            boxShadow: '0 0 12px rgba(6, 182, 212, 0.4)',
          }}
          animate={{ width: `${percentA}%` }}
          transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
        />
        <motion.div
          className="absolute inset-y-0 right-0 rounded-full"
          style={{
            background: 'linear-gradient(90deg, #6366f1, #f43f5e)',
            boxShadow: '0 0 12px rgba(244, 63, 94, 0.4)',
          }}
          animate={{ width: `${100 - percentA}%` }}
          transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
        />

        {/* Divider */}
        <motion.div
          className="absolute top-0 bottom-0 w-0.5 bg-white/80 z-10"
          animate={{ left: `${percentA}%` }}
          transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
          style={{ transform: 'translateX(-50%)' }}
        />
      </div>
    </div>
  )
}
