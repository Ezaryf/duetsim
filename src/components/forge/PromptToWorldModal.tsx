"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Loader2, Globe } from 'lucide-react';
import { useSettingsStore } from '@/stores/settingsStore';

interface PromptToWorldModalProps {
    onWorldGenerated: (worldData: any) => void;
}

export default function PromptToWorldModal({ onWorldGenerated }: PromptToWorldModalProps) {
    const [prompt, setPrompt] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const apiKey = useSettingsStore(state => state.apiKey);
    const baseUrl = useSettingsStore(state => state.baseUrl);
    const model = useSettingsStore(state => state.model);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        if (!apiKey) {
            setError("AI Provider not connected. Please configure in Settings.");
            return;
        }

        setIsGenerating(true);
        setError(null);

        try {
            const res = await fetch('/api/world-builder', {
                method: 'POST',
                body: JSON.stringify({ prompt, connection: { apiKey, baseUrl, model } })
            });

            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            onWorldGenerated(data);
        } catch (err: any) {
            setError(err.message || "Failed to generate world");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Narrative Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-3xl w-full z-10"
            >
                <div className="text-center mb-12">
                    <Globe className="w-16 h-16 text-[#06b6d4] mx-auto mb-6 opacity-80" />
                    <h1 className="text-4xl font-light text-white tracking-widest uppercase mb-4">
                        Narrative Strategy OS
                    </h1>
                    <p className="text-white/40 font-mono text-sm max-w-xl mx-auto leading-relaxed">
                        Describe a world. The AI builds the rules, characters, conflicts, history, and future branches. Then you intervene like a god, strategist, or villain.
                    </p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-2xl relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-[#06b6d4] to-[#f43f5e] rounded-2xl opacity-20 group-hover:opacity-40 blur transition duration-1000"></div>
                    
                    <div className="relative bg-black rounded-xl p-2 flex flex-col gap-4">
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="e.g. A startup launches an AI assistant and gets attacked by competitors, regulators, and public backlash..."
                            className="w-full h-32 bg-transparent border-none text-white/90 focus:ring-0 resize-none font-mono text-sm p-4 placeholder-white/20"
                            disabled={isGenerating}
                        />
                        
                        <div className="flex items-center justify-between px-4 pb-4">
                            <span className="text-xs text-white/30 uppercase tracking-widest">
                                World Builder Protocol
                            </span>
                            <button
                                onClick={handleGenerate}
                                disabled={isGenerating || !prompt.trim()}
                                className="px-6 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white rounded-lg flex items-center gap-2 font-semibold transition-all"
                            >
                                {isGenerating ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Simulating...</>
                                ) : (
                                    <><Sparkles className="w-4 h-4 text-[#06b6d4]" /> Generate OS</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="mt-6 text-center text-[#f43f5e] text-sm bg-[#f43f5e]/10 border border-[#f43f5e]/20 p-4 rounded-xl">
                        {error}
                    </div>
                )}
            </motion.div>
        </div>
    );
}
