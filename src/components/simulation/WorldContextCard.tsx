"use client";

import React, { useState } from 'react';
import { useEmergentStore } from '@/stores/emergentStore';
import { BookOpen, ChevronDown, ChevronUp, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function WorldContextCard() {
    const { scenarioContext, hiddenVariables, worldRules } = useEmergentStore();
    const [isExpanded, setIsExpanded] = useState(true);

    if (!scenarioContext) return null;

    return (
        <div className="absolute top-24 left-8 z-40 w-80 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl pointer-events-auto">
            <div 
                className="px-4 py-3 border-b border-white/10 bg-white/5 flex items-center justify-between cursor-pointer hover:bg-white/10 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#06b6d4]" />
                    <h3 className="text-white/90 uppercase tracking-widest text-[10px] font-bold font-mono">
                        World Context
                    </h3>
                </div>
                {isExpanded ? <ChevronUp className="w-4 h-4 text-white/50" /> : <ChevronDown className="w-4 h-4 text-white/50" />}
            </div>
            
            <AnimatePresence>
                {isExpanded && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="p-4 flex flex-col gap-4"
                    >
                        <p className="text-white/80 text-sm leading-relaxed font-serif italic border-l-2 border-[#06b6d4]/50 pl-3">
                            {scenarioContext}
                        </p>

                        <div className="pt-3 border-t border-white/10">
                            <div className="flex items-center gap-2 mb-2">
                                <EyeOff className="w-3 h-3 text-[#f43f5e]" />
                                <span className="text-[10px] text-[#f43f5e] uppercase tracking-widest font-bold">Unseen Forces</span>
                            </div>
                            <div className="space-y-2">
                                {hiddenVariables.map((v) => (
                                    <div key={v.name} className="flex flex-col gap-1">
                                        <div className="flex justify-between text-xs text-white/60 font-mono">
                                            <span>{v.name}</span>
                                            <span>{v.value}%</span>
                                        </div>
                                        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-[#f43f5e] transition-all duration-1000" 
                                                style={{ width: `${v.value}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
