import type { 
  AgentRole, 
  AgentState, 
  SimulationState, 
  SimulationEvent, 
  EntityProfile,
  NarrativeEntry,
  StrategicRecommendation,
  DashboardMetrics,
  ActionType
} from '@/types/agents'
import { createAgent, decideAction, applyActionEffects, ACTIONS_BY_ROLE, ACTION_IMPACTS } from './agent-engine'
import { analyzeEvent, calculateMarketImpact, generateEventNarrative, convertActionToEvent } from './causal-engine'
import { KnowledgeGraphManager } from './knowledge-graph'

// ─── Simulation Engine ─────────────────────────────────────────────────
// Orchestrates the entire simulation loop: events → agents → decisions → outcomes

// ─── Create Initial Simulation State ───────────────────────────────────

export function createSimulation(
  entityA: EntityProfile,
  entityB: EntityProfile,
  totalDays: number = 90
): SimulationState {
  const knowledgeGraph = new KnowledgeGraphManager()
  
  // Add entities to knowledge graph
  knowledgeGraph.addEntity(entityA)
  knowledgeGraph.addEntity(entityB)
  
  // Connect them as competitors
  knowledgeGraph.connectEntities(entityA.id, entityB.id, 'competes_with')

  // Create agents
  const agents: Record<AgentRole, AgentState> = {
    founder: createAgent('founder', entityA.id, 'opportunistic'),
    competitor: createAgent('competitor', entityB.id, 'aggressive'),
    regulator: createAgent('regulator', 'regulator_1', 'conservative'),
    public: createAgent('public', 'public_1', 'neutral'),
  }

  return {
    id: `sim_${Date.now()}`,
    day: 0,
    agents,
    marketShare: { A: 50, B: 50 },
    sentiment: { A: 50, B: 50 },
    events: [],
    knowledgeGraph: knowledgeGraph.export(),
    status: 'idle',
  }
}

// ─── Process External Event ───────────────────────────────────────────

export function processExternalEvent(
  simulation: SimulationEvent,
  state: SimulationState
): { state: SimulationState; narrative: NarrativeEntry } {
  const entities = {
    A: { id: 'entity_a', name: 'Entity A', type: 'company' as const, description: '', marketPosition: state.marketShare.A, competitors: [], partners: [], lastUpdated: '', metadata: {} },
    B: { id: 'entity_b', name: 'Entity B', type: 'company' as const, description: '', marketPosition: state.marketShare.B, competitors: [], partners: [], lastUpdated: '', metadata: {} },
  }

  // Analyze event with causal engine
  const analysis = analyzeEvent(simulation, entities, state.agents)
  
  // Calculate market impact
  const marketImpact = calculateMarketImpact(
    analysis,
    state.marketShare,
    state.sentiment
  )

  // Update agent memories
  const updatedAgents = { ...state.agents }
  for (const [role, agent] of Object.entries(updatedAgents)) {
    const agentReaction = analysis.affectedAgents.find(a => a.role === role)
    if (agentReaction) {
      updatedAgents[role as AgentRole] = {
        ...agent,
        currentAction: null, // Will be decided in next tick
      }
    }
  }

  // Update state
  const newState: SimulationState = {
    ...state,
    agents: updatedAgents,
    marketShare: {
      A: Math.max(10, Math.min(90, state.marketShare.A + marketImpact.marketShareShift)),
      B: Math.max(10, Math.min(90, state.marketShare.B - marketImpact.marketShareShift)),
    },
    sentiment: {
      A: Math.max(10, Math.min(90, state.sentiment.A + marketImpact.sentimentShift)),
      B: Math.max(10, Math.min(90, state.sentiment.B + marketImpact.sentimentShift / 2)),
    },
    events: [...state.events, simulation],
    knowledgeGraph: addEventToGraph(state.knowledgeGraph, simulation),
  }

  // Generate narrative
  const narrative: NarrativeEntry = {
    id: `narrative_${simulation.id}`,
    day: simulation.day,
    title: simulation.description,
    content: generateEventNarrative(simulation, analysis),
    perspective: 'observer',
    keyEvents: analysis.directEffects,
    emotionalTone: marketImpact.marketShareShift > 5 ? 'positive' : marketImpact.marketShareShift < -5 ? 'negative' : 'neutral',
  }

  return { state: newState, narrative }
}

