import { create } from 'zustand'
import type { Entity, EntityCategory, ForgeEvent, Simulation, SimulationStatus, ConsequenceResult, WorldRules, HiddenVariable, AgentRole } from '@/types'
import { createSimulation, injectEvent, getActiveBranch } from '@/lib/engine/engine'
import { createForgeEvent } from '@/lib/engine/events'
import { useSettingsStore } from './settingsStore'

interface SimulationStore {
  // ─── Entity Selection ────────────────────────────────────────────────────
  entityA: Entity | null
  entityB: Entity | null
  category: EntityCategory
  setEntityA: (entity: Entity | null) => void
  setEntityB: (entity: Entity | null) => void
  setCategory: (cat: EntityCategory) => void

  // ─── World Builder State ───────────────────────────────────────────────
  worldRules: WorldRules | null
  hiddenVariables: HiddenVariable[]
  scenarioContext: string | null
  setWorldRules: (rules: WorldRules | null) => void
  setHiddenVariables: (vars: HiddenVariable[]) => void
  setScenarioContext: (context: string | null) => void

  // ─── Simulation State ────────────────────────────────────────────────────
  simulation: Simulation | null
  status: SimulationStatus
  totalDays: number
  setTotalDays: (days: number) => void

  // ─── Consequence Engine ────────────────────────────────────────────────
  consequenceResult: ConsequenceResult | null
  isAnalyzingConsequences: boolean
  analyzeConsequences: (event: string) => Promise<void>

  // ─── Actions ─────────────────────────────────────────────────────────────
  startSimulation: () => void
  injectEvent: (text: string, target: 'A' | 'B' | 'both', overrides?: Partial<ForgeEvent>) => void
  selectBranch: (branchId: string) => void
  compareBranches: (branchIdA: string, branchIdB: string) => void

  // ─── Compare Mode ────────────────────────────────────────────────────────
  compareMode: boolean
  compareBranchIds: [string, string] | null
  setCompareMode: (on: boolean) => void

  // ─── Event History ───────────────────────────────────────────────────────
  eventHistory: ForgeEvent[]

  // ─── Reset ───────────────────────────────────────────────────────────────
  reset: () => void
}

export const useSimulationStore = create<SimulationStore>((set, get) => ({
  // ─── Defaults ──────────────────────────────────────────────────────────────
  entityA: null,
  entityB: null,
  category: 'repo',
  simulation: null,
  status: 'idle',
  totalDays: 90,
  compareMode: false,
  compareBranchIds: null,
  eventHistory: [],

  // ─── World Builder State ───────────────────────────────────────────────
  worldRules: null,
  hiddenVariables: [],
  scenarioContext: null,
  setWorldRules: (rules) => set({ worldRules: rules }),
  setHiddenVariables: (vars) => set({ hiddenVariables: vars }),
  setScenarioContext: (context) => set({ scenarioContext: context }),

  // ─── Consequence Engine State ──────────────────────────────────────────
  consequenceResult: null,
  isAnalyzingConsequences: false,
  analyzeConsequences: async (event: string) => {
    const { worldRules, hiddenVariables, simulation } = get()
    
    const settings = useSettingsStore.getState()
    if (!settings.apiKey) {
      console.error('No API key configured')
      return
    }

    set({ isAnalyzingConsequences: true })

    try {
      // Build agent states from simulation
      const agentStates = simulation?.branches.find(b => b.isActive)?.events.reduce((acc: Record<string, any>, evt) => {
        // Simplified - in full implementation would track agent resources from events
        acc.founder = { resources: 70, trust: 50, riskTolerance: 70 }
        acc.competitor = { resources: 65, trust: 45, riskTolerance: 60 }
        acc.regulator = { resources: 50, trust: 40, riskTolerance: 30 }
        acc.public = { resources: 30, trust: 50, riskTolerance: 50 }
        return acc
      }, {}) || {
        founder: { resources: 70, trust: 50, riskTolerance: 70 },
        competitor: { resources: 65, trust: 45, riskTolerance: 60 },
        regulator: { resources: 50, trust: 40, riskTolerance: 30 },
        public: { resources: 30, trust: 50, riskTolerance: 50 }
      }

      const response = await fetch('/api/consequence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event,
          worldRules: worldRules || { volatility: 50, transparency: 50, trustDecay: 50 },
          hiddenVariables: hiddenVariables || [],
          agentStates,
          connection: {
            apiKey: settings.apiKey,
            baseUrl: settings.baseUrl,
            model: settings.model
          },
          cascadeDepth: 3
        })
      })

      if (!response.ok) {
        throw new Error('Consequence analysis failed')
      }

      const result = await response.json()
      set({ consequenceResult: result, isAnalyzingConsequences: false })
    } catch (error) {
      console.error('Consequence Engine error:', error)
      set({ isAnalyzingConsequences: false })
    }
  },

  // ─── Entity Selection ──────────────────────────────────────────────────────
  setEntityA: (entity) => set({ entityA: entity }),
  setEntityB: (entity) => set({ entityB: entity }),
  setCategory: (category) => set({ category }),
  setTotalDays: (totalDays) => set({ totalDays }),

  // ─── Start Simulation ──────────────────────────────────────────────────────
  startSimulation: () => {
    const { entityA, entityB, totalDays } = get()
    if (!entityA || !entityB) return

    set({ status: 'running' })

    // Simulate async processing
    setTimeout(() => {
      const simulation = createSimulation(entityA, entityB, totalDays)
      set({ simulation, status: 'complete' })
    }, 800)
  },

  // ─── Inject Event ──────────────────────────────────────────────────────────
  injectEvent: (text, target, overrides) => {
    const { simulation, eventHistory } = get()
    if (!simulation) return

    const activeBranch = getActiveBranch(simulation)
    if (!activeBranch) return

    // Calculate injection day dynamically to progress the timeline
    const lastEvent = activeBranch.events.at(-1)
    const injectionDay = lastEvent 
      ? Math.min(lastEvent.day + 15, simulation.totalDays - 5)
      : 15
      
    const event = createForgeEvent(text, injectionDay, target, overrides)

    const updatedSim = injectEvent(simulation, event)

    set({
      simulation: updatedSim,
      eventHistory: [...eventHistory, event],
    })
  },

  // ─── Select Branch ─────────────────────────────────────────────────────────
  selectBranch: (branchId) => {
    const { simulation } = get()
    if (!simulation) return

    const updatedBranches = simulation.branches.map(b => ({
      ...b,
      isActive: b.id === branchId,
    }))

    set({
      simulation: {
        ...simulation,
        branches: updatedBranches,
        activeBranchId: branchId,
      },
    })
  },

  // ─── Compare Branches ──────────────────────────────────────────────────────
  compareBranches: (branchIdA, branchIdB) => {
    set({
      compareMode: true,
      compareBranchIds: [branchIdA, branchIdB],
    })
  },

  setCompareMode: (on) => {
    set({
      compareMode: on,
      compareBranchIds: on ? get().compareBranchIds : null,
    })
  },

  // ─── Reset ─────────────────────────────────────────────────────────────────
  reset: () =>
    set({
      entityA: null,
      entityB: null,
      simulation: null,
      status: 'idle',
      compareMode: false,
      compareBranchIds: null,
      eventHistory: [],
      worldRules: null,
      hiddenVariables: [],
      scenarioContext: null,
      consequenceResult: null,
      isAnalyzingConsequences: false,
    }),
}))
