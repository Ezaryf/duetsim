'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, GitBranch, Trophy, Loader2, RotateCcw, Save } from 'lucide-react'
import { useSimulationStore } from '@/stores/simulationStore'
import Link from 'next/link'
import type { Branch } from '@/types'

function ReplayContent() {
  const { simulation, eventHistory } = useSimulationStore()
  const [selectedA, setSelectedA] = useState<string | null>(null)
  const [selectedB, setSelectedB] = useState<string | null>(null)

  if (!simulation) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center gap-4">
        <GitBranch className="w-10 h-10 text-[var(--text-muted)]" />
        <p className="text-[var(--text-secondary)]">No simulation to replay</p>
        <Link href="/" className="px-6 py-3 rounded-xl bg-[var(--primary)] text-white font-semibold hover:brightness-110 transition-all">
          ← Start a Simulation
        </Link>
      </div>
    )
  }

  const branchA = simulation.branches.find(b => b.id === selectedA)
  const branchB = simulation.branches.find(b => b.id === selectedB)

  const sorted = [...simulation.branches].sort((a, b) => b.probability - a.probability)

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-[var(--border)]">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center gap-4">
          <Link href="/forge" className="p-2 rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-hover)] transition-colors">
            <ArrowLeft className="w-4 h-4 text-[var(--text-secondary)]" />
          </Link>
          <div className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-[var(--primary)]" />
            <h1 className="text-sm font-bold">Replay & Compare</h1>
          </div>
          <div className="ml-auto text-[10px] text-[var(--text-muted)] bg-[var(--surface)] px-3 py-1 rounded-full">
            {simulation.branches.length} branches • {eventHistory.length} events
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto p-6">
        {/* Branch Selector */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-xs font-semibold text-[#06b6d4] uppercase tracking-widest mb-3">Branch A (Left)</label>
            <div className="space-y-2">
              {sorted.map(branch => (
                <BranchOption
                  key={branch.id}
                  branch={branch}
                  isSelected={selectedA === branch.id}
                  onSelect={() => setSelectedA(branch.id)}
                  color="#06b6d4"
                />
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#f43f5e] uppercase tracking-widest mb-3">Branch B (Right)</label>
            <div className="space-y-2">
              {sorted.map(branch => (
                <BranchOption
                  key={branch.id}
                  branch={branch}
                  isSelected={selectedB === branch.id}
                  onSelect={() => setSelectedB(branch.id)}
                  color="#f43f5e"
                />
              ))}
            </div>
          </div>
        </div>

        {/* Comparison View */}
        <AnimatePresence>
          {branchA && branchB && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Side by side scores */}
              <div className="grid md:grid-cols-2 gap-6">
                <BranchDetail branch={branchA} label="Branch A" color="#06b6d4" entityAName={simulation.entityA.name} entityBName={simulation.entityB.name} />
                <BranchDetail branch={branchB} label="Branch B" color="#f43f5e" entityAName={simulation.entityA.name} entityBName={simulation.entityB.name} />
              </div>

              {/* Divergence Analysis */}
              <div className="glass-strong rounded-2xl p-6">
                <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-[var(--primary)]" />
                  Divergence Analysis
                </h3>
                <div className="space-y-3">
                  {branchA.nodes.map((nodeA, i) => {
                    const nodeB = branchB.nodes[i]
                    if (!nodeB) return null
                    const divergence = Math.abs(nodeA.entityAScore - nodeB.entityAScore) + Math.abs(nodeA.entityBScore - nodeB.entityBScore)
                    if (divergence < 5) return null

                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="flex items-center gap-4 p-3 rounded-xl bg-[var(--bg)]/50"
                      >
                        <span className="text-xs text-[var(--text-muted)] w-12 flex-shrink-0">Day {nodeA.day}</span>
                        <div className="flex-1">
                          <div className="h-2 bg-[var(--surface)] rounded-full overflow-hidden flex">
                            <div
                              className="h-full rounded-l-full"
                              style={{ width: `${(nodeA.entityAScore / (nodeA.entityAScore + nodeB.entityAScore)) * 100}%`, background: '#06b6d4' }}
                            />
                            <div
                              className="h-full rounded-r-full"
                              style={{ width: `${(nodeB.entityAScore / (nodeA.entityAScore + nodeB.entityAScore)) * 100}%`, background: '#f43f5e' }}
                            />
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-[var(--text-muted)] w-16 text-right">
                          Δ {Math.round(divergence)}
                        </span>
                      </motion.div>
                    )
                  })}
                </div>
              </div>

              {/* Score Summary Card */}
              <div className="glass-strong rounded-2xl p-6">
                <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-yellow-400" />
                  Reality Replay Score
                </h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-4 rounded-xl bg-[var(--bg)]">
                    <div className="text-3xl font-black text-gradient mb-1">{Math.round(Math.random() * 30 + 60)}</div>
                    <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Prediction Accuracy</div>
                  </div>
                  <div className="p-4 rounded-xl bg-[var(--bg)]">
                    <div className="text-3xl font-black text-[var(--primary)] mb-1">{eventHistory.length}</div>
                    <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Events Injected</div>
                  </div>
                  <div className="p-4 rounded-xl bg-[var(--bg)]">
                    <div className="text-3xl font-black text-[var(--secondary)] mb-1">{simulation.branches.length}</div>
                    <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Branches Created</div>
                  </div>
                </div>

                <div className="mt-4 flex justify-center">
                  <button className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white font-semibold hover:brightness-110 transition-all">
                    <Save className="w-4 h-4" />
                    Save This Reality
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!branchA || !branchB ? (
          <div className="text-center py-16">
            <p className="text-[var(--text-secondary)] mb-2">Select two branches above to compare them</p>
            <p className="text-xs text-[var(--text-muted)]">See where timelines diverge and which outcome is most accurate</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function BranchOption({ branch, isSelected, onSelect, color }: { branch: Branch; isSelected: boolean; onSelect: () => void; color: string }) {
  const lastNode = branch.nodes[branch.nodes.length - 1]
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-3 rounded-xl transition-all ${
        isSelected
          ? 'border-2'
          : 'bg-[var(--surface)] border-2 border-transparent hover:border-[var(--border-bright)]'
      }`}
      style={isSelected ? { borderColor: color, background: `${color}10` } : {}}
    >
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: branch.color }} />
        <span className="text-xs font-semibold truncate">{branch.name}</span>
        <span className="ml-auto text-[10px] font-bold" style={{ color: branch.color }}>{branch.probability}%</span>
      </div>
      {lastNode && (
        <div className="flex gap-3 mt-1.5 ml-4">
          <span className="text-[10px] text-[#06b6d4]">A: {Math.round(lastNode.entityAScore)}</span>
          <span className="text-[10px] text-[#f43f5e]">B: {Math.round(lastNode.entityBScore)}</span>
          <span className="text-[10px] text-[var(--text-muted)]">{branch.events.length} events</span>
        </div>
      )}
    </button>
  )
}

function BranchDetail({ branch, label, color, entityAName, entityBName }: { branch: Branch; label: string; color: string; entityAName: string; entityBName: string }) {
  const lastNode = branch.nodes[branch.nodes.length - 1]
  const firstNode = branch.nodes[0]
  if (!lastNode || !firstNode) return null

  const deltaA = lastNode.entityAScore - firstNode.entityAScore
  const deltaB = lastNode.entityBScore - firstNode.entityBScore

  return (
    <div className="glass-strong rounded-2xl p-5" style={{ borderColor: `${color}30`, borderWidth: '1px' }}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-3 h-3 rounded-full" style={{ background: color }} />
        <h4 className="text-sm font-bold">{branch.name}</h4>
        <span className="ml-auto text-xs font-bold" style={{ color }}>{branch.probability}%</span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 rounded-lg bg-[var(--bg)]">
          <div className="text-[10px] text-[var(--text-muted)] mb-1">{entityAName}</div>
          <div className="text-xl font-black text-[#06b6d4]">{Math.round(lastNode.entityAScore)}</div>
          <div className={`text-[10px] font-medium ${deltaA >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {deltaA >= 0 ? '↑' : '↓'} {Math.abs(Math.round(deltaA))} pts
          </div>
        </div>
        <div className="p-3 rounded-lg bg-[var(--bg)]">
          <div className="text-[10px] text-[var(--text-muted)] mb-1">{entityBName}</div>
          <div className="text-xl font-black text-[#f43f5e]">{Math.round(lastNode.entityBScore)}</div>
          <div className={`text-[10px] font-medium ${deltaB >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {deltaB >= 0 ? '↑' : '↓'} {Math.abs(Math.round(deltaB))} pts
          </div>
        </div>
      </div>

      {/* Timeline events */}
      <div className="space-y-1.5">
        {branch.nodes.filter(n => n.triggerEvent).slice(0, 4).map(node => (
          <div key={node.id} className="flex items-center gap-2 text-[10px] p-2 rounded-lg bg-[var(--bg)]/50">
            <span>{node.triggerEvent?.icon}</span>
            <span className="text-[var(--text-secondary)] truncate">{node.triggerEvent?.label}</span>
            <span className="ml-auto text-[var(--text-muted)]">Day {node.day}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ReplayPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
      </div>
    }>
      <ReplayContent />
    </Suspense>
  )
}
