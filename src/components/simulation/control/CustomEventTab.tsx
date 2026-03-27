"use client";

import React, { useState } from 'react';
import { useEmergentStore } from '@/stores/emergentStore';
import { useSimulationStore } from '@/stores/simulationStore';
import { Target, Zap, Activity, Hash, Sparkles } from 'lucide-react';

export default function CustomEventTab() {
    const { entityA, entityB, injectEvent } = useSimulationStore();
    
    const [narrative, setNarrative] = useState("");
    const [target, setTarget] = useState<'A' | 'B' | 'both'>('both');
    const [magnitude, setMagnitude] = useState(50);
    const [probability, setProbability] = useState(100);
    const [direction, setDirection] = useState<'positive' | 'negative' | 'chaotic'>('negative');

    const handleInject = () => {
        if (!narrative.trim()) return;
        
        // When using Custom Event Builder, we bypass the AI prediction engine and force the impact values
        injectEvent(narrative, target, {
            impact: direction === 'negative' ? -magnitude : magnitude,
            probability: probability / 100,
            label: narrative.substring(0, 20) + '...',
            description: narrative,
            stateChange: direction,
            icon: direction === 'chaotic' ? '🌪️' : direction === 'positive' ? '⚡' : '🔥'
        });

        setNarrative("");
    };

    return (
        <div className="h-full overflow-y-auto p-5 scrollbar-hide flex flex-col gap-6">
            <h2 className="text-white/90 uppercase tracking-[0.2em] text-[10px] font-bold font-mono border-b border-white/10 pb-3">
                System Override: Custom Event
            </h2>

            {/* Narrative Input */}
            <div className="flex flex-col gap-2">
                <label className="text-[10px] text-white/50 uppercase tracking-widest font-bold">Event Narrative</label>
                <textarea 
                    value={narrative}
                    onChange={e => setNarrative(e.target.value)}
                    placeholder="e.g. A sudden whistleblower leak destabilizes the board..."
                    className="w-full h-24 bg-black/50 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-[#f43f5e] focus:ring-1 focus:ring-[#f43f5e] outline-none transition-all resize-none font-mono"
                />
            </div>

            {/* Target Selection */}
            <div className="flex flex-col gap-2">
                <label className="text-[10px] text-white/50 uppercase tracking-widest font-bold flex items-center gap-2">
                    <Target className="w-3 h-3" /> Target Entity
                </label>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setTarget('A')} 
                        className={`flex-1 py-2 rounded-md text-xs font-mono border ${target === 'A' ? 'bg-[#06b6d4]/20 border-[#06b6d4] text-[#06b6d4]' : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'}`}
                    >
                        {entityA?.name || 'A'}
                    </button>
                    <button 
                        onClick={() => setTarget('B')} 
                        className={`flex-1 py-2 rounded-md text-xs font-mono border ${target === 'B' ? 'bg-[#f43f5e]/20 border-[#f43f5e] text-[#f43f5e]' : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'}`}
                    >
                        {entityB?.name || 'B'}
                    </button>
                    <button 
                        onClick={() => setTarget('both')} 
                        className={`flex-1 py-2 rounded-md text-xs font-mono border ${target === 'both' ? 'bg-purple-500/20 border-purple-500 text-purple-400' : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'}`}
                    >
                        Global
                    </button>
                </div>
            </div>

            {/* Direction Selection */}
            <div className="flex flex-col gap-2">
                <label className="text-[10px] text-white/50 uppercase tracking-widest font-bold flex items-center gap-2">
                    <Activity className="w-3 h-3" /> Impact Vector
                </label>
                <div className="flex rounded-md overflow-hidden border border-white/10">
                    <button 
                        onClick={() => setDirection('positive')}
                        className={`flex-1 py-1.5 text-xs font-mono ${direction === 'positive' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-black/50 text-white/50 hover:bg-white/5'}`}
                    >
                        Positive
                    </button>
                    <button 
                        onClick={() => setDirection('negative')}
                        className={`flex-1 py-1.5 text-xs font-mono border-x border-white/10 ${direction === 'negative' ? 'bg-red-500/20 text-red-400' : 'bg-black/50 text-white/50 hover:bg-white/5'}`}
                    >
                        Negative
                    </button>
                    <button 
                        onClick={() => setDirection('chaotic')}
                        className={`flex-1 py-1.5 text-xs font-mono ${direction === 'chaotic' ? 'bg-amber-500/20 text-amber-400' : 'bg-black/50 text-white/50 hover:bg-white/5'}`}
                    >
                        Chaotic
                    </button>
                </div>
            </div>

            {/* Magnitude Slider */}
            <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center">
                    <label className="text-[10px] text-white/50 uppercase tracking-widest font-bold flex items-center gap-2">
                        <Zap className="w-3 h-3" /> Magnitude Force
                    </label>
                    <span className="text-xs font-mono text-[#f43f5e] font-bold">{magnitude}</span>
                </div>
                <input 
                    type="range" 
                    min="1" 
                    max="100" 
                    value={magnitude}
                    onChange={(e) => setMagnitude(Number(e.target.value))}
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#f43f5e]"
                />
            </div>

            {/* Probability Slider */}
            <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center">
                    <label className="text-[10px] text-white/50 uppercase tracking-widest font-bold flex items-center gap-2">
                        <Hash className="w-3 h-3" /> Probability Weight
                    </label>
                    <span className="text-xs font-mono text-[#06b6d4] font-bold">{probability}%</span>
                </div>
                <input 
                    type="range" 
                    min="1" 
                    max="100" 
                    value={probability}
                    onChange={(e) => setProbability(Number(e.target.value))}
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#06b6d4]"
                />
            </div>

            <button
                onClick={handleInject}
                disabled={!narrative.trim()}
                className="mt-auto w-full py-3 bg-[#f43f5e] hover:bg-[#e11d48] disabled:bg-white/5 disabled:text-white/20 text-white rounded-lg font-bold tracking-widest uppercase text-xs transition-all flex items-center justify-center gap-2"
            >
                <Sparkles className="w-4 h-4" /> Inject Director Override
            </button>
        </div>
    );
}
