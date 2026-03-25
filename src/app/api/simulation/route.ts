import { NextRequest, NextResponse } from 'next/server'
import { createSimulation, injectEvent } from '@/lib/engine/engine'
import { createForgeEvent } from '@/lib/engine/events'
import type { Entity } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { entityA: entityAData, entityB: entityBData, totalDays = 90, event } = body

    if (!entityAData || !entityBData) {
      return NextResponse.json({ error: 'Missing entity data' }, { status: 400 })
    }

    const entityA: Entity = {
      id: entityAData.id || entityAData.name,
      category: entityAData.category || 'repo',
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
      category: entityBData.category || 'repo',
      externalId: entityBData.externalId || entityBData.name,
      name: entityBData.name,
      owner: entityBData.owner,
      description: entityBData.description,
      metrics: entityBData.metrics,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    let simulation = createSimulation(entityA, entityB, totalDays)

    // If an event was provided, inject it
    if (event?.text) {
      const forgeEvent = createForgeEvent(event.text, event.day || 45, event.target || 'A')
      simulation = injectEvent(simulation, forgeEvent)
    }

    return NextResponse.json({ simulation })
  } catch (error) {
    console.error('Simulation error:', error)
    return NextResponse.json({ error: 'Simulation failed' }, { status: 500 })
  }
}