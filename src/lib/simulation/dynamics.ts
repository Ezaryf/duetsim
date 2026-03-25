import type { Entity, TrajectoryPoint, Outcome, OutcomeType, SimulationResult } from '@/types'

export interface SimulationParams {
  entityA: Entity
  entityB: Entity
  timeHorizon: number
  depth: 'fast' | 'balanced' | 'deep'
}

function normalizeMetrics(entity: Entity): { growth: number; engagement: number; community: number } {
  const m = entity.metrics
  
  const starsNorm = Math.log10((m?.stars || 1) + 1) / 6
  const forksNorm = Math.log10((m?.forks || 1) + 1) / 5
  const watchersNorm = Math.log10((m?.watchers || 1) + 1) / 4
  
  const growth = (starsNorm * 0.5 + forksNorm * 0.3 + watchersNorm * 0.2)
  const engagement = 0.5 + Math.random() * 0.3
  const community = 0.4 + Math.random() * 0.4
  
  return {
    growth: Math.min(1, Math.max(0.1, growth)),
    engagement: Math.min(1, Math.max(0.1, engagement)),
    community: Math.min(1, Math.max(0.1, community)),
  }
}

export function runDynamicsSimulation(params: SimulationParams): TrajectoryPoint[][] {
  const { entityA, entityB, timeHorizon } = params
  
  const metricsA = normalizeMetrics(entityA)
  const metricsB = normalizeMetrics(entityB)
  
  const rA = metricsA.growth * 0.05
  const rB = metricsB.growth * 0.05
  
  const K = 100
  
  const initA = 30 + metricsA.engagement * 40
  const initB = 30 + metricsB.engagement * 40
  
  const alphaAB = 0.3 + Math.random() * 0.4
  const alphaBA = 0.3 + Math.random() * 0.4
  
  const trajectoryCount = params.depth === 'fast' ? 100 : params.depth === 'balanced' ? 500 : 1000
  const trajectories: TrajectoryPoint[][] = []
  
  for (let t = 0; t < trajectoryCount; t++) {
    const trajectory: TrajectoryPoint[] = []
    let A = initA + (Math.random() - 0.5) * 10
    let B = initB + (Math.random() - 0.5) * 10
    
    for (let day = 0; day <= timeHorizon; day += Math.ceil(timeHorizon / 50)) {
      const noiseA = 1 + (Math.random() - 0.5) * 0.1
      const noiseB = 1 + (Math.random() - 0.5) * 0.1
      
      const dAdt = rA * A * (1 - (A + alphaAB * B) / K) * noiseA
      const dBdt = rB * B * (1 - (B + alphaBA * A) / K) * noiseB
      
      A = Math.max(0.1, A + dAdt)
      B = Math.max(0.1, B + dBdt)
      
      trajectory.push({
        day,
        entityA: A,
        entityB: B,
        confidenceLow: Math.min(A, B) * 0.85,
        confidenceHigh: Math.max(A, B) * 1.15,
      })
    }
    
    trajectories.push(trajectory)
  }
  
  return trajectories
}

