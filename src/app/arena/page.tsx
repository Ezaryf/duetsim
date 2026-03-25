'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, ComposedChart } from 'recharts'
import { Loader2, Star, GitFork, Eye, AlertTriangle, TrendingUp, TrendingDown, ArrowLeft, RefreshCw } from 'lucide-react'
import { useDuelStore } from '@/stores/duelStore'
import { runSimulation } from '@/lib/simulation/dynamics'
import type { Entity, SimulationResult, Outcome } from '@/types'
import Link from 'next/link'

function ArenaContent() {
  const searchParams = useSearchParams()
  const { setEntityA, setEntityB, setResult, result, isLoading, setLoading } = useDuelStore()
  const [selectedOutcome, setSelectedOutcome] = useState<Outcome | null>(null)
  const [entityA, setEntityAState] = useState<Entity | null>(null)
  const [entityB, setEntityBState] = useState<Entity | null>(null)

  useEffect(() => {
    const aParam = searchParams.get('a')
    const bParam = searchParams.get('b')
    
    if (aParam && bParam) {
      setEntityAState({
        id: aParam,
        type: 'repo',
        externalId: aParam,
        name: aParam.split('/')[1] || aParam,
        owner: aParam.split('/')[0],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metrics: { stars: 50000 + Math.random() * 100000, forks: 5000 + Math.random() * 20000, watchers: 2000 },
      })
      setEntityBState({
        id: bParam,
        type: 'repo',
        externalId: bParam,
        name: bParam.split('/')[1] || bParam,
        owner: bParam.split('/')[0],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metrics: { stars: 50000 + Math.random() * 100000, forks: 5000 + Math.random() * 20000, watchers: 2000 },
      })
    }
  }, [searchParams, setEntityA, setEntityB])

  useEffect(() => {
    if (entityA && entityB && !result) {
      setLoading(true)
      setTimeout(() => {
        const simulation = runSimulation({
          entityA,
          entityB,
          timeHorizon: 90,
          depth: 'balanced',
        })
        setResult(simulation)
        setLoading(false)
      }, 1500)
    }
  }, [entityA, entityB, result, setLoading, setResult])

  const handleRerun = () => {
    if (!entityA || !entityB) return
    setLoading(true)
    setTimeout(() => {
      const simulation = runSimulation({
        entityA,
        entityB,
        timeHorizon: 90,
        depth: 'balanced',
      })
      setResult(simulation)
      setLoading(false)
    }, 1500)
  }

  const chartData = result?.trajectories[0] || []
  
  const topOutcome = result?.outcomes[0]
  const dominancePercent = topOutcome?.type === 'a_dominates' 
    ? topOutcome.probability 
    : topOutcome?.type === 'b_dominates' 
      ? 100 - topOutcome.probability 
      : 50

  const outcomeLabels: Record<string, string> = {
    a_dominates: 'A Dominates',
    b_dominates: 'B Dominates',
    mutual_growth: 'Mutual Growth',
    mutual_decline: 'Mutual Decline',
    a_rises_b_stabilizes: 'A Rises, B Stabilizes',
    b_rises_a_stabilizes: 'B Rises, A Stabilizes',
    market_split: 'Market Split',
    oscillation: 'Oscillation',
    convergence: 'Convergence',
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/duel" className="p-2 rounded-lg bg-[#1a1a2a] hover:bg-[#2a2a3a] transition-colors">
            <ArrowLeft className="w-5 h-5 text-[#94a3b8]" />
          </Link>
          <h1 className="text-2xl font-bold">
            <span className="text-cyan-400">{entityA?.name || 'Entity A'}</span>
            <span className="text-[#94a3b8] mx-2">vs</span>
            <span className="text-rose-400">{entityB?.name || 'Entity B'}</span>
          </h1>
          <button onClick={handleRerun} className="ml-auto p-2 rounded-lg bg-[#1a1a2a] hover:bg-[#2a2a3a] transition-colors">
            <RefreshCw className={`w-5 h-5 text-[#94a3b8] ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-[#6366f1] animate-spin mb-4" />
            <p className="text-[#94a3b8]">Running simulation...</p>
          </div>
        ) : result ? (
          <>
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <EntityCard entity={entityA} color="cyan" side="A" />
              <ArenaStats 
                dominancePercent={dominancePercent} 
                topOutcome={topOutcome}
                outcomeLabel={topOutcome ? outcomeLabels[topOutcome.type] : ''}
              />
              <EntityCard entity={entityB} color="rose" side="B" />
            </div>

            <div className="glass rounded-2xl p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">Trajectory Simulation</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData}>
                    <defs>
                      <linearGradient id="gradientA" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="gradientB" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
                    <XAxis 
                      dataKey="day" 
                      stroke="#94a3b8" 
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                      label={{ value: 'Days', position: 'insideBottom', fill: '#94a3b8', offset: -5 }}
                    />
                    <YAxis 
                      stroke="#94a3b8" 
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                    />
                    <Tooltip 
                      contentStyle={{ background: '#12121a', border: '1px solid #2a2a3a', borderRadius: '8px' }}
                      labelStyle={{ color: '#f8fafc' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="confidenceHigh" 
                      stroke="transparent" 
                      fill="url(#gradientA)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="confidenceLow" 
                      stroke="transparent" 
                      fill="#0a0a0f" 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="entityA" 
                      stroke="#06b6d4" 
                      strokeWidth={2}
                      dot={false}
                      name={entityA?.name || 'Entity A'}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="entityB" 
                      stroke="#f43f5e" 
                      strokeWidth={2}
                      dot={false}
                      name={entityB?.name || 'Entity B'}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {result.outcomes.map((outcome, i) => (
                <motion.button
                  key={outcome.type}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => setSelectedOutcome(outcome)}
                  className={`p-4 rounded-xl text-left transition-all ${
                    selectedOutcome?.type === outcome.type
                      ? 'bg-[#6366f1] text-white'
                      : 'bg-[#12121a] hover:bg-[#1a1a2a]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">{outcomeLabels[outcome.type]}</span>
                    <span className={`text-sm px-2 py-1 rounded ${
                      outcome.confidence === 'high' ? 'bg-green-500/20 text-green-400' :
                      outcome.confidence === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {outcome.probability}%
                    </span>
                  </div>
                  <div className="h-1 bg-[#2a2a3a] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#06b6d4] to-[#6366f1]" 
                      style={{ width: `${outcome.probability}%` }}
                    />
                  </div>
                </motion.button>
              ))}
            </div>

            {selectedOutcome && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
                onClick={() => setSelectedOutcome(null)}
              >
                <div 
                  className="glass rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 className="text-2xl font-bold mb-4">{outcomeLabels[selectedOutcome.type]}</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[#94a3b8]">Probability</span>
                        <span className="font-semibold text-[#6366f1]">{selectedOutcome.probability}%</span>
                      </div>
                      <div className="h-2 bg-[#2a2a3a] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#6366f1]" 
                          style={{ width: `${selectedOutcome.probability}%` }}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-[#94a3b8] block mb-2">Confidence</span>
                      <span className={`px-3 py-1 rounded ${
                        selectedOutcome.confidence === 'high' ? 'bg-green-500/20 text-green-400' :
                        selectedOutcome.confidence === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {selectedOutcome.confidence.charAt(0).toUpperCase() + selectedOutcome.confidence.slice(1)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[#94a3b8] block mb-2">Key Drivers</span>
                      <ul className="space-y-1">
                        {selectedOutcome.drivers.map((driver, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm">
                            <TrendingUp className="w-4 h-4 text-green-400" />{driver}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <span className="text-[#94a3b8] block mb-2">Risk Factors</span>
                      <ul className="space-y-1">
                        {selectedOutcome.risks.map((risk, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm">
                            <AlertTriangle className="w-4 h-4 text-yellow-400" />{risk}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <span className="text-[#94a3b8] block mb-2">Timeline Milestones</span>
                      <ul className="space-y-2">
                        {selectedOutcome.milestones.map((milestone, i) => (
                          <li key={i} className="flex items-center gap-3 text-sm">
                            <span className="px-2 py-0.5 rounded bg-[#1a1a2a] text-[#94a3b8]">
                              Day {milestone.day}
                            </span>
                            {milestone.event}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </>
        ) : null}
      </div>
    </div>
  )
}

interface EntityCardProps {
  entity: Entity | null
  color: 'cyan' | 'rose'
  side: 'A' | 'B'
}

function EntityCard({ entity, color, side }: EntityCardProps) {
  const colorClass = color === 'cyan' ? 'border-cyan-500' : 'border-rose-500'
  const glowClass = color === 'cyan' ? 'shadow-[0_0_20px_rgba(6,182,212,0.2)]' : 'shadow-[0_0_20px_rgba(244,63,94,0.2)]'
  const textClass = color === 'cyan' ? 'text-cyan-400' : 'text-rose-400'
  
  return (
    <div className={`glass rounded-2xl p-6 border-2 ${colorClass} ${glowClass}`}>
      <div className="flex items-center gap-2 mb-4">
        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
          color === 'cyan' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-rose-500/20 text-rose-400'
        }`}>
          {side}
        </span>
        <span className="text-lg font-semibold">{entity?.name || 'Loading...'}</span>
      </div>
      {entity?.owner && (
        <p className="text-sm text-[#94a3b8] mb-4">{entity.owner}</p>
      )}
      <div className="space-y-2">
        {entity?.metrics?.stars !== undefined && (
          <div className="flex items-center gap-2 text-[#94a3b8]">
            <Star className="w-4 h-4 text-yellow-500" />
            <span>{entity.metrics.stars.toLocaleString()}</span>
          </div>
        )}
        {entity?.metrics?.forks !== undefined && (
          <div className="flex items-center gap-2 text-[#94a3b8]">
            <GitFork className="w-4 h-4" />
            <span>{entity.metrics.forks.toLocaleString()}</span>
          </div>
        )}
        {entity?.metrics?.watchers !== undefined && (
          <div className="flex items-center gap-2 text-[#94a3b8]">
            <Eye className="w-4 h-4" />
            <span>{entity.metrics.watchers.toLocaleString()}</span>
          </div>
        )}
      </div>
    </div>
  )
}

interface ArenaStatsProps {
  dominancePercent: number
  topOutcome: Outcome | undefined
  outcomeLabel: string
}

function ArenaStats({ dominancePercent, topOutcome, outcomeLabel }: ArenaStatsProps) {
  return (
    <div className="glass rounded-2xl p-6 flex flex-col items-center justify-center">
      <h3 className="text-lg font-semibold mb-4">Outcome Spectrum</h3>
      <div className="w-full mb-4">
        <div className="flex justify-between text-xs text-[#94a3b8] mb-2">
          <span>A Dominates</span>
          <span>B Dominates</span>
        </div>
        <div className="h-4 bg-gradient-to-r from-[#06b6d4] via-[#6366f1] to-[#f43f5e] rounded-full relative">
          <div 
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full border-2 border-[#6366f1]"
            style={{ left: `${dominancePercent}%`, transform: 'translate(-50%, -50%)' }}
          />
        </div>
      </div>
      {topOutcome && (
        <div className="text-center">
          <p className="text-sm text-[#94a3b8]">Most Likely</p>
          <p className="text-xl font-bold text-[#6366f1]">{outcomeLabel}</p>
          <p className="text-3xl font-bold text-gradient">{topOutcome.probability}%</p>
        </div>
      )}
    </div>
  )
}

export default function ArenaPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#6366f1] animate-spin" />
      </div>
    }>
      <ArenaContent />
    </Suspense>
  )
}