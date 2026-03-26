'use client'

import { useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Stars } from '@react-three/drei'

interface CoreProps {
  readonly scoreA: number
  readonly scoreB: number
  readonly eventTrigger?: number
}

function WarpField({ scoreA, scoreB, eventTrigger }: Readonly<CoreProps>) {
  const [speed, setSpeed] = useState(1)

  useEffect(() => {
    if (eventTrigger && eventTrigger > 0) {
      setSpeed(15) // Intense hyperspace speed on event
      const t = setTimeout(() => {
        setSpeed(1)
      }, 1500)
      return () => clearTimeout(t)
    }
  }, [eventTrigger])

  const isAWinnng = scoreA > scoreB
  const dominantColor = isAWinnng ? '#06b6d4' : '#f43f5e'

  return (
    <group>
      {/* Background Energy field — massive particle acceleration instead of solid spheres */}
      <Stars radius={150} depth={50} count={6000} factor={4} saturation={1} fade speed={speed} />
      
      {/* Dynamic Lighting flash on events */}
      <ambientLight {...({ intensity: 0.2 } as any)} />
      <pointLight {...({ position: [0, 0, 5], color: dominantColor, intensity: speed > 1 ? 4 : 0, distance: 50 } as any)} />
    </group>
  )
}

export default function ConflictCore3D({ scoreA, scoreB, eventTrigger }: Readonly<CoreProps>) {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none opacity-50 mix-blend-screen">
      <Canvas camera={{ position: [0, 0, 10], fov: 45 }}>
        <fog {...({ attach: "fog", args: ['#06060b', 8, 25] } as any)} />
        <WarpField scoreA={scoreA} scoreB={scoreB} eventTrigger={eventTrigger} />
      </Canvas>
    </div>
  )
}
