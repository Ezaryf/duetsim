export type EntityType = 'repo' | 'company' | 'product' | 'model'

export interface EntityMetrics {
  stars?: number
  forks?: number
  issues?: number
  prs?: number
  watchers?: number
  size?: number
  openIssues?: number
  closedIssues?: number
  contributors?: number
  commits?: number
  releases?: number
  lastUpdate?: string
  description?: string
  topics?: string[]
  language?: string
  license?: string
}

export interface Entity {
  id: string
  type: EntityType
  externalId: string
  name: string
  owner?: string
  description?: string
  metrics?: EntityMetrics
  embedding?: number[]
  createdAt: string
  updatedAt: string
}

export type SimulationDepth = 'fast' | 'balanced' | 'deep'

export interface Duel {
  id: string
  userId?: string
  entityA: Entity
  entityB: Entity
  timeHorizon: number
  depth: SimulationDepth
  status: 'pending' | 'running' | 'completed' | 'failed'
  createdAt: string
}

export type OutcomeType =
  | 'a_dominates'
  | 'b_dominates'
  | 'mutual_growth'
  | 'mutual_decline'
  | 'a_rises_b_stabilizes'
  | 'b_rises_a_stabilizes'
  | 'market_split'
  | 'oscillation'
  | 'convergence'

export interface Outcome {
  type: OutcomeType
  probability: number
  confidence: 'low' | 'medium' | 'high'
  drivers: string[]
  risks: string[]
  milestones: { day: number; event: string }[]
}

export interface TrajectoryPoint {
  day: number
  entityA: number
  entityB: number
  confidenceLow: number
  confidenceHigh: number
}

export interface SimulationResult {
  id: string
  duelId: string
  outcomes: Outcome[]
  trajectories: TrajectoryPoint[][]
  narrative: Record<OutcomeType, string>
  createdAt: string
}

export interface ScenarioParams {
  aPopularity: number
  bPopularity: number
  aContributors: number
  bContributors: number
  viralEvent: boolean
  majorRelease: boolean
  fundingBoost: boolean
  regulationShock: boolean
}