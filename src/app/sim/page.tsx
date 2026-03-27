'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Zap, ArrowRight, Sparkles, GitBranch, Target, Flame, Settings, Play, Pause, RotateCcw, Hand, MessageSquare, BarChart3, Lightbulb, Users, Shield, TrendingUp, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { useSimulationStore } from '@/stores/agentSimulationStore'
import type { EntityProfile, AgentRole, ActionType } from '@/types/agents'

const entityTypes: { id: 'company' | 'product' | 'founder' | 'regulation'; label: string; icon: string }[] = [
  { id: 'company', label: 'Company', icon: '🏢' },
  { id: 'product', label: 'Product', icon: '🚀' },
  { id: 'founder', label: 'Founder', icon: '👤' },
  { id: 'regulation', label: 'Regulation', icon: '⚖️' },
]

const scenarioTemplates = [
  { id: 'startup-war', name: 'Startup vs Incumbent', desc: 'Fast-growing startup disrupts established player', icon: '⚔️' },
  { id: 'platform-battle', name: 'Platform Battle', desc: 'Two platforms compete for ecosystem dominance', icon: '🌐' },
  { id: 'regulatory-standoff', name: 'Regulatory Standoff', desc: 'Company vs government regulation', icon: '⚖️' },
  { id: 'public-crisis', name: 'Public Crisis', desc: 'Company faces public backlash', icon: '🔥' },
]

export default function Simulation() {
  const [entityA, setEntityA] = useState({ name: '', type: 'company' as const, description: '', marketPosition: 50 })
  const [entityB, setEntityB] = useState({ name: '', type: 'company' as const, description: '', marketPosition: 50 })
  const [setupStep, setSetupStep] = useState<'entities' | 'scenario'>('entities')
  const [eventInput, setEventInput] = useState('')
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'inject' | 'narrative' | 'dashboard' | 'strategy'>('inject')
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const { 
    simulation, 
    narratives, 
    recommendations, 
    dashboardMetrics, 
    isRunning, 
    isPaused,
    initializeSimulation, 
    injectEvent, 
    startSimulation, 
    pauseSimulation, 
    resumeSimulation, 
    stepSimulation,
    resetSimulation,
    manualAction 
  } = useSimulationStore()

  useEffect(() => {
    if (!simulation?.events.length || !isRunning) return

    const interval = setInterval(() => {
      stepSimulation()
    }, 2000)

    return () => clearInterval(interval)
  }, [isRunning, simulation?.events.length])

  const handleStart = () => {
    const profileA: EntityProfile = {
      id: `entity_${Date.now()}_a`,
      name: entityA.name || 'Entity A',
      type: entityA.type,
      description: entityA.description,
      marketPosition: 50,
      competitors: [],
      partners: [],
      lastUpdated: new Date().toISOString(),
      metadata: {},
    }

    const profileB: EntityProfile = {
      id: `entity_${Date.now()}_b`,
      name: entityB.name || 'Entity B',
      type: entityB.type,
      description: entityB.description,
      marketPosition: 50,
      competitors: [],
      partners: [],
      lastUpdated: new Date().toISOString(),
      metadata: {},
    }

    initializeSimulation(profileA, profileB, 90)
  }

  const handleInjectEvent = () => {
    if (!eventInput.trim()) return
    injectEvent(eventInput)
    setEventInput('')
  }

  const agentButtons: { role: AgentRole; icon: React.ReactNode; label: string }[] = [
    { role: 'founder', icon: <Users className="w-4 h-4" />, label: 'Founder' },
    { role: 'competitor', icon: <Target className="w-4 h-4" />, label: 'Competitor' },
    { role: 'regulator', icon: <Shield className="w-4 h-4" />, label: 'Regulator' },
    { role: 'public', icon: <TrendingUp className="w-4 h-4" />, label: 'Public' },
  ]

  const actionButtons: { type: ActionType; label: string }[] = [
    { type: 'launch', label: 'Launch' },
    { type: 'price_war', label: 'Price War' },
    { type: 'PR_campaign', label: 'PR Campaign' },
    { type: 'investigate', label: 'Investigate' },
    { type: 'boycott', label: 'Boycott' },
    { type: 'no_action', label: 'Wait' },
  ]

  const agentButtonArray: Array<{ role: AgentRole; icon: React.ReactNode; label: string }> = agentButtons
  const actionButtonArray: Array<{ type: ActionType; label: string }> = actionButtons

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {!simulation ? (
        <SetupPhase
          entityA={entityA}
          entityB={entityB}
          setEntityA={setEntityA}
          setEntityB={setEntityB}
          setupStep={setupStep}
          setSetupStep={setSetupStep}
          selectedScenario={selectedScenario}
          setSelectedScenario={setSelectedScenario}
          handleStart={handleStart}
        />
      ) : (
        <SimulationPhase
          simulation={simulation}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          eventInput={eventInput}
          setEventInput={setEventInput}
          handleInjectEvent={handleInjectEvent}
          narratives={narratives}
          recommendations={recommendations}
          dashboardMetrics={dashboardMetrics}
          isRunning={isRunning}
          isPaused={isPaused}
          startSimulation={startSimulation}
          pauseSimulation={pauseSimulation}
          resumeSimulation={resumeSimulation}
          stepSimulation={stepSimulation}
          resetSimulation={resetSimulation}
          manualAction={manualAction}
          agentButtonArray={agentButtonArray}
          actionButtonArray={actionButtonArray}
        />
      )}
    </div>
  )
}

