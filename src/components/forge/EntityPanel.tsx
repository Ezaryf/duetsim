'use client'

import { motion } from 'framer-motion'
import type { Entity } from '@/types'

interface EntityPanelProps {
  readonly entity: Entity
  readonly side: 'A' | 'B'
  readonly confidence: number
  readonly score: number
}

export default function EntityPanel({ entity, side, confidence, score }: EntityPanelProps) {
  const isA = side === 'A'
  const color = isA ? '#06b6d4' : '#f43f5e'
  const borderColor = isA ? 'border-[#06b6d4]/30' : 'border-[#f43f5e]/30'

  const circumference = 2 * Math.PI * 36

  return (
    <div className={`glass-strong rounded-2xl p-5 ${borderColor} border`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
          isA ? 'bg-[#06b6d4]/20 text-[#06b6d4]' : 'bg-[#f43f5e]/20 text-[#f43f5e]'
        }`}>
          {side}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm truncate">{entity.name}</h3>
          {entity.owner && (
            <p className="text-xs text-[var(--text-muted)] truncate">{entity.owner}</p>
          )}
        </div>
      </div>

      {/* Confidence Ring */}
      <div className="flex justify-center mb-4">
        <div className="relative w-24 h-24">
          <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
            {/* Background ring */}
            <circle
              cx="40" cy="40" r="36"
              fill="none"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="5"
            />
            {/* Progress ring */}
            <motion.circle
              cx="40" cy="40" r="36"
              fill="none"
              stroke={color}
              strokeWidth="5"
              strokeLinecap="round"
              initial={{ strokeDashoffset: circumference }}
              animate={{
                strokeDashoffset: circumference - (circumference * confidence),
              }}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
              strokeDasharray={circumference}
              style={{ filter: `drop-shadow(0 0 6px ${color}50)` }}
            />
          </svg>
          {/* Score number */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              key={Math.round(score)}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-2xl font-black"
              style={{ color }}
            >
              {Math.round(score)}
            </motion.span>
            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">score</span>
          </div>
        </div>
      </div>

      {/* Confidence label */}
      <div className="text-center">
        <div className="text-xs text-[var(--text-muted)] mb-1">Confidence</div>
        <motion.div
          key={Math.round(confidence * 100)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-lg font-bold"
          style={{ color }}
        >
          {Math.round(confidence * 100)}%
        </motion.div>
      </div>

      {/* Metrics */}
      {entity.metrics && (
        <div className="mt-4 pt-4 border-t border-[var(--border)] space-y-2">
          {entity.metrics.stars !== undefined && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--text-muted)]">⭐ Stars</span>
              <span className="font-medium">{Math.round(entity.metrics.stars).toLocaleString()}</span>
            </div>
          )}
          {entity.metrics.forks !== undefined && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--text-muted)]">🍴 Forks</span>
              <span className="font-medium">{Math.round(entity.metrics.forks).toLocaleString()}</span>
            </div>
          )}
          {entity.metrics.watchers !== undefined && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--text-muted)]">👁 Watchers</span>
              <span className="font-medium">{Math.round(entity.metrics.watchers).toLocaleString()}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
