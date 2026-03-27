import { create } from 'zustand';

export interface WorldRules {
  volatility: number;
  transparency: number;
  trustDecay: number;
}

export interface HiddenVariable {
  name: string;
  value: number;
}

export interface DramaEntry {
    id: string;
    agent: 'CEO' | 'Regulator' | 'Public' | 'Competitor' | 'System' | 'Story' | 'Event';
    text: string;
    timestamp: number;
}

interface EmergentState {
    currentTick: number;
    maxTicks: number;
    isSimulating: boolean;
    nodes: any[];
    links: any[];
    // Addictive Engine States
    instability: number; // 0 to 100
    dramaFeed: DramaEntry[];
    worldRules: WorldRules | null;
    hiddenVariables: HiddenVariable[];
    scenarioContext: string | null;
    // Actions
    advanceTick: () => void;
    setTick: (tick: number) => void;
    injectEvent: (eventPayload: string) => void;
    addDrama: (entry: Omit<DramaEntry, 'id'>) => void;
    setWorldState: (rules: WorldRules, hidden: HiddenVariable[], context: string | null) => void;
}

export const useEmergentStore = create<EmergentState>((set, get) => ({
    currentTick: 0,
    maxTicks: 10,
    isSimulating: false,
    
    instability: 45, // starts stable
    dramaFeed: [
        { id: '1', agent: 'System', text: 'World Engine Initialized.', timestamp: 0 }
    ],
    worldRules: null,
    hiddenVariables: [],
    scenarioContext: null,
    
    // Mock branching data
    nodes: [
        { id: "Event_1", label: "Initial Setup", group: "Trigger", radius: 15, prob: 100, sentiment: 'neutral' },
        { id: "Outcome_1A", label: "Steady Growth", group: "Outcome", radius: 20, prob: 70, sentiment: 'positive' },
        { id: "Outcome_1B", label: "Regulatory Warning", group: "Outcome", radius: 15, prob: 30, sentiment: 'negative' },
    ],
    links: [
        { source: "Event_1", target: "Outcome_1A", value: 3 },
        { source: "Event_1", target: "Outcome_1B", value: 1 },
    ],

    advanceTick: () => set((state) => {
        const nextTick = Math.min(state.currentTick + 1, state.maxTicks);
        // Slowly increase tension if no action taken
        const newInstability = Math.min(100, state.instability + Math.random() * 5 + 2);
        
        return { 
            currentTick: nextTick,
            instability: newInstability
        };
    }),

    setTick: (tick) => set({ currentTick: tick }),

    injectEvent: (eventPayload: string) => set((state) => {
        const newNodeId = `Event_Chaos_${state.currentTick}`;
        const spike = 25; // Chaos skyrockets tension
        
        return {
            nodes: [...state.nodes, { id: newNodeId, label: eventPayload, group: "Chaos", radius: 30, prob: 100, sentiment: 'chaos' }],
            links: [...state.links, { source: state.nodes.at(-1)?.id, target: newNodeId, value: 5 }],
            currentTick: Math.min(state.currentTick + 1, state.maxTicks),
            instability: Math.min(100, state.instability + spike)
        }
    }),

    addDrama: (entry: Omit<DramaEntry, 'id'>) => set((state) => ({
        dramaFeed: [...state.dramaFeed, { ...entry, id: Math.random().toString(36).slice(2, 11) }]
    })),

    setWorldState: (rules: WorldRules, hidden: HiddenVariable[], context: string | null) => set(() => ({
        worldRules: rules,
        hiddenVariables: hidden,
        scenarioContext: context
    }))
}));
