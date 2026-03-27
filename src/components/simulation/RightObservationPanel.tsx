"use client";

import React, { useState } from 'react';
import { BookOpen, Activity, Sparkles, SlidersHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEmergentStore } from '@/stores/emergentStore';

import StoryDirectorFeed from '@/components/simulation/StoryDirectorFeed';
import WorldContextTab from '@/components/simulation/observation/WorldContextTab';
import AIPromptsTab from '@/components/simulation/observation/AIPromptsTab';

type TabId = 'context' | 'feed' | 'ai' | 'delta';

export default function RightObservationPanel() {
    const [activeTab, setActiveTab] = useState<TabId>('context');

    return (
        <div className="flex flex-col w-[450px] h-[75vh] bg-black/80 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl pointer-events-auto relative">
            {/* Header Tabs */}
            <div className="flex bg-white/5 border-b border-white/10 shrink-0">
                <button 
                    onClick={() => setActiveTab('context')}
                    className={`flex-1 py-4 text-xs font-bold tracking-widest uppercase flex flex-col items-center gap-2 border-b-2 transition-colors ${activeTab === 'context' ? 'border-[#06b6d4] text-white' : 'border-transparent text-white/40 hover:text-white/70'}`}
                >
                    <BookOpen className="w-4 h-4" />
                    World Context
                </button>
                <button 
                    onClick={() => setActiveTab('feed')}
                    className={`flex-1 py-4 text-xs font-bold tracking-widest uppercase flex flex-col items-center gap-2 border-b-2 transition-colors ${activeTab === 'feed' ? 'border-[#06b6d4] text-white' : 'border-transparent text-white/40 hover:text-white/70'}`}
                >
                    <Activity className="w-4 h-4" />
                    Live Feed
                </button>
                <button 
                    onClick={() => setActiveTab('ai')}
                    className={`flex-1 py-4 text-xs font-bold tracking-widest uppercase flex flex-col items-center gap-2 border-b-2 transition-colors ${activeTab === 'ai' ? 'border-[#06b6d4] text-white' : 'border-transparent text-white/40 hover:text-white/70'}`}
                >
                    <Sparkles className="w-4 h-4" />
                    AI Prompts
                </button>
                <button 
                    onClick={() => setActiveTab('delta')}
                    className={`flex-1 py-4 text-xs font-bold tracking-widest uppercase flex flex-col items-center gap-2 border-b-2 transition-colors ${activeTab === 'delta' ? 'border-[#06b6d4] text-white' : 'border-transparent text-white/40 hover:text-white/70'}`}
                >
                    <SlidersHorizontal className="w-4 h-4" />
                    What-If
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative">
                <AnimatePresence mode="wait">
                    {activeTab === 'context' && (
                        <motion.div key="context" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="absolute inset-0">
                            <WorldContextTab />
                        </motion.div>
                    )}
                    {activeTab === 'feed' && (
                        <motion.div key="feed" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="absolute inset-0">
                            <StoryDirectorFeed />
                        </motion.div>
                    )}
                    {activeTab === 'ai' && (
                        <motion.div key="ai" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="absolute inset-0 overflow-hidden">
                            <AIPromptsTab />
                        </motion.div>
                    )}
                    {activeTab === 'delta' && (
                        <motion.div key="delta" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="absolute inset-0 p-6 flex items-center justify-center">
                            <div className="text-center">
                                <SlidersHorizontal className="w-8 h-8 text-white/20 mx-auto mb-4" />
                                <h3 className="text-white/60 font-mono text-sm uppercase">Comparison Mode</h3>
                                <p className="text-xs text-white/30 mt-2">Select branches on the timeline to compare deltas.</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
