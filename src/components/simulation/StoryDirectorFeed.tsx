"use client";

import React, { useEffect, useRef } from 'react';
import { useEmergentStore } from '@/stores/emergentStore';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen } from 'lucide-react';

const agentColors: Record<string, string> = {
    'CEO': 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    'Regulator': 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    'Public': 'text-pink-400 bg-pink-400/10 border-pink-400/20',
    'Competitor': 'text-purple-400 bg-purple-400/10 border-purple-400/20',
    'System': 'text-slate-400 bg-slate-400/10 border-slate-400/20',
    'Story': 'text-white bg-white/5 border-white/20',
    'Event': 'text-[#06b6d4] bg-[#06b6d4]/10 border-[#06b6d4]/20',
};

export default function StoryDirectorFeed() {
    const dramaFeed = useEmergentStore(state => state.dramaFeed);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom like a live feed
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [dramaFeed]);

    return (
        <div className="flex flex-col w-full h-full relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#06b6d4]/10 blur-3xl rounded-full" />
            
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4 scroll-smooth scrollbar-hide">
                <AnimatePresence initial={false}>
                    {dramaFeed.map((entry) => (
                        <motion.div 
                            key={entry.id}
                            initial={{ opacity: 0, y: 30, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            className={`flex flex-col p-4 rounded-xl border ${agentColors[entry.agent] || agentColors['System']} backdrop-blur-md`}
                        >
                            <div className="flex justify-between items-end mb-2">
                                <span className="font-mono text-[10px] font-bold tracking-tight uppercase opacity-70">
                                    {entry.agent}
                                </span>
                                <span className="text-[10px] opacity-40 font-mono">
                                    T+{entry.timestamp}
                                </span>
                            </div>
                            
                            <p className={`text-sm tracking-wide leading-relaxed ${entry.agent === 'Story' ? 'italic font-serif text-base' : 'font-medium'}`}>
                                {entry.agent === 'Story' ? null : '"'}{entry.text}{entry.agent === 'Story' ? null : '"'}
                            </p>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
