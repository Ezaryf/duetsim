"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DiffOverlayProps {
    isVisible: boolean;
    onClose: () => void;
    baseOutcome: string;
    targetOutcome: string;
    diffs: {
        metric: string;
        value: number;
        triggered?: boolean;
    }[];
}

export default function DiffOverlay({ isVisible, onClose, baseOutcome, targetOutcome, diffs }: Readonly<DiffOverlayProps>) {
    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div 
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 50 }}
                    className="absolute top-8 right-8 w-80 bg-black/80 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl p-6 z-50"
                >
                    <div className="flex justify-between items-center mb-6">
                        <h4 className="text-white/80 text-sm font-bold tracking-widest uppercase">Outcome Delta</h4>
                        <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
                            ✕
                        </button>
                    </div>

                    <div className="flex items-center gap-2 mb-6 text-xs text-white/50 font-mono">
                        <span className="truncate">{baseOutcome}</span>
                        <span>→</span>
                        <span className="text-white truncate">{targetOutcome}</span>
                    </div>

                    <div className="space-y-4">
                        {diffs.map((diff) => {
                            const sign = diff.value > 0 ? '+' : '';
                            let colorClass = 'text-slate-400';
                            if (diff.value > 0) colorClass = 'text-green-400';
                            else if (diff.value < 0) colorClass = 'text-red-400';
                            
                            return (
                            <div key={diff.metric} className="flex justify-between items-center border-b border-white/5 pb-2">
                                <span className="text-white/70 text-sm tracking-wide">{diff.metric}</span>
                                {diff.triggered === undefined ? (
                                    <span className={`text-sm font-mono font-bold ${colorClass}`}>
                                        {sign}{diff.value}
                                    </span>
                                ) : (
                                    <span className={`text-xs font-mono font-bold px-2 py-1 rounded ${diff.triggered ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                                        {diff.triggered ? 'TRIGGERED' : 'SAFE'}
                                    </span>
                                )}
                            </div>
                            );
                        })}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
