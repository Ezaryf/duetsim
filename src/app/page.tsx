'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Search, GitBranch, Zap, ArrowRight, Sparkles } from 'lucide-react'
import Link from 'next/link'

const quickPicks = [
  { name: 'GPT-4o', owner: 'openai', repo: 'openai-python', type: 'model' },
  { name: 'Claude 3.5', owner: 'anthropic', repo: 'claude-code', type: 'model' },
  { name: 'React', owner: 'facebook', repo: 'react', type: 'framework' },
  { name: 'Vue', owner: 'vuejs', repo: 'vue', type: 'framework' },
  { name: 'TensorFlow', owner: 'tensorflow', repo: 'tensorflow', type: 'framework' },
  { name: 'PyTorch', owner: 'pytorch', repo: 'pytorch', type: 'framework' },
]

export default function Home() {
  const [entityA, setEntityA] = useState('')
  const [entityB, setEntityB] = useState('')
  const [isHovering, setIsHovering] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationId: number
    const particles: { x: number; y: number; vx: number; vy: number; size: number; color: string }[] = []

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const colors = ['#06b6d4', '#6366f1', '#8b5cf6', '#f43f5e']
    
    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size: Math.random() * 3 + 1,
        color: colors[Math.floor(Math.random() * colors.length)]
      })
    }

    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const mouseX = isHovering ? centerX : null
    const mouseY = isHovering ? centerY : null

    const animate = () => {
      ctx.fillStyle = 'rgba(10, 10, 15, 0.1)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      particles.forEach((p, i) => {
        if (mouseX !== null && mouseY !== null) {
          const dx = mouseX - p.x
          const dy = mouseY - p.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 300) {
            p.vx += dx / dist * 0.05
            p.vy += dy / dist * 0.05
          }
        }

        p.x += p.vx
        p.y += p.vy

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.globalAlpha = 0.6
        ctx.fill()

        particles.slice(i + 1).forEach(p2 => {
          const dx = p2.x - p.x
          const dy = p2.y - p.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 100) {
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.strokeStyle = p.color
            ctx.globalAlpha = 0.1 * (1 - dist / 100)
            ctx.stroke()
          }
        })
      })

      animationId = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', resize)
    }
  }, [isHovering])

  return (
    <div className="min-h-screen relative overflow-hidden">
      <canvas
        ref={canvasRef}
        className="fixed inset-0 z-0"
        style={{ background: 'linear-gradient(180deg, #0a0a0f 0%, #12121a 100%)' }}
      />

      <nav className="relative z-10 flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#06b6d4] to-[#8b5cf6] flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gradient">DuetSim</span>
        </div>
        <div className="flex items-center gap-6 text-sm text-[#94a3b8]">
          <Link href="/explore" className="hover:text-white transition-colors">Explore</Link>
          <Link href="/history" className="hover:text-white transition-colors">History</Link>
          <Link href="/about" className="hover:text-white transition-colors">About</Link>
        </div>
      </nav>

      <main className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl md:text-7xl font-bold mb-4">
            <span className="text-gradient">Simulate</span> the Future
          </h1>
          <p className="text-xl text-[#94a3b8] max-w-2xl mx-auto">
            Watch two forces collide, adapt, and reshape each other&apos;s future.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-4xl"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          <div className="glass rounded-3xl p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
              <div className="flex-1 w-full">
                <label className="block text-sm text-[#94a3b8] mb-2">Entity A</label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94a3b8]" />
                  <input
                    type="text"
                    placeholder="Search repository..."
                    value={entityA}
                    onChange={(e) => setEntityA(e.target.value)}
                    className="w-full bg-[#0a0a0f] border border-[#2a2a3a] rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-[#4a4a5a] focus:outline-none focus:border-[#06b6d4] transition-colors"
                  />
                </div>
              </div>

              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#6366f1] to-[#f43f5e] flex items-center justify-center animate-glow-pulse">
                  <span className="text-2xl font-bold text-white">VS</span>
                </div>
              </div>

              <div className="flex-1 w-full">
                <label className="block text-sm text-[#94a3b8] mb-2">Entity B</label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94a3b8]" />
                  <input
                    type="text"
                    placeholder="Search repository..."
                    value={entityB}
                    onChange={(e) => setEntityB(e.target.value)}
                    className="w-full bg-[#0a0a0f] border border-[#2a2a3a] rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-[#4a4a5a] focus:outline-none focus:border-[#f43f5e] transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 text-center">
              <Link
                href={entityA && entityB ? `/duel?a=${encodeURIComponent(entityA)}&b=${encodeURIComponent(entityB)}` : '#'}
                className={`inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold transition-all ${
                  entityA && entityB
                    ? 'bg-gradient-to-r from-[#06b6d4] to-[#6366f1] text-white hover:shadow-lg hover:shadow-[#6366f1]/30'
                    : 'bg-[#2a2a3a] text-[#94a3b8] cursor-not-allowed'
                }`}
              >
                <Sparkles className="w-5 h-5" />
                Run Simulation
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12"
        >
          <p className="text-sm text-[#94a3b8] mb-4 text-center">Quick picks</p>
          <div className="flex flex-wrap justify-center gap-3">
            {quickPicks.slice(0, 4).map((pick, i) => (
              <button
                key={i}
                onClick={() => {
                  if (!entityA) setEntityA(`${pick.owner}/${pick.repo}`)
                  else if (!entityB) setEntityB(`${pick.owner}/${pick.repo}`)
                }}
                className="px-4 py-2 rounded-lg bg-[#1a1a2a] border border-[#2a2a3a] text-sm text-[#94a3b8] hover:border-[#6366f1] hover:text-white transition-all"
              >
                {pick.name}
              </button>
            ))}
          </div>
        </motion.div>
      </main>

      <footer className="relative z-10 py-8 text-center text-sm text-[#4a4a5a]">
        <p>Built with physics-inspired simulation • Powered by Claude 3.5</p>
      </footer>
    </div>
  )
}