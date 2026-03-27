import type { AgentRole, AgentState, AgentPersonality, AgentAction, AgentMemory, ActionType } from '@/types/agents'

// ─── Agent Role Configurations ───────────────────────────────────────────

export const AGENT_CONFIGS: Record<AgentRole, {
  name: string
  defaultPersonality: AgentPersonality
  goals: string[]
  riskTolerance: number
  resourceWeight: number
}> = {
  founder: {
    name: 'Founder',
    defaultPersonality: 'opportunistic',
    goals: ['Maximize growth', 'Capture market share', 'Build brand'],
    riskTolerance: 70,
    resourceWeight: 0.8,
  },
  competitor: {
    name: 'Competitor',
    defaultPersonality: 'aggressive',
    goals: ['Defend market share', 'Disrupt competitor', 'Maximize profit'],
    riskTolerance: 60,
    resourceWeight: 0.9,
  },
  regulator: {
    name: 'Regulator',
    defaultPersonality: 'conservative',
    goals: ['Ensure compliance', 'Protect public interest', 'Maintain order'],
    riskTolerance: 30,
    resourceWeight: 0.5,
  },
  public: {
    name: 'Public',
    defaultPersonality: 'neutral',
    goals: ['Trust building', 'Value delivery', 'Safety assurance'],
    riskTolerance: 50,
    resourceWeight: 0.3,
  },
}

// ─── Available Actions by Role ─────────────────────────────────────────

export const ACTIONS_BY_ROLE: Record<AgentRole, ActionType[]> = {
  founder: ['launch', 'pivot', 'acquire', 'hire', 'fire', 'PR_campaign', 'no_action'],
  competitor: ['price_war', 'acquire', 'launch', 'PR_campaign', 'no_action'],
  regulator: ['regulate', 'investigate', 'delay', 'no_action'],
  public: ['boycott', 'support', 'no_action'],
}

// ─── Action Impact Definitions ─────────────────────────────────────────

export const ACTION_IMPACTS: Record<ActionType, {
  label: string
  description: string
  marketShareEffect: number
  sentimentEffect: number
  regulatoryRiskEffect: number
  resourceCost: number
  cooldown: number  // days before same action can be used
}> = {
  launch: {
    label: 'Launch Product/Feature',
    description: 'Introduce new product or feature to market',
    marketShareEffect: 10,
    sentimentEffect: 5,
    regulatoryRiskEffect: 0,
    resourceCost: 20,
    cooldown: 30,
  },
  pivot: {
    label: 'Strategic Pivot',
    description: 'Change business direction',
    marketShareEffect: -5,
    sentimentEffect: -10,
    regulatoryRiskEffect: 5,
    resourceCost: 30,
    cooldown: 60,
  },
  acquire: {
    label: 'Acquisition',
    description: 'Acquire a company or asset',
    marketShareEffect: 15,
    sentimentEffect: 0,
    regulatoryRiskEffect: 10,
    resourceCost: 40,
    cooldown: 90,
  },
  price_war: {
    label: 'Price War',
    description: 'Lower prices to gain competitive advantage',
    marketShareEffect: 8,
    sentimentEffect: -5,
    regulatoryRiskEffect: 0,
    resourceCost: 15,
    cooldown: 45,
  },
  hire: {
    label: 'Hiring Spree',
    description: 'Hire talented employees',
    marketShareEffect: 5,
    sentimentEffect: 5,
    regulatoryRiskEffect: 0,
    resourceCost: 15,
    cooldown: 20,
  },
  fire: {
    label: 'Layoffs',
    description: 'Reduce workforce',
    marketShareEffect: 0,
    sentimentEffect: -15,
    regulatoryRiskEffect: 5,
    resourceCost: -10,
    cooldown: 30,
  },
  PR_campaign: {
    label: 'PR Campaign',
    description: 'Launch public relations campaign',
    marketShareEffect: 3,
    sentimentEffect: 10,
    regulatoryRiskEffect: 0,
    resourceCost: 10,
    cooldown: 30,
  },
  regulate: {
    label: 'Regulation',
    description: 'Impose new regulations',
    marketShareEffect: -5,
    sentimentEffect: 0,
    regulatoryRiskEffect: 20,
    resourceCost: 5,
    cooldown: 60,
  },
  investigate: {
    label: 'Investigation',
    description: 'Launch formal investigation',
    marketShareEffect: -3,
    sentimentEffect: -5,
    regulatoryRiskEffect: 15,
    resourceCost: 10,
    cooldown: 45,
  },
  delay: {
    label: 'Delay Approval',
    description: 'Delay regulatory approval',
    marketShareEffect: -2,
    sentimentEffect: -3,
    regulatoryRiskEffect: 10,
    resourceCost: 5,
    cooldown: 30,
  },
  boycott: {
    label: 'Boycott',
    description: 'Call for consumer boycott',
    marketShareEffect: -8,
    sentimentEffect: -20,
    regulatoryRiskEffect: 5,
    resourceCost: 5,
    cooldown: 60,
  },
  support: {
    label: 'Public Support',
    description: 'Express public support',
    marketShareEffect: 3,
    sentimentEffect: 15,
    regulatoryRiskEffect: -5,
    resourceCost: 5,
    cooldown: 30,
  },
  no_action: {
    label: 'No Action',
    description: 'Observe and wait',
    marketShareEffect: 0,
    sentimentEffect: 0,
    regulatoryRiskEffect: 0,
    resourceCost: 0,
    cooldown: 0,
  },
}

