# Reflection

_Draft below, grounded in what actually happened during the build. Read it over and edit anything that doesn't match how it actually felt — this section is graded on honesty, not polish._

## What was hardest, and why

The environment kept fighting me more than the code did. A `git restore` at one point overwrote an untracked `package.json`, which meant rebuilding it from `package-lock.json` by hand instead of just re-running `npm install`. Separately, VS Code repeatedly opened the wrong project folder, which is how a duplicate `app/app/` directory ended up committed — dead code that sat in the repo until it got cleaned up in a later pass. Neither of these was a hard *technical* problem, but both cost real time and taught me to double-check my working directory and git state before trusting either.

The other hard part was building and testing a streaming feature while running on a zero Anthropic credit balance for a stretch — I couldn't live-test the real model responses, so I built a mock streaming mode just to verify the UI states (thinking indicator, token-by-token render, stop button) actually worked before the real API calls were even possible.

The hardest single stretch, though, was getting the live deployment to actually talk to OpenRouter. The chat worked locally but failed on Vercel with "Something went wrong," and the real cause changed every time I fixed the previous one: first no environment variable was set at all, then it was set under the wrong key name (`openrouter` instead of `OPENROUTER_API_KEY`), then the value I'd pasted turned out to be OpenRouter's masked display string (`sk-or-v1-6ba...062`) rather than the real key — which only shows in full once, at creation — and finally, once a real working key was in place, the specific free-tier model slug I was using had been deprecated. Each fix produced a *different* error message, which is what made it hard: it would have been easy to assume the first fix hadn't worked and start second-guessing things that were actually already correct. Reading the Vercel function logs directly, and testing the API key against OpenRouter's `/auth/key` endpoint standalone with `Invoke-RestMethod` — outside my app entirely — was what finally cut through the guessing and showed exactly which layer was broken at each step.

## What I'd do differently next time

Set up the test suite from day one instead of at the end. Writing `ChatInterface.test.tsx` after the component was already fully built meant retrofitting tests around existing behavior instead of using tests to catch bugs while I was still writing it. I'd also open a fresh terminal/PowerShell session before touching git remotes — most of the "remote origin already exists" and file-corruption issues I hit across projects this cycle came from reusing a stale shell session instead of starting clean. And for deployment specifically: I'd verify an env var actually saved (by testing the deployed endpoint, not just trusting the dashboard UI) before assuming a fix worked and moving on to the next thing.

## One thing that surprised me

How much of "AI integration done well" is actually about the boring parts — cancellation, error states, auto-scroll behavior — and not the model call itself. The `streamText` call in `route.ts` is a handful of lines; the part that took real thought was making sure closing the tab actually stops the server from paying for tokens (`abortSignal`), and that a stopped generation still leaves a normal, usable message behind instead of a half-broken one.
