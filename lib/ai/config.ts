/**
 * lib/ai/config.ts
 * ---------------------------------------------------------------------------
 * Single source of truth for the personal-agent chat feature.
 *
 * Routed through OpenRouter (not the direct Anthropic API) — OpenRouter
 * exposes an OpenAI-compatible endpoint that can call Claude, GPT, Llama,
 * and other models behind one API key and one billing account. Swapping
 * CHAT_MODEL below is how you switch models; nothing else in the app needs
 * to change either way.
 * ---------------------------------------------------------------------------
 */

import { createOpenRouter } from "@openrouter/ai-sdk-provider";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

/**
 * MODEL
 * ---------------------------------------------------------------------------
 * OpenRouter model IDs are "provider/model-name" — e.g.
 * "anthropic/claude-sonnet-4.5" for Claude, or a ":free" suffixed model
 * (check openrouter.ai/models for current free-tier options) if you want
 * to test without spending anything. Swap the string below to change
 * which model powers the whole app.
 */
export const CHAT_MODEL = openrouter("meta-llama/llama-3.1-8b-instruct:free");

/**
 * SYSTEM PROMPT
 * ---------------------------------------------------------------------------
 * Kept short and behavior-focused on purpose — this is a chat *feature*
 * inside a portfolio capstone, not a general-purpose assistant. Edit this
 * single string to change how every response in the app sounds; you should
 * never need to hardcode instructions inside the route handler or the
 * client component.
 */
export const CHAT_SYSTEM_PROMPT = `
You are the assistant embedded in Roshani Kumari's personal-agent app (part of the OUTPUT. portfolio).

Voice: direct, plain, confident. No fluff, no hedging, no marketing buzzwords.
Keep answers concise by default — expand only when the question actually needs it.
If you don't know something or a tool result is missing, say so plainly instead of guessing.
Use markdown sparingly: short paragraphs, and code blocks only for actual code.
`.trim();

/**
 * GENERATION SETTINGS
 * ---------------------------------------------------------------------------
 * Passed straight into streamText(). Kept as a separate object (rather than
 * inlined in the route handler) so route.ts stays focused on wiring, and
 * these numbers stay easy to tune from one place.
 */
export const CHAT_GENERATION_CONFIG = {
  /** Hard ceiling on response length. Raise this if replies get cut off. */
  maxOutputTokens: 1024,
  /** Lower = more deterministic/focused. Higher = more varied phrasing. */
  temperature: 0.7,
} as const;

/**
 * ROUTE SETTINGS
 * ---------------------------------------------------------------------------
 * Documented here for visibility, but NOT imported by route.ts: Next.js
 * requires route segment config (`export const maxDuration`) to be a
 * static literal in the route file itself. See the `maxDuration` export
 * at the top of app/api/chat/route.ts — keep that number in sync with
 * this one if you change either.
 */
export const CHAT_MAX_DURATION_SECONDS = 30;