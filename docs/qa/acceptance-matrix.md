# WEGO acceptance matrix

| Area | Acceptance check | Automated coverage |
|---|---|---|
| Onboarding | Five steps, valid name 1–24 chars, invite copy, reload after completion | `tests/e2e/onboarding.spec.ts` |
| Check-in | Mood/energy/want required, note max 240, Guess opens after submit | `tests/e2e/core-flow.spec.ts`, domain tests |
| Reveal | Locked until both same-day answers, guess result, save Story once | core e2e, API integration |
| Story/share | Newest first, selected entry opens dialog, PNG fallback works | UI/unit + manual export |
| Together | Filters and planned section persist | manual smoke; add dedicated e2e before launch |
| Мы | Own answer/vote persists; partner results remain gated | manual smoke; add dedicated e2e before launch |
| Realtime | SSE emits join/check-in/guess/story events and reconnects | SSE unit test; add two-client e2e before launch |
| Offline/day | Queue preserves order; old date returns conflict; new day is clean | queue unit test; add browser offline e2e before launch |
| Security | Telegram HMAC, membership, validation envelope, note privacy/encryption | API/security tests |