// ─── Simulation Tick ──────────────────────────────────────────────────

export interface TickResult {
  state: SimulationState
  agentActions: { role: AgentRole; action: string; reasoning: string }[]
  narrative: NarrativeEntry | null
}

export function runSimulationTick(currentState: SimulationState): TickResult {
  if (currentState.status !== 'running') {
    return { state: currentState, agentActions: [], narrative: null }
  }

  const nextDay = currentState.day + 1
  const agentActions: { role: AgentRole; action: string; reasoning: string }[] = []
  const events: SimulationEvent[] = []
  
  const context = {
    day: nextDay,
    marketShare: currentState.marketShare,
    sentiment: currentState.sentiment,
    recentEvents: currentState.events.slice(-3).map(e => e.description),
    competitorAction: currentState.agents.competitor.currentAction,
  }

  const newAgents = { ...currentState.agents }

  // Each agent decides and acts
  const agentRoles: AgentRole[] = ['founder', 'competitor', 'regulator', 'public']
  
  for (const role of agentRoles) {
    const agent = newAgents[role]
    const decision = decideAction(agent, context)
    
    const action = decision.action
    const impact = ACTION_IMPACTS[action.type]
    
    agentActions.push({
      role,
      action: impact.label,
      reasoning: decision.reasoning,
    })

    // Convert action to event
    const actionEvent = convertActionToEvent(agent, action.type, nextDay)
    events.push(actionEvent)

    // Update agent with action and apply effects
    const effects = applyActionEffects(action, newAgents)
    
    newAgents[role] = {
      ...agent,
      currentAction: action,
      resources: Math.max(10, Math.min(100, effects.newResources[role])),
    }
  }

  // Apply cumulative effects
  let totalMarketShift = 0
  let totalSentimentShift = 0
  
  for (const event of events) {
    if (event.type === 'agent_action') {
      totalMarketShift += event.marketImpact.marketShareShift
      totalSentimentShift += event.marketImpact.sentimentShift
    }
  }

  const newState: SimulationState = {
    ...currentState,
    day: nextDay,
    agents: newAgents,
    marketShare: {
      A: Math.max(10, Math.min(90, currentState.marketShare.A + totalMarketShift)),
      B: Math.max(10, Math.min(90, currentState.marketShare.B - totalMarketShift)),
    },
    sentiment: {
      A: Math.max(10, Math.min(90, currentState.sentiment.A + totalSentimentShift)),
      B: Math.max(10, Math.min(90, currentState.sentiment.B + totalSentimentShift / 2)),
    },
    events: [...currentState.events, ...events],
  }

  // Generate narrative for tick
  const narrative = generateTickNarrative(nextDay, agentActions, newState.marketShare)

  return { state: newState, agentActions, narrative }
}

// ─── Helper Functions ──────────────────────────────────────────────────

function addEventToGraph(graph: any, event: SimulationEvent): any {
  // Simplified - in real implementation would use KnowledgeGraphManager
  return graph
}

function generateTickNarrative(
  day: number,
  actions: { role: AgentRole; action: string; reasoning: string }[],
  marketShare: { A: number; B: number }
): NarrativeEntry {
  const significantActions = actions.filter(a => a.action !== 'No Action')
  
  let content = `Day ${day}: `
  
  if (significantActions.length === 0) {
    content += 'Markets remain stable. No significant actions taken.'
  } else {
    content += significantActions.map(a => 
      `${a.role} ${a.action.toLowerCase()}: ${a.reasoning}`
    ).join('. ')
  }

  const leader = marketShare.A > marketShare.B ? 'Entity A' : marketShare.B > marketShare.A ? 'Entity B' : 'tied'
  content += `\n\nCurrent standings: Entity A at ${marketShare.A.toFixed(1)}%, Entity B at ${marketShare.B.toFixed(1)}%. Leading: ${leader}`

  return {
    id: `narrative_tick_${day}`,
    day,
    title: `Day ${day} Developments`,
    content,
    perspective: 'observer',
    keyEvents: significantActions.map(a => a.action),
    emotionalTone: Math.abs(marketShare.A - marketShare.B) > 15 ? 'tense' : 'neutral',
  }
}

