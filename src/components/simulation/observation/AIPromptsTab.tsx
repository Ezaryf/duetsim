"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { useSimulationStore } from '@/stores/simulationStore';
import { Sparkles, ChevronDown, Brain, Users, TrendingUp, AlertTriangle } from 'lucide-react';

export default function AIPromptsTab() {
  const { consequenceResult, isAnalyzingConsequences, analyzeConsequences, eventHistory } = useSimulationStore();

  const lastEvent = eventHistory[eventHistory.length - 1];

  const handleAnalyze = () => {
    if (lastEvent) {
      analyzeConsequences(lastEvent.description);
    }
  };

  if (isAnalyzingConsequences) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          className="mb-4"
        >
          <Brain className="w-10 h-10 text-[#06b6d4]" />
        </motion.div>
        <p className="text-white/60 font-mono text-sm">Analyzing cascade...</p>
        <p className="text-white/30 text-xs mt-2">Tracing consequences through agent network</p>
      </div>
    );
  }

  if (!consequenceResult && !lastEvent) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <Sparkles className="w-8 h-8 text-white/20 mx-auto mb-4" />
        <h3 className="text-white/60 font-mono text-sm uppercase">Consequence Engine Ready</h3>
        <p className="text-xs text-white/30 mt-2 max-w-[250px]">
          Inject an event to analyze multi-step cascading consequences.
        </p>
      </div>
    );
  }

  if (!consequenceResult && lastEvent) {
    return (
      <div className="h-full flex flex-col p-4 gap-4">
        <div className="glass rounded-lg p-4 border border-white/10">
          <h4 className="text-white/60 text-xs uppercase tracking-widest mb-2">Latest Event</h4>
          <p className="text-white text-sm">{lastEvent.description}</p>
        </div>
        
        <button
          onClick={handleAnalyze}
          className="w-full py-3 bg-[#06b6d4] hover:bg-[#0891b2] text-white rounded-lg font-bold tracking-widest uppercase text-xs transition-all flex items-center justify-center gap-2"
        >
          <Brain className="w-4 h-4" /> Analyze Consequences
        </button>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 scrollbar-hide flex flex-col gap-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-white/90 uppercase tracking-[0.2em] text-[10px] font-bold font-mono">
          Cascade Analysis
        </h3>
        <span className="text-[10px] text-[#06b6d4] font-mono">{consequenceResult?.cascade?.length || 0} steps</span>
      </div>

      {/* Cascade Steps */}
      {consequenceResult?.cascade?.map((step: any, index: number) => (
        <motion.div
          key={step.step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="glass rounded-lg border border-white/10 overflow-hidden"
        >
          {/* Step Header */}
          <div className="bg-white/5 px-4 py-2 flex items-center justify-between">
            <span className="text-[#06b6d4] font-mono text-xs font-bold">STEP {step.step}</span>
            <span className="text-white/30 text-[10px]">{step.trigger.slice(0, 40)}...</span>
          </div>

          {/* Narrative */}
          <div className="px-4 py-3 border-b border-white/5">
            <p className="text-white/80 text-xs leading-relaxed">{step.narrative}</p>
          </div>

          {/* Perceptions Grid */}
          <div className="px-4 py-3 border-b border-white/5">
            <h5 className="text-white/40 text-[10px] uppercase tracking-widest mb-2 flex items-center gap-1">
              <Users className="w-3 h-3" /> Perceptions
            </h5>
            <div className="grid grid-cols-2 gap-2">
              {step.perceptions?.map((p: any, i: number) => (
                <div key={i} className="bg-black/30 rounded p-2">
                  <span className="text-[10px] font-mono text-[#f43f5e] uppercase">{p.agent}</span>
                  <p className="text-white/60 text-[10px] mt-1">{p.perception}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Actions Grid */}
          <div className="px-4 py-3 border-b border-white/5">
            <h5 className="text-white/40 text-[10px] uppercase tracking-widest mb-2 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Actions
            </h5>
            <div className="space-y-2">
              {step.actions?.map((a: any, i: number) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-[10px] font-mono text-[#06b6d4] uppercase shrink-0 w-16">{a.agent}</span>
                  <div>
                    <span className="text-white text-xs">{a.action}</span>
                    <p className="text-white/40 text-[10px]">{a.reasoning}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hidden Variable Shifts */}
          {step.hiddenVariableShifts?.length > 0 && (
            <div className="px-4 py-3">
              <h5 className="text-white/40 text-[10px] uppercase tracking-widest mb-2 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Hidden Variables
              </h5>
              <div className="space-y-2">
                {step.hiddenVariableShifts.map((hv: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-white/60">{hv.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-white/30">{hv.before}</span>
                      <span className="text-[#06b6d4]">→</span>
                      <span className={hv.after > hv.before ? 'text-green-400' : 'text-red-400'}>{hv.after}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      ))}

      {/* Final Outcome */}
      {consequenceResult?.finalOutcome && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-lg border border-[#06b6d4]/30 bg-[#06b6d4]/5 p-4"
        >
          <h4 className="text-[#06b6d4] text-xs uppercase tracking-widest mb-3 font-bold">Final Outcome</h4>
          <p className="text-white text-sm leading-relaxed mb-4">{consequenceResult.finalOutcome.narrative}</p>
          
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(consequenceResult.finalOutcome.resourceChanges).map(([agent, change]: [string, any]) => (
              <div key={agent} className="bg-black/30 rounded p-2 flex justify-between">
                <span className="text-white/50 text-xs uppercase">{agent}</span>
                <span className={String(change).startsWith('+') ? 'text-green-400' : 'text-red-400'}>{change}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Analyze Another Button */}
      {lastEvent && (
        <button
          onClick={handleAnalyze}
          className="w-full py-3 bg-[#06b6d4]/20 hover:bg-[#06b6d4]/30 border border-[#06b6d4]/50 text-[#06b6d4] rounded-lg font-bold tracking-widest uppercase text-xs transition-all flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4" /> Re-Analyze
        </button>
      )}
    </div>
  );
}
