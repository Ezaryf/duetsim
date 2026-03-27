import type { SimulationEvent, AgentRole, AgentState, MarketImpact, EntityProfile, ActionType } from '@/types/agents'
import { ACTION_IMPACTS } from './agent-engine'

// ─── Causal Reasoning Engine ───────────────────────────────────────────
// This module analyzes how events affect agents and generates meaningful outcomes
// instead of arbitrary numerical changes.

// ─── Event Analysis ────────────────────────────────────────────────────

export interface CausalAnalysis {
  cause: string
  directEffects: string[]
  indirectEffects: string[]
  affectedAgents: { role: AgentRole; impact: string; magnitude: number }[]
  chain: CausalChain[]
}

export interface CausalChain {
  step: number
  from: AgentRole
  to: AgentRole
  trigger: string
  reaction: string
  outcome: string
}

// ─── Event Type Categories ───────────────────────────────────────────────

type EventCategory = 'funding' | 'scandal' | 'launch' | 'regulatory' | 'market' | 'social' | 'acquisition'

const EVENT_CATEGORY_MAP: Record<string, EventCategory> = {
  'funding': 'funding',
  'raise': 'funding',
  'invest': 'funding',
  'scandal': 'scandal',
  'breach': 'scandal',
  'lawsuit': 'scandal',
  'launch': 'launch',
  'release': 'launch',
  'announce': 'launch',
  'regulate': 'regulatory',
  'law': 'regulatory',
  'fine': 'regulatory',
  'ban': 'regulatory',
  'market': 'market',
  'competitor': 'market',
  'price': 'market',
  'social': 'social',
  'viral': 'social',
  'backlash': 'social',
  'boycott': 'social',
}

// ─── Agent Reaction Templates ──────────────────────────────────────────

interface ReactionTemplate {
  trigger: EventCategory
  agent: AgentRole
  condition: string
  response: string
  outcome: string
  marketEffect: number
  sentimentEffect: number
}

const REACTION_TEMPLATES: ReactionTemplate[] = [
  // Founder reactions to funding
  {
    trigger: 'funding',
    agent: 'founder',
    condition: 'positive',
    response: 'Accelerate growth with new capital',
    outcome: 'Hiring spree, faster product development',
    marketEffect: 10,
    sentimentEffect: 5,
  },
  // Competitor reactions to funding
  {
    trigger: 'funding',
    agent: 'competitor',
    condition: 'any',
    response: 'Defend market share against well-funded rival',
    outcome: 'Price reductions, increased marketing',
    marketEffect: -3,
    sentimentEffect: 0,
  },
  // Regulator reactions to funding
  {
    trigger: 'funding',
    agent: 'regulator',
    condition: 'any',
    response: 'Monitor for antitrust concerns',
    outcome: 'Increased scrutiny',
    marketEffect: 0,
    sentimentEffect: -5,
  },
  // Public reactions to funding
  {
    trigger: 'funding',
    agent: 'public',
    condition: 'positive',
    response: 'Positive sentiment towards growth company',
    outcome: 'Increased trust',
    marketEffect: 0,
    sentimentEffect: 10,
  },

  // Founder reactions to scandal
  {
    trigger: 'scandal',
    agent: 'founder',
    condition: 'negative',
    response: 'Crisis management and transparency',
    outcome: 'PR campaign, leadership changes',
    marketEffect: -15,
    sentimentEffect: -20,
  },
  // Competitor reactions to scandal
  {
    trigger: 'scandal',
    agent: 'competitor',
    condition: 'any',
    response: 'Capitalize on rival\'s misfortune',
    outcome: 'Marketing attack, customer acquisition',
    marketEffect: 8,
    sentimentEffect: 5,
  },
  // Regulator reactions to scandal
  {
    trigger: 'scandal',
    agent: 'regulator',
    condition: 'negative',
    response: 'Launch investigation',
    outcome: 'Formal investigation, potential fines',
    marketEffect: -10,
    sentimentEffect: -10,
  },
  // Public reactions to scandal
  {
    trigger: 'scandal',
    agent: 'public',
    condition: 'negative',
    response: 'Lose trust in entity',
    outcome: 'Boycott calls, negative sentiment',
    marketEffect: -5,
    sentimentEffect: -30,
  },

  // Founder reactions to launch
  {
    trigger: 'launch',
    agent: 'founder',
    condition: 'positive',
    response: 'Announce and market new product',
    outcome: 'Market share gains',
    marketEffect: 8,
    sentimentEffect: 5,
  },
  // Competitor reactions to launch
  {
    trigger: 'launch',
    agent: 'competitor',
    condition: 'any',
    response: 'Counter with own launch or price reduction',
    outcome: 'Price war or feature comparison',
    marketEffect: -2,
    sentimentEffect: 0,
  },
  // Regulator reactions to launch
  {
    trigger: 'launch',
    agent: 'regulator',
    condition: 'any',
    response: 'Review for compliance',
    outcome: 'Potential delays',
    marketEffect: -2,
    sentimentEffect: 0,
  },
  // Public reactions to launch
  {
    trigger: 'launch',
    agent: 'public',
    condition: 'positive',
    response: 'Excited about new option',
    outcome: 'Positive reception',
    marketEffect: 0,
    sentimentEffect: 8,
  },

  // Founder reactions to regulatory
  {
    trigger: 'regulatory',
    agent: 'founder',
    condition: 'negative',
    response: 'Lobby against or comply',
    outcome: 'Compliance costs or pivot',
    marketEffect: -5,
    sentimentEffect: -5,
  },
  // Competitor reactions to regulatory
  {
    trigger: 'regulatory',
    agent: 'competitor',
    condition: 'any',
    response: 'Position as compliant alternative',
    outcome: 'Marketing advantage',
    marketEffect: 3,
    sentimentEffect: 3,
  },
  // Regulator reactions to regulatory
  {
    trigger: 'regulatory',
    agent: 'regulator',
    condition: 'positive',
    response: 'Enforce new rules',
    outcome: 'Compliance monitoring',
    marketEffect: 0,
    sentimentEffect: 5,
  },
  // Public reactions to regulatory
  {
    trigger: 'regulatory',
    agent: 'public',
    condition: 'positive',
    response: 'Feel protected',
    outcome: 'Increased trust in system',
    marketEffect: 0,
    sentimentEffect: 10,
  },

  // Social events
  {
    trigger: 'social',
    agent: 'founder',
    condition: 'negative',
    response: 'Crisis response',
    outcome: 'Apology, policy changes',
    marketEffect: -8,
    sentimentEffect: -15,
  },
  {
    trigger: 'social',
    agent: 'competitor',
    condition: 'any',
    response: 'Exploit rival\'s PR problem',
    outcome: 'Customer acquisition',
    marketEffect: 5,
    sentimentEffect: 5,
  },
  {
    trigger: 'social',
    agent: 'public',
    condition: 'negative',
    response: 'Demand change',
    outcome: 'Ongoing pressure',
    marketEffect: -3,
    sentimentEffect: -20,
  },
]

