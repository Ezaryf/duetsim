import { NextResponse } from 'next/server'
import { buildSystemPrompt } from '@/lib/ai/prompts'

// ─── Types ───────────────────────────────────────────────────────────────────

type EndpointType = 'chat' | 'messages' | 'responses'

interface PredictRequest {
  entityA: string
  entityB: string
  scoreA: number
  scoreB: number
  eventText: string
  target?: 'A' | 'B' | 'both'
  connection: {
    apiKey: string
    baseUrl: string
    model: string
    endpointType?: EndpointType
  }
}

interface UnifiedPrediction {
  impact: number
  probability?: number
  label: string
  description: string
  stateChange?: string
}

// ─── Validation ──────────────────────────────────────────────────────────────

const REQUIRED_FIELDS = ['impact', 'label', 'description'] as const

function validateAIResponse(parsed: Record<string, unknown>): string | null {
  for (const field of REQUIRED_FIELDS) {
    if (parsed[field] === undefined || parsed[field] === null) {
      return `AI response missing required field: "${field}"`
    }
  }
  if (typeof parsed.impact !== 'number' || parsed.impact < -100 || parsed.impact > 100) {
    return `AI returned invalid impact value: ${parsed.impact}. Expected number between -100 and 100.`
  }
  return null
}

// ─── Format-Specific Request Builders ────────────────────────────────────────

function buildChatRequest(model: string, systemPrompt: string) {
  return {
    path: '/chat/completions',
    body: {
      model,
      messages: [
        { role: 'system', content: 'You are a simulation engine that only outputs JSON.' },
        { role: 'user', content: systemPrompt }
      ],
      temperature: 0.2
    },
    extractContent: (data: Record<string, unknown>) => {
      const choices = data.choices as Array<{ message: { content: string } }> | undefined
      return choices?.[0]?.message?.content || '{}'
    }
  }
}

function buildMessagesRequest(model: string, systemPrompt: string) {
  return {
    path: '/messages',
    body: {
      model,
      max_tokens: 1024,
      system: 'You are a simulation engine that only outputs JSON.',
      messages: [
        { role: 'user', content: systemPrompt }
      ],
      temperature: 0.2
    },
    extractContent: (data: Record<string, unknown>) => {
      const content = data.content as Array<{ type: string; text: string }> | undefined
      const textBlock = content?.find(c => c.type === 'text')
      return textBlock?.text || '{}'
    }
  }
}

function buildResponsesRequest(model: string, systemPrompt: string) {
  return {
    path: '/responses',
    body: {
      model,
      instructions: 'You are a simulation engine that only outputs JSON.',
      input: systemPrompt,
      temperature: 0.2
    },
    extractContent: (data: Record<string, unknown>) => {
      // Responses API returns output array with message items
      const output = data.output as Array<{ type: string; content?: Array<{ type: string; text: string }> }> | undefined
      const msgItem = output?.find(o => o.type === 'message')
      const textPart = msgItem?.content?.find(c => c.type === 'output_text')
      return textPart?.text || '{}'
    }
  }
}

function getRequestConfig(endpointType: EndpointType, model: string, systemPrompt: string) {
  switch (endpointType) {
    case 'messages': return buildMessagesRequest(model, systemPrompt)
    case 'responses': return buildResponsesRequest(model, systemPrompt)
    case 'chat':
    default: return buildChatRequest(model, systemPrompt)
  }
}

// ─── Main Handler ────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const body: PredictRequest = await req.json()
    const { entityA, entityB, scoreA, scoreB, eventText, target = 'A', connection } = body

    let targetName: string
    if (target === 'A') targetName = entityA
    else if (target === 'B') targetName = entityB
    else targetName = 'Both Entities'

    if (!connection?.apiKey) {
      return NextResponse.json({ error: 'Missing API Key' }, { status: 401 })
    }

    const endpointType: EndpointType = connection.endpointType || 'chat'
    const systemPrompt = buildSystemPrompt(entityA, entityB, scoreA, scoreB, eventText, targetName)
    const config = getRequestConfig(endpointType, connection.model || 'minimax-m2.5-free', systemPrompt)

    // Fetch with 30s timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    try {
      let response = await fetch(`${connection.baseUrl}${config.path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${connection.apiKey}`
        },
        body: JSON.stringify(config.body),
        signal: controller.signal
      })

      // Exponential backoff retry for 429 (Too Many Requests)
      const maxRetries = 3
      const baseDelay = 2000
      let retries = 0
      while (response.status === 429 && retries < maxRetries) {
        const delay = baseDelay * Math.pow(2, retries)
        await new Promise(resolve => setTimeout(resolve, delay))
        response = await fetch(`${connection.baseUrl}${config.path}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${connection.apiKey}`
          },
          body: JSON.stringify(config.body),
          signal: controller.signal
        })
        retries++
      }

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        let errorDetail = errorText
        try {
          const errJson = JSON.parse(errorText)
          errorDetail = errJson.error?.message || errJson.message || errorText
        } catch (_e) { /* raw text is fine */ }
        
        // Pass through 429 status explicitly
        return NextResponse.json(
          { error: `AI Provider Error: ${errorDetail}` }, 
          { status: response.status }
        )
      }

      const data = await response.json()
      const content = config.extractContent(data)

      // Robust extraction: find the first { and matching }
      const jsonMatch = /\{[\s\S]*\}/.exec(content)

      if (!jsonMatch) {
        return NextResponse.json({ error: 'The AI model did not return a recognizable JSON response.' }, { status: 502 })
      }

      let parsed: Record<string, unknown>
      try {
        parsed = JSON.parse(jsonMatch[0])
      } catch (_e) {
        return NextResponse.json({ error: 'AI output contained braces but was not valid JSON.' }, { status: 502 })
      }

      // Validate required fields
      const validationError = validateAIResponse(parsed)
      if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 502 })
      }

      return NextResponse.json(parsed as unknown as UnifiedPrediction)

    } catch (fetchErr: unknown) {
      clearTimeout(timeoutId)
      if (fetchErr instanceof Error && fetchErr.name === 'AbortError') {
        return NextResponse.json({ error: 'AI request timed out after 30 seconds. Try a different provider or check your connection.' }, { status: 504 })
      }
      throw fetchErr
    }

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error("AI Prediction Edge Error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