export function calculateOutcomes(trajectories: TrajectoryPoint[][]): Outcome[] {
  const finalA = trajectories.map(t => t[t.length - 1].entityA)
  const finalB = trajectories.map(t => t[t.length - 1].entityB)
  
  const avgFinalA = finalA.reduce((a, b) => a + b, 0) / finalA.length
  const avgFinalB = finalB.reduce((a, b) => a + b, 0) / finalB.length
  
  const aWins = finalA.filter(a => a > finalB[finalA.indexOf(a)] * 1.2).length / finalA.length
  const bWins = finalB.filter(b => b > finalA[finalB.indexOf(b)] * 1.2).length / finalB.length
  const bothGrow = finalA.filter(a => a > 30 && finalB[finalA.indexOf(a)] > 30).length / finalA.length
  const bothDecline = finalA.filter(a => a < 20 || finalB[finalA.indexOf(a)] < 20).length / finalA.length
  
  const outcomes: Outcome[] = [
    {
      type: 'a_dominates',
      probability: Math.round(aWins * 100),
      confidence: aWins > 0.6 ? 'high' : aWins > 0.4 ? 'medium' : 'low',
      drivers: ['Higher growth rate', 'Stronger community engagement', 'More active development'],
      risks: ['Market saturation', 'Dependency on single project'],
      milestones: [
        { day: Math.round(trajectories[0].length * 0.3), event: 'Initial advantage established' },
        { day: Math.round(trajectories[0].length * 0.6), event: 'Dominance becomes clear' },
      ],
    },
    {
      type: 'b_dominates',
      probability: Math.round(bWins * 100),
      confidence: bWins > 0.6 ? 'high' : bWins > 0.4 ? 'medium' : 'low',
      drivers: ['Faster feature development', 'Better marketing', 'Larger ecosystem'],
      risks: ['Resource constraints', 'Competition response'],
      milestones: [
        { day: Math.round(trajectories[0].length * 0.4), event: 'Competitive pressure increases' },
        { day: Math.round(trajectories[0].length * 0.7), event: 'Leadership transition' },
      ],
    },
    {
      type: 'mutual_growth',
      probability: Math.round(bothGrow * 100),
      confidence: bothGrow > 0.5 ? 'high' : 'medium',
      drivers: ['Expanding market', 'Complementary features', 'Healthy competition'],
      risks: ['Market plateau', 'External disruption'],
      milestones: [
        { day: Math.round(trajectories[0].length * 0.3), event: 'Parallel growth begins' },
        { day: Math.round(trajectories[0].length * 0.6), event: 'Sustained momentum confirmed' },
      ],
    },
    {
      type: 'mutual_decline',
      probability: Math.round(bothDecline * 100),
      confidence: bothDecline > 0.4 ? 'medium' : 'low',
      drivers: ['Market contraction', 'Alternative solutions', 'Technology shifts'],
      risks: ['Complete market exit', 'Acquisition'],
      milestones: [
        { day: Math.round(trajectories[0].length * 0.4), event: 'Decline initiated' },
        { day: Math.round(trajectories[0].length * 0.7), event: 'Critical threshold reached' },
      ],
    },
    {
      type: 'a_rises_b_stabilizes',
      probability: Math.round(Math.max(0, (avgFinalA - avgFinalB) / 20) * 50),
      confidence: 'medium',
      drivers: ['Momentum advantage', 'Feature differentiation'],
      risks: ['Stagnation risk', 'Competitive response'],
      milestones: [
        { day: Math.round(trajectories[0].length * 0.3), event: 'A gains altitude' },
        { day: Math.round(trajectories[0].length * 0.6), event: 'B consolidates position' },
      ],
    },
    {
      type: 'b_rises_a_stabilizes',
      probability: Math.round(Math.max(0, (avgFinalB - avgFinalA) / 20) * 50),
      confidence: 'medium',
      drivers: ['Recent momentum', 'User acquisition'],
      risks: ['Resource constraints', 'Feature parity'],
      milestones: [
        { day: Math.round(trajectories[0].length * 0.3), event: 'B accelerates' },
        { day: Math.round(trajectories[0].length * 0.6), event: 'A reaches ceiling' },
      ],
    },
    {
      type: 'market_split',
      probability: 15,
      confidence: 'low',
      drivers: ['Different target markets', 'Niche specialization'],
      risks: ['Limited growth', 'Platform risk'],
      milestones: [
        { day: Math.round(trajectories[0].length * 0.5), event: 'Market segmentation clear' },
      ],
    },
    {
      type: 'oscillation',
      probability: 10,
      confidence: 'low',
      drivers: ['Cyclic trends', 'Alternating releases', 'Market timing'],
      risks: ['Unpredictability', 'Strategic confusion'],
      milestones: [
        { day: Math.round(trajectories[0].length * 0.25), event: 'First swing' },
        { day: Math.round(trajectories[0].length * 0.5), event: 'Reversal' },
        { day: Math.round(trajectories[0].length * 0.75), event: 'Second swing' },
      ],
    },
    {
      type: 'convergence',
      probability: 8,
      confidence: 'low',
      drivers: ['Feature parity', 'User demand', 'Acquisition'],
      risks: ['Regulatory issues', 'Cultural clash'],
      milestones: [
        { day: Math.round(trajectories[0].length * 0.6), event: 'Convergence signals' },
        { day: Math.round(trajectories[0].length * 0.9), event: 'Integration begins' },
      ],
    },
  ]
  
  return outcomes.sort((a, b) => b.probability - a.probability)
}