// ─── Agent Factory ──────────────────────────────────────────────────────

export function createAgent(
  role: AgentRole,
  entityId: string,
  personality?: AgentPersonality
): AgentState {
  const config = AGENT_CONFIGS[role]
  
  return {
    role,
    name: config.name,
    entityId,
    personality: personality || config.defaultPersonality,
    goals: [...config.goals],
    memory: [],
    currentAction: null,
    resources: 70,
    trust: 50,
    riskTolerance: config.riskTolerance,
  }
}

// ─── Agent Memory Management ───────────────────────────────────────────

export function addAgentMemory(
  agent: AgentState,
  eventId: string,
  perception: string,
  agentInterpreted: string,
  agentAction: string,
  outcome: string
): AgentState {
  const memory: AgentMemory = {
    eventId,
    timestamp: Date.now(),
    perception,
    agentInterpreted,
    agentAction,
    outcome,
  }

  return {
    ...agent,
    memory: [...agent.memory.slice(-9), memory],  // Keep last 10 memories
  }
}

export function getAgentMemorySummary(agent: AgentState): string {
  if (agent.memory.length === 0) {
    return 'No previous events recorded.'
  }

  const recent = agent.memory.slice(-3)
  return recent.map(m => 
    `- ${m.perception}: ${m.agentAction} → ${m.outcome}`
  ).join('\n')
}

// ─── Agent Decision Making ─────────────────────────────────────────────

export interface DecisionContext {
  day: number
  marketShare: { A: number; B: number }
  sentiment: { A: number; B: number }
  recentEvents: string[]
  competitorAction: AgentAction | null
}

export interface DecisionResult {
  action: AgentAction
  reasoning: string
  confidence: number
}

// ─── Simple Rule-Based Decision Engine ─────────────────────────────────

// This will be replaced with AI-driven decisions in production
export function decideAction(
  agent: AgentState,
  context: DecisionContext
): DecisionResult {
  const actions = ACTIONS_BY_ROLE[agent.role]
  const lastAction = agent.currentAction
  
  // Check cooldown
  if (lastAction) {
    const cooldown = ACTION_IMPACTS[lastAction.type].cooldown
    const daysSinceAction = context.day - (lastAction.timestamp / 86400000)
    if (daysSinceAction < cooldown) {
      return {
        action: {
          id: `action_${Date.now()}`,
          type: 'no_action',
          targetId: '',
          intensity: 0,
          reasoning: 'Cooldown period active',
          timestamp: Date.now(),
        },
        reasoning: 'Recent action still in cooldown period',
        confidence: 0.9,
      }
    }
  }

  // Decision logic based on agent role and personality
  const decision = ruleBasedDecision(agent, context)
  return decision
}

