import { create } from 'zustand'
import type { Entity, EntityCategory, ForgeEvent, Simulation, SimulationStatus } from '@/types'
import { createSimulation, injectEvent, getActiveBranch } from '@/lib/engine/engine'
import { createForgeEvent } from '@/lib/engine/events'

interface SimulationStore {
  // ─── Entity Selection ────────────────────────────────────────────────────
  entityA: Entity | null
  entityB: Entity | null
  category: EntityCategory
  setEntityA: (entity: Entity | null) => void
  setEntityB: (entity: Entity | null) => void
  setCategory: (cat: EntityCategory) => void

  // ─── Simulation State ────────────────────────────────────────────────────
  simulation: Simulation | null
  status: SimulationStatus
  totalDays: number
  setTotalDays: (days: number) => void

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
    const lastEvent = activeBranch.events[activeBranch.events.length - 1]
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
    }),
}))
