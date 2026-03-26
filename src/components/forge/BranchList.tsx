'use client'

import { motion } from 'framer-motion'
import { GitBranch, Check } from 'lucide-react'
import type { Branch } from '@/types'

interface BranchListProps {
  readonly branches: Branch[]
  readonly activeBranchId: string
  readonly onSelectBranch: (branchId: string) => void
}

export default function BranchList({ branches, activeBranchId, onSelectBranch }: BranchListProps) {
  // Sort: active first, then by probability
  const sorted = [...branches].sort((a, b) => {
    if (a.id === activeBranchId) return -1
    if (b.id === activeBranchId) return 1
    return b.probability - a.probability
  })

  return (
    <div className="glass-strong rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <GitBranch className="w-4 h-4 text-[var(--primary)]" />
        <h3 className="text-sm font-bold">Branches</h3>
        <span className="ml-auto text-[10px] text-[var(--text-muted)] bg-[var(--bg)] px-2 py-0.5 rounded-full">
          {branches.length}
        </span>
      </div>

      <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
        {sorted.map((branch, i) => {
          const isActive = branch.id === activeBranchId
          const lastNode = branch.nodes.at(-1)
          const scoreA = lastNode?.entityAScore || 50
          const scoreB = lastNode?.entityBScore || 50
          let winner: 'A' | 'B' | 'TIE' = 'TIE'
          if (scoreA > scoreB) winner = 'A'
          else if (scoreB > scoreA) winner = 'B'

          return (
            <motion.button
              key={branch.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => onSelectBranch(branch.id)}
              className={`w-full text-left p-3 rounded-xl transition-all ${
                isActive
                  ? 'bg-[var(--primary)]/10 border border-[var(--primary)]/30'
                  : 'bg-[var(--bg)]/40 border border-transparent hover:border-[var(--border-bright)] hover:bg-[var(--surface)]'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                {/* Color dot */}
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ background: branch.color, boxShadow: isActive ? `0 0 8px ${branch.color}60` : 'none' }}
                />
                <span className="text-xs font-semibold truncate flex-1">{branch.name}</span>
                {isActive && <Check className="w-3.5 h-3.5 text-[var(--primary)] flex-shrink-0" />}
              </div>

              {/* Probability + scores */}
              <div className="flex items-center gap-2 ml-4">
                <div className="flex-1 h-1.5 bg-[var(--bg)] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${branch.probability}%`,
                      background: `linear-gradient(90deg, ${branch.color}80, ${branch.color})`,
                    }}
                  />
                </div>
                <span className="text-[10px] font-bold w-8 text-right" style={{ color: branch.color }}>
                  {branch.probability}%
                </span>
              </div>

              {/* Final scores */}
              <div className="flex items-center gap-3 ml-4 mt-1.5">
                <span className={`text-[10px] font-medium ${winner === 'A' ? 'text-[#06b6d4]' : 'text-[var(--text-muted)]'}`}>
                  A: {Math.round(scoreA)}
                </span>
                <span className={`text-[10px] font-medium ${winner === 'B' ? 'text-[#f43f5e]' : 'text-[var(--text-muted)]'}`}>
                  B: {Math.round(scoreB)}
                </span>
                {branch.forkDay !== null && (
                  <span className="text-[9px] text-[var(--text-muted)]">fork@{branch.forkDay}d</span>
                )}
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
