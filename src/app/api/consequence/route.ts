import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { 
      event, 
      worldRules, 
      hiddenVariables, 
      agentStates,
      connection,
      cascadeDepth = 3 
    } = await req.json();

    if (!connection?.apiKey) {
      return new Response('Missing API Key', { status: 401 });
    }

    const openai = createOpenAI({
      apiKey: connection.apiKey,
      baseURL: connection.baseUrl || 'https://api.openai.com/v1'
    });

    // Build context about current agent states
    const agentContext = Object.entries(agentStates || {}).map(([role, state]: [string, any]) => {
      return `${role}: resources=${state.resources}, trust=${state.trust}, riskTolerance=${state.riskTolerance}`;
    }).join('; ');

    const hiddenVars = (hiddenVariables || []).map((v: any) => `${v.name}=${v.value}`).join(', ');

    const result = await generateText({
      model: openai(connection.model || 'gpt-4o'),
      prompt: `You are an expert consequence analyst for a narrative simulation engine. Your job is to analyze how a single event creates cascading effects through a closed system of agents.

SYSTEM STATE:
- World Rules: volatility=${worldRules?.volatility}, transparency=${worldRules?.transparency}, trustDecay=${worldRules?.trustDecay}
- Hidden Variables: ${hiddenVars || 'none detected'}
- Agent States: ${agentContext}

THE TRIGGER EVENT:
"${event}"

TASK: Analyze this event through ${cascadeDepth} steps of cascading consequences. For each step:
1. Identify which agents perceive and react to the event
2. Determine their immediate response
3. Show how that response becomes the trigger for the next step
4. Include how hidden variables shift based on each action

CRITICAL INSTRUCTION: You MUST return ONLY a raw JSON object with absolutely NO markdown formatting, NO backticks, and NO conversational text. Just the raw JSON.

RETURN THIS EXACT JSON STRUCTURE:
{
  "cascade": [
    {
      "step": 1,
      "trigger": "The original event",
      "perceptions": [
        { "agent": "founder", "perception": "How they view the event", "emotionalState": "their reaction" },
        { "agent": "competitor", "perception": "How they view the event", "emotionalState": "their reaction" },
        { "agent": "regulator", "perception": "How they view the event", "emotionalState": "their reaction" },
        { "agent": "public", "perception": "How they view the event", "emotionalState": "their reaction" }
      ],
      "actions": [
        { "agent": "founder", "action": "what they do", "reasoning": "why they do it" },
        { "agent": "competitor", "action": "what they do", "reasoning": "why they do it" },
        { "agent": "regulator", "action": "what they do", "reasoning": "why they do it" },
        { "agent": "public", "action": "what they do", "reasoning": "why they do it" }
      ],
      "hiddenVariableShifts": [
        { "name": "variable name", "before": 50, "after": 65, "reason": "why it shifted" }
      ],
      "narrative": "A vivid description of what happens at this step"
    },
    {
      "step": 2,
      "trigger": "The action from step 1 that cascades",
      "perceptions": [...],
      "actions": [...],
      "hiddenVariableShifts": [...],
      "narrative": "..."
    },
    {
      "step": 3,
      "trigger": "The action from step 2 that cascades",
      "perceptions": [...],
      "actions": [...],
      "hiddenVariableShifts": [...],
      "narrative": "..."
    }
  ],
  "finalOutcome": {
    "winner": "which agent/entity emerges better",
    "narrative": "The complete story arc from event to conclusion",
    "resourceChanges": {
      "founder": "+/- change",
      "competitor": "+/- change",
      "regulator": "+/- change",
      "public": "+/- change"
    }
  }
}`,
    });

    let rawOutput = result.text.trim();
    if (rawOutput.startsWith('```json')) {
        rawOutput = rawOutput.split('```json')[1].split('```')[0].trim();
    } else if (rawOutput.startsWith('```')) {
        rawOutput = rawOutput.split('```')[1].split('```')[0].trim();
    }

    const parsedData = JSON.parse(rawOutput);

    return Response.json(parsedData);
  } catch (error: any) {
    console.error('Consequence Engine Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
