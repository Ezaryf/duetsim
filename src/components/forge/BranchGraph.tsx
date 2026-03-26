'use client'

import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { TimelineNode, Simulation } from '@/types'

interface BranchGraphProps {
  readonly simulation: Simulation
  readonly activeBranchId: string
  readonly onSelectBranch: (branchId: string) => void
}

export default function BranchGraph({ simulation, activeBranchId, onSelectBranch }: BranchGraphProps) {
  const [hoveredNode, setHoveredNode] = useState<TimelineNode | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })

  const activeBranch = simulation.branches.find(b => b.id === activeBranchId)
  const visibleBranches = simulation.branches.filter(b => b.id === activeBranchId || b.parentBranchId === activeBranchId || b.id === activeBranch?.parentBranchId)

  // Layout calculations
  const graphWidth = 900
  const graphHeight = 340
  const padding = { top: 30, right: 40, bottom: 30, left: 40 }
  const plotWidth = graphWidth - padding.left - padding.right
  const plotHeight = graphHeight - padding.top - padding.bottom

  const maxDay = simulation.totalDays
  const xScale = (day: number) => padding.left + (day / maxDay) * plotWidth
  const yScaleA = (score: number) => padding.top + plotHeight * 0.3 - (score / 100) * plotHeight * 0.25
  const yScaleB = (score: number) => padding.top + plotHeight * 0.7 - (score / 100) * plotHeight * 0.25

  // Generate path data for each branch
  const branchPaths = useMemo(() => {
    return visibleBranches.map((branch, branchIdx) => {
      const isActive = branch.id === activeBranchId
      const yOffset = branchIdx * 8 - (visibleBranches.length - 1) * 4

      const pathA = branch.nodes.map((node, i) => {
        const x = xScale(node.day)
        const y = yScaleA(node.entityAScore) + yOffset
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
      }).join(' ')

      const pathB = branch.nodes.map((node, i) => {
        const x = xScale(node.day)
        const y = yScaleB(node.entityBScore) + yOffset
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
      }).join(' ')

      return { branch, pathA, pathB, isActive, yOffset }
    })
  }, [visibleBranches, activeBranchId, maxDay])

  // Event nodes
  const eventNodes = useMemo(() => {
    if (!activeBranch) return []
    return activeBranch.nodes.filter(n => n.triggerEvent)
  }, [activeBranch])

  return (
    <div className="glass-strong rounded-2xl p-5 relative overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold">Branching Timeline</h3>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-0.5 bg-[#06b6d4] rounded" />
            <span className="text-[10px] text-[var(--text-muted)]">{simulation.entityA.name}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-0.5 bg-[#f43f5e] rounded" />
            <span className="text-[10px] text-[var(--text-muted)]">{simulation.entityB.name}</span>
          </div>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${graphWidth} ${graphHeight}`}
        className="w-full"
        style={{ height: 'auto', maxHeight: '320px' }}
      >
        {/* Grid lines */}
        {Array.from({ length: 6 }, (_, i) => {
          const x = padding.left + (i / 5) * plotWidth
          return (
            <g key={`grid-${i}`}>
              <line x1={x} y1={padding.top} x2={x} y2={graphHeight - padding.bottom} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              <text x={x} y={graphHeight - 8} fill="rgba(255,255,255,0.2)" fontSize="9" textAnchor="middle" fontFamily="Plus Jakarta Sans">
                {Math.round((i / 5) * maxDay)}d
              </text>
            </g>
          )
        })}

        {/* Branch paths */}
        {branchPaths.map(({ branch, pathA, pathB, isActive }) => (
          <g key={branch.id} className={isActive ? '' : 'opacity-25'}>
            {/* Entity A trajectory */}
            <motion.path
              d={pathA}
              fill="none"
              stroke="#06b6d4"
              strokeWidth={isActive ? 2.5 : 1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.2, ease: 'easeInOut' }}
              style={isActive ? { filter: 'drop-shadow(0 0 4px rgba(6,182,212,0.4))' } : {}}
            />
            {/* Entity B trajectory */}
            <motion.path
              d={pathB}
              fill="none"
              stroke="#f43f5e"
              strokeWidth={isActive ? 2.5 : 1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.2, ease: 'easeInOut', delay: 0.1 }}
              style={isActive ? { filter: 'drop-shadow(0 0 4px rgba(244,63,94,0.4))' } : {}}
            />

            {/* Fork indicator */}
            {branch.forkDay !== null && (
              <motion.circle
                cx={xScale(branch.forkDay)}
                cy={graphHeight / 2}
                r="6"
                fill={branch.color}
                opacity="0.6"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.4, type: 'spring' }}
                style={{ cursor: 'pointer', filter: `drop-shadow(0 0 6px ${branch.color}60)` }}
                onClick={() => onSelectBranch(branch.id)}
              />
            )}
          </g>
        ))}

        {/* Event markers on active branch */}
        {eventNodes.map((node, i) => {
          const x = xScale(node.day)
          const yA = yScaleA(node.entityAScore)
          const yB = yScaleB(node.entityBScore)
          const midY = (yA + yB) / 2

          return (
            <g key={node.id}>
              {/* Vertical event line */}
              <motion.line
                x1={x} y1={yA - 5} x2={x} y2={yB + 5}
                stroke="rgba(99,102,241,0.4)"
                strokeWidth="1"
                strokeDasharray="3 2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 + i * 0.1 }}
              />
              {/* Event node */}
              <motion.g
                onMouseEnter={(e) => {
                  setHoveredNode(node)
                  const rect = (e.target as SVGElement).closest('svg')?.getBoundingClientRect()
                  if (rect) {
                    setTooltipPos({ x: (x / graphWidth) * rect.width, y: (midY / graphHeight) * rect.height })
                  }
                }}
                onMouseLeave={() => setHoveredNode(null)}
                style={{ cursor: 'pointer' }}
              >
                <motion.circle
                  cx={x} cy={midY} r="8"
                  fill="var(--bg)"
                  stroke="#6366f1"
                  strokeWidth="2"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5 + i * 0.1, type: 'spring', stiffness: 300 }}
                  style={{ filter: 'drop-shadow(0 0 8px rgba(99,102,241,0.5))' }}
                />
                <text x={x} y={midY + 3.5} fill="white" fontSize="8" textAnchor="middle" fontFamily="Plus Jakarta Sans" fontWeight="700">
                  ⚡
                </text>
              </motion.g>
            </g>
          )
        })}

        {/* Score labels at end */}
        {activeBranch && activeBranch.nodes.length > 0 && (() => {
          const lastNode = activeBranch.nodes.at(-1)!
          return (
            <>
              <text x={graphWidth - 5} y={yScaleA(lastNode.entityAScore) + 4} fill="#06b6d4" fontSize="11" textAnchor="end" fontFamily="Plus Jakarta Sans" fontWeight="700">
                {Math.round(lastNode.entityAScore)}
              </text>
              <text x={graphWidth - 5} y={yScaleB(lastNode.entityBScore) + 4} fill="#f43f5e" fontSize="11" textAnchor="end" fontFamily="Plus Jakarta Sans" fontWeight="700">
                {Math.round(lastNode.entityBScore)}
              </text>
            </>
          )
        })()}
      </svg>

      {/* Tooltip */}
      <AnimatePresence>
        {hoveredNode && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute z-50 glass-strong rounded-xl p-3 text-xs max-w-[220px] pointer-events-none"
            style={{
              left: `${Math.min(tooltipPos.x, 650)}px`,
              top: `${tooltipPos.y + 50}px`,
            }}
          >
            {hoveredNode.triggerEvent && (
              <div className="flex items-center gap-1.5 mb-1.5">
                <span>{hoveredNode.triggerEvent.icon}</span>
                <span className="font-bold text-[var(--primary)]">{hoveredNode.triggerEvent.label}</span>
              </div>
            )}
            <p className="text-[var(--text-secondary)] mb-1"><span className="text-white font-medium">State:</span> {hoveredNode.stateChange}</p>
            <p className="text-[var(--text-muted)] text-[10px]">{hoveredNode.reason}</p>
            <div className="flex items-center gap-3 mt-2 pt-2 border-t border-[var(--border)]">
              <span className="text-[#06b6d4] font-bold">A: {Math.round(hoveredNode.entityAScore)}</span>
              <span className="text-[#f43f5e] font-bold">B: {Math.round(hoveredNode.entityBScore)}</span>
              <span className="text-[var(--text-muted)]">Day {hoveredNode.day}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
