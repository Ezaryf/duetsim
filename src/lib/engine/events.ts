import type { ForgeEvent, EventCategory } from '@/types'

// ─── Event Templates ─────────────────────────────────────────────────────────

export interface EventTemplate {
  label: string
  description: string
  category: EventCategory
  defaultImpact: number
  defaultTarget: 'A' | 'B' | 'both'
  icon: string
  keywords: string[]
}

export const EVENT_TEMPLATES: EventTemplate[] = [
  // Funding
  {
    label: 'Receives major funding',
    description: 'Secures a significant funding round',
    category: 'funding',
    defaultImpact: 65,
    defaultTarget: 'A',
    icon: '💰',
    keywords: ['funding', 'invest', 'raise', 'capital', 'series', 'round', 'million', 'billion', '$'],
  },
  {
    label: 'Funding runs dry',
    description: 'Fails to secure next funding round',
    category: 'funding',
    defaultImpact: -55,
    defaultTarget: 'A',
    icon: '📉',
    keywords: ['burn', 'runway', 'bankrupt', 'cash', 'out of money'],
  },
  // Launch
  {
    label: 'Major product launch',
    description: 'Launches a significant new product or feature',
    category: 'launch',
    defaultImpact: 50,
    defaultTarget: 'A',
    icon: '🚀',
    keywords: ['launch', 'release', 'ship', 'announce', 'unveil', 'new product', 'v2'],
  },
  {
    label: 'Surprise feature drop',
    description: 'Unexpected feature release disrupts the market',
    category: 'feature',
    defaultImpact: 40,
    defaultTarget: 'A',
    icon: '⚡',
    keywords: ['feature', 'surprise', 'drop', 'update', 'upgrade'],
  },
  // Scandal
  {
    label: 'Data breach exposed',
    description: 'Major security breach becomes public',
    category: 'scandal',
    defaultImpact: -70,
    defaultTarget: 'A',
    icon: '🔓',
    keywords: ['breach', 'hack', 'leak', 'security', 'exposed', 'data'],
  },
  {
    label: 'Leadership scandal',
    description: 'Executive misconduct becomes public',
    category: 'scandal',
    defaultImpact: -60,
    defaultTarget: 'A',
    icon: '🔥',
    keywords: ['scandal', 'ceo', 'fired', 'misconduct', 'resign', 'controversy'],
  },
  // Policy & Regulation
  {
    label: 'Favorable regulation passes',
    description: 'Government regulation benefits the entity',
    category: 'regulation',
    defaultImpact: 45,
    defaultTarget: 'A',
    icon: '📜',
    keywords: ['regulation', 'law', 'policy', 'approve', 'legal', 'compliance'],
  },
  {
    label: 'Regulatory crackdown',
    description: 'Government imposes strict new regulations',
    category: 'regulation',
    defaultImpact: -50,
    defaultTarget: 'both',
    icon: '⚖️',
    keywords: ['crackdown', 'ban', 'restrict', 'antitrust', 'fine', 'penalty'],
  },
  // Backlash
  {
    label: 'Public backlash erupts',
    description: 'Social media backlash causes reputation damage',
    category: 'backlash',
    defaultImpact: -45,
    defaultTarget: 'A',
    icon: '😡',
    keywords: ['backlash', 'boycott', 'cancel', 'outrage', 'protest', 'angry'],
  },
  // Viral
  {
    label: 'Goes viral on social media',
    description: 'Massive organic reach and attention',
    category: 'viral',
    defaultImpact: 55,
    defaultTarget: 'A',
    icon: '📱',
    keywords: ['viral', 'trending', 'famous', 'creator', 'influencer', 'featured'],
  },
  {
    label: 'Featured by major creator',
    description: 'A prominent figure endorses or covers the entity',
    category: 'viral',
    defaultImpact: 50,
    defaultTarget: 'A',
    icon: '🌟',
    keywords: ['featured', 'endorsed', 'review', 'spotlight', 'youtube', 'podcast'],
  },
  // Acquisition
  {
    label: 'Acquisition offer',
    description: 'Receives a significant acquisition offer',
    category: 'acquisition',
    defaultImpact: 30,
    defaultTarget: 'A',
    icon: '🤝',
    keywords: ['acquire', 'buy', 'merge', 'takeover', 'acquisition'],
  },
  // Pivot
  {
    label: 'Strategic pivot',
    description: 'Fundamentally changes business direction',
    category: 'pivot',
    defaultImpact: 20,
    defaultTarget: 'A',
    icon: '🔄',
    keywords: ['pivot', 'rebrand', 'restructure', 'new direction', 'transform'],
  },
]

