/**
 * app/api/chat/route.ts
 * ---------------------------------------------------------------------------
 * Server-only route handler. This is the ONLY place ANTHROPIC_API_KEY is
 * ever touched — it's read from process.env by the @ai-sdk/anthropic
 * provider inside lib/ai/config.ts, never sent to or read by the client.
 *
 * Client (components/chat/ChatInterface.tsx) POSTs { messages } here via
 * useChat's built-in transport and reads back an SSE stream of UI message
 * chunks (text deltas, start/finish events, etc). We never handle the raw
 * SSE framing ourselves — toUIMessageStreamResponse() does that.
 * ---------------------------------------------------------------------------
 */

import { streamText, convertToModelMessages, type UIMessage } from "ai";
import {
  CHAT_MODEL,
  CHAT_SYSTEM_PROMPT,
  CHAT_GENERATION_CONFIG,
} from "@/lib/ai/config";

// Lets this function stream for longer than Vercel's default serverless
// timeout. Required for anything but the shortest replies.
//
// Next.js requires route segment config (maxDuration, runtime, etc.) to be
// a statically-analyzable literal — it can't be imported from config.ts,
// so this one number lives here instead. Keep it in sync with
// CHAT_MAX_DURATION_SECONDS in lib/ai/config.ts if you change either.
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  // convertToModelMessages is async in current AI SDK versions (it may
  // need to resolve file parts). Always await it before passing to
  // streamText, or TypeScript will (correctly) refuse to build.
  const modelMessages = await convertToModelMessages(messages);

  const result = streamText({
    model: CHAT_MODEL,
    system: CHAT_SYSTEM_PROMPT,
    messages: modelMessages,
    ...CHAT_GENERATION_CONFIG,

    // Ties the upstream Anthropic request to the incoming HTTP request's
    // signal. Without this, clicking "stop" on the client only stops the
    // client from *reading* the stream — the server keeps generating and
    // paying for tokens in the background. With it, closing the client
    // connection (stop button, tab close, navigation) actually cancels
    // the call to Anthropic.
    abortSignal: req.signal,

    // Fires server-side if the model errors out, or if the request was
    // aborted (stop button). Doesn't change client behavior — that's
    // handled in ChatInterface's onError — but it means a stopped
    // generation shows up in your server logs instead of vanishing silently.
    onError: ({ error }) => {
      console.error("[chat] streamText error:", error);
    },
  });

  // Converts the model stream into the SSE format useChat expects, and
  // sets the response headers useChat's transport looks for.
  return result.toUIMessageStreamResponse();
}
