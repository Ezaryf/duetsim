'use client'

import { useEffect, Suspense, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Loader2, ArrowLeft, Zap, RefreshCw, Settings } from 'lucide-react'
import { useSimulationStore } from '@/stores/simulationStore'
import { getActiveBranch } from '@/lib/engine/engine'
import Link from 'next/link'

import EntityPanel from '@/components/forge/EntityPanel'
import BranchGraph from '@/components/forge/BranchGraph'
import EventForge from '@/components/forge/EventForge'
import ConfidenceBar from '@/components/forge/ConfidenceBar'
import BranchList from '@/components/forge/BranchList'
import ConflictCore3D from '@/components/forge/ConflictCore3D'
import RealityTicker from '@/components/forge/RealityTicker'
import SettingsModal from '@/components/ui/SettingsModal'

function ForgeContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const {
    entityA, entityB, simulation, status,
    setEntityA, setEntityB, setCategory,
    startSimulation, injectEvent, selectBranch,
    eventHistory, reset,
  } = useSimulationStore()

  // ─── Bootstrap from URL params ──────────────────────────────────────────
  useEffect(() => {
    const a = searchParams.get('a')
    const b = searchParams.get('b')
    const cat = searchParams.get('cat') as any

    if (a && b && !entityA && !entityB) {
      setEntityA({
        id: a,
        category: cat || 'repo',
        externalId: a,
        name: a.split('/').pop() || a,
        owner: a.includes('/') ? a.split('/')[0] : undefined,
        description: '',
        metrics: { stars: 50000 + Math.random() * 150000, forks: 5000 + Math.random() * 30000, watchers: 2000 + Math.random() * 8000 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      setEntityB({
        id: b,
        category: cat || 'repo',
        externalId: b,
        name: b.split('/').pop() || b,
        owner: b.includes('/') ? b.split('/')[0] : undefined,
        description: '',
        metrics: { stars: 50000 + Math.random() * 150000, forks: 5000 + Math.random() * 30000, watchers: 2000 + Math.random() * 8000 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      if (cat) setCategory(cat)
    }
  }, [searchParams])

  // ─── Auto-start simulation ──────────────────────────────────────────────
  useEffect(() => {
    if (entityA && entityB && !simulation && status === 'idle') {
      startSimulation()
    }
  }, [entityA, entityB, simulation, status])

  // ─── Derived data ──────────────────────────────────────────────────────
  const activeBranch = simulation ? getActiveBranch(simulation) : null
  const lastNode = activeBranch?.nodes[activeBranch.nodes.length - 1]
  const scoreA = lastNode?.entityAScore || 50
  const scoreB = lastNode?.entityBScore || 50
  const confA = lastNode?.confidenceA || 0.5
  const confB = lastNode?.confidenceB || 0.5

  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  // ─── Screen Shake Logic ────────────────────────────────────────────────
  const [shake, setShake] = useState(false)
  const [lastEventCount, setLastEventCount] = useState(0)
  const eventCount = activeBranch?.events.length || 0

  useEffect(() => {
    if (eventCount > lastEventCount) {
      setLastEventCount(eventCount)
      setShake(true)
      const t = setTimeout(() => setShake(false), 400)
      return () => clearTimeout(t)
    }
  }, [eventCount, lastEventCount])

  // ─── Loading state ─────────────────────────────────────────────────────
  if (status === 'running' || (!simulation && entityA && entityB)) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Zap className="w-10 h-10 text-[var(--primary)]" />
        </motion.div>
        <p className="text-[var(--text-secondary)] font-medium">Forging future timelines...</p>
        <p className="text-xs text-[var(--text-muted)]">Simulating branching outcomes</p>
      </div>
    )
  }

  // ─── No entities ───────────────────────────────────────────────────────
  if (!entityA || !entityB) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center gap-4">
        <p className="text-[var(--text-secondary)]">No entities selected</p>
        <Link href="/" className="px-6 py-3 rounded-xl bg-[var(--primary)] text-white font-semibold hover:brightness-110 transition-all">
          ← Choose Entities
        </Link>
      </div>
    )
  }

  const handleRerun = () => {
    reset()
    setTimeout(() => {
      router.push(`/forge?a=${encodeURIComponent(entityA.externalId)}&b=${encodeURIComponent(entityB.externalId)}&cat=${entityA.category}`)
    }, 100)
  }

  return (
    <motion.div 
      className="min-h-screen bg-[var(--bg)] relative overflow-x-hidden pb-12"
      animate={shake ? { x: [-8, 8, -8, 8, -4, 4, 0], y: [-4, 4, -4, 4, -2, 2, 0] } : { x: 0, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* 3D WebGL Background Simulation */}
      <ConflictCore3D scoreA={scoreA} scoreB={scoreB} eventTrigger={eventCount} />

      {/* ─── Top Bar ──────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 glass border-b border-[var(--border)]">
        <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center gap-4">
          <Link href="/" className="p-2 rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-hover)] transition-colors">
            <ArrowLeft className="w-4 h-4 text-[var(--text-secondary)]" />
          </Link>

          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="text-sm font-bold text-[#06b6d4] truncate">{entityA.name}</span>
            <span className="text-xs text-[var(--text-muted)] flex-shrink-0">vs</span>
            <span className="text-sm font-bold text-[#f43f5e] truncate">{entityB.name}</span>
          </div>

          <div className="flex items-center gap-2">
            {simulation && (
              <span className="text-[10px] text-[var(--text-muted)] bg-[var(--surface)] px-3 py-1 rounded-full">
                {simulation.branches.length} branches • {simulation.totalDays}d
              </span>
            )}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-hover)] transition-colors"
              title="AI Settings"
            >
              <Settings className="w-4 h-4 text-[var(--text-secondary)]" />
            </button>
            <button
              onClick={handleRerun}
              className="p-2 rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-hover)] transition-colors"
              title="Re-run simulation"
            >
              <RefreshCw className="w-4 h-4 text-[var(--text-secondary)]" />
            </button>
          </div>
        </div>
      </header>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* ─── Main Layout ──────────────────────────────────────────────── */}
      {simulation && (
        <div className="max-w-[1600px] mx-auto p-4 relative z-10">
          <div className="grid grid-cols-12 gap-4">

            {/* Left — Entity Panels */}
            <div className="col-span-12 lg:col-span-2 flex flex-col gap-4">
              <EntityPanel entity={entityA} side="A" confidence={confA} score={scoreA} />
              <EntityPanel entity={entityB} side="B" confidence={confB} score={scoreB} />
            </div>

            {/* Center — Graph + Confidence Bar */}
            <div className="col-span-12 lg:col-span-7 flex flex-col gap-4">
              <BranchGraph
                simulation={simulation}
                activeBranchId={simulation.activeBranchId}
                onSelectBranch={selectBranch}
              />
              <ConfidenceBar
                scoreA={scoreA}
                scoreB={scoreB}
                nameA={entityA.name}
                nameB={entityB.name}
              />
              {/* Branch List — below graph on desktop */}
              <BranchList
                branches={simulation.branches}
                activeBranchId={simulation.activeBranchId}
                onSelectBranch={selectBranch}
              />
            </div>

            {/* Right — Event Forge */}
            <div className="col-span-12 lg:col-span-3">
              <div className="sticky top-[72px]">
                <EventForge
                  onInjectEvent={injectEvent}
                  entityAName={entityA.name}
                  entityBName={entityB.name}
                  eventHistory={eventHistory}
                />
              </div>
            </div>
          </div>
          
          {/* Scroll Reality Ticker at the absolute bottom */}
          <RealityTicker events={activeBranch?.events || []} />
        </div>
      )}
    </motion.div>
  )
}

export default function ForgePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
      </div>
    }>
      <ForgeContent />
    </Suspense>
  )
}
