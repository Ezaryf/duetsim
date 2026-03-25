import { create } from 'zustand'
import type { Entity, Duel, SimulationResult, ScenarioParams } from '@/types'

interface DuelStore {
  entityA: Entity | null
  entityB: Entity | null
  duel: Duel | null
  result: SimulationResult | null
  isLoading: boolean
  error: string | null
  
  timeHorizon: number
  depth: 'fast' | 'balanced' | 'deep'
  
  scenarioParams: ScenarioParams
  
  setEntityA: (entity: Entity | null) => void
  setEntityB: (entity: Entity | null) => void
  setDuel: (duel: Duel | null) => void
  setResult: (result: SimulationResult | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setTimeHorizon: (days: number) => void
  setDepth: (depth: 'fast' | 'balanced' | 'deep') => void
  updateScenarioParam: <K extends keyof ScenarioParams>(key: K, value: ScenarioParams[K]) => void
  reset: () => void
}

const defaultScenarioParams: ScenarioParams = {
  aPopularity: 50,
  bPopularity: 50,
  aContributors: 50,
  bContributors: 50,
  viralEvent: false,
  majorRelease: false,
  fundingBoost: false,
  regulationShock: false,
}

export const useDuelStore = create<DuelStore>((set) => ({
  entityA: null,
  entityB: null,
  duel: null,
  result: null,
  isLoading: false,
  error: null,
  timeHorizon: 90,
  depth: 'balanced',
  scenarioParams: defaultScenarioParams,
  
  setEntityA: (entity) => set({ entityA: entity }),
  setEntityB: (entity) => set({ entityB: entity }),
  setDuel: (duel) => set({ duel }),
  setResult: (result) => set({ result }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setTimeHorizon: (timeHorizon) => set({ timeHorizon }),
  setDepth: (depth) => set({ depth }),
  updateScenarioParam: (key, value) => set((state) => ({
    scenarioParams: { ...state.scenarioParams, [key]: value }
  })),
  reset: () => set({
    entityA: null,
    entityB: null,
    duel: null,
    result: null,
    isLoading: false,
    error: null,
    scenarioParams: defaultScenarioParams,
  }),
}))