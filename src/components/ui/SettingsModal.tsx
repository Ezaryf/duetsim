'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Settings, Database, Key, Server, CheckCircle2, AlertCircle, Loader2, Search, Sparkles } from 'lucide-react'
import { useSettingsStore, inferEndpointType } from '@/stores/settingsStore'
import type { EndpointType } from '@/stores/settingsStore'

// ─── Provider Presets ────────────────────────────────────────────────────────

const PROVIDERS = [
  { id: 'openai', label: 'OpenAI', url: 'https://api.openai.com/v1', defaultModel: 'gpt-4o-mini', icon: '⚡' },
  { id: 'openrouter', label: 'OpenRouter', url: 'https://openrouter.ai/api/v1', defaultModel: 'meta-llama/llama-3.3-70b-instruct', icon: '🌌' },
  { id: 'opencode', label: 'OpenCode Zen', url: 'https://opencode.ai/zen/v1', defaultModel: 'minimax-m2.5-free', icon: '💻' },
  { id: 'groq', label: 'Groq', url: 'https://api.groq.com/openai/v1', defaultModel: 'llama-3.1-8b-instant', icon: '🚀' },
  { id: 'deepseek', label: 'DeepSeek', url: 'https://api.deepseek.com', defaultModel: 'deepseek-chat', icon: '🐋' },
  { id: 'together', label: 'Together', url: 'https://api.together.xyz/v1', defaultModel: 'meta-llama/Llama-3-8b-chat-hf', icon: '🤝' },
  { id: 'xai', label: 'xAI', url: 'https://api.x.ai/v1', defaultModel: 'grok-beta', icon: '✖️' },
  { id: 'custom', label: 'Custom', url: '', defaultModel: '', icon: '⚙️' }
]

// ─── Free Models (OpenCode Zen) ──────────────────────────────────────────────

const FREE_MODEL_IDS = new Set([
  'minimax-m2.5-free',
  'mimo-v2-pro-free',
  'mimo-v2-omni-free',
  'nemotron-3-super-free',
  'big-pickle',
])

interface ZenModel {
  id: string
  name?: string
  owned_by?: string
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function SettingsModal({ isOpen, onClose }: Readonly<{ isOpen: boolean, onClose: () => void }>) {
  const { apiKey, baseUrl, model, endpointType, setApiKey, setBaseUrl, setModel, setEndpointType, setProviderType } = useSettingsStore()
  const [mounted, setMounted] = useState(false)

  const [localKey, setLocalKey] = useState('')
  const [localUrl, setLocalUrl] = useState('')
  const [localModel, setLocalModel] = useState('')
  const [localEndpointType, setLocalEndpointType] = useState<EndpointType>('chat')
  const [activeProviderId, setActiveProviderId] = useState('openai')
  const [saveState, setSaveState] = useState<'idle' | 'validating' | 'success' | 'error'>('idle')
  const [validationError, setValidationError] = useState('')

  // Live model catalog (for OpenCode Zen)
  const [zenModels, setZenModels] = useState<ZenModel[]>([])
  const [modelsLoading, setModelsLoading] = useState(false)
  const [modelSearch, setModelSearch] = useState('')

  // Sync state on open
  useEffect(() => {
    setMounted(true)
    if (isOpen) {
      setLocalKey(apiKey)
      setLocalUrl(baseUrl)
      setLocalModel(model)
      setLocalEndpointType(endpointType)
      setSaveState('idle')
      setValidationError('')

      const matchedProvider = PROVIDERS.find(p => p.url === baseUrl)
      if (matchedProvider) setActiveProviderId(matchedProvider.id)
      else if (baseUrl) setActiveProviderId('custom')
    }
  }, [isOpen, apiKey, baseUrl, model, endpointType])

  // Fetch models when OpenCode Zen is selected
  const fetchZenModels = useCallback(async () => {
    setModelsLoading(true)
    try {
      const res = await fetch('/api/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseUrl: 'https://opencode.ai/zen/v1', apiKey: localKey }),
      })
      if (res.ok) {
        const data = await res.json()
        const models: ZenModel[] = data.data || data || []
        setZenModels(Array.isArray(models) ? models : [])
      }
    } catch {
      // Silently fail — model picker will just show the text input
    } finally {
      setModelsLoading(false)
    }
  }, [localKey])

