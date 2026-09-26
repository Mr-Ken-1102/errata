/**
 * Provider-shape questions asked in more than one place: the LLM client when it
 * builds a model, and the config routes when they probe one. Kept together so
 * the two cannot answer them differently — they were byte-identical copies, and
 * a provider that counted as Gemini in one and not the other would fail in ways
 * that look like a bad API key.
 */

export function isGeminiProvider(provider: { preset?: string; baseURL: string }): boolean {
  return provider.preset === 'gemini' || provider.baseURL.includes('generativelanguage.googleapis.com')
}

/**
 * Gemini's OpenAI-compatible shim lives at `/openai` under the same base as the
 * native API. Strip it so the native endpoints resolve.
 */
export function normalizeGeminiBaseURL(baseURL: string): string {
  return baseURL.replace(/\/+$/, '').replace(/\/openai$/, '')
}

/**
 * OpenAI-compatible config probes historically accept either an API root
 * (for example Ollama at `http://localhost:11434`) or an already-versioned
 * endpoint. Keep runtime model creation on the same contract: trim trailing
 * slashes and add `/v1` only when the caller did not already provide a
 * numeric version suffix.
 */
export function normalizeOpenAICompatibleBaseURL(baseURL: string): string {
  const base = baseURL.replace(/\/+$/, '')
  return /\/v\d+$/.test(base) ? base : `${base}/v1`
}
