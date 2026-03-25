import { NextRequest, NextResponse } from 'next/server'
import { runSimulation } from '@/lib/simulation/dynamics'
import type { Entity } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { entityA: entityAData, entityB: entityBData, timeHorizon = 90, depth = 'balanced' } = body

    if (!entityAData || !entityBData) {
      return NextResponse.json({ error: 'Missing entity data' }, { status: 400 })
    }

    const entityA: Entity = {
      id: entityAData.id || entityAData.name,
      type: entityAData.type || 'repo',
      externalId: entityAData.externalId || entityAData.name,
      name: entityAData.name,
      owner: entityAData.owner,
      description: entityAData.description,
      metrics: entityAData.metrics,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const entityB: Entity = {
      id: entityBData.id || entityBData.name,
      type: entityBData.type || 'repo',
      externalId: entityBData.externalId || entityBData.name,
      name: entityBData.name,
      owner: entityBData.owner,
      description: entityBData.description,
      metrics: entityBData.metrics,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const result = runSimulation({
      entityA,
      entityB,
      timeHorizon,
      depth,
    })

    return NextResponse.json({ result })
  } catch (error) {
    console.error('Simulation error:', error)
    return NextResponse.json({ error: 'Simulation failed' }, { status: 500 })
  }
}