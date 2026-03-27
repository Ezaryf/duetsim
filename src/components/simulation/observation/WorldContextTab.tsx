"use client";

import React from 'react';
import { useEmergentStore } from '@/stores/emergentStore';
import { EyeOff } from 'lucide-react';

// The extracted contents from the old WorldContextCard, now living as a full readable tab content
export default function WorldContextTab() {
    const { scenarioContext, hiddenVariables } = useEmergentStore();

    if (!scenarioContext) {
        return (
            <div className="p-8 text-center text-white/40 font-mono text-sm">
                No active scenario context loaded.
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto p-6 scrollbar-hide">
            <h2 className="text-lg text-white font-light tracking-widest uppercase mb-6">Original World Mandate</h2>
            
            <p className="text-white/80 text-base leading-loose font-serif italic border-l-4 border-[#06b6d4]/50 pl-5 mb-8">
                {scenarioContext}
            </p>

            <div className="mt-8">
                <div className="flex items-center gap-3 mb-6">
                    <EyeOff className="w-4 h-4 text-[#f43f5e]" />
                    <span className="text-sm text-[#f43f5e] uppercase tracking-widest font-bold">Unseen Forces</span>
                </div>
                
                <div className="space-y-6">
                    {hiddenVariables.map((v) => (
                        <div key={v.name} className="flex flex-col gap-2">
                            <div className="flex justify-between text-sm text-white/80 font-mono">
                                <span>{v.name}</span>
                                <span>{v.value}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-gradient-to-r from-[#f43f5e]/50 to-[#f43f5e] transition-all duration-1000" 
                                    style={{ width: `${v.value}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
