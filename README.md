# OUTPUT. — Personal Agent (FE-06 Capstone)

A streaming AI chat interface built with Next.js, the Vercel AI SDK, and OpenRouter, wrapped in a six-screen shell for a future personal Google Workspace + Telegram agent.

**Live app:** https://my-capstone-project-6i78.vercel.app/
**Repo:** https://github.com/roshaniprajapati1252-sys/My-Capstone-Project

---

## Project brief

This app solves the "too many tabs" problem of checking Gmail, Calendar, and Drive separately by giving them one dashboard with a conversational assistant on top. It's built for one user — me — as a personal daily-driver, not a multi-tenant product. I chose this idea because it's the one FE-06 project that actually gets used after the internship ends: an AI layer over the tools I already open every day, instead of a demo that gets closed and forgotten.

**Current scope:** the chat assistant (Dashboard screen) is fully functional and is the AI integration this capstone demonstrates. Docs, Gmail, Calendar, Drive, and Telegram are scaffolded routes reserved for the next build phase — see [Known limitations](#known-limitations--future-improvements).

---

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | React 19, Tailwind CSS v4 |
| AI SDK | Vercel AI SDK (`ai`, `@ai-sdk/react`) |
| Model routing | OpenRouter (`@openrouter/ai-sdk-provider`) → `anthropic/claude-sonnet-4.5` |
| Testing | Vitest + React Testing Library |
| Deployment | Vercel |

---

## Setup & run

```bash
npm install
```

Create `.env.local` in the project root:

```
OPENROUTER_API_KEY=sk-or-v1-...
```

Get a key at [openrouter.ai/keys](https://openrouter.ai/keys) — note it's only shown in full once, at creation.

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). That's it — one install, one env var, one command.

### Other scripts

```bash
npm run build          # production build
npm run lint           # ESLint
npm test               # run the test suite once
npm run test:watch     # watch mode
npm run test:coverage  # coverage report
```

---

## Architecture overview

```
app/
  page.tsx              Dashboard — nav grid + embedded ChatInterface
  layout.tsx             Root layout: fonts, nav, OUTPUT. brand shell
  api/chat/route.ts       Server route: the only place OPENROUTER_API_KEY is touched
  health/page.tsx         Live health check (pings an external API, renders status)
  docs/ gmail/ calendar/  Placeholder routes for future integrations
  drive/ telegram/page.tsx

components/chat/
  ChatInterface.tsx       Client component: message list, input, streaming state

lib/ai/
  config.ts                Model, system prompt, generation settings — single source of truth
```

**Request flow:** `ChatInterface` calls `useChat` (from `@ai-sdk/react`) with a `DefaultChatTransport` pointed at `/api/chat`. The route handler converts the message history with `convertToModelMessages`, calls `streamText` against the OpenRouter-routed Claude model, and returns `toUIMessageStreamResponse()` — an SSE stream `useChat` consumes directly, so no manual stream-parsing exists on either side.

**Why OpenRouter instead of calling Anthropic directly:** one API key and one billing account can front Claude, GPT, or other models. Swapping `CHAT_MODEL` in `lib/ai/config.ts` is the only change needed to switch models — nothing else in the app knows or cares which provider is behind it.

---

## AI integration explained

**What it is:** a streaming chat assistant embedded directly in the Dashboard, not a separate page. It's scoped with a short system prompt (see `lib/ai/config.ts`) telling it to stay direct and concise, matching the OUTPUT. brand voice, rather than acting as a generic chatbot.

**Why this counts as meaningful integration, not a gimmick:**
- Token-by-token streaming with a real UI response: a "thinking" indicator that hands off cleanly to streamed text, a stop button that actually cancels the upstream request (via `abortSignal: req.signal` — closing the client connection stops the server from paying for tokens it's no longer using), and auto-scroll that respects the user's own scroll position instead of yanking them to the bottom mid-read.
- Structured error handling: a dismissible error banner (`role="alert"`) rather than a silent failure or a raw stack trace.
- Markdown rendering with a streaming-safe sanitizer (`sanitizeStreamingMarkdown`) that closes dangling code fences while a message is still arriving, so partial code blocks don't break layout mid-stream.

**Prompt:** the system prompt is intentionally short and behavior-focused (see `CHAT_SYSTEM_PROMPT` in `lib/ai/config.ts`) — it sets voice and honesty ("say so plainly instead of guessing") rather than trying to hard-code every possible instruction.

---

## Testing evidence

11 tests, all passing, covering the component that matters most for this capstone:

```
✓ components/chat/ChatInterface.test.tsx (11 tests)

Test Files  1 passed (1)
     Tests  11 passed (11)
```

Coverage on `ChatInterface.tsx`:

```
File               | % Stmts | % Branch | % Funcs | % Lines
-------------------|---------|----------|---------|--------
ChatInterface.tsx  |   78.12 |    81.03 |   88.88 |   85.96
```

**What's covered:** empty state, send-button enable/disable logic, trimming + clearing input on submit, rejecting whitespace-only submissions, Enter-to-send vs. Shift+Enter-for-newline, rendering existing messages by role, the thinking indicator, the busy-state send→stop button swap and disabled textarea, and the error banner + dismiss flow.

**Why `useChat` itself is mocked:** it owns real network I/O — testing it for real means hitting OpenRouter, which costs money and isn't deterministic. The mock drives the component through the same states the real hook produces (`ready` / `submitted` / `streaming` / `error`) and asserts on what `ChatInterface` does with each state, which is the part actually worth testing here.

Run it yourself: `npm test`

---

## Performance & accessibility audit

**Lighthouse (mobile, run against the live Vercel URL):** Performance **71** / Accessibility **100** / Best Practices **100** / SEO **100**

**What the audit found and what I did about it:**

The first run scored Performance **69**, with all Core Web Vitals (FCP, LCP, CLS) in the green zone but Total Blocking Time sitting at ~2.3s — the diagnostics pointed straight at it: "Reduce JavaScript execution time" and "Minimize main-thread work," caused by the full chat bundle (streaming SDK, markdown rendering) loading eagerly on first paint even though a visitor's first view is just static dashboard cards.

Fix attempt #1 — lazy-loading `ChatInterface` with `next/dynamic` and `ssr: false` — actually made it *worse* (Performance dropped to 46), because disabling server-side rendering meant the browser now had to wait on an extra client-side fetch before painting content that used to render immediately from the server. I reverted `ssr: false` but kept the dynamic import, which still code-splits the chat bundle into its own chunk without delaying first paint. That brought Performance to **71** with no regression elsewhere — a real improvement, not a large one, and I'm noting that honestly rather than rounding it up.

**axe/DevTools Issues panel:** 1 issue flagged — "A form field element should have an id or name attribute." Not yet fixed; flagged here rather than silently ignored.

Local checks already passing, independent of the live audit:
- `npx tsc --noEmit` — 0 type errors
- `npx eslint .` — 0 errors
- Interactive elements (`Send message`, `Stop generating`, `Dismiss`) carry explicit `aria-label`s; the error banner uses `role="alert"`; the thinking indicator uses `aria-live="polite"` so screen readers announce state changes without needing to poll.

---

## Known limitations & future improvements

- **Docs, Gmail, Calendar, Drive, and Telegram are placeholder routes.** Only the Dashboard's chat assistant is functionally complete. This capstone demonstrates the AI-integration and production-readiness bar on that one screen rather than shipping five shallow integrations.
- **No conversation persistence.** Refreshing the page clears the chat history — there's no database or local storage layer yet.
- **Single-user, no auth.** There's no login; anyone with the URL can use the assistant against my API key. Fine for a personal tool, not fine to share widely as-is.
- **Fixed model, no user-facing model picker.** Swapping models means editing `lib/ai/config.ts` and redeploying.
- **Next planned step:** wire the Gmail/Calendar/Drive routes to real Google APIs (already explored in FL-04 tool-calling work) so the assistant can act on real data instead of just chatting.
- **Model is temporarily `meta-llama/llama-3.1-8b-instruct` instead of Claude.** The OpenRouter account backing this deployment ran out of credit mid-build; swapping `CHAT_MODEL` in `lib/ai/config.ts` back to `anthropic/claude-sonnet-4.5` once the account is topped up is a one-line change — the architecture doesn't care which model is behind it, which is the whole point of routing through OpenRouter.

---

## Deployment & operation

See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for the filled-out deployment checklist, failure modes, and rollback plan.

`/health` gives a live status check — it pings an external endpoint and renders `{ status, checkedAt }` as JSON, so "is this deployment actually working" has a real answer instead of just "the page loads."

---

## Reflection

See [`REFLECTION.md`](./REFLECTION.md).
