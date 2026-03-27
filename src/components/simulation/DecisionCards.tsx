"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DecisionCards() {
    const [risk, setRisk] = useState(50);
    const [selectedCard, setSelectedCard] = useState<string | null>(null);

    const cards = [
        { id: 'aggressive', title: 'Launch Early', desc: 'Max Growth. Critical Regulatory Risk.', danger: true },
        { id: 'safe', title: 'Delay Compliance', desc: 'Secure Trust. Lose Market Share.', danger: false }
    ];

    return (
        <div className="flex flex-col gap-6 w-full max-w-2xl bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-white/70 uppercase tracking-widest text-xs font-semibold">User Override Protocol</h3>
                <span className="text-[10px] text-white/30 font-mono">TENSION ACTIVE</span>
            </div>

            <div className="flex flex-col gap-2">
                <div className="flex justify-between text-xs font-mono font-bold text-white/60">
                    <span>Safety-First</span>
                    <span>Risk Appetite: {risk}%</span>
                    <span className="text-red-400">Hyper-Aggressive</span>
                </div>
                <input 
                    type="range" min="0" max="100" 
                    value={risk} onChange={(e) => setRisk(Number.parseInt(e.target.value))}
                    className="w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-red-500 rounded-lg appearance-none cursor-pointer"
                />
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
                {cards.map(card => {
                    let cardStyle = 'border-white/10 hover:border-white/30 bg-white/5';
                    if (selectedCard === card.id) {
                        cardStyle = card.danger ? 'border-red-500 bg-red-500/10' : 'border-blue-500 bg-blue-500/10';
                    }

                    return (
                    <motion.button
                        key={card.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedCard(card.id)}
                        className={`p-4 rounded-xl border text-left transition-all ${cardStyle}`}
                    >
                        <h4 className={`font-mono text-sm mb-1 ${card.danger ? 'text-red-400' : 'text-blue-400'}`}>
                            {card.title}
                        </h4>
                        <p className="text-xs text-white/50 tracking-wide">{card.desc}</p>
                    </motion.button>
                    );
                })}
            </div>

            <AnimatePresence>
                {selectedCard && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="w-full"
                    >
                        <button className="w-full py-3 bg-white text-black font-bold uppercase tracking-widest text-sm rounded-xl shadow-[0_0_15px_rgba(255,255,255,0.3)] hover:bg-white/90">
                            Commit Decision
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
