'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Zap, ArrowRight, Sparkles, GitBranch, Target, Flame, Settings } from 'lucide-react'
import Link from 'next/link'
import { useSimulationStore } from '@/stores/simulationStore'
import type { EntityCategory } from '@/types'
import SettingsModal from '@/components/ui/SettingsModal'

// ─── Category Config ─────────────────────────────────────────────────────────

const categories: { id: EntityCategory; label: string; vs: string; iconA: string; iconB: string; placeholderA: string; placeholderB: string }[] = [
  { id: 'repo', label: 'Repo vs Repo', vs: 'vs', iconA: '📦', iconB: '📦', placeholderA: 'e.g. facebook/react', placeholderB: 'e.g. vuejs/vue' },
  { id: 'company', label: 'Company vs Regulation', vs: 'vs', iconA: '🏢', iconB: '⚖️', placeholderA: 'e.g. OpenAI', placeholderB: 'e.g. EU AI Act' },
  { id: 'product', label: 'Product vs Market', vs: 'vs', iconA: '🚀', iconB: '🌍', placeholderA: 'e.g. GPT-4o', placeholderB: 'e.g. Enterprise AI Market' },
  { id: 'founder', label: 'Founder vs Competitor', vs: 'vs', iconA: '👤', iconB: '⚔️', placeholderA: 'e.g. Sam Altman', placeholderB: 'e.g. Dario Amodei' },
  { id: 'brand', label: 'Brand vs Audience', vs: 'vs', iconA: '✨', iconB: '👥', placeholderA: 'e.g. Tesla', placeholderB: 'e.g. EV Enthusiasts' },
  { id: 'policy', label: 'Policy vs Public', vs: 'vs', iconA: '📜', iconB: '🗣️', placeholderA: 'e.g. Data Privacy Act', placeholderB: 'e.g. Public Reaction' },
]

const quickPicks: Record<string, { a: string; b: string; label: string }[]> = {
  repo: [
    { a: 'facebook/react', b: 'vuejs/vue', label: 'React vs Vue' },
    { a: 'tensorflow/tensorflow', b: 'pytorch/pytorch', label: 'TensorFlow vs PyTorch' },
    { a: 'vercel/next.js', b: 'nuxt/nuxt', label: 'Next.js vs Nuxt' },
    { a: 'rust-lang/rust', b: 'golang/go', label: 'Rust vs Go' },
  ],
  company: [
    { a: 'OpenAI', b: 'EU AI Act', label: 'OpenAI vs EU' },
    { a: 'Meta', b: 'FTC Regulation', label: 'Meta vs FTC' },
  ],
  product: [
    { a: 'GPT-4o', b: 'Claude 4', label: 'GPT-4o vs Claude 4' },
    { a: 'Cursor', b: 'VSCode', label: 'Cursor vs VSCode' },
  ],
  founder: [
    { a: 'Sam Altman', b: 'Dario Amodei', label: 'Altman vs Amodei' },
    { a: 'Elon Musk', b: 'Mark Zuckerberg', label: 'Musk vs Zuck' },
  ],
  brand: [
    { a: 'Tesla', b: 'EV Market', label: 'Tesla vs EV Market' },
    { a: 'Apple', b: 'Samsung', label: 'Apple vs Samsung' },
  ],
  policy: [
    { a: 'AI Safety Bill', b: 'Public Response', label: 'AI Safety vs Public' },
    { a: 'TikTok Ban', b: 'Creator Economy', label: 'TikTok Ban vs Creators' },
  ],
}

// ─── Landing Page ────────────────────────────────────────────────────────────

