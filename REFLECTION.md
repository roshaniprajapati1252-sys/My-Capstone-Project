# Reflection

_Draft below, grounded in what actually happened during the build. Read it over and edit anything that doesn't match how it actually felt — this section is graded on honesty, not polish._

## What was hardest, and why

The environment kept fighting me more than the code did. A `git restore` at one point overwrote an untracked `package.json`, which meant rebuilding it from `package-lock.json` by hand instead of just re-running `npm install`. Separately, VS Code repeatedly opened the wrong project folder, which is how a duplicate `app/app/` directory ended up committed — dead code that sat in the repo until it got cleaned up in a later pass. Neither of these was a hard *technical* problem, but both cost real time and taught me to double-check my working directory and git state before trusting either.

The other hard part was building and testing a streaming feature while running on a zero Anthropic credit balance for a stretch — I couldn't live-test the real model responses, so I built a mock streaming mode just to verify the UI states (thinking indicator, token-by-token render, stop button) actually worked before the real API calls were even possible.

## What I'd do differently next time

Set up the test suite from day one instead of at the end. Writing `ChatInterface.test.tsx` after the component was already fully built meant retrofitting tests around existing behavior instead of using tests to catch bugs while I was still writing it. I'd also open a fresh terminal/PowerShell session before touching git remotes — most of the "remote origin already exists" and file-corruption issues I hit across projects this cycle came from reusing a stale shell session instead of starting clean.

## One thing that surprised me

How much of "AI integration done well" is actually about the boring parts — cancellation, error states, auto-scroll behavior — and not the model call itself. The `streamText` call in `route.ts` is a handful of lines; the part that took real thought was making sure closing the tab actually stops the server from paying for tokens (`abortSignal`), and that a stopped generation still leaves a normal, usable message behind instead of a half-broken one.
