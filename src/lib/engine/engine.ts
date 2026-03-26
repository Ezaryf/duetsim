import type {
  Entity,
  ForgeEvent,
  TimelineNode,
  CausalEdge,
  Branch,
  Simulation,
} from '@/types'
import { calculateEventImpact } from './events'

// ─── ID Generators ───────────────────────────────────────────────────────────

function uid(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

// ─── Lotka-Volterra Core ─────────────────────────────────────────────────────

function normalizeEntityStrength(entity: Entity): number {
  const m = entity.metrics
  if (!m) return 50

  const starsSig = Math.log10((m.stars || 1) + 1) / 6
  const forksSig = Math.log10((m.forks || 1) + 1) / 5
  const watchSig = Math.log10((m.watchers || 1) + 1) / 4

  return Math.min(85, Math.max(25, (starsSig * 0.5 + forksSig * 0.3 + watchSig * 0.2) * 100))
}

interface DynamicsState {
  a: number
  b: number
}

function stepDynamics(
  state: DynamicsState,
  rA: number,
  rB: number,
  alphaAB: number,
  alphaBA: number,
  K: number,
  noise: number = 0.05
): DynamicsState {
  const nA = 1 + (Math.random() - 0.5) * noise * 2
  const nB = 1 + (Math.random() - 0.5) * noise * 2

  const dA = rA * state.a * (1 - (state.a + alphaAB * state.b) / K) * nA
  const dB = rB * state.b * (1 - (state.b + alphaBA * state.a) / K) * nB

  return {
    a: Math.max(2, Math.min(98, state.a + dA)),
    b: Math.max(2, Math.min(98, state.b + dB)),
  }
}

// ─── State Change Description Generator ──────────────────────────────────────

function describeStateChange(
  prevA: number,
  prevB: number,
  newA: number,
  newB: number,
  event?: ForgeEvent
): { stateChange: string; reason: string } {
  if (event?.stateChange) {
    return { stateChange: event.stateChange, reason: event.description }
  }

  const deltaA = newA - prevA
  const deltaB = newB - prevB

  if (event) {
    return describeEventEffect(event, deltaA, deltaB)
  }

  return describeGenericStateChange(deltaA, deltaB)
}

function describeEventEffect(event: ForgeEvent, deltaA: number, deltaB: number) {
  let effect = 'stabilizing'
  if (deltaA > 5) effect = 'accelerating growth'
  else if (deltaA < -5) effect = 'momentum loss'

  let bEffect = 'holding steady'
  if (deltaB > 5) bEffect = 'competitive surge'
  else if (deltaB < -5) bEffect = 'decline pressure'

  return {
    stateChange: `${event.label} → ${effect}`,
    reason: `${event.description} triggers ${effect} for Entity A and ${bEffect} for Entity B`,
  }
}

function describeGenericStateChange(deltaA: number, deltaB: number) {
  if (Math.abs(deltaA) < 1 && Math.abs(deltaB) < 1) {
    return { stateChange: 'equilibrium', reason: 'Both entities maintaining current trajectory' }
  }
  if (deltaA > 3 && deltaB > 3) {
    return { stateChange: 'mutual growth', reason: 'Market expansion benefits both entities' }
  }
  if (deltaA > 3 && deltaB < -3) {
    return { stateChange: 'A gaining, B declining', reason: 'Competitive pressure shifting toward A' }
  }
  if (deltaB > 3 && deltaA < -3) {
    return { stateChange: 'B gaining, A declining', reason: 'Competitive pressure shifting toward B' }
  }
  if (deltaA > 0) {
    return { stateChange: 'A strengthening', reason: 'Entity A showing positive momentum' }
  }
  return { stateChange: 'B strengthening', reason: 'Entity B showing positive momentum' }
}

// ─── Branch Generation ───────────────────────────────────────────────────────

function generateBranchTimeline(
  entityA: Entity,
  entityB: Entity,
  totalDays: number,
  branchId: string,
  bias: 'neutral' | 'A-favored' | 'B-favored',
  existingEvents: ForgeEvent[] = []
): TimelineNode[] {
  const strengthA = normalizeEntityStrength(entityA)
  const strengthB = normalizeEntityStrength(entityB)

  let rA = 0.04
  if (bias === 'A-favored') rA += 0.02
  else if (bias === 'B-favored') rA -= 0.01

  let rB = 0.04
  if (bias === 'B-favored') rB += 0.02
  else if (bias === 'A-favored') rB -= 0.01

  const alphaAB = 0.3 + Math.random() * 0.3 + (bias === 'B-favored' ? 0.15 : 0)
  const alphaBA = 0.3 + Math.random() * 0.3 + (bias === 'A-favored' ? 0.15 : 0)

  const K = 100
  const nodes: TimelineNode[] = []
  let state: DynamicsState = { a: strengthA, b: strengthB }
  const stepSize = Math.max(1, Math.ceil(totalDays / 30))

  for (let day = 0; day <= totalDays; day += stepSize) {
    const prev = { ...state }

    // Check for events at this day
    const dayEvent = existingEvents.find(e => Math.abs(e.day - day) < stepSize / 2)
    if (dayEvent) {
      const impact = calculateEventImpact(dayEvent, state.a, state.b)
      state.a = Math.max(2, Math.min(98, state.a + impact.deltaA))
      state.b = Math.max(2, Math.min(98, state.b + impact.deltaB))
    }

    state = stepDynamics(state, rA, rB, alphaAB, alphaBA, K)

    const { stateChange, reason } = describeStateChange(prev.a, prev.b, state.a, state.b, dayEvent)

    nodes.push({
      id: `node_${branchId}_${day}`,
      day,
      parentId: nodes.length > 0 ? nodes.at(-1)!.id : null,
      branchId,
      entityAScore: Math.round(state.a * 10) / 10,
      entityBScore: Math.round(state.b * 10) / 10,
      confidenceA: Math.max(0.2, Math.min(1, 0.5 + (state.a - state.b) / 100)),
      confidenceB: Math.max(0.2, Math.min(1, 0.5 + (state.b - state.a) / 100)),
      triggerEvent: dayEvent,
      stateChange,
      probabilityShift: Math.round((state.a - state.b) - (prev.a - prev.b)),
      reason,
    })
  }

  return nodes
}

// ─── Causal Graph Builder ────────────────────────────────────────────────────

export function buildCausalGraph(branches: Branch[]): CausalEdge[] {
  const edges: CausalEdge[] = []

  for (const branch of branches) {
    addSequentialEdges(branch, edges)
    addCrossBranchEdges(branch, branches, edges)
  }

  return edges
}

function addSequentialEdges(branch: Branch, edges: CausalEdge[]) {
  for (let i = 0; i < branch.nodes.length - 1; i++) {
    const from = branch.nodes[i]
    const to = branch.nodes[i + 1]
    const shift = Math.abs(to.probabilityShift)
    const strength = Math.min(1, shift / 15)

    if (strength > 0.1) {
      edges.push({
        id: `edge_${from.id}_${to.id}`,
        fromNodeId: from.id,
        toNodeId: to.id,
        label: to.triggerEvent?.label || to.stateChange,
        strength,
      })
    }
  }
}

function addCrossBranchEdges(branch: Branch, allBranches: Branch[], edges: CausalEdge[]) {
  if (branch.forkDay === null || !branch.parentBranchId) return

  const forkNode = branch.nodes.find(n => n.day === branch.forkDay)
  if (!forkNode) return

  const parentBranch = allBranches.find(b => b.id === branch.parentBranchId)
  const parentForkNode = parentBranch?.nodes.find(n => n.day === branch.forkDay)

  if (parentForkNode) {
    edges.push({
      id: `edge_fork_${parentForkNode.id}_${forkNode.id}`,
      fromNodeId: parentForkNode.id,
      toNodeId: forkNode.id,
      label: 'branch divergence',
      strength: 0.8,
    })
  }
}

// ─── Create Simulation ───────────────────────────────────────────────────────

export function createSimulation(
  entityA: Entity,
  entityB: Entity,
  totalDays: number = 90
): Simulation {
  const biases: Array<{ name: string; bias: 'neutral' | 'A-favored' | 'B-favored'; color: string; prob: number }> = [
    { name: 'Baseline', bias: 'neutral', color: '#6366f1', prob: 50 },
    { name: `${entityA.name} Surge`, bias: 'A-favored', color: '#06b6d4', prob: 25 },
    { name: `${entityB.name} Surge`, bias: 'B-favored', color: '#f43f5e', prob: 25 },
  ]

  const branches: Branch[] = biases.map((b, i) => {
    const branchId = `branch_${uid()}`
    return {
      id: branchId,
      name: b.name,
      color: b.color,
      nodes: generateBranchTimeline(entityA, entityB, totalDays, branchId, b.bias),
      events: [],
      probability: b.prob,
      isActive: i === 0,
      parentBranchId: null,
      forkDay: null,
    }
  })

  const causalEdges = buildCausalGraph(branches)

  return {
    id: `sim_${uid()}`,
    entityA,
    entityB,
    branches,
    causalEdges,
    activeBranchId: branches[0].id,
    totalDays,
    createdAt: new Date().toISOString(),
  }
}

// ─── Inject Event ────────────────────────────────────────────────────────────

export function injectEvent(
  simulation: Simulation,
  event: ForgeEvent
): Simulation {
  const activeBranch = simulation.branches.find(b => b.id === simulation.activeBranchId)
  if (!activeBranch) return simulation

  // Create a new fork branch from the event injection point
  const forkBranchId = `branch_${uid()}`
  const allEvents = [...activeBranch.events, event]

  // Regenerate from the event day
  const newNodes = generateBranchTimeline(
    simulation.entityA,
    simulation.entityB,
    simulation.totalDays,
    forkBranchId,
    'neutral',
    allEvents
  )

  // Also regenerate opposite-bias branch
  const altBranchId = `branch_${uid()}`
  const altBias = event.targetEntity === 'A' ? 'B-favored' : 'A-favored'
  const altNodes = generateBranchTimeline(
    simulation.entityA,
    simulation.entityB,
    simulation.totalDays,
    altBranchId,
    altBias,
    allEvents
  )

  const newForkBranch: Branch = {
    id: forkBranchId,
    name: `After: ${event.label}`,
    color: (() => {
      if (event.targetEntity === 'A') return '#06b6d4'
      if (event.targetEntity === 'B') return '#f43f5e'
      return '#8b5cf6'
    })(),
    nodes: newNodes,
    events: allEvents,
    probability: event.probability || 40,
    isActive: true,
    parentBranchId: activeBranch.id,
    forkDay: event.day,
  }

  const altForkBranch: Branch = {
    id: altBranchId,
    name: `Counter: ${event.label}`,
    color: event.targetEntity === 'A' ? '#f43f5e' : '#06b6d4',
    nodes: altNodes,
    events: allEvents,
    probability: Math.max(5, 100 - (event.probability || 80)),
    isActive: false,
    parentBranchId: activeBranch.id,
    forkDay: event.day,
  }

  // Redistribute probabilities
  const updatedBranches = simulation.branches.map(b => ({
    ...b,
    isActive: false,
    probability: Math.max(5, Math.round(b.probability * 0.65)),
  }))

  const allBranches = [...updatedBranches, newForkBranch, altForkBranch]

  // Normalize probabilities to sum ~100
  const totalProb = allBranches.reduce((sum, b) => sum + b.probability, 0)
  const normalizedBranches = allBranches.map(b => ({
    ...b,
    probability: Math.round((b.probability / totalProb) * 100),
  }))

  const causalEdges = buildCausalGraph(normalizedBranches)

  return {
    ...simulation,
    branches: normalizedBranches,
    causalEdges,
    activeBranchId: forkBranchId,
  }
}

// ─── Get Active Branch Data ──────────────────────────────────────────────────

export function getActiveBranch(simulation: Simulation): Branch | undefined {
  return simulation.branches.find(b => b.id === simulation.activeBranchId)
}

export function getBranchFinalScores(branch: Branch): { scoreA: number; scoreB: number } {
  const lastNode = branch.nodes.at(-1)
  return {
    scoreA: lastNode?.entityAScore || 50,
    scoreB: lastNode?.entityBScore || 50,
  }
}
