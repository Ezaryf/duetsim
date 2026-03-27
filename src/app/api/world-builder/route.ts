import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { prompt, connection } = await req.json();

    if (!connection?.apiKey) {
      return new Response('Missing API Key', { status: 401 });
    }

    const openai = createOpenAI({
      apiKey: connection.apiKey,
      baseURL: connection.baseUrl || 'https://api.openai.com/v1'
    });

    const result = await generateText({
      model: openai(connection.model || 'gpt-4o'),
      prompt: `You are an expert world builder and narrative simulation director. 
      Given the following premise, construct a closed ecosystem with a protagonist, antagonist, intrinsic world physics rules, and hidden variables running beneath the surface.
      
      CRITICAL INSTRUCTION: You MUST return ONLY a raw JSON object with absolutely NO markdown formatting, NO backticks, and NO conversational text. Just the raw JSON.
      
      EXTRACT THIS EXACT JSON STRUCTURE:
      {
        "protagonist": {
          "name": "string",
          "description": "string",
          "personalityConcept": "string"
        },
        "antagonist": {
          "name": "string",
          "description": "string",
          "personalityConcept": "string"
        },
        "worldRules": {
          "volatility": 50, // 0-100 indicating chaos
          "transparency": 50, // 0-100 indicating information speed
          "trustDecay": 50 // 0-100 indicating base cynicism
        },
        "hiddenVariables": [
          { "name": "Silent Resentment", "startingValue": 50 },
          { "name": "Market Panic", "startingValue": 20 },
          { "name": "Regulatory Heat", "startingValue": 10 }
        ], // exactly 3 thematic hidden forces
        "scenarioContext": "A brief, compelling opening paragraph describing the exact moment the simulation begins."
      }
      
      User Premise: "${prompt}"`,
    });

    let rawOutput = result.text.trim();
    if (rawOutput.startsWith('\`\`\`json')) {
        rawOutput = rawOutput.split('\`\`\`json')[1].split('\`\`\`')[0].trim();
    } else if (rawOutput.startsWith('\`\`\`')) {
        rawOutput = rawOutput.split('\`\`\`')[1].split('\`\`\`')[0].trim();
    }

    const parsedData = JSON.parse(rawOutput);

    return Response.json(parsedData);
  } catch (error: any) {
    console.error('World Builder Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
