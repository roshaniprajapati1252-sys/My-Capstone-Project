# Deployment Checklist

## Pre-deploy

- [x] `npx tsc --noEmit` passes with 0 errors
- [x] `npx eslint .` passes with 0 errors
- [x] `npm test` passes (11/11)
- [ ] `npm run build` succeeds on Vercel (font fetch requires network Vercel's build servers have; can't be verified in a sandboxed environment — confirm on next deploy)
- [x] `.env.local` is git-ignored; no secrets committed
- [ ] `OPENROUTER_API_KEY` set in Vercel → Project Settings → Environment Variables (Key and Value are separate fields — don't paste `KEY=value` into one box)
- [ ] Manual redeploy triggered after any env var change (Vercel does not auto-redeploy on env var edits)

## Deploy

- [ ] Push to `main`
- [ ] Vercel auto-deploy triggers (or manual redeploy if only env vars changed)
- [ ] Visit the live URL directly — click into the Dashboard, send a real message, confirm it streams
- [ ] Visit `/health` — confirm it returns `{ "status": "ok", ... }`

## Post-deploy verification

- [ ] Send a message and confirm token-by-token streaming (not one big chunk)
- [ ] Click Stop mid-response — confirm it stops cleanly and you can send again immediately
- [ ] Trigger an error state (e.g. temporarily bad API key) — confirm the error banner shows and Dismiss works, rather than a blank screen or crash
- [ ] Run Lighthouse (mobile) against the live URL — target 85+, aim for 90+
- [ ] Run axe DevTools or WAVE against the live URL — record violations and fixes in `README.md`

## How it fails safely

- **Model/API errors:** `streamText`'s `onError` logs server-side; the client shows a dismissible `role="alert"` banner via `ChatInterface`'s `error` state instead of a blank screen or unhandled exception.
- **Slow/hung generation:** `maxDuration = 30` caps the serverless function; the Stop button cancels the request via `abortSignal` tied to the client connection, so an abandoned tab doesn't keep burning tokens server-side.
- **Missing API key:** the OpenRouter client throws on first request rather than failing silently; surfaces as the same error banner.

## Rollback plan

Nothing fancy yet, and that's honest: **redeploy the previous commit from the Vercel dashboard** (Deployments tab → previous deployment → "Promote to Production"). No feature flags, no blue/green — for a single-user personal tool at this stage, instant rollback via Vercel's deployment history is enough. If this grows past a personal tool, the next step would be tagging releases in git so rollback targets are named rather than "whichever deployment looked fine."

## Monitoring

`/health` is the current monitoring surface — it's a manual check, not automated alerting. Genuine next step if this needs to be trusted unattended: a scheduled ping (e.g. a cron-triggered request) against `/health` with a notification on non-`ok` status.