// ─── Generate Strategic Recommendations ────────────────────────────────

export function generateRecommendations(
  state: SimulationState
): StrategicRecommendation[] {
  const recommendations: StrategicRecommendation[] = []
  
  const { marketShare, sentiment, agents } = state
  const diff = marketShare.A - marketShare.B
  const sentimentDiff = sentiment.A - sentiment.B

  // Founder recommendations
  if (diff < -20) {
    recommendations.push({
      id: `rec_founder_1`,
      forAgent: 'founder',
      priority: 'high',
      action: 'launch',
      reasoning: 'Significant market share deficit. Need a big move.',
      expectedOutcome: 'Regain market position through innovation',
      risks: ['Resource drain', 'Market timing risk'],
    })
  }

  if (sentiment.A < 40) {
    recommendations.push({
      id: `rec_founder_2`,
      forAgent: 'founder',
      priority: 'high',
      action: 'PR_campaign',
      reasoning: 'Public sentiment is low. Need to rebuild trust.',
      expectedOutcome: 'Improve public perception',
      risks: ['May seem insincere if not backed by action'],
    })
  }

  if (agents.founder.resources < 30) {
    recommendations.push({
      id: `rec_founder_3`,
      forAgent: 'founder',
      priority: 'medium',
      action: 'acquire',
      reasoning: 'Resources are running low. Consider strategic acquisition.',
      expectedOutcome: 'Boost capabilities and market position',
      risks: ['High cost', 'Integration challenges'],
    })
  }

  // Competitor recommendations
  if (diff > 20) {
    recommendations.push({
      id: `rec_competitor_1`,
      forAgent: 'competitor',
      priority: 'medium',
      action: 'price_war',
      reasoning: 'Strong position. Press the advantage.',
      expectedOutcome: 'Further increase market dominance',
      risks: ['Margin compression', 'Price war escalation'],
    })
  }

  // Regulator recommendations
  if (Math.abs(sentimentDiff) > 30) {
    recommendations.push({
      id: `rec_regulator_1`,
      forAgent: 'regulator',
      priority: 'medium',
      action: 'investigate',
      reasoning: 'Significant public sentiment imbalance. Investigate.',
      expectedOutcome: 'Ensure fair market practices',
      risks: ['May be seen as overreach'],
    })
  }

  // Public recommendations
  if (sentiment.A > 70) {
    recommendations.push({
      id: `rec_public_1`,
      forAgent: 'public',
      priority: 'low',
      action: 'support',
      reasoning: 'Entity A is doing well. Show support.',
      expectedOutcome: 'Encourage positive trajectory',
      risks: ['None significant'],
    })
  }

  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })
}

// ─── Generate Dashboard Metrics ─────────────────────────────────────────

export function generateDashboardMetrics(state: SimulationState): DashboardMetrics {
  const majorEvents = state.events
    .filter(e => e.type === 'agent_action' && e.marketImpact.marketShareShift !== 0)
    .slice(-5)
    .map(e => e.description)

  return {
    day: state.day,
    marketShare: {
      A: Math.round(state.marketShare.A),
      B: Math.round(state.marketShare.B),
    },
    sentiment: {
      A: Math.round(state.sentiment.A),
      B: Math.round(state.sentiment.B),
    },
    resourceLevel: {
      founder: state.agents.founder.resources,
      competitor: state.agents.competitor.resources,
      regulator: state.agents.regulator.resources,
      public: state.agents.public.trust,
    },
    eventCount: state.events.length,
    majorEvents,
  }
}
