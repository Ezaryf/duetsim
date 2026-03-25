import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type EndpointType = 'chat' | 'messages' | 'responses'

interface SettingsState {
  apiKey: string
  baseUrl: string
  model: string
  endpointType: EndpointType
  providerType: string
  setApiKey: (key: string) => void
  setBaseUrl: (url: string) => void
  setModel: (model: string) => void
  setEndpointType: (type: EndpointType) => void
  setProviderType: (type: string) => void
  setConnection: (conn: { baseUrl: string; model: string; endpointType: EndpointType; providerType: string }) => void
}

/**
 * Infer the correct OpenCode Zen endpoint type from a model ID.
 * GPT models → Responses API, Claude → Messages API, everything else → Chat Completions.
 */
export function inferEndpointType(modelId: string): EndpointType {
  const id = modelId.toLowerCase()
  if (id.startsWith('gpt-')) return 'responses'
  if (id.startsWith('claude-')) return 'messages'
  return 'chat'
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      apiKey: '',
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-4o-mini',
      endpointType: 'chat' as EndpointType,
      providerType: 'openai',
      setApiKey: (key) => set({ apiKey: key }),
      setBaseUrl: (url) => set({ baseUrl: url }),
      setModel: (model) => set({ model }),
      setEndpointType: (type) => set({ endpointType: type }),
      setProviderType: (type) => set({ providerType: type }),
      setConnection: (conn) => set(conn),
    }),
    {
      name: 'futureforge-settings',
    }
  )
)
