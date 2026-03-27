import { create } from 'zustand'
import type { 
  SimulationState, 
  EntityProfile, 
  SimulationEvent, 
  NarrativeEntry, 
  StrategicRecommendation,
  DashboardMetrics,
  AgentRole,
  ActionType
} from '@/types/agents'
import { 
  createSimulation, 
  processExternalEvent, 
  runSimulationTick, 
  generateRecommendations,
  generateDashboardMetrics
} from '@/lib/agents/simulation-engine'
import { convertActionToEvent } from '@/lib/agents/causal-engine'

interface SimulationStore {
  // State
  simulation: SimulationState | null
  narratives: NarrativeEntry[]
  recommendations: StrategicRecommendation[]
  dashboardMetrics: DashboardMetrics | null
  isRunning: boolean
  isPaused: boolean
  
  // Actions
  initializeSimulation: (entityA: EntityProfile, entityB: EntityProfile, totalDays?: number) => void
  injectEvent: (description: string, day?: number) => void
  startSimulation: () => void
  pauseSimulation: () => void
  resumeSimulation: () => void
  stopSimulation: () => void
  stepSimulation: () => void
  manualAction: (agentRole: AgentRole, actionType: ActionType) => void
  resetSimulation: () => void
}

export const useSimulationStore = create<SimulationStore>((set, get) => ({
  simulation: null,
  narratives: [],
  recommendations: [],
  dashboardMetrics: null,
  isRunning: false,
  isPaused: false,

  initializeSimulation: (entityA, entityB, totalDays = 90) => {
    const sim = createSimulation(entityA, entityB, totalDays)
    set({
      simulation: sim,
      narratives: [],
      recommendations: generateRecommendations(sim),
      dashboardMetrics: generateDashboardMetrics(sim),
    })
  },

  injectEvent: (description, day) => {
    const { simulation, narratives } = get()
    if (!simulation) return

    const event: SimulationEvent = {
      id: `ext_evt_${Date.now()}`,
      day: day ?? simulation.day,
      type: 'external',
      trigger: 'User injected',
      description,
      involvedAgents: ['founder', 'competitor', 'regulator', 'public'],
      marketImpact: {
        marketShareShift: 0,
        sentimentShift: 0,
        regulatoryRiskShift: 0,
        resourceShift: [],
      },
      narrative: description,
    }

    const { state, narrative } = processExternalEvent(event, simulation)
    
    set({
      simulation: state,
      narratives: [...narratives, narrative],
      recommendations: generateRecommendations(state),
      dashboardMetrics: generateDashboardMetrics(state),
    })
  },

  startSimulation: () => {
    const { simulation } = get()
    if (!simulation) return
    
    set({ 
      simulation: { ...simulation, status: 'running' },
      isRunning: true,
      isPaused: false,
    })
  },

  pauseSimulation: () => {
    const { simulation } = get()
    if (!simulation) return
    
    set({ 
      simulation: { ...simulation, status: 'paused' },
      isPaused: true,
    })
  },

  resumeSimulation: () => {
    const { simulation } = get()
    if (!simulation) return
    
    set({ 
      simulation: { ...simulation, status: 'running' },
      isPaused: false,
    })
  },

  stopSimulation: () => {
    const { simulation } = get()
    if (!simulation) return
    
    set({ 
      simulation: { ...simulation, status: 'complete' },
      isRunning: false,
      isPaused: false,
    })
  },

  stepSimulation: () => {
    const { simulation, narratives } = get()
    if (!simulation || simulation.status !== 'running') return

    const { state, narrative } = runSimulationTick(simulation)
    
    set({
      simulation: state,
      narratives: narrative ? [...narratives, narrative] : narratives,
      recommendations: generateRecommendations(state),
      dashboardMetrics: generateDashboardMetrics(state),
    })
  },

  manualAction: (agentRole, actionType) => {
    const { simulation, narratives } = get()
    if (!simulation) return

    const agent = simulation.agents[agentRole]
    if (!agent) return

    const event = convertActionToEvent(agent, actionType, simulation.day + 1)
    const { state, narrative } = processExternalEvent(event, simulation)

    set({
      simulation: state,
      narratives: [...narratives, narrative],
      recommendations: generateRecommendations(state),
      dashboardMetrics: generateDashboardMetrics(state),
    })
  },

  resetSimulation: () => {
    set({
      simulation: null,
      narratives: [],
      recommendations: [],
      dashboardMetrics: null,
      isRunning: false,
      isPaused: false,
    })
  },
}))
