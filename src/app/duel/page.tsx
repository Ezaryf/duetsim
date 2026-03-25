'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Search, Star, GitFork, Eye, AlertCircle, Loader2, ArrowRight, Settings2 } from 'lucide-react'
import { useDuelStore } from '@/stores/duelStore'
import type { Entity, EntityMetrics } from '@/types'
import Link from 'next/link'

interface SearchResult {
  name: string
  fullName: string
  description: string
  stars: number
  forks: number
  watchers: number
  language: string
  topics: string[]
}

async function searchGitHub(query: string): Promise<SearchResult[]> {
  if (!query || query.length < 2) return []
  
  try {
    const response = await fetch(`/api/entity/search?q=${encodeURIComponent(query)}`)
    if (!response.ok) return []
    const data = await response.json()
    return data.results || []
  } catch {
    return []
  }
}

function DuelSetupContent() {
  const searchParams = useSearchParams()
  const { entityA, entityB, setEntityA, setEntityB, timeHorizon, setTimeHorizon, depth, setDepth } = useDuelStore()
  
  const [queryA, setQueryA] = useState(searchParams.get('a') || '')
  const [queryB, setQueryB] = useState(searchParams.get('b') || '')
  const [resultsA, setResultsA] = useState<SearchResult[]>([])
  const [resultsB, setResultsB] = useState<SearchResult[]>([])
  const [loadingA, setLoadingA] = useState(false)
  const [loadingB, setLoadingB] = useState(false)

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (queryA.length >= 2) {
        setLoadingA(true)
        const results = await searchGitHub(queryA)
        setResultsA(results)
        setLoadingA(false)
      } else {
        setResultsA([])
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [queryA])

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (queryB.length >= 2) {
        setLoadingB(true)
        const results = await searchGitHub(queryB)
        setResultsB(results)
        setLoadingB(false)
      } else {
        setResultsB([])
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [queryB])

  const selectResultA = (result: SearchResult) => {
    setEntityA({
      id: result.fullName,
      type: 'repo',
      externalId: result.fullName,
      name: result.name,
      owner: result.fullName.split('/')[0],
      description: result.description,
      metrics: {
        stars: result.stars,
        forks: result.forks,
        watchers: result.watchers,
        language: result.language,
        topics: result.topics,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    setResultsA([])
    setQueryA(result.fullName)
  }

  const selectResultB = (result: SearchResult) => {
    setEntityB({
      id: result.fullName,
      type: 'repo',
      externalId: result.fullName,
      name: result.name,
      owner: result.fullName.split('/')[0],
      description: result.description,
      metrics: {
        stars: result.stars,
        forks: result.forks,
        watchers: result.watchers,
        language: result.language,
        topics: result.topics,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    setResultsB([])
    setQueryB(result.fullName)
  }

  const timeHorizons = [
    { value: 7, label: '7 days' },
    { value: 30, label: '30 days' },
    { value: 90, label: '90 days' },
    { value: 180, label: '180 days' },
  ]

  const depths = [
    { value: 'fast', label: 'Fast', desc: 'Quick analysis' },
    { value: 'balanced', label: 'Balanced', desc: 'Standard simulation' },
    { value: 'deep', label: 'Deep', desc: 'Comprehensive analysis' },
  ] as const

  return (
    <div className="min-h-screen bg-[#0a0a0f] px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold mb-4">
            <span className="text-gradient">Duel</span> Setup
          </h1>
          <p className="text-[#94a3b8]">Select two entities to simulate their future interaction</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <EntitySelector
            label="Entity A"
            query={queryA}
            setQuery={setQueryA}
            results={resultsA}
            loading={loadingA}
            onSelect={selectResultA}
            selected={entityA}
            color="cyan"
            placeholder="Search GitHub repositories..."
          />
          
          <EntitySelector
            label="Entity B"
            query={queryB}
            setQuery={setQueryB}
            results={resultsB}
            loading={loadingB}
            onSelect={selectResultB}
            selected={entityB}
            color="rose"
            placeholder="Search GitHub repositories..."
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-2xl p-6 mb-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <Settings2 className="w-5 h-5 text-[#6366f1]" />
            <h3 className="text-lg font-semibold">Simulation Parameters</h3>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-[#94a3b8] mb-3">Time Horizon</label>
              <div className="flex flex-wrap gap-2">
                {timeHorizons.map((th) => (
                  <button
                    key={th.value}
                    onClick={() => setTimeHorizon(th.value)}
                    className={`px-4 py-2 rounded-lg text-sm transition-all ${
                      timeHorizon === th.value
                        ? 'bg-[#6366f1] text-white'
                        : 'bg-[#1a1a2a] text-[#94a3b8] hover:bg-[#2a2a3a]'
                    }`}
                  >
                    {th.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm text-[#94a3b8] mb-3">Simulation Depth</label>
              <div className="flex flex-wrap gap-2">
                {depths.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => setDepth(d.value)}
                    className={`px-4 py-2 rounded-lg text-sm transition-all ${
                      depth === d.value
                        ? 'bg-[#6366f1] text-white'
                        : 'bg-[#1a1a2a] text-[#94a3b8] hover:bg-[#2a2a3a]'
                    }`}
                  >
                    <span className="block">{d.label}</span>
                    <span className="text-xs opacity-60">{d.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        <div className="text-center">
          <Link
            href={entityA && entityB ? `/arena?a=${encodeURIComponent(entityA.externalId)}&b=${encodeURIComponent(entityB.externalId)}` : '#'}
            className={`inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold transition-all ${
              entityA && entityB
                ? 'bg-gradient-to-r from-[#06b6d4] to-[#6366f1] text-white hover:shadow-lg hover:shadow-[#6366f1]/30'
                : 'bg-[#2a2a3a] text-[#94a3b8] cursor-not-allowed'
            }`}
          >
            Start Simulation
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  )
}

interface EntitySelectorProps {
  label: string
  query: string
  setQuery: (q: string) => void
  results: SearchResult[]
  loading: boolean
  onSelect: (r: SearchResult) => void
  selected: Entity | null
  color: 'cyan' | 'rose'
  placeholder: string
}

function EntitySelector({ label, query, setQuery, results, loading, onSelect, selected, color, placeholder }: EntitySelectorProps) {
  const borderColor = color === 'cyan' ? 'border-[#06b6d4]' : 'border-[#f43f5e]'
  const glowClass = color === 'cyan' ? 'focus:shadow-[0_0_20px_rgba(6,182,212,0.3)]' : 'focus:shadow-[0_0_20px_rgba(244,63,94,0.3)]'
  
  return (
    <div className="relative">
      <label className="block text-sm text-[#94a3b8] mb-2">{label}</label>
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94a3b8]" />
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={`w-full bg-[#0a0a0f] border ${borderColor} rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-[#4a4a5a] focus:outline-none transition-all ${glowClass}`}
        />
        {loading && (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94a3b8] animate-spin" />
        )}
      </div>

      {results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#12121a] border border-[#2a2a3a] rounded-xl overflow-hidden z-50 max-h-64 overflow-y-auto">
          {results.map((result, i) => (
            <button
              key={i}
              onClick={() => onSelect(result)}
              className="w-full px-4 py-3 text-left hover:bg-[#1a1a2a] transition-colors border-b border-[#2a2a3a] last:border-0"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-white">{result.fullName}</span>
                <div className="flex items-center gap-3 text-sm text-[#94a3b8]">
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4" />{result.stars}
                  </span>
                  <span className="flex items-center gap-1">
                    <GitFork className="w-4 h-4" />{result.forks}
                  </span>
                </div>
              </div>
              {result.description && (
                <p className="text-sm text-[#94a3b8] mt-1 truncate">{result.description}</p>
              )}
            </button>
          ))}
        </div>
      )}

      {selected && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mt-4 p-4 rounded-xl bg-[#12121a] border ${borderColor}`}
        >
          <div className="flex items-center gap-4">
            {selected.metrics?.stars !== undefined && (
              <div className="flex items-center gap-1 text-[#94a3b8]">
                <Star className="w-4 h-4 text-yellow-500" />
                <span>{selected.metrics.stars.toLocaleString()}</span>
              </div>
            )}
            {selected.metrics?.forks !== undefined && (
              <div className="flex items-center gap-1 text-[#94a3b8]">
                <GitFork className="w-4 h-4" />
                <span>{selected.metrics.forks.toLocaleString()}</span>
              </div>
            )}
            {selected.metrics?.language && (
              <span className="px-2 py-1 rounded bg-[#1a1a2a] text-xs text-[#94a3b8]">
                {selected.metrics.language}
              </span>
            )}
          </div>
          {selected.description && (
            <p className="mt-2 text-sm text-[#94a3b8]">{selected.description}</p>
          )}
        </motion.div>
      )}
    </div>
  )
}

export default function DuelPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#6366f1] animate-spin" />
      </div>
    }>
      <DuelSetupContent />
    </Suspense>
  )
}