function SetupPhase({ entityA, entityB, setEntityA, setEntityB, setupStep, setSetupStep, selectedScenario, setSelectedScenario, handleStart }: any) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl w-full"
      >
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text-secondary)] mb-6">
            <Sparkles className="w-3.5 h-3.5 text-[var(--primary)]" />
            AI Agent Conflict Simulator
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            God Mode <span className="text-gradient">Simulation</span>
          </h1>
          <p className="text-[var(--text-secondary)] text-lg max-w-2xl mx-auto">
            Inject events and watch intelligent agents react with strategy
          </p>
        </div>

        <div className="flex justify-center gap-4 mb-8">
          {['entities', 'scenario'].map(step => (
            <button
              key={step}
              onClick={() => setSetupStep(step as any)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                setupStep === step
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border)]'
              }`}
            >
              {step === 'entities' ? 'Setup Entities' : 'Scenarios'}
            </button>
          ))}
        </div>

        {setupStep === 'entities' ? (
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="glass-strong rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4 text-[var(--accent-a)]">Entity A (You)</h3>
              <input
                type="text"
                placeholder="Entity name (e.g., Tesla)"
                value={entityA.name}
                onChange={(e) => setEntityA({ ...entityA, name: e.target.value })}
                className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-4 py-3 mb-3 text-white placeholder:text-[var(--text-muted)]"
              />
              <textarea
                placeholder="Description (optional)"
                value={entityA.description}
                onChange={(e) => setEntityA({ ...entityA, description: e.target.value })}
                className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-4 py-3 text-white placeholder:text-[var(--text-muted)] resize-none"
                rows={2}
              />
            </div>

            <div className="glass-strong rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4 text-[var(--accent-b)]">Entity B (Opponent)</h3>
              <input
                type="text"
                placeholder="Entity name (e.g., Ford)"
                value={entityB.name}
                onChange={(e) => setEntityB({ ...entityB, name: e.target.value })}
                className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-4 py-3 mb-3 text-white placeholder:text-[var(--text-muted)]"
              />
              <textarea
                placeholder="Description (optional)"
                value={entityB.description}
                onChange={(e) => setEntityB({ ...entityB, description: e.target.value })}
                className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-4 py-3 text-white placeholder:text-[var(--text-muted)] resize-none"
                rows={2}
              />
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {scenarioTemplates.map(s => (
              <button
                key={s.id}
                onClick={() => setSelectedScenario(s.id)}
                className={`glass rounded-xl p-4 text-left transition-all ${
                  selectedScenario === s.id ? 'border-[var(--primary)]' : ''
                }`}
              >
                <span className="text-2xl mb-2 block">{s.icon}</span>
                <h4 className="font-semibold mb-1">{s.name}</h4>
                <p className="text-xs text-[var(--text-secondary)]">{s.desc}</p>
              </button>
            ))}
          </div>
        )}

        <div className="text-center">
          <button
            onClick={handleStart}
            disabled={!entityA.name || !entityB.name}
            className="px-10 py-4 rounded-2xl bg-gradient-to-r from-[var(--accent-a)] via-[var(--primary)] to-[var(--accent-b)] text-white font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 mx-auto"
          >
            <Flame className="w-5 h-5" />
            Start Simulation
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
    </div>
  )
}

function SimulationPhase({ simulation, activeTab, setActiveTab, eventInput, setEventInput, handleInjectEvent, narratives, recommendations, dashboardMetrics, isRunning, isPaused, startSimulation, pauseSimulation, resumeSimulation, stepSimulation, resetSimulation, manualAction, agentButtonArray, actionButtonArray }: any) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="glass border-b border-[var(--border)] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-[var(--primary)]" />
            <span className="font-bold">Day {simulation.day}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-[var(--accent-a)]">A: {simulation.marketShare.A.toFixed(1)}%</span>
            <span className="text-[var(--text-muted)]">vs</span>
            <span className="text-[var(--accent-b)]">B: {simulation.marketShare.B.toFixed(1)}%</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isRunning ? (
            <button onClick={startSimulation} className="p-2 rounded-lg bg-green-600/20 text-green-400 hover:bg-green-600/30">
              <Play className="w-5 h-5" />
            </button>
          ) : isPaused ? (
            <button onClick={resumeSimulation} className="p-2 rounded-lg bg-yellow-600/20 text-yellow-400 hover:bg-yellow-600/30">
              <Play className="w-5 h-5" />
            </button>
          ) : (
            <button onClick={pauseSimulation} className="p-2 rounded-lg bg-yellow-600/20 text-yellow-400 hover:bg-yellow-600/30">
              <Pause className="w-5 h-5" />
            </button>
          )}
          <button onClick={stepSimulation} className="p-2 rounded-lg bg-[var(--surface)] text-[var(--text-secondary)] hover:text-white">
            <ArrowRight className="w-5 h-5" />
          </button>
          <button onClick={resetSimulation} className="p-2 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30">
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Agent Panel */}
        <aside className="w-64 glass border-r border-[var(--border)] p-4 hidden lg:block">
          <h3 className="text-sm font-semibold text-[var(--text-muted)] mb-4">AGENTS</h3>
          <div className="space-y-3">
            {agentButtonArray.map(({ role, icon, label }: { role: AgentRole; icon: React.ReactNode; label: string }) => (
              <div key={role} className="glass rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  {icon}
                  <span className="font-medium">{label}</span>
                </div>
                <div className="text-xs text-[var(--text-secondary)]">
                  Resources: {simulation.agents[role].resources}%
                </div>
                <div className="w-full h-1 bg-[var(--bg)] rounded-full mt-1">
                  <div 
                    className="h-full bg-[var(--primary)] rounded-full" 
                    style={{ width: `${simulation.agents[role].resources}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <h3 className="text-sm font-semibold text-[var(--text-muted)] mt-6 mb-4">QUICK ACTIONS</h3>
          <div className="space-y-2">
            {agentButtonArray.map((agent: { role: AgentRole; label: string }) => (
              <div key={agent.role}>
                <div className="text-xs text-[var(--text-muted)] mb-1">{agent.label}</div>
                <div className="flex flex-wrap gap-1">
                  {actionButtonArray.slice(0, 4).map((action: { type: ActionType; label: string }) => (
                    <button
                      key={action.type}
                      onClick={() => manualAction(agent.role, action.type)}
                      className="px-2 py-1 text-xs rounded bg-[var(--surface)] hover:bg-[var(--primary)] hover:text-white transition-colors"
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Main Tabs */}
        <main className="flex-1 flex flex-col">
          <div className="flex border-b border-[var(--border)]">
            {[
              { id: 'inject', icon: <Hand className="w-4 h-4" />, label: 'Inject' },
              { id: 'narrative', icon: <MessageSquare className="w-4 h-4" />, label: 'Narrative' },
              { id: 'dashboard', icon: <BarChart3 className="w-4 h-4" />, label: 'Dashboard' },
              { id: 'strategy', icon: <Lightbulb className="w-4 h-4" />, label: 'Strategy' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-[var(--primary)] border-b-2 border-[var(--primary)]'
                    : 'text-[var(--text-secondary)] hover:text-white'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 p-6 overflow-auto">
            {activeTab === 'inject' && (
              <div className="max-w-2xl mx-auto">
                <div className="glass rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-400" />
                    Inject Event
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] mb-4">
                    Describe an event. All 4 agents will perceive and react to it.
                  </p>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="e.g., 'A major data breach is exposed'"
                      value={eventInput}
                      onChange={(e) => setEventInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleInjectEvent()}
                      className="flex-1 bg-[var(--bg)] border border-[var(--border)] rounded-lg px-4 py-3 text-white placeholder:text-[var(--text-muted)]"
                    />
                    <button
                      onClick={handleInjectEvent}
                      className="px-6 py-3 rounded-lg bg-[var(--primary)] text-white font-medium hover:opacity-90"
                    >
                      Inject
                    </button>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="text-sm font-semibold text-[var(--text-muted)] mb-3">SUGGESTED EVENTS</h4>
                  <div className="flex flex-wrap gap-2">
                    {['Major funding round announced', 'CEO resignation', 'Competitor launches new product', 'Regulatory investigation begins', 'Public boycott starts', 'Surprise acquisition'].map(evt => (
                      <button
                        key={evt}
                        onClick={() => { setEventInput(evt); handleInjectEvent() }}
                        className="px-3 py-1.5 text-sm rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-hover)] transition-colors"
                      >
                        {evt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'narrative' && (
              <div className="max-w-2xl mx-auto">
                <div className="space-y-4">
                  {narratives.length === 0 ? (
                    <div className="text-center text-[var(--text-muted)] py-10">
                      <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No events yet. Inject an event to start the story.</p>
                    </div>
                  ) : (
                    narratives.slice().reverse().map((n: any) => (
                      <motion.div
                        key={n.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass rounded-xl p-4 border-l-4 border-[var(--primary)]"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs text-[var(--text-muted)]">Day {n.day}</span>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${
                            n.emotionalTone === 'positive' ? 'bg-green-600/20 text-green-400' :
                            n.emotionalTone === 'negative' ? 'bg-red-600/20 text-red-400' :
                            n.emotionalTone === 'tense' ? 'bg-orange-600/20 text-orange-400' :
                            'bg-gray-600/20 text-gray-400'
                          }`}>
                            {n.emotionalTone}
                          </span>
                        </div>
                        <h4 className="font-semibold mb-2">{n.title}</h4>
                        <p className="text-sm text-[var(--text-secondary)] whitespace-pre-line">{n.content}</p>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'dashboard' && dashboardMetrics && (
              <div className="max-w-3xl mx-auto">
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div className="glass rounded-xl p-5">
                    <h4 className="text-sm font-semibold text-[var(--text-muted)] mb-3">MARKET SHARE</h4>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-[var(--accent-a)]">A</span>
                          <span>{dashboardMetrics.marketShare.A}%</span>
                        </div>
                        <div className="h-2 bg-[var(--bg)] rounded-full overflow-hidden">
                          <div className="h-full bg-[var(--accent-a)]" style={{ width: `${dashboardMetrics.marketShare.A}%` }} />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-[var(--accent-b)]">B</span>
                          <span>{dashboardMetrics.marketShare.B}%</span>
                        </div>
                        <div className="h-2 bg-[var(--bg)] rounded-full overflow-hidden">
                          <div className="h-full bg-[var(--accent-b)]" style={{ width: `${dashboardMetrics.marketShare.B}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="glass rounded-xl p-5">
                    <h4 className="text-sm font-semibold text-[var(--text-muted)] mb-3">SENTIMENT</h4>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-[var(--accent-a)]">A</span>
                          <span>{dashboardMetrics.sentiment.A}%</span>
                        </div>
                        <div className="h-2 bg-[var(--bg)] rounded-full overflow-hidden">
                          <div className="h-full bg-purple-500" style={{ width: `${dashboardMetrics.sentiment.A}%` }} />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-[var(--accent-b)]">B</span>
                          <span>{dashboardMetrics.sentiment.B}%</span>
                        </div>
                        <div className="h-2 bg-[var(--bg)] rounded-full overflow-hidden">
                          <div className="h-full bg-purple-500" style={{ width: `${dashboardMetrics.sentiment.B}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="glass rounded-xl p-5">
                  <h4 className="text-sm font-semibold text-[var(--text-muted)] mb-3">RESOURCES</h4>
                  <div className="grid grid-cols-4 gap-4">
                    {Object.entries(dashboardMetrics.resourceLevel).map(([agent, value]) => (
                      <div key={agent}>
                        <div className="text-xs text-[var(--text-secondary)] capitalize mb-1">{agent}</div>
                        <div className="h-2 bg-[var(--bg)] rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              (value as number) > 60 ? 'bg-green-500' :
                              (value as number) > 30 ? 'bg-yellow-500' : 'bg-red-500'
                            }`} 
                            style={{ width: `${value}%` }} 
                          />
                        </div>
                        <div className="text-xs mt-1">{(value as number)}%</div>
                      </div>
                    ))}
                  </div>
                </div>

                {dashboardMetrics.majorEvents.length > 0 && (
                  <div className="glass rounded-xl p-5 mt-4">
                    <h4 className="text-sm font-semibold text-[var(--text-muted)] mb-3">RECENT EVENTS</h4>
                    <ul className="space-y-2">
                      {dashboardMetrics.majorEvents.map((evt: string, i: number) => (
                        <li key={i} className="text-sm flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-yellow-500" />
                          {evt}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'strategy' && (
              <div className="max-w-2xl mx-auto">
                <div className="space-y-4">
                  {recommendations.length === 0 ? (
                    <div className="text-center text-[var(--text-muted)] py-10">
                      <Lightbulb className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No recommendations yet. Run the simulation to see strategic advice.</p>
                    </div>
                  ) : (
                    recommendations.map((rec: any) => (
                      <motion.div
                        key={rec.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="glass rounded-xl p-4"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-0.5 text-xs rounded-full ${
                            rec.priority === 'high' ? 'bg-red-600/20 text-red-400' :
                            rec.priority === 'medium' ? 'bg-yellow-600/20 text-yellow-400' :
                            'bg-blue-600/20 text-blue-400'
                          }`}>
                            {rec.priority}
                          </span>
                          <span className="text-sm font-medium text-[var(--text-secondary)] capitalize">
                            {rec.forAgent}
                          </span>
                        </div>
                        <h4 className="font-semibold mb-1">{rec.action}</h4>
                        <p className="text-sm text-[var(--text-secondary)] mb-2">{rec.reasoning}</p>
                        <p className="text-xs text-[var(--text-muted)]">Expected: {rec.expectedOutcome}</p>
                        {rec.risks.length > 0 && (
                          <div className="flex gap-2 mt-2">
                            {rec.risks.map((risk: string, i: number) => (
                              <span key={i} className="text-xs px-2 py-0.5 bg-red-600/10 text-red-400 rounded">
                                {risk}
                              </span>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
