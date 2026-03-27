// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// NEW TYPE DEFINITIONS - AI Agent Conflict Simulator
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ─── Agent Types ───────────────────────────────────────────────────────────

export type AgentRole = 'founder' | 'competitor' | 'regulator' | 'public'

export type AgentPersonality = 'aggressive' | 'defensive' | 'conservative' | 'opportunistic' | 'neutral'

export interface AgentMemory {
  eventId: string
  timestamp: number
  perception: string
  agentInterpreted: string
  agentAction: string
  outcome: string
}

export interface AgentState {
  role: AgentRole
  name: string
  entityId: string
  personality: AgentPersonality
  goals: string[]
  memory: AgentMemory[]
  currentAction: AgentAction | null
  resources: number  // 0-100, represents capability
  trust: number       // 0-100, public trust for public agent
  riskTolerance: number // 0-100
}

export interface AgentAction {
  id: string
  type: ActionType
  targetId: string
  intensity: number  // 0-100
  reasoning: string
  timestamp: number
}

export type ActionType =
  | 'launch'
  | 'pivot'
  | 'acquire'
  | 'price_war'
  | 'hire'
  | 'fire'
  | 'PR_campaign'
  | 'regulate'
  | 'investigate'
  | 'boycott'
  | 'support'
  | 'delay'
  | 'no_action'

// ─── Entity Types ─────────────────────────────────────────────────────────

export interface EntityProfile {
  id: string
  name: string
  type: 'company' | 'product' | 'founder' | 'regulation' | 'public_figure'
  description: string
  marketPosition: number  // 0-100
  revenue?: number
  users?: number
  competitors: string[]
  partners: string[]
  lastUpdated: string
  metadata: Record<string, unknown>
}

// ─── Knowledge Graph ───────────────────────────────────────────────────

export interface KnowledgeNode {
  id: string
  type: 'entity' | 'event' | 'concept'
  label: string
  data: EntityProfile | SimulationEvent | string
  connections: string[]  // IDs of connected nodes
}

export interface KnowledgeEdge {
  id: string
  fromId: string
  toId: string
  relationship: 'owns' | 'competes_with' | 'partners_with' | 'regulates' | 'influences' | 'succeeds' | 'fails'
  strength: number  // 0-1
}

export interface KnowledgeGraph {
  nodes: KnowledgeNode[]
  edges: KnowledgeEdge[]
}

// ─── Event Types ───────────────────────────────────────────────────────

export interface SimulationEvent {
  id: string
  day: number
  type: 'external' | 'agent_action' | 'market_shift'
  trigger: string  // What triggered this
  description: string
  involvedAgents: AgentRole[]
  marketImpact: MarketImpact
  narrative: string  // AI-generated narrative
}

export interface MarketImpact {
  marketShareShift: number  // Negative for A, positive for B
  sentimentShift: number
  regulatoryRiskShift: number
  resourceShift: { agent: AgentRole; change: number }[]
}

// ─── Simulation State ───────────────────────────────────────────────────

export interface SimulationState {
  id: string
  day: number
  agents: Record<AgentRole, AgentState>
  marketShare: { A: number; B: number }
  sentiment: { A: number; B: number }
  events: SimulationEvent[]
  knowledgeGraph: KnowledgeGraph
  status: 'idle' | 'running' | 'paused' | 'complete'
}

// ─── Output Types ───────────────────────────────────────────────────────

export interface NarrativeEntry {
  id: string
  day: number
  title: string
  content: string
  perspective: AgentRole | 'observer'
  keyEvents: string[]
  emotionalTone: 'positive' | 'negative' | 'neutral' | 'tense' | 'hopeful'
}

export interface StrategicRecommendation {
  id: string
  forAgent: AgentRole
  priority: 'high' | 'medium' | 'low'
  action: ActionType
  reasoning: string
  expectedOutcome: string
  risks: string[]
}

export interface DashboardMetrics {
  day: number
  marketShare: { A: number; B: number }
  sentiment: { A: number; B: number }
  resourceLevel: { [key in AgentRole]: number }
  eventCount: number
  majorEvents: string[]
}

// ─── Scenario Templates ─────────────────────────────────────────────────

export interface ScenarioTemplate {
  id: string
  name: string
  description: string
  entities: { name: string; type: string; description: string }[]
  initialEvent: string
  suggestedActions: string[]
}
