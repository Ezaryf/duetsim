"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { QUICK_INJECT_CATEGORIES } from '@/lib/engine/events';

export default function EventArsenal() {
    return (
        <div className="w-full h-full bg-black/60 backdrop-blur-md rounded-2xl border border-white/10 p-5 flex flex-col shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-32 h-32 bg-[#f43f5e]/10 blur-3xl pointer-events-none" />
            <h3 className="text-white/70 uppercase tracking-widest text-xs font-semibold mb-2 text-right">Deploy Arsenal</h3>
            <div className="flex flex-col gap-2 w-64">
                {QUICK_INJECT_CATEGORIES.map(cat => (
                    <motion.div
                        key={cat.category}
                        draggable
                        onDragStart={(e: any) => {
                            e.dataTransfer.setData("text/plain", cat.label);
                            e.currentTarget.style.opacity = "0.5";
                        }}
                        onDragEnd={(e: any) => {
                            e.currentTarget.style.opacity = "1";
                        }}
                        whileHover={{ scale: 1.05, x: -10 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-4 py-3 rounded-xl bg-black/60 backdrop-blur-md border border-white/20 text-sm font-bold text-white shadow-xl cursor-grab active:cursor-grabbing hover:border-purple-500/50 hover:shadow-purple-500/20"
                    >
                        {cat.icon} <span className="ml-2">{cat.label}</span>
                    </motion.div>
                ))}
            </div>
            <p className="text-[10px] text-white/40 text-right mt-2 font-mono">Drag into nodes to deploy.</p>
        </div>
    );
}