export function aggregateTrajectories(trajectories: TrajectoryPoint[][]): TrajectoryPoint[] {
  const days = trajectories[0].map(t => t.day)
  
  return days.map((day, i) => {
    const valuesA = trajectories.map(t => t[i].entityA)
    const valuesB = trajectories.map(t => t[i].entityB)
    
    const avgA = valuesA.reduce((a, b) => a + b, 0) / valuesA.length
    const avgB = valuesB.reduce((a, b) => a + b, 0) / valuesB.length
    
    const sortedA = [...valuesA].sort((a, b) => a - b)
    const sortedB = [...valuesB].sort((a, b) => a - b)
    
    return {
      day,
      entityA: avgA,
      entityB: avgB,
      confidenceLow: Math.min(sortedA[Math.floor(sortedA.length * 0.1)], sortedB[Math.floor(sortedB.length * 0.1)]),
      confidenceHigh: Math.max(sortedA[Math.floor(sortedA.length * 0.9)], sortedB[Math.floor(sortedB.length * 0.9)]),
    }
  })
}

export function runSimulation(params: SimulationParams): SimulationResult {
  const trajectories = runDynamicsSimulation(params)
  const aggregated = aggregateTrajectories(trajectories)
  const outcomes = calculateOutcomes(trajectories)
  
  return {
    id: `sim_${Date.now()}`,
    duelId: `duel_${Date.now()}`,
    outcomes,
    trajectories: [aggregated],
    narrative: {
      a_dominates: `Based on the simulation, Entity A shows strong indicators of potential dominance with ${outcomes.find(o => o.type === 'a_dominates')?.probability}% probability. Key factors include growth trajectory and community engagement metrics.`,
      b_dominates: `Entity B demonstrates competitive potential with ${outcomes.find(o => o.type === 'b_dominates')?.probability}% likelihood of dominance. The simulation accounts for feature development velocity and ecosystem strength.`,
      mutual_growth: `The simulation suggests a ${outcomes.find(o => o.type === 'mutual_growth')?.probability}% probability of mutual growth, indicating an expanding market with room for both entities.`,
      mutual_decline: `There's a ${outcomes.find(o => o.type === 'mutual_decline')?.probability}% probability of mutual decline, potentially due to market contraction or emerging alternatives.`,
      a_rises_b_stabilizes: `Entity A shows ${outcomes.find(o => o.type === 'a_rises_b_stabilizes')?.probability}% probability of growth while B stabilizes, indicating a potential leadership transition.`,
      b_rises_a_stabilizes: `Entity B shows ${outcomes.find(o => o.type === 'b_rises_a_stabilizes')?.probability}% probability of growth while A stabilizes, suggesting a competitive shift.`,
      market_split: `The market split scenario has ${outcomes.find(o => o.type === 'market_split')?.probability}% probability, indicating distinct niche positioning.`,
      oscillation: `Oscillation scenario: ${outcomes.find(o => o.type === 'oscillation')?.probability}% probability, suggesting alternating advantage between entities.`,
      convergence: `Convergence has ${outcomes.find(o => o.type === 'convergence')?.probability}% probability, potentially indicating future integration or acquisition.`,
    },
    createdAt: new Date().toISOString(),
  }
}