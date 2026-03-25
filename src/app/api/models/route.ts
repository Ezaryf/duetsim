import { NextResponse } from 'next/server'

/**
 * Server-side proxy for fetching models from any OpenAI-compatible provider.
 * Avoids CORS issues by making the request from the server instead of the browser.
 */
export async function POST(req: Request) {
  try {
    const { baseUrl, apiKey } = await req.json()

    if (!baseUrl) {
      return NextResponse.json({ error: 'Missing baseUrl' }, { status: 400 })
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`

    const res = await fetch(`${baseUrl}/models`, {
      headers,
      signal: controller.signal
    })
    clearTimeout(timeoutId)

    if (!res.ok) {
      // 404/405 = provider doesn't expose /models — return empty list
      if (res.status === 404 || res.status === 405) {
        return NextResponse.json({ data: [] })
      }
      // Pass through 429 specifically
      if (res.status === 429) {
        return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
      }
      const errText = await res.text()
      return NextResponse.json({ error: errText }, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json(data)

  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      return NextResponse.json({ error: 'Timed out fetching models' }, { status: 504 })
    }
    return NextResponse.json({ error: 'Failed to fetch models' }, { status: 500 })
  }
}