  useEffect(() => {
    if (activeProviderId === 'opencode' && isOpen) {
      fetchZenModels()
    } else {
      setZenModels([])
    }
  }, [activeProviderId, isOpen, fetchZenModels])

  if (!isOpen || !mounted) return null

  const handleProviderSelect = (provId: string) => {
    setActiveProviderId(provId)
    setValidationError('')
    setSaveState('idle')
    setModelSearch('')
    const prov = PROVIDERS.find(p => p.id === provId)
    if (prov && prov.id !== 'custom') {
      setLocalUrl(prov.url)
      setLocalModel(prov.defaultModel)
      setLocalEndpointType(inferEndpointType(prov.defaultModel))
    }
  }

  const handleModelSelect = (modelId: string) => {
    setLocalModel(modelId)
    setLocalEndpointType(inferEndpointType(modelId))
    setModelSearch('')
  }

  const handleSave = async () => {
    setSaveState('validating')
    setValidationError('')

    try {
      const res = await validateApiKey(localUrl, localKey)

      if (!res.ok && res.status !== 404 && res.status !== 405) {
        await handleValidationError(res)
        return
      }

      // Key is valid — save everything
      saveToStore()
      setSaveState('success')
      setTimeout(() => {
        onClose()
        setSaveState('idle')
      }, 800)

    } catch (err: unknown) {
      handleConnectionError(err)
    }
  }

