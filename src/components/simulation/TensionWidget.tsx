"use client";

import React, { useEffect, useRef } from 'react';
import { useEmergentStore } from '@/stores/emergentStore';
import { gsap } from 'gsap';

export default function TensionWidget() {
    const instability = useEmergentStore(state => state.instability);
    const widgetRef = useRef<HTMLDivElement>(null);
    const ringRef = useRef<SVGCircleElement>(null);

    // Calculate stroke dashoffset for ring gauge
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (instability / 100) * circumference;

    const isCritical = instability >= 80;

    useEffect(() => {
        if (!ringRef.current || !widgetRef.current) return;

        // Animate the gauge filling
        gsap.to(ringRef.current, {
            strokeDashoffset: offset,
            duration: 1,
            ease: "power2.out"
        });

        if (isCritical) {
            // Heartbeat/vignette flash animation
            gsap.to(widgetRef.current, {
                boxShadow: "inset 0 0 60px rgba(239, 68, 68, 0.4)",
                borderColor: "rgba(239, 68, 68, 0.6)",
                yoyo: true,
                repeat: -1,
                duration: 0.8
            });
        } else {
            gsap.killTweensOf(widgetRef.current);
            gsap.to(widgetRef.current, {
                boxShadow: "inset 0 0 0px rgba(239, 68, 68, 0)",
                borderColor: "rgba(255, 255, 255, 0.1)",
                duration: 0.5
            });
        }
    }, [instability, offset, isCritical]);

    return (
        <div 
            ref={widgetRef} 
            className="flex flex-col items-center p-6 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl w-64 shadow-2xl transition-all"
        >
            <h3 className="text-white/70 uppercase tracking-widest text-xs font-semibold mb-4">Instability Core</h3>
            
            <div className="relative flex items-center justify-center w-32 h-32">
                <svg className="absolute w-full h-full -rotate-90">
                    <circle 
                        cx="64" cy="64" r={radius}
                        stroke="rgba(255,255,255,0.05)" 
                        strokeWidth="8" fill="none"
                    />
                    <circle 
                        ref={ringRef}
                        cx="64" cy="64" r={radius}
                        stroke={isCritical ? "#ef4444" : "#3b82f6"} 
                        strokeWidth="8" fill="none"
                        strokeLinecap="round"
                        style={{ strokeDasharray: circumference, strokeDashoffset: circumference }}
                    />
                </svg>
                <div className="text-center z-10">
                    <span className={`text-4xl font-bold font-mono tracking-tighter ${isCritical ? 'text-red-500' : 'text-white'}`}>
                        {Math.round(instability)}
                    </span>
                </div>
            </div>

            <div className="mt-4 text-center h-8">
                {isCritical && (
                    <span className="text-xs text-red-400 font-mono animate-pulse uppercase tracking-widest">
                        Nearing Cascade!
                    </span>
                )}
            </div>
        </div>
    );
}
