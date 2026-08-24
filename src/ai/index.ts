import type { AiService } from "./types";
import { MockAiProvider } from "./mock-provider";

export type { AiService } from "./types";
export * from "./types";

let cachedService: AiService | null = null;

/**
 * Resolve the active AI provider at runtime based on `AI_PROVIDER` /
 * available API keys, without any caller ever importing a concrete
 * provider class directly.
 *
 * Real Claude/OpenAI/Gemini providers are intentionally not wired into this
 * MVP build (Phase 1 prioritizes the deterministic learning core — mastery,
 * SRS, quiz scoring — never depending on an external API being available).
 * Dropping in a real provider means: implement `AiService` in a new file
 * under `src/ai/`, and add one branch below — no other code changes.
 */
export function getAiService(): AiService {
  if (cachedService) return cachedService;

  const provider = process.env.AI_PROVIDER?.toLowerCase();
  const hasAnthropicKey = Boolean(process.env.ANTHROPIC_API_KEY);
  const hasOpenAiKey = Boolean(process.env.OPENAI_API_KEY);
  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY);

  if (provider === "anthropic" && hasAnthropicKey) {
    // TODO: return new AnthropicAiProvider() once implemented.
    cachedService = new MockAiProvider();
  } else if (provider === "openai" && hasOpenAiKey) {
    // TODO: return new OpenAiProvider() once implemented.
    cachedService = new MockAiProvider();
  } else if (provider === "gemini" && hasGeminiKey) {
    // TODO: return new GeminiAiProvider() once implemented.
    cachedService = new MockAiProvider();
  } else {
    cachedService = new MockAiProvider();
  }

  return cachedService;
}