  const validateApiKey = async (url: string, key: string) => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)
    try {
      const res = await fetch('/api/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseUrl: url, apiKey: key }),
        signal: controller.signal
      })
      return res
    } finally {
      clearTimeout(timeoutId)
    }
  }

  const handleValidationError = async (res: Response) => {
    if (res.status === 429) {
      setSaveState('error')
      setValidationError('Rate limit exceeded (429). Please wait a moment and try again.')
      return
    }
    const errText = await res.text()
    let detail = 'Invalid API key or endpoint.'
    try {
      const errJson = JSON.parse(errText)
      detail = errJson.error?.message || errJson.message || detail
    } catch (error_) { 
      // Failed to parse — use default detail
    }
    setSaveState('error')
    setValidationError(detail)
  }

  const handleConnectionError = (err: unknown) => {
    setSaveState('error')
    if (err instanceof Error && err.name === 'AbortError') {
      setValidationError('Connection timed out. Check your endpoint URL.')
    } else {
      setValidationError(err instanceof Error ? err.message : 'Could not reach the AI provider.')
    }
  }

  const saveToStore = () => {
    setApiKey(localKey)
    setBaseUrl(localUrl)
    setModel(localModel)
    setEndpointType(localEndpointType)
    setProviderType(activeProviderId)
  }

  const isCustom = activeProviderId === 'custom'
  const isOpenCode = activeProviderId === 'opencode'

  // Filter zen models by search
  const filteredModels = zenModels.filter(m =>
    m.id.toLowerCase().includes(modelSearch.toLowerCase())
  )

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ type: "spring", bounce: 0, duration: 0.4 }}
          className="relative w-full max-w-lg bg-[var(--surface)] border border-[var(--border)] rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 pb-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#06b6d4] to-[#3b82f6] flex items-center justify-center shadow-lg shadow-[#06b6d4]/20">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-white">AI Engine Link</h2>
                <p className="text-xs text-[var(--text-muted)]">Connect an OpenAI-compatible API</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-[var(--text-muted)] hover:text-white rounded-xl hover:bg-[var(--surface-hover)] transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 pt-2 flex flex-col gap-6 overflow-y-auto flex-1 min-h-0">
            {/* Provider Grid */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider ml-1">Provider Preset</span>
              <div className="grid grid-cols-2 gap-2">
                {PROVIDERS.map((prov) => (
                  <button
                    key={prov.id}
                    onClick={() => handleProviderSelect(prov.id)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      activeProviderId === prov.id
                        ? 'bg-[var(--primary)] text-white shadow-md shadow-[var(--glow-primary)] border border-transparent'
                        : 'bg-black/30 border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-bright)] hover:text-white'
                    }`}
                  >
                    <span>{prov.icon}</span>
                    {prov.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Inputs */}
            <div className="flex flex-col gap-4 bg-black/20 p-5 rounded-2xl border border-[var(--border)]">
              {/* Custom Base URL */}
              <AnimatePresence mode="popLayout">
                {isCustom && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex flex-col gap-1.5"
                  >
                    <label htmlFor="base-url-input" className="text-xs font-semibold text-[var(--text-muted)] flex items-center gap-1.5 ml-1">
                      <Server className="w-3.5 h-3.5" /> Endpoint Base URL
                    </label>
                    <input
                      id="base-url-input"
                      type="text"
                      value={localUrl}
                      onChange={e => { setLocalUrl(e.target.value); setSaveState('idle'); setValidationError('') }}
                      className="w-full bg-black/40 border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[var(--primary)] font-mono transition-colors"
                      placeholder="https://api.openai.com/v1"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Model Picker — OpenCode Zen live catalog */}
              <AnimatePresence mode="popLayout">
                {isOpenCode && zenModels.length > 0 ? (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex flex-col gap-2"
                  >
                    <label className="text-xs font-semibold text-[var(--text-muted)] flex items-center gap-1.5 ml-1">
                      <Sparkles className="w-3.5 h-3.5" /> Model Catalog
                      {modelsLoading && <Loader2 className="w-3 h-3 animate-spin ml-1" />}
                    </label>

                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]" />
                      <input
                        id="model-search-input"
                        type="text"
                        value={modelSearch}
                        onChange={e => setModelSearch(e.target.value)}
                        className="w-full bg-black/40 border border-[var(--border)] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[var(--primary)] font-mono transition-colors"
                        placeholder="Search models…"
                      />
                    </div>

                    {/* Model grid */}
                    <div className="max-h-40 overflow-y-auto rounded-xl border border-[var(--border)] bg-black/20">
                      {filteredModels.map(m => {
                        const isFree = FREE_MODEL_IDS.has(m.id)
                        const isSelected = localModel === m.id
                        return (
                          <button
                            key={m.id}
                            onClick={() => handleModelSelect(m.id)}
                            className={`w-full text-left px-3 py-2 text-xs font-mono flex items-center gap-2 transition-all border-b border-[var(--border)] last:border-b-0 ${
                              isSelected
                                ? 'bg-[var(--primary)]/20 text-white'
                                : 'text-[var(--text-secondary)] hover:bg-white/5 hover:text-white'
                            }`}
                          >
                            <span className="flex-1 truncate">{m.id}</span>
                            {isFree && (
                              <span className="shrink-0 px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[9px] font-bold uppercase tracking-wider">
                                Free
                              </span>
                            )}
                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-[var(--primary)]" />}
                          </button>
                        )
                      })}
                      {filteredModels.length === 0 && (
                        <p className="text-[10px] text-[var(--text-muted)] text-center py-3">No models match your search.</p>
                      )}
                    </div>

                    {/* Endpoint type badge */}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-[var(--text-muted)]">Endpoint:</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20">
                        /{localEndpointType === 'chat' ? 'chat/completions' : localEndpointType}
                      </span>
                    </div>
                  </motion.div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="model-id-input" className="text-xs font-semibold text-[var(--text-muted)] flex items-center gap-1.5 ml-1">
                      <Database className="w-3.5 h-3.5" /> Model ID
                      {isOpenCode && modelsLoading && <Loader2 className="w-3 h-3 animate-spin ml-1" />}
                    </label>
                    <input
                      id="model-id-input"
                      type="text"
                      value={localModel}
                      onChange={e => { setLocalModel(e.target.value); setLocalEndpointType(inferEndpointType(e.target.value)) }}
                      className="w-full bg-black/40 border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[var(--primary)] font-mono transition-colors"
                      placeholder="gpt-4o-mini"
                    />
                  </div>
                )}
              </AnimatePresence>

              {/* API Key */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="api-key-input" className="text-xs font-semibold text-[var(--text-muted)] flex items-center gap-1.5 ml-1">
                  <Key className="w-3.5 h-3.5" /> API Key
                </label>
                <input
                  id="api-key-input"
                  type="password"
                  value={localKey}
                  onChange={e => { setLocalKey(e.target.value); setSaveState('idle'); setValidationError('') }}
                  className={`w-full bg-black/40 border rounded-xl px-4 py-3 text-sm text-white focus:outline-none font-mono transition-colors ${
                    saveState === 'error' ? 'border-red-500/60 focus:border-red-500' : 'border-[var(--border)] focus:border-[var(--primary)]'
                  }`}
                  placeholder={activeProviderId === 'openai' ? "sk-proj-..." : "sk-..."}
                />
                {!localKey && <p className="text-[10px] text-amber-500 flex items-center gap-1 mt-1 ml-1"><AlertCircle className="w-3 h-3"/> Key required for AI generation</p>}
                
                {/* Stale cache hint */}
                {isOpenCode && (
                  <p className="text-[9px] text-[var(--text-muted)] mt-2 italic px-1">
                    Tip: If models don't load, try a <b>Hard Refresh (Ctrl+F5)</b> to clear browser cache.
                  </p>
                )}
              </div>

              {/* Validation Error */}
              <AnimatePresence>
                {saveState === 'error' && validationError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400"
                  >
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{validationError}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 px-6 border-t border-[var(--border)] bg-black/40 flex justify-between items-center shrink-0">
            <span className="text-[10px] text-[var(--text-muted)] w-1/2">
              Keys are stored entirely locally on your device.
            </span>
            <button
              onClick={handleSave}
              disabled={saveState === 'success' || saveState === 'validating' || !localKey}
              className={(() => {
                const isSuccess = saveState === 'success'
                const isValidating = saveState === 'validating'
                if (isSuccess) return 'relative overflow-hidden px-8 py-2.5 text-sm font-bold rounded-xl transition-all bg-emerald-500 text-white'
                if (isValidating) return 'relative overflow-hidden px-8 py-2.5 text-sm font-bold rounded-xl transition-all bg-[var(--primary)] text-white cursor-wait'
                if (!localKey) return 'relative overflow-hidden px-8 py-2.5 text-sm font-bold rounded-xl transition-all bg-[var(--surface-hover)] text-[var(--text-muted)] cursor-not-allowed'
                return 'relative overflow-hidden px-8 py-2.5 text-sm font-bold rounded-xl transition-all bg-white text-black hover:bg-white/90 shadow-[0_0_20px_rgba(255,255,255,0.2)]'
              })()}
            >
              {(() => {
                const isSuccess = saveState === 'success'
                const isValidating = saveState === 'validating'
                
                if (isSuccess) {
                  return (
                    <motion.div
                      key="saved"
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -20, opacity: 0 }}
                      className="flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Connected
                    </motion.div>
                  )
                }
                
                if (isValidating) {
                  return (
                    <motion.div
                      key="validating"
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -20, opacity: 0 }}
                      className="flex items-center gap-2"
                    >
                      <Loader2 className="w-4 h-4 animate-spin" /> Validating…
                    </motion.div>
                  )
                }
                
                return (
                  <motion.div
                    key="save"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                  >
                    Save Connection
                  </motion.div>
                )
              })()}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
