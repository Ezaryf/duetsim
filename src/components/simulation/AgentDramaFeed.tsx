"use client";

import React, { useEffect, useRef } from 'react';
import { useEmergentStore } from '@/stores/emergentStore';
import { motion, AnimatePresence } from 'framer-motion';

const agentColors = {
    'CEO': 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    'Regulator': 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    'Public': 'text-pink-400 bg-pink-400/10 border-pink-400/20',
    'Competitor': 'text-purple-400 bg-purple-400/10 border-purple-400/20',
    'System': 'text-slate-400 bg-slate-400/10 border-slate-400/20',
};

export default function AgentDramaFeed() {
    const dramaFeed = useEmergentStore(state => state.dramaFeed);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom like a live feed
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [dramaFeed]);

    return (
        <div className="flex flex-col w-full h-80 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            <div className="px-4 py-3 border-b border-white/10 bg-white/5">
                <h3 className="text-white/70 uppercase tracking-widest text-xs font-semibold">Live Intercepts</h3>
            </div>
            
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth scrollbar-hide">
                <AnimatePresence initial={false}>
                    {dramaFeed.map((entry) => (
                        <motion.div 
                            key={entry.id}
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            className={`flex flex-col p-3 rounded-xl border ${agentColors[entry.agent]} backdrop-blur-md`}
                        >
                            <div className="flex justify-between items-end mb-1">
                                <span className="font-mono text-xs font-bold tracking-tight uppercase">
                                    {entry.agent}
                                </span>
                                <span className="text-[10px] opacity-50 font-mono">
                                    T+{entry.timestamp}
                                </span>
                            </div>
                            <p className="text-sm font-medium tracking-wide">
                                "{entry.text}"
                            </p>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