// ─── Main Analysis Function ─────────────────────────────────────────────

export function analyzeEvent(
  event: SimulationEvent,
  entities: { A: EntityProfile; B: EntityProfile },
  agents: Record<AgentRole, AgentState>
): CausalAnalysis {
  const category = categorizeEvent(event.description)
  
  // Find relevant reactions
  const relevantReactions = REACTION_TEMPLATES.filter(
    r => r.trigger === category
  )

  const directEffects: string[] = []
  const indirectEffects: string[] = []
  const affectedAgents: CausalAnalysis['affectedAgents'] = []
  const chain: CausalChain[] = []

  // Generate reactions for each agent type
  const agentRoles: AgentRole[] = ['founder', 'competitor', 'regulator', 'public']
  
  agentRoles.forEach((role, index) => {
    const reaction = relevantReactions.find(r => r.agent === role)
    if (reaction) {
      const agentEntity = role === 'founder' ? 'A' : 'B'
      const entity = agentEntity === 'A' ? entities.A : entities.B
      
      directEffects.push(`${reaction.response}: ${reaction.outcome}`)
      
      affectedAgents.push({
        role,
        impact: reaction.outcome,
        magnitude: Math.abs(reaction.marketEffect),
      })

      // Create causal chain
      if (index < agentRoles.length - 1) {
        chain.push({
          step: index + 1,
          from: role,
          to: agentRoles[index + 1],
          trigger: reaction.response,
          reaction: reaction.outcome,
          outcome: `${role} taking ${reaction.response.toLowerCase()} creates ripple effect`,
        })
      }
    }
  })

  // Generate indirect effects (second-order impacts)
  const firstOrderChanges = affectedAgents.filter(a => a.magnitude > 5)
  firstOrderChanges.forEach(agent => {
    if (agent.role === 'founder' && agent.magnitude > 10) {
      indirectEffects.push('Market dynamics shift - competitor must respond')
    }
    if (agent.role === 'public' && agent.magnitude > 15) {
      indirectEffects.push('Sentiment shift triggers regulatory attention')
    }
  })

  return {
    cause: event.description,
    directEffects,
    indirectEffects,
    affectedAgents,
    chain,
  }
}

// ─── Event Categorization ───────────────────────────────────────────────