function ruleBasedDecision(agent: AgentState, context: DecisionContext): DecisionResult {
  const actions = ACTIONS_BY_ROLE[agent.role]
  const { marketShare, sentiment, recentEvents } = context

  // Founder logic
  if (agent.role === 'founder') {
    if (marketShare.A < 40) {
      return {
        action: makeAction('launch', 'market', 70),
        reasoning: 'Low market share - need to launch new products',
        confidence: 0.7,
      }
    }
    if (sentiment.A < 40) {
      return {
        action: makeAction('PR_campaign', 'public', 60),
        reasoning: 'Negative sentiment - need PR recovery',
        confidence: 0.7,
      }
    }
    if (recentEvents.some(e => e.includes('competitor'))) {
      return {
        action: makeAction('price_war', 'competitor', 50),
        reasoning: 'Competitor action detected - respond aggressively',
        confidence: 0.6,
      }
    }
  }

  // Competitor logic
  if (agent.role === 'competitor') {
    if (marketShare.B > marketShare.A + 20) {
      return {
        action: makeAction('price_war', 'founder', 80),
        reasoning: 'Defensive - respond to market leader',
        confidence: 0.8,
      }
    }
    if (sentiment.B > 70) {
      return {
        action: makeAction('acquire', 'market', 50),
        reasoning: 'Strong position - good time to acquire',
        confidence: 0.6,
      }
    }
  }

  // Regulator logic
  if (agent.role === 'regulator') {
    if (recentEvents.some(e => e.includes('breach') || e.includes('scandal'))) {
      return {
        action: makeAction('investigate', 'founder', 80),
        reasoning: 'Potential violation detected - investigate',
        confidence: 0.8,
      }
    }
    if (sentiment.A < 30 || sentiment.B < 30) {
      return {
        action: makeAction('regulate', 'market', 60),
        reasoning: 'Public concern high - consider regulation',
        confidence: 0.7,
      }
    }
  }

  // Public logic
  if (agent.role === 'public') {
    if (sentiment.A > 70) {
      return {
        action: makeAction('support', 'founder', 70),
        reasoning: 'Entity A has strong public support',
        confidence: 0.7,
      }
    }
    if (sentiment.A < 30) {
      return {
        action: makeAction('boycott', 'founder', 80),
        reasoning: 'Entity A lost public trust',
        confidence: 0.8,
      }
    }
  }

  // Default: no action
  return {
    action: makeAction('no_action', '', 0),
    reasoning: 'No compelling reason to act',
    confidence: 0.5,
  }
}

function makeAction(type: ActionType, targetId: string, intensity: number): AgentAction {
  return {
    id: `action_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    type,
    targetId,
    intensity,
    reasoning: ACTION_IMPACTS[type].description,
    timestamp: Date.now(),
  }
}

// ─── Apply Action Effects ───────────────────────────────────────────────

export interface ActionResult {
  newResources: { [key in AgentRole]: number }
  marketShareShift: { A: number; B: number }
  sentimentShift: { A: number; B: number }
  regulatoryRiskShift: number
}

export function applyActionEffects(
  action: AgentAction,
  actors: Record<AgentRole, AgentState>
): ActionResult {
  const impact = ACTION_IMPACTS[action.type]
  
  const result: ActionResult = {
    newResources: {
      founder: actors.founder.resources,
      competitor: actors.competitor.resources,
      regulator: actors.regulator.resources,
      public: actors.public.resources,
    },
    marketShareShift: { A: 0, B: 0 },
    sentimentShift: { A: 0, B: 0 },
    regulatoryRiskShift: 0,
  }

  if (action.type === 'no_action') {
    return result
  }

  // Apply resource cost
  const actorKey = action.targetId.toLowerCase().includes('founder') ? 'founder' :
                   action.targetId.toLowerCase().includes('competitor') ? 'competitor' :
                   action.targetId.toLowerCase().includes('regulator') ? 'regulator' : 'founder'
  
  result.newResources[actorKey] = Math.max(10, result.newResources[actorKey] - impact.resourceCost)

  // Apply effects based on action type
  switch (action.type) {
    case 'launch':
    case 'pivot':
    case 'hire':
      result.marketShareShift.A = impact.marketShareEffect
      result.sentimentShift.A = impact.sentimentEffect
      break
    case 'price_war':
      result.marketShareShift.A = impact.marketShareEffect
      result.marketShareShift.B = -impact.marketShareEffect / 2
      break
    case 'acquire':
      result.marketShareShift.A = impact.marketShareEffect
      result.sentimentShift.B = -5
      break
    case 'fire':
      result.sentimentShift.A = impact.sentimentEffect
      result.newResources.founder += Math.abs(impact.resourceCost)
      break
    case 'PR_campaign':
      result.sentimentShift.A = impact.sentimentEffect
      break
    case 'regulate':
    case 'investigate':
    case 'delay':
      result.marketShareShift.A = impact.marketShareEffect
      result.regulatoryRiskShift = impact.regulatoryRiskEffect
      break
    case 'boycott':
      result.marketShareShift.A = impact.marketShareEffect
      result.sentimentShift.A = impact.sentimentEffect
      break
    case 'support':
      result.sentimentShift.A = impact.sentimentEffect
      break
  }

  return result
}
