# Deployment Checklist

## Pre-deploy

- [x] `npx tsc --noEmit` passes with 0 errors
- [x] `npx eslint .` passes with 0 errors
- [x] `npm test` passes (11/11)
- [x] `npm run build` succeeds on Vercel (confirmed live — app is deployed and working)
- [x] `.env.local` is git-ignored; no secrets committed
- [x] `OPENROUTER_API_KEY` set in Vercel → Project Settings → Environment Variables
- [x] Manual redeploy triggered after any env var change

## Deploy

- [x] Push to `main`
- [x] Vercel auto-deploy triggers
- [x] Visit the live URL directly — click into the Dashboard, send a real message, confirm it streams
- [ ] Visit `/health` — confirm it returns `{ "status": "ok", ... }`

## Post-deploy verification

- [x] Send a message and confirm token-by-token streaming (not one big chunk)
- [ ] Click Stop mid-response — confirm it stops cleanly and you can send again immediately
- [x] Trigger an error state — confirm the error banner shows and Dismiss works, rather than a blank screen or crash
- [x] Run Lighthouse (mobile) against the live URL — target 85+, aim for 90+
- [x] Run axe DevTools or WAVE against the live URL — record violations and fixes in `README.md`

## How it fails safely

- **Model/API errors:** `streamText`'s `onError` logs server-side; the client shows a dismissible `role="alert"` banner via `ChatInterface`'s `error` state instead of a blank screen or unhandled exception.
- **Slow/hung generation:** `maxDuration = 30` caps the serverless function; the Stop button cancels the request via `abortSignal` tied to the client connection, so an abandoned tab doesn't keep burning tokens server-side.
- **Missing API key:** the OpenRouter client throws on first request rather than failing silently; surfaces as the same error banner.

## Rollback plan

Nothing fancy yet, and that's honest: **redeploy the previous commit from the Vercel dashboard** (Deployments tab → previous deployment → "Promote to Production"). No feature flags, no blue/green — for a single-user personal tool at this stage, instant rollback via Vercel's deployment history is enough. If this grows past a personal tool, the next step would be tagging releases in git so rollback targets are named rather than "whichever deployment looked fine."

## Monitoring

`/health` is the current monitoring surface — it's a manual check, not automated alerting. Genuine next step if this needs to be trusted unattended: a scheduled ping (e.g. a cron-triggered request) against `/health` with a notification on non-`ok` status.
