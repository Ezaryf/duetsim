"use client";

import React from 'react';
import { motion } from 'framer-motion';

interface TimelineSliderProps {
    currentTick: number;
    maxTicks: number;
    onTickChange: (tick: number) => void;
}

export default function TimelineSlider({ currentTick, maxTicks, onTickChange }: Readonly<TimelineSliderProps>) {
    return (
        <div className="w-full max-w-3xl mx-auto flex flex-col items-center gap-4 bg-black/50 p-6 rounded-2xl border border-white/10 backdrop-blur-xl">
            <h3 className="text-white/80 font-medium tracking-wide">Simulation Timeline</h3>
            <div className="flex items-center gap-4 w-full">
                <span className="text-xs font-mono text-white/50">T=0</span>
                <input 
                    type="range" 
                    min="0" 
                    max={maxTicks} 
                    value={currentTick} 
                    onChange={(e) => onTickChange(Number.parseInt(e.target.value))}
                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <span className="text-xs font-mono text-white/50">T={maxTicks}</span>
            </div>
            
            <div className="flex justify-between w-full mt-2">
                <motion.div 
                    key={currentTick}
                    initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                    className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg font-mono text-sm border border-blue-500/30"
                >
                    Current: Tick {currentTick}
                </motion.div>
                
                <button 
                    onClick={() => onTickChange(Math.min(currentTick + 1, maxTicks))}
                    className="px-6 py-2 bg-white text-black font-semibold rounded-lg hover:bg-white/90 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] active:scale-95"
                >
                    Advance Simulation
                </button>
            </div>
        </div>
    );
}