function categorizeEvent(description: string): EventCategory {
  const lower = description.toLowerCase()
  
  for (const [keyword, category] of Object.entries(EVENT_CATEGORY_MAP)) {
    if (lower.includes(keyword)) {
      return category
    }
  }
  
  return 'market' // default
}

// ─── Market Impact Calculator ───────────────────────────────────────────

export function calculateMarketImpact(
  analysis: CausalAnalysis,
  currentMarketShare: { A: number; B: number },
  currentSentiment: { A: number; B: number }
): MarketImpact {
  let marketShareShift = 0
  let sentimentShift = 0
  let regulatoryRiskShift = 0

  // Aggregate effects from all affected agents
  for (const agent of analysis.affectedAgents) {
    const agentEffects = REACTION_TEMPLATES.filter(r => r.agent === agent.role)
    
    agentEffects.forEach(effect => {
      if (agent.role === 'founder') {
        marketShareShift += effect.marketEffect
        sentimentShift += effect.sentimentEffect
      } else if (agent.role === 'competitor') {
        marketShareShift -= effect.marketEffect // competitor gaining = A losing
        sentimentShift += effect.sentimentEffect / 2
      } else if (agent.role === 'regulator') {
        regulatoryRiskShift += Math.abs(effect.marketEffect)
      } else if (agent.role === 'public') {
        sentimentShift += effect.sentimentEffect * 1.5
      }
    })
  }

  // Scale effects relative to current state (diminishing returns at extremes)
  const scaleMarket = 1 - Math.abs(currentMarketShare.A - 50) / 100
  const scaleSentiment = 1 - Math.abs(currentSentiment.A - 50) / 100

  return {
    marketShareShift: Math.round(marketShareShift * scaleMarket * 10) / 10,
    sentimentShift: Math.round(sentimentShift * scaleSentiment * 10) / 10,
    regulatoryRiskShift: Math.min(30, regulatoryRiskShift),
    resourceShift: analysis.affectedAgents.map(a => ({
      agent: a.role,
      change: Math.round(a.magnitude * 0.3),
    })),
  }
}

// ─── Narrative Generation Helper ────────────────────────────────────────

export function generateEventNarrative(
  event: SimulationEvent,
  analysis: CausalAnalysis
): string {
  const lines: string[] = []
  
  lines.push(`📢 **${event.description}**`)
  lines.push('')
  lines.push('**What happened:**')
  analysis.directEffects.forEach(effect => {
    lines.push(`- ${effect}`)
  })
  
  if (analysis.indirectEffects.length > 0) {
    lines.push('')
    lines.push('**Ripple effects:**')
    analysis.indirectEffects.forEach(effect => {
      lines.push(`- ${effect}`)
    })
  }
  
  if (analysis.chain.length > 0) {
    lines.push('')
    lines.push('**Chain reaction:**')
    analysis.chain.forEach(step => {
      lines.push(`- ${step.from} → ${step.to}: ${step.reaction}`)
    })
  }
  
  return lines.join('\n')
}

// ─── Action-to-Event Converter ─────────────────────────────────────────

export function convertActionToEvent(
  actor: AgentState,
  actionType: ActionType,
  day: number
): SimulationEvent {
  const impact = ACTION_IMPACTS[actionType]
  
  return {
    id: `evt_action_${Date.now()}`,
    day,
    type: 'agent_action',
    trigger: `${actor.name} executes ${impact.label}`,
    description: `${actor.name} ${impact.description.toLowerCase()}`,
    involvedAgents: [actor.role],
    marketImpact: {
      marketShareShift: impact.marketShareEffect,
      sentimentShift: impact.sentimentEffect,
      regulatoryRiskShift: impact.regulatoryRiskEffect,
      resourceShift: [{
        agent: actor.role,
        change: -impact.resourceCost,
      }],
    },
    narrative: generateActionNarrative(actor, actionType, impact),
  }
}

function generateActionNarrative(
  actor: AgentState,
  actionType: ActionType,
  impact: typeof ACTION_IMPACTS[ActionType]
): string {
  const actionVerbs: Record<ActionType, string> = {
    launch: 'launched',
    pivot: 'pivoted',
    acquire: 'acquired',
    price_war: 'started a price war',
    hire: 'hired',
    fire: 'laid off',
    PR_campaign: 'ran',
    regulate: 'imposed',
    investigate: 'launched investigation into',
    delay: 'delayed',
    boycott: 'called for boycott of',
    support: 'expressed support for',
    no_action: 'took no action',
  }
  
  return `${actor.name} ${actionVerbs[actionType]} - ${impact.description}. ` +
    `Expected impact: ${impact.marketShareEffect > 0 ? '+' : ''}${impact.marketShareEffect} market share, ` +
    `${impact.sentimentEffect > 0 ? '+' : ''}${impact.sentimentEffect} sentiment.`
}
