// ─── Entity Types ────────────────────────────────────────────────────────────

export type EntityCategory =
  | 'repo'
  | 'company'
  | 'product'
  | 'model'
  | 'brand'
  | 'policy'
  | 'founder'

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
  marketCap?: number
  revenue?: number
  users?: number
}

export interface Entity {
  id: string
  category: EntityCategory
  externalId: string
  name: string
  owner?: string
  description?: string
  metrics?: EntityMetrics
  avatar?: string
  createdAt: string
  updatedAt: string
}

// ─── Event Types ─────────────────────────────────────────────────────────────

export type EventCategory =
  | 'funding'
  | 'scandal'
  | 'launch'
  | 'policy'
  | 'backlash'
  | 'viral'
  | 'feature'
  | 'regulation'
  | 'acquisition'
  | 'pivot'
  | 'custom'

export interface ForgeEvent {
  id: string
  label: string
  description: string
  impact: number               // -100 to +100
  targetEntity: 'A' | 'B' | 'both'
  day: number                  // injection point on timeline
  category: EventCategory
  icon?: string
  stateChange?: string         // AI generated state change description
  probability?: number         // AI generated probability of this exact timeline occurring
  createdAt: string
}

// ─── Timeline & Branching Types ──────────────────────────────────────────────

export interface TimelineNode {
  id: string
  day: number
  parentId: string | null
  branchId: string
  entityAScore: number         // 0-100
  entityBScore: number         // 0-100
  confidenceA: number          // 0-1
  confidenceB: number          // 0-1
  triggerEvent?: ForgeEvent
  stateChange: string          // e.g. "hiring surge"
  probabilityShift: number     // delta from parent
  reason: string               // e.g. "Funding event → hiring surge → product acceleration"
}

export interface CausalEdge {
  id: string
  fromNodeId: string
  toNodeId: string
  label: string
  strength: number             // 0-1
}

export interface Branch {
  id: string
  name: string
  color: string
  nodes: TimelineNode[]
  events: ForgeEvent[]
  probability: number          // 0-100  how likely this branch is
  isActive: boolean
  parentBranchId: string | null
  forkDay: number | null       // day where this branch forked
}

// ─── Simulation Types ────────────────────────────────────────────────────────

export interface Simulation {
  id: string
  entityA: Entity
  entityB: Entity
  branches: Branch[]
  causalEdges: CausalEdge[]
  activeBranchId: string
  totalDays: number
  createdAt: string
}

// ─── Replay & Score Types ────────────────────────────────────────────────────

export interface Prediction {
  id: string
  simulationId: string
  branchId: string
  predictedWinner: 'A' | 'B' | 'tie'
  confidence: number
  createdAt: string
}

export interface ReplayScore {
  simulationId: string
  predictions: Prediction[]
  accuracyScore: number        // 0-100
  createdAt: string
}

// ─── Duel Category Presets ───────────────────────────────────────────────────

export interface DuelPreset {
  id: string
  category: string
  label: string
  entityA: Partial<Entity>
  entityB: Partial<Entity>
  description: string
}

export type SimulationStatus = 'idle' | 'running' | 'complete' | 'error'

// ─── Consequence Engine Types ─────────────────────────────────────────────

export type AgentRole = 'founder' | 'competitor' | 'regulator' | 'public'

export interface AgentState {
  resources: number
  trust: number
  riskTolerance: number
}

export interface HiddenVariable {
  name: string
  value: number
}

export interface WorldRules {
  volatility: number
  transparency: number
  trustDecay: number
}

export interface CascadeStep {
  step: number
  trigger: string
  perceptions: Array<{
    agent: AgentRole
    perception: string
    emotionalState: string
  }>
  actions: Array<{
    agent: AgentRole
    action: string
    reasoning: string
  }>
  hiddenVariableShifts: Array<{
    name: string
    before: number
    after: number
    reason: string
  }>
  narrative: string
}

export interface FinalOutcome {
  winner: string
  narrative: string
  resourceChanges: Record<AgentRole, string>
}

export interface ConsequenceResult {
  cascade: CascadeStep[]
  finalOutcome: FinalOutcome
}