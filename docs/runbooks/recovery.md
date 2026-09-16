# WEGO recovery runbook

1. Stop rollout and inspect request-id logs without printing request bodies.
2. If data access is suspect, disable new sessions and rotate Telegram/session secrets.
3. For invite compromise, invalidate outstanding invitation hashes and issue new invites.
4. Restore PostgreSQL to a point-in-time copy, run migrations, and verify membership, check-in uniqueness, and Story source uniqueness.
5. For note-key incidents, keep the previous key version available for decrypt-only recovery, re-encrypt with the new key, then revoke the old key.
6. Smoke-test: create space → join second member → two check-ins → Guess → Reveal → Story → PNG download.
7. Re-enable traffic gradually while watching auth failures, Reveal locks, SSE connections, queue depth, and export errors.
