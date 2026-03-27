"use client";

import React, { useState } from 'react';
import { Sword, PenTool, ListOrdered, Settings2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import EventArsenal from '@/components/forge/EventArsenal';
import CustomEventTab from '@/components/simulation/control/CustomEventTab';

type TabId = 'arsenal' | 'custom' | 'storylines' | 'params';

export default function LeftControlPanel() {
    const [activeTab, setActiveTab] = useState<TabId>('arsenal');

    // Strip the outer Absolute container from EventArsenal for mounting inside here, assuming EventArsenal is responsive
    return (
        <div className="flex flex-col w-[380px] h-[75vh] bg-black/80 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl pointer-events-auto relative">
            {/* Header Tabs */}
            <div className="flex bg-white/5 border-b border-white/10 shrink-0">
                <button 
                    onClick={() => setActiveTab('arsenal')}
                    className={`flex-1 py-4 text-[10px] font-bold tracking-widest uppercase flex flex-col items-center gap-2 border-b-2 transition-colors ${activeTab === 'arsenal' ? 'border-[#f43f5e] text-white' : 'border-transparent text-white/40 hover:text-white/70'}`}
                >
                    <Sword className="w-4 h-4" />
                    Arsenal
                </button>
                <button 
                    onClick={() => setActiveTab('custom')}
                    className={`flex-1 py-4 text-[10px] font-bold tracking-widest uppercase flex flex-col items-center gap-2 border-b-2 transition-colors ${activeTab === 'custom' ? 'border-[#f43f5e] text-white' : 'border-transparent text-white/40 hover:text-white/70'}`}
                >
                    <PenTool className="w-4 h-4" />
                    Custom
                </button>
                <button 
                    onClick={() => setActiveTab('storylines')}
                    className={`flex-1 py-4 text-[10px] font-bold tracking-widest uppercase flex flex-col items-center gap-2 border-b-2 transition-colors ${activeTab === 'storylines' ? 'border-[#f43f5e] text-white' : 'border-transparent text-white/40 hover:text-white/70'}`}
                >
                    <ListOrdered className="w-4 h-4" />
                    Storylines
                </button>
                <button 
                    onClick={() => setActiveTab('params')}
                    className={`flex-1 py-4 text-[10px] font-bold tracking-widest uppercase flex flex-col items-center gap-2 border-b-2 transition-colors ${activeTab === 'params' ? 'border-[#f43f5e] text-white' : 'border-transparent text-white/40 hover:text-white/70'}`}
                >
                    <Settings2 className="w-4 h-4" />
                    Params
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative">
                <AnimatePresence mode="wait">
                    {activeTab === 'arsenal' && (
                        <motion.div key="arsenal" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="absolute inset-0">
                            {/* Injected dynamically to drop on the graph */}
                            <EventArsenal />
                        </motion.div>
                    )}
                    {activeTab === 'custom' && (
                        <motion.div key="custom" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="absolute inset-0">
                            <CustomEventTab />
                        </motion.div>
                    )}
                    {activeTab === 'storylines' && (
                        <motion.div key="storylines" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="absolute inset-0 p-6 flex flex-col justify-center items-center text-center">
                            <ListOrdered className="w-8 h-8 text-white/20 mb-4" />
                            <h3 className="text-white/60 font-mono text-xs uppercase">Storyline Macros</h3>
                            <p className="text-[10px] text-white/30 mt-2 max-w-[250px]">Inject pre-made multi-event sequences (e.g., "The Underdog Victory").</p>
                            <div className="mt-4 px-4 py-2 bg-white/5 border border-white/10 rounded uppercase text-[10px] tracking-widest text-white/40">In Development</div>
                        </motion.div>
                    )}
                    {activeTab === 'params' && (
                        <motion.div key="params" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="absolute inset-0 p-6 flex flex-col justify-center items-center text-center">
                            <Settings2 className="w-8 h-8 text-white/20 mb-4" />
                            <h3 className="text-white/60 font-mono text-xs uppercase">Sim Parameters</h3>
                            <p className="text-[10px] text-white/30 mt-2 max-w-[250px]">Adjust tick speed, engine randomness, and baseline chaos vs stable trajectories.</p>
                            <div className="mt-4 px-4 py-2 bg-white/5 border border-white/10 rounded uppercase text-[10px] tracking-widest text-white/40">In Development</div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
