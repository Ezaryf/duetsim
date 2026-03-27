"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { SimulationBranch } from '@/types';
import { Play, Pause, SkipForward, SkipBack } from 'lucide-react';

interface FloatingScrubberProps {
    readonly branches: SimulationBranch[];
    readonly activeBranchId: string;
    readonly onSelectBranch: (id: string) => void;
}

export default function FloatingScrubber({ branches, activeBranchId, onSelectBranch }: FloatingScrubberProps) {
    if (!branches || branches.length === 0) return null;

    return (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2">
            
            {/* Holographic Timeline Bar */}
            <div className="flex items-center gap-4 bg-black/60 backdrop-blur-xl border border-white/10 px-8 py-3 rounded-full shadow-2xl">
                
                {/* Playback Controls */}
                <div className="flex items-center gap-3 pr-4 border-r border-white/10">
                    <button className="text-white/40 hover:text-white transition-colors">
                        <SkipBack className="w-4 h-4" />
                    </button>
                    <button className="text-white hover:text-[#06b6d4] transition-colors">
                        <Play className="w-5 h-5 fill-current" />
                    </button>
                    <button className="text-white/40 hover:text-white transition-colors">
                        <SkipForward className="w-4 h-4" />
                    </button>
                </div>

                {/* Branch Nodes (Timeline) */}
                <div className="flex items-center gap-3">
                    {branches.map((branch, i) => {
                        const isActive = branch.id === activeBranchId;
                        return (
                            <motion.button
                                key={branch.id}
                                onClick={() => onSelectBranch(branch.id)}
                                whileHover={{ scale: 1.2 }}
                                whileTap={{ scale: 0.9 }}
                                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                                    isActive 
                                    ? 'bg-[#06b6d4] shadow-[0_0_15px_rgba(6,182,212,0.8)]' 
                                    : 'bg-white/20 hover:bg-white/50'
                                }`}
                                title={`Timeline Variance: ${branch.id.slice(0, 5)}`}
                            />
                        );
                    })}
                </div>

                {/* Active Info */}
                <div className="pl-4 border-l border-white/10 font-mono text-xs text-white/50 tracking-widest uppercase">
                    Tick: {branches.find(b => b.id === activeBranchId)?.nodes.length || 0}
                </div>
            </div>
            
            <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-medium">Temporal Navigation</p>
        </div>
    );
}