export default function Home() {
  const [inputA, setInputA] = useState('')
  const [inputB, setInputB] = useState('')
  const [activeCategory, setActiveCategory] = useState<EntityCategory>('repo')
  const { setEntityA, setEntityB, setCategory } = useSimulationStore()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  const currentCat = categories.find(c => c.id === activeCategory) || categories[0]
  const canForge = inputA.trim().length > 0 && inputB.trim().length > 0

  // ─── Particle Background ────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationId: number
    const particles: { x: number; y: number; vx: number; vy: number; size: number; color: string; alpha: number }[] = []

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const colorsA = ['#06b6d4', '#0ea5e9', '#38bdf8']
    const colorsB = ['#f43f5e', '#e11d48', '#fb7185']
    const allColors = [...colorsA, ...colorsB, '#6366f1', '#8b5cf6']

    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 1.2,
        vy: (Math.random() - 0.5) * 1.2,
        size: Math.random() * 2.5 + 0.5,
        color: allColors[Math.floor(Math.random() * allColors.length)],
        alpha: Math.random() * 0.5 + 0.2,
      })
    }

    const animate = () => {
      ctx.fillStyle = 'rgba(6, 6, 11, 0.08)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      particles.forEach((p, i) => {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.globalAlpha = p.alpha
        ctx.fill()

        particles.slice(i + 1).forEach(p2 => {
          const dx = p2.x - p.x
          const dy = p2.y - p.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 120) {
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.strokeStyle = p.color
            ctx.globalAlpha = 0.06 * (1 - dist / 120)
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        })
      })
      ctx.globalAlpha = 1
      animationId = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  // ─── Navigation Handler ─────────────────────────────────────────────────
  const handleForge = () => {
    if (!canForge) return

    setEntityA({
      id: inputA,
      category: activeCategory,
      externalId: inputA,
      name: inputA.split('/').pop() || inputA,
      owner: inputA.includes('/') ? inputA.split('/')[0] : undefined,
      description: '',
      metrics: { stars: 50000 + Math.random() * 150000, forks: 5000 + Math.random() * 30000, watchers: 2000 + Math.random() * 8000 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    setEntityB({
      id: inputB,
      category: activeCategory,
      externalId: inputB,
      name: inputB.split('/').pop() || inputB,
      owner: inputB.includes('/') ? inputB.split('/')[0] : undefined,
      description: '',
      metrics: { stars: 50000 + Math.random() * 150000, forks: 5000 + Math.random() * 30000, watchers: 2000 + Math.random() * 8000 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    setCategory(activeCategory)
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <canvas
        ref={canvasRef}
        className="fixed inset-0 z-0"
        style={{ background: 'linear-gradient(180deg, #06060b 0%, #0c0c18 50%, #06060b 100%)' }}
      />

      {/* ─── Nav ─────────────────────────────────────────────────────────── */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#06b6d4] to-[#8b5cf6] flex items-center justify-center shadow-lg shadow-[#6366f1]/20">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">Future<span className="text-gradient">Forge</span></span>
        </div>
        <div className="flex items-center gap-6 text-sm text-[var(--text-secondary)]">
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="hover:text-white transition-colors flex items-center gap-1.5"
            title="AI Settings"
          >
            <Settings className="w-4 h-4" />Settings
          </button>
          <Link href="/forge" className="hover:text-white transition-colors flex items-center gap-1.5">
            <Flame className="w-4 h-4" />Forge
          </Link>
          <Link href="/replay" className="hover:text-white transition-colors flex items-center gap-1.5">
            <GitBranch className="w-4 h-4" />Replay
          </Link>
        </div>
      </nav>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* ─── Hero ────────────────────────────────────────────────────────── */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text-secondary)] mb-6">
            <Sparkles className="w-3.5 h-3.5 text-[var(--primary)]" />
            Pairwise Future Conflict Engine
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold mb-5 leading-[1.05] tracking-tight">
            Simulate what happens<br />
            when two forces <span className="text-gradient">collide</span>.
          </h1>
          <p className="text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed">
            Choose two entities. Inject real-world events. Watch branching<br className="hidden md:block" /> futures unfold through a connected causal outcome graph.
          </p>
        </motion.div>

        {/* ─── Category Pills ────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="flex flex-wrap justify-center gap-2 mb-8"
        >
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                activeCategory === cat.id
                  ? 'bg-[var(--primary)] text-white shadow-lg shadow-[var(--glow-primary)]'
                  : 'bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border)] hover:border-[var(--border-bright)] hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </motion.div>

        {/* ─── Matchup Card ──────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="w-full max-w-4xl"
        >
          <div className="glass-strong rounded-3xl p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
              {/* Entity A */}
              <div className="flex-1 w-full">
                <label className="block text-xs font-semibold text-[var(--accent-a)] uppercase tracking-widest mb-2">
                  {currentCat.iconA} Entity A
                </label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    placeholder={currentCat.placeholderA}
                    value={inputA}
                    onChange={(e) => setInputA(e.target.value)}
                    className="w-full bg-[var(--bg)] border border-[var(--border-bright)] rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-a)] focus:shadow-[0_0_20px_rgba(6,182,212,0.15)] transition-all"
                  />
                </div>
              </div>

              {/* VS Badge */}
              <div className="relative flex-shrink-0">
                <motion.div
                  animate={{
                    boxShadow: canForge
                      ? ['0 0 20px rgba(99,102,241,0.3)', '0 0 40px rgba(99,102,241,0.5)', '0 0 20px rgba(99,102,241,0.3)']
                      : '0 0 15px rgba(99,102,241,0.2)',
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent-b)] flex items-center justify-center"
                >
                  <span className="text-xl font-black text-white">VS</span>
                </motion.div>
              </div>

              {/* Entity B */}
              <div className="flex-1 w-full">
                <label className="block text-xs font-semibold text-[var(--accent-b)] uppercase tracking-widest mb-2">
                  {currentCat.iconB} Entity B
                </label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    placeholder={currentCat.placeholderB}
                    value={inputB}
                    onChange={(e) => setInputB(e.target.value)}
                    className="w-full bg-[var(--bg)] border border-[var(--border-bright)] rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-b)] focus:shadow-[0_0_20px_rgba(244,63,94,0.15)] transition-all"
                  />
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-8 text-center">
              <Link
                href={canForge ? `/forge?a=${encodeURIComponent(inputA)}&b=${encodeURIComponent(inputB)}&cat=${activeCategory}` : '#'}
                onClick={handleForge}
              >
                <motion.div
                  whileHover={canForge ? { scale: 1.03, y: -2 } : {}}
                  whileTap={canForge ? { scale: 0.98 } : {}}
                  className={`inline-flex items-center gap-3 px-10 py-4 rounded-2xl font-bold text-lg transition-all ${
                    canForge
                      ? 'bg-gradient-to-r from-[var(--accent-a)] via-[var(--primary)] to-[var(--accent-b)] text-white shadow-xl shadow-[var(--glow-primary)] cursor-pointer'
                      : 'bg-[var(--surface-hover)] text-[var(--text-muted)] cursor-not-allowed'
                  }`}
                >
                  <Flame className="w-5 h-5" />
                  Forge the Future
                  <ArrowRight className="w-5 h-5" />
                </motion.div>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* ─── Quick Picks ───────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="mt-8"
          >
            <p className="text-xs font-medium text-[var(--text-muted)] mb-3 text-center uppercase tracking-widest">Quick picks</p>
            <div className="flex flex-wrap justify-center gap-2">
              {(quickPicks[activeCategory] || []).map((pick, i) => (
                <motion.button
                  key={`${activeCategory}-${i}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => { setInputA(pick.a); setInputB(pick.b) }}
                  className="px-4 py-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm text-[var(--text-secondary)] hover:border-[var(--primary)] hover:text-white hover:shadow-md hover:shadow-[var(--glow-primary)] transition-all duration-300"
                >
                  <span className="font-medium">{pick.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* ─── Feature Pillars ───────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-16 mb-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full"
        >
          {[
            { icon: <Target className="w-6 h-6 text-[var(--accent-a)]" />, title: 'Duel', desc: 'Two forces. One arena. Watch them collide and reshape each other.' },
            { icon: <Zap className="w-6 h-6 text-[var(--primary)]" />, title: 'Event', desc: 'Inject funding, scandals, launches. The future recalculates instantly.' },
            { icon: <GitBranch className="w-6 h-6 text-[var(--accent-b)]" />, title: 'Branch', desc: 'Explore branching timelines. See cause → effect → consequence.' },
          ].map((pillar, i) => (
            <motion.div
              key={pillar.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 + i * 0.15 }}
              className="glass rounded-2xl p-6 text-center hover:border-[var(--border-bright)] transition-all duration-300"
            >
              <div className="flex justify-center mb-3">{pillar.icon}</div>
              <h3 className="text-lg font-bold mb-1">{pillar.title}</h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{pillar.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </main>

      {/* ─── Footer ──────────────────────────────────────────────────────── */}
      <footer className="relative z-10 py-8 text-center text-xs text-[var(--text-muted)]">
        <p>FutureForge • Pairwise Future Conflict Engine</p>
      </footer>
    </div>
  )
}