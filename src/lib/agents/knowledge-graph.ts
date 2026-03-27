import type { KnowledgeGraph, KnowledgeNode, KnowledgeEdge, EntityProfile, SimulationEvent } from '@/types/agents'

export class KnowledgeGraphManager {
  private graph: KnowledgeGraph

  constructor() {
    this.graph = { nodes: [], edges: [] }
  }

  // ─── Node Operations ───────────────────────────────────────────────────

  addEntity(entity: EntityProfile): void {
    const existing = this.graph.nodes.find(n => n.id === entity.id)
    if (existing) {
      Object.assign(existing.data, entity)
      return
    }

    this.graph.nodes.push({
      id: entity.id,
      type: 'entity',
      label: entity.name,
      data: entity,
      connections: [],
    })
  }

  addEvent(event: SimulationEvent): void {
    const node: KnowledgeNode = {
      id: event.id,
      type: 'event',
      label: event.description.slice(0, 50),
      data: event,
      connections: [],
    }
    this.graph.nodes.push(node)
  }

  addConcept(concept: string): string {
    const id = `concept_${concept.toLowerCase().replace(/\s+/g, '_')}`
    const existing = this.graph.nodes.find(n => n.id === id)
    if (existing) return id

    this.graph.nodes.push({
      id,
      type: 'concept',
      label: concept,
      data: concept,
      connections: [],
    })
    return id
  }

  // ─── Edge Operations ──────────────────────────────────────────────────

  addRelationship(fromId: string, toId: string, relationship: KnowledgeEdge['relationship'], strength: number = 1): void {
    const existing = this.graph.edges.find(
      e => e.fromId === fromId && e.toId === toId
    )
    if (existing) {
      existing.strength = Math.max(existing.strength, strength)
      return
    }

    this.graph.edges.push({
      id: `edge_${fromId}_${toId}_${relationship}`,
      fromId,
      toId,
      relationship,
      strength,
    })

    this.addNodeConnection(fromId, toId)
  }

  private addNodeConnection(nodeId: string, connectedId: string): void {
    const node = this.graph.nodes.find(n => n.id === nodeId)
    if (node && !node.connections.includes(connectedId)) {
      node.connections.push(connectedId)
    }
  }

  // ─── Entity Relationship Helpers ─────────────────────────────────────

  connectEntities(entityAId: string, entityBId: string, relationship: 'competes_with' | 'partners_with' | 'owns'): void {
    this.addRelationship(entityAId, entityBId, relationship)
    if (relationship === 'competes_with') {
      this.addRelationship(entityBId, entityAId, 'competes_with')
    } else if (relationship === 'partners_with') {
      this.addRelationship(entityBId, entityAId, 'partners_with')
    }
  }

  // ─── Query Operations ───────────────────────────────────────────────

  getEntity(id: string): KnowledgeNode | undefined {
    return this.graph.nodes.find(n => n.id === id && n.type === 'entity')
  }

  getRelatedEntities(entityId: string): KnowledgeNode[] {
    const node = this.graph.nodes.find(n => n.id === entityId)
    if (!node) return []

    return node.connections
      .map(connId => this.graph.nodes.find(n => n.id === connId))
      .filter((n): n is KnowledgeNode => n !== undefined && n.type === 'entity')
  }

  getRelationship(fromId: string, toId: string): KnowledgeEdge | undefined {
    return this.graph.edges.find(e => e.fromId === fromId && e.toId === toId)
  }

  getEventsAffecting(entityId: string): KnowledgeNode[] {
    return this.graph.nodes.filter(
      n => n.type === 'event' && 
           n.connections.includes(entityId)
    )
  }

  // ─── Graph Export/Import ─────────────────────────────────────────────

  export(): KnowledgeGraph {
    return JSON.parse(JSON.stringify(this.graph))
  }

  import(graph: KnowledgeGraph): void {
    this.graph = graph
  }

  // ─── Visualization Helpers ─────────────────────────────────────────────

  getAdjacencyList(): Map<string, string[]> {
    const adj = new Map<string, string[]>()
    
    for (const node of this.graph.nodes) {
      adj.set(node.id, [...node.connections])
    }
    
    return adj
  }

  findPath(fromId: string, toId: string): string[] | null {
    const visited = new Set<string>()
    const queue: string[][] = [[fromId]]

    while (queue.length > 0) {
      const path = queue.shift()!
      const current = path[path.length - 1]

      if (current === toId) {
        return path
      }

      if (visited.has(current)) continue
      visited.add(current)

      const node = this.graph.nodes.find(n => n.id === current)
      if (node) {
        for (const connId of node.connections) {
          if (!visited.has(connId)) {
            queue.push([...path, connId])
          }
        }
      }
    }

    return null
  }

  // ─── Analysis ───────────────────────────────────────────────────────

  getInfluenceScore(entityId: string): number {
    const node = this.graph.nodes.find(n => n.id === entityId)
    if (!node) return 0

    let score = 0
    for (const edge of this.graph.edges) {
      if (edge.fromId === entityId) {
        score += edge.strength
      }
    }
    return score
  }

  getCompetitors(entityId: string): KnowledgeNode[] {
    const related = this.getRelatedEntities(entityId)
    return related.filter(n => {
      const edge = this.getRelationship(entityId, n.id)
      return edge?.relationship === 'competes_with'
    })
  }

  getPartners(entityId: string): KnowledgeNode[] {
    const related = this.getRelatedEntities(entityId)
    return related.filter(n => {
      const edge = this.getRelationship(entityId, n.id)
      return edge?.relationship === 'partners_with'
    })
  }
}

export const createKnowledgeGraph = (): KnowledgeGraphManager => {
  return new KnowledgeGraphManager()
}