// ─── Quick Inject Categories ─────────────────────────────────────────────────

export const QUICK_INJECT_CATEGORIES: { category: EventCategory; label: string; icon: string }[] = [
  { category: 'funding', label: 'Funding', icon: '💰' },
  { category: 'scandal', label: 'Scandal', icon: '🔥' },
  { category: 'launch', label: 'Launch', icon: '🚀' },
  { category: 'regulation', label: 'Policy', icon: '⚖️' },
  { category: 'backlash', label: 'Backlash', icon: '😡' },
  { category: 'viral', label: 'Viral', icon: '📱' },
]

// ─── Event Matching ──────────────────────────────────────────────────────────

export function matchEventFromText(text: string): EventTemplate | null {
  const lower = text.toLowerCase()

  let bestMatch: EventTemplate | null = null
  let bestScore = 0

  for (const template of EVENT_TEMPLATES) {
    let score = 0
    for (const keyword of template.keywords) {
      if (lower.includes(keyword)) {
        score += keyword.length // longer keyword matches are worth more
      }
    }
    if (score > bestScore) {
      bestScore = score
      bestMatch = template
    }
  }

  return bestScore > 0 ? bestMatch : null
}

// ─── Event Creation ──────────────────────────────────────────────────────────

export function createForgeEvent(
  text: string,
  day: number,
  target: 'A' | 'B' | 'both' = 'A',
  overrides?: Partial<ForgeEvent>
): ForgeEvent {
  const matched = matchEventFromText(text)

  return {
    id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    label: matched?.label || text.slice(0, 60),
    description: text,
    impact: matched?.defaultImpact || 30,
    targetEntity: target,
    day,
    category: matched?.category || 'custom',
    icon: matched?.icon || '⚡',
    stateChange: overrides?.stateChange,
    probability: overrides?.probability,
    createdAt: new Date().toISOString(),
    ...overrides,
  }
}

// ─── Impact Calculator ───────────────────────────────────────────────────────

export function calculateEventImpact(
  event: ForgeEvent,
  currentScoreA: number,
  currentScoreB: number
): { deltaA: number; deltaB: number } {
  const magnitude = Math.abs(event.impact) / 100
  const direction = event.impact > 0 ? 1 : -1

  // Impact scales with the inverse of current score (diminishing returns at high scores)
  const scaleA = 1 - currentScoreA / 150
  const scaleB = 1 - currentScoreB / 150

  let deltaA = 0
  let deltaB = 0

  switch (event.targetEntity) {
    case 'A':
      deltaA = direction * magnitude * 25 * scaleA
      deltaB = -direction * magnitude * 8 * scaleB // smaller inverse effect
      break
    case 'B':
      deltaB = direction * magnitude * 25 * scaleB
      deltaA = -direction * magnitude * 8 * scaleA
      break
    case 'both':
      deltaA = direction * magnitude * 20 * scaleA
      deltaB = direction * magnitude * 20 * scaleB
      break
  }

  // Add slight randomness
  deltaA += (Math.random() - 0.5) * 5
  deltaB += (Math.random() - 0.5) * 5

  return { deltaA, deltaB }
}
