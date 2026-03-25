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

// ─── Debug: Check Available Models ─────────────────────────────────────────

async function checkAvailableModels(baseUrl: string, apiKey: string): Promise<string[]> {
  try {
    const res = await fetch(`${baseUrl}/models`, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    })
    if (res.ok) {
      const data = await res.json()
      return data.data?.map((m: { id: string }) => m.id) || []
    }
  } catch {}
  return []
}

// ─── Main Handler ────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const body: PredictRequest = await req.json()
    const { entityA, entityB, scoreA, scoreB, eventText, target = 'A', connection } = body

    console.log('[AI] Request:', { baseUrl: connection.baseUrl, model: connection.model, endpointType: connection.endpointType })

    let targetName: string
    if (target === 'A') targetName = entityA
    else if (target === 'B') targetName = entityB
    else targetName = 'Both Entities'

    if (!connection?.apiKey) {
      return NextResponse.json({ error: 'Missing API Key. Please add your OpenCode Zen API key in Settings.' }, { status: 401 })
    }

    const endpointType: EndpointType = connection.endpointType || 'chat'
    const systemPrompt = buildSystemPrompt(entityA, entityB, scoreA, scoreB, eventText, targetName)
    const config = getRequestConfig(endpointType, connection.model || 'minimax-m2.5-free', systemPrompt)

    const fullUrl = `${connection.baseUrl}${config.path}`
    console.log('[AI] Calling:', fullUrl)
    console.log('[AI] Model:', connection.model)
    console.log('[AI] Body:', JSON.stringify(config.body).substring(0, 200))

    // Fetch with 60s timeout (increased)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 60000)

    let response: Response | null = null
    let lastError: string = ''
    const maxRetries = 5
    const baseDelay = 3000

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        response = await fetch(fullUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${connection.apiKey}`
          },
          body: JSON.stringify(config.body),
          signal: controller.signal
        })

        console.log('[AI] Response status:', response.status, 'Attempt:', attempt + 1)

        // Success - break out of retry loop
        if (response.ok) break

        // Get error details
        const errorText = await response.text()
        console.log('[AI] Error response:', errorText.substring(0, 500))
        
        let errorDetail = errorText
        try {
          const errJson = JSON.parse(errorText)
          errorDetail = errJson.error?.message || errJson.message || errorText
        } catch {}

        // Check for specific errors
        if (response.status === 500 && errorDetail.includes('prompt_tokens')) {
          lastError = 'OpenCode Zen bug: Model returns 500 due to missing usage data. Try a different model like glm-5-free or big-pickle.'
          console.log('[AI] Known bug detected - stopping retries')
          break
        }

        if (response.status === 429) {
          lastError = `Rate limited (429). Attempt ${attempt + 1}/${maxRetries}.`
          const delay = baseDelay * Math.pow(1.5, attempt)
          console.log('[AI] Rate limited, waiting', delay / 1000, 's...')
          await new Promise(resolve => setTimeout(resolve, delay))
          continue
        }

        if (response.status === 401) {
          lastError = 'Authentication failed (401). Check your API key or ensure OpenCode Zen billing is set up.'
          break
        }

        if (response.status === 403) {
          lastError = 'Access forbidden (403). Your account may not have access to this model.'
          break
        }

        lastError = `AI Provider Error (${response.status}): ${errorDetail}`
        break

      } catch (fetchErr) {
        if (fetchErr instanceof Error && fetchErr.name === 'AbortError') {
          lastError = 'AI request timed out after 60 seconds.'
          break
        }
        lastError = `Network error: ${fetchErr instanceof Error ? fetchErr.message : 'Unknown'}`
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }

    clearTimeout(timeoutId)

    if (!response || !response.ok) {
      // Debug: check available models
      if (connection.baseUrl.includes('opencode.ai/zen')) {
        console.log('[AI] Checking available models...')
        const availableModels = await checkAvailableModels(connection.baseUrl, connection.apiKey)
        console.log('[AI] Available models:', availableModels)
        
        if (availableModels.length > 0 && !availableModels.includes(connection.model)) {
          return NextResponse.json({ 
            error: `Model "${connection.model}" not available on your account. Available models: ${availableModels.slice(0, 15).join(', ')}`,
            availableModels 
          }, { status: 400 })
        }
      }

      return NextResponse.json({ error: lastError }, { status: response?.status || 500 })
    }

    const data = await response.json()
    const content = config.extractContent(data)

    console.log('[AI] Response content:', content.substring(0, 200))

    // Robust extraction: find the first { and matching }
    const jsonMatch = /\{[\s\S]*\}/.exec(content)

    if (!jsonMatch) {
      return NextResponse.json({ error: 'The AI model did not return a recognizable JSON response.' }, { status: 502 })
    }

    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(jsonMatch[0])
    } catch {
      return NextResponse.json({ error: 'AI output contained braces but was not valid JSON.' }, { status: 502 })
    }

    // Validate required fields
    const validationError = validateAIResponse(parsed)
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 502 })
    }

    console.log('[AI] Success:', parsed)
    return NextResponse.json(parsed as unknown as UnifiedPrediction)

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[AI] Prediction Error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}