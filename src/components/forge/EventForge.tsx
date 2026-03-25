'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Send, Clock, Sparkles, AlertTriangle } from 'lucide-react'
import { QUICK_INJECT_CATEGORIES } from '@/lib/engine/events'
import type { ForgeEvent } from '@/types'
import { useSettingsStore } from '@/stores/settingsStore'
import { useSimulationStore } from '@/stores/simulationStore'
import { getActiveBranch } from '@/lib/engine/engine'

interface EventForgeProps {
  onInjectEvent: (text: string, target: 'A' | 'B' | 'both', overrides?: Partial<ForgeEvent>) => void
  entityAName: string
  entityBName: string
  eventHistory: ForgeEvent[]
}

export default function EventForge({ onInjectEvent, entityAName, entityBName, eventHistory }: EventForgeProps) {
  const { apiKey, baseUrl, model, endpointType } = useSettingsStore()
  const { simulation } = useSimulationStore()

  const [eventText, setEventText] = useState('')
  const [isInjecting, setIsInjecting] = useState(false)
  const [target, setTarget] = useState<'A' | 'B' | 'both'>('A')
  const [inlineError, setInlineError] = useState<string | null>(null)
  const [lastAIStatus, setLastAIStatus] = useState<'idle' | 'success' | 'fallback'>('idle')
  const [rateLimitCooldown, setRateLimitCooldown] = useState(0)

  // Rate limit cooldown timer
  useEffect(() => {
    if (rateLimitCooldown <= 0) return
    const timer = setInterval(() => {
      setRateLimitCooldown(prev => {
        if (prev <= 1) return 0
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [rateLimitCooldown])

  // Core prediction function used by both custom text and quick inject
  const runPrediction = async (text: string, currentTarget: 'A' | 'B' | 'both') => {
    if (rateLimitCooldown > 0) {
      setInlineError(`Rate limited. Please wait ${rateLimitCooldown}s...`)
      return
    }
    if (isInjecting) return
    setIsInjecting(true)
    setInlineError(null)
    setLastAIStatus('idle')

    try {
      if (!apiKey) {
        console.warn("No AI API key found, using heuristic simulation.")
        onInjectEvent(text, currentTarget)
        setLastAIStatus('fallback')
        setInlineError('No API key — used heuristic fallback.')
        return
      }

      if (!simulation) return

      const activeBranch = getActiveBranch(simulation)
      const lastNode = activeBranch?.nodes.at(-1)
      
      const res = await fetch('/api/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityA: entityAName,
          entityB: entityBName,
          scoreA: lastNode?.entityAScore || 50,
          scoreB: lastNode?.entityBScore || 50,
          eventText: text,
          target: currentTarget,
          connection: { apiKey, baseUrl, model, endpointType }
        })
      })

      const aiData = await res.json()

      if (res.ok) {
        onInjectEvent(text, currentTarget, {
          impact: aiData.impact,
          label: aiData.label,
          description: aiData.description,
          stateChange: aiData.stateChange,
          probability: aiData.probability,
          icon: '✨'
        })
        setLastAIStatus('success')
      } else {
        const errorMsg = aiData.error || "Unknown AI error"
        const isRateLimit = res.status === 429 || errorMsg.includes('429') || errorMsg.toLowerCase().includes('rate limit')
        
        if (isRateLimit) {
          setRateLimitCooldown(8)
          setInlineError("AI rate limit reached. Using heuristic fallback...")
        } else {
          setInlineError(`AI failed: ${errorMsg}. Fell back to heuristic.`)
        }
        setLastAIStatus('fallback')
        onInjectEvent(text, currentTarget)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Could not reach the AI gateway."
      console.error("AI fetch error:", message)
      setInlineError(`Connection error: ${message}. Fell back to heuristic.`)
      setLastAIStatus('fallback')
      onInjectEvent(text, currentTarget)
    } finally {
      setIsInjecting(false)
    }
  }

  const handleInject = async () => {
    if (!eventText.trim() || rateLimitCooldown > 0) return
    await runPrediction(eventText, target)
    setEventText('')
  }

  const handleQuickInject = async (label: string) => {
    const targetLabel = target === 'A' ? entityAName : target === 'B' ? entityBName : 'Both entities'
    const text = `${targetLabel}: ${label}`
    await runPrediction(text, target)
  }

  return (
    <div className="glass-strong rounded-2xl p-5 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold">Event Forge</h3>
            <p className="text-[10px] text-[var(--text-muted)]">What happens next?</p>
          </div>
        </div>
        {apiKey ? (
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded border ${
            lastAIStatus === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/20' 
              : lastAIStatus === 'fallback' 
                ? 'bg-amber-500/10 border-amber-500/20' 
                : 'bg-[#06b6d4]/10 border-[#06b6d4]/20'
          }`}>
            <Sparkles className={`w-3 h-3 ${
              lastAIStatus === 'success' ? 'text-emerald-400' : lastAIStatus === 'fallback' ? 'text-amber-400' : 'text-[#06b6d4]'
            }`} />
            <span className={`text-[9px] font-bold uppercase tracking-wider ${
              lastAIStatus === 'success' ? 'text-emerald-400' : lastAIStatus === 'fallback' ? 'text-amber-400' : 'text-[#06b6d4]'
            }`}>
              {lastAIStatus === 'success' ? 'AI Success' : lastAIStatus === 'fallback' ? 'Fallback' : 'AI Active'}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider">No Key</span>
          </div>
        )}
      </div>

      {/* Inline Error Banner */}
      <AnimatePresence>
        {inlineError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-start gap-2 p-2.5 mb-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300"
          >
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>{inlineError}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Target selector */}
      <div className="flex gap-1.5 mb-3">
        {([
          { value: 'A' as const, label: entityAName, color: '#06b6d4' },
          { value: 'B' as const, label: entityBName, color: '#f43f5e' },
          { value: 'both' as const, label: 'Both', color: '#6366f1' },
        ]).map(t => (
          <button
            key={t.value}
            onClick={() => setTarget(t.value)}
            className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all truncate ${
              target === t.value
                ? 'text-white'
                : 'bg-[var(--bg)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
            }`}
            style={target === t.value ? { background: `${t.color}30`, color: t.color, border: `1px solid ${t.color}40` } : { border: '1px solid transparent' }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="relative mb-3">
        <textarea
          value={eventText}
          onChange={(e) => setEventText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleInject() }}}
          placeholder={`"${entityAName} receives $120M funding…"`}
          rows={2}
          disabled={isInjecting}
          className="w-full bg-[var(--bg)] border border-[var(--border-bright)] rounded-xl py-3 px-4 pr-12 text-sm text-white placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] transition-all resize-none disabled:opacity-50"
        />
        <button
          onClick={handleInject}
          disabled={!eventText.trim() || isInjecting || rateLimitCooldown > 0}
          className={`absolute right-3 bottom-3 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
            eventText.trim() && !isInjecting && rateLimitCooldown === 0
              ? 'bg-[var(--primary)] text-white hover:brightness-110'
              : 'bg-[var(--surface)] text-[var(--text-muted)]'
          }`}
        >
          {isInjecting ? (
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-4 h-4 border-2 border-[var(--text-muted)] border-t-white rounded-full" />
          ) : rateLimitCooldown > 0 ? (
            <span className="text-xs font-bold">{rateLimitCooldown}</span>
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Quick inject */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {QUICK_INJECT_CATEGORIES.map(cat => (
          <button
            key={cat.category}
            onClick={() => handleQuickInject(cat.label)}
            disabled={isInjecting || rateLimitCooldown > 0}
            className="px-2.5 py-1 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-xs text-[var(--text-secondary)] hover:border-[var(--primary)] hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      {/* Event history */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="flex items-center gap-1.5 mb-2">
          <Clock className="w-3 h-3 text-[var(--text-muted)]" />
          <span className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider">Event History</span>
        </div>
        <div className="space-y-1.5">
          <AnimatePresence>
            {eventHistory.slice().reverse().map((evt) => (
              <motion.div
                key={evt.id}
                initial={{ opacity: 0, x: -20, height: 0 }}
                animate={{ opacity: 1, x: 0, height: 'auto' }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-start gap-2 p-2 rounded-lg bg-[var(--bg)]/50 text-xs"
              >
                <span>{evt.icon || '⚡'}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{evt.label}</p>
                  <p className="text-[var(--text-muted)] text-[10px]">Day {evt.day} • Impact: {evt.impact > 0 ? '+' : ''}{evt.impact}</p>
                </div>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                  evt.targetEntity === 'A' ? 'bg-[#06b6d4]/20 text-[#06b6d4]' :
                  evt.targetEntity === 'B' ? 'bg-[#f43f5e]/20 text-[#f43f5e]' :
                  'bg-[#6366f1]/20 text-[#6366f1]'
                }`}>
                  {evt.targetEntity}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
          {eventHistory.length === 0 && (
            <p className="text-[10px] text-[var(--text-muted)] text-center py-4">No events injected yet. Type an event above or use quick inject.</p>
          )}
        </div>
      </div>
    </div>
  )
}
