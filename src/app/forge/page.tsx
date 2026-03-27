'use client'

import { useEffect, Suspense, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Loader2, ArrowLeft, Zap, RefreshCw, Settings } from 'lucide-react'
import { useSimulationStore } from '@/stores/simulationStore'
import { getActiveBranch } from '@/lib/engine/engine'
import Link from 'next/link'

import BattlefieldGraph from '@/components/forge/BattlefieldGraph'
import PromptToWorldModal from '@/components/forge/PromptToWorldModal'
import TensionWidget from '@/components/simulation/TensionWidget'
import LeftControlPanel from '@/components/simulation/LeftControlPanel'
import RightObservationPanel from '@/components/simulation/RightObservationPanel'
import { useSettingsStore } from '@/stores/settingsStore'
import { useEmergentStore } from '@/stores/emergentStore'
import SettingsModal from '@/components/ui/SettingsModal'
import RealityTicker from '@/components/forge/RealityTicker'
import FloatingScrubber from '@/components/forge/FloatingScrubber'

function ForgeContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const {
    entityA, entityB, simulation, status,
    setEntityA, setEntityB, setCategory,
    startSimulation, injectEvent, selectBranch, reset,
  } = useSimulationStore()
  
  const { apiKey, baseUrl, model, endpointType } = useSettingsStore()
  const { setWorldState } = useEmergentStore()

  // Bootstrap from URL params
  useEffect(() => {
    const a = searchParams.get('a')
    const b = searchParams.get('b')
    const cat = searchParams.get('cat') as any
    if (a && b && !entityA && !entityB) {
      setEntityA({
        id: a, category: cat || 'repo', externalId: a, name: a.split('/').pop() || a,
        description: '', metrics: { stars: 50000, forks: 5000, watchers: 2000 },
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      })
      setEntityB({
        id: b, category: cat || 'repo', externalId: b, name: b.split('/').pop() || b,
        description: '', metrics: { stars: 50000, forks: 5000, watchers: 2000 },
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      })
      if (cat) setCategory(cat)
    }
  }, [searchParams])

  useEffect(() => {
    if (entityA && entityB && !simulation && status === 'idle') {
      startSimulation()
    }
  }, [entityA, entityB, simulation, status])

  const handleWorldGenerated = (worldData: any) => {
    // Bootstrap the world state via Zustand based on the AI generation
    console.log("World Generated:", worldData);
    setEntityA({
        id: worldData.protagonist.name.replaceAll(' ', '-').toLowerCase(),
        category: 'repo',
        externalId: 'protagonist',
        name: worldData.protagonist.name,
        description: worldData.protagonist.description,
        metrics: { stars: 100, forks: 0, watchers: 100 },
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    });
    setEntityB({
        id: worldData.antagonist.name.replaceAll(' ', '-').toLowerCase(),
        category: 'repo',
        externalId: 'antagonist',
        name: worldData.antagonist.name,
        description: worldData.antagonist.description,
        metrics: { stars: 100, forks: 0, watchers: 100 },
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    });
    
    // Save generated physical laws, hidden factors, and context
    if (worldData.worldRules && worldData.hiddenVariables) {
        setWorldState(
            worldData.worldRules, 
            worldData.hiddenVariables.map((h: any) => ({ name: h.name, value: h.startingValue })),
            worldData.scenarioContext
        );
    }
  }

  const activeBranch = simulation ? getActiveBranch(simulation) : null
  const lastNode = activeBranch?.nodes.at(-1)
  const scoreA = lastNode?.entityAScore || 50
  const scoreB = lastNode?.entityBScore || 50
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  const handleRerun = () => {
    reset()
    setTimeout(() => {
      router.push(`/forge?a=${encodeURIComponent(entityA!.externalId)}&b=${encodeURIComponent(entityB!.externalId)}&cat=${entityA!.category}`)
    }, 100)
  }

  const handleNodeDrop = async ({ eventLabel, targetId }: { eventLabel: string, targetId: string }) => {
    let target: 'A' | 'B' | 'both' = 'both';
    if (targetId === 'entityA') target = 'A';
    else if (targetId === 'entityB') target = 'B';
    
    try {
      if (!apiKey) {
        injectEvent(eventLabel, target);
        return;
      }

      const res = await fetch('/api/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityA: entityA?.name,
          entityB: entityB?.name,
          scoreA,
          scoreB,
          eventText: eventLabel,
          target,
          connection: { apiKey, baseUrl, model, endpointType }
        })
      });
      const aiData = await res.json();
      if (res.ok) {
        injectEvent(eventLabel, target, {
          impact: aiData.impact, label: aiData.label,
          description: aiData.description, stateChange: aiData.stateChange,
          probability: aiData.probability, icon: '💥'
        });
      } else {
        injectEvent(eventLabel, target);
      }
    } catch {
      injectEvent(eventLabel, target);
    }
  }

  if (status === 'running' || (!simulation && entityA && entityB)) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
          <Zap className="w-10 h-10 text-[var(--primary)]" />
        </motion.div>
        <p className="text-white/70 font-medium tracking-widest uppercase text-sm">Deploying Combat Engine...</p>
      </div>
    )
  }

  if (!entityA || !entityB) {
    return (
        <div className="relative">
            <PromptToWorldModal onWorldGenerated={handleWorldGenerated} />
            <div className="absolute top-4 right-4 z-50">
                <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                >
                    <Settings className="w-4 h-4 text-white/70" />
                </button>
            </div>
            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        </div>
    )
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden font-sans">
      {/* Absolute Battlefield Graph underneath all UI */}
      {simulation && (
        <BattlefieldGraph 
            entityAName={entityA.name}
            entityBName={entityB.name}
            scoreA={scoreA}
            scoreB={scoreB}
            events={activeBranch?.events || []}
            onNodeDrop={handleNodeDrop}
        />
      )}

      {/* ─── Top Military HUD ──────────────────────────────────────────────────── */}
      <header className="absolute top-0 w-full z-50 bg-black/40 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-[1800px] mx-auto px-6 py-4 flex items-center gap-6">
          <Link href="/" className="p-2 rounded-lg hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-5 h-5 text-white/70" />
          </Link>
          <div className="flex items-center gap-4 flex-1 min-w-0 font-mono tracking-widest text-lg">
            <span className="font-bold text-[#06b6d4] uppercase">{entityA.name}</span>
            <span className="text-sm text-white/40">VS</span>
            <span className="font-bold text-[#f43f5e] uppercase">{entityB.name}</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
            >
              <Settings className="w-4 h-4 text-white/70" />
            </button>
            <button
              onClick={handleRerun}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-white/70" />
            </button>
          </div>
        </div>
      </header>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* ─── Floating Layout Elements ─────────────────────────────────────────── */}
      {simulation && (
          <>
            {/* HUD OVERLAY - Top Center: World Status */}
            <div className="absolute top-24 left-1/2 -translate-x-1/2 z-40 pointer-events-auto">
                <TensionWidget />
            </div>

            {/* HUD OVERLAY - Left Sidebar: Director's Sandbox */}
            <div className="absolute top-24 left-8 bottom-32 z-40 pointer-events-none flex flex-col justify-end">
                <LeftControlPanel />
            </div>

            {/* HUD OVERLAY - Right Sidebar: Observation Deck */}
            <div className="absolute top-24 right-8 bottom-32 z-40 pointer-events-none flex flex-col justify-end">
                <RightObservationPanel />
            </div>

            {/* Bottom Center: Floating Scrubber */}
            <FloatingScrubber 
                branches={simulation.branches}
                activeBranchId={simulation.activeBranchId}
                onSelectBranch={selectBranch}
            />

            {/* Reality Ticker bottom edge */}
            <div className="absolute bottom-0 w-full z-30 pointer-events-none">
              <RealityTicker events={activeBranch?.events || []} />
            </div>
          </>
      )}
    </div>
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
