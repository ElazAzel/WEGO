# WEGO privacy model

WEGO stores only the data required for a shared daily ritual: Telegram account identity, space membership, daily mood/energy/want, optional private note, guesses, Story entries, and planned activities.

- A user's own check-in is readable to that user immediately.
- A partner's mood, energy, and want can be used to show whether Reveal is ready; the partner's note and guess remain hidden until Reveal.
- Story is shared space content. Saving a Reveal is an explicit action by a member.
- Analytics must be allowlisted product events only (`checkin_completed`, `guess_saved`, `reveal_opened`, `story_saved`, `share_exported`, `evolution_triggered`) and must exclude note text, tokens, Telegram ids, and raw answer values.
- Local preview state is stored under `wego-production-state-v1`; production bootstrap must replace it with server truth and clear stale preview state on account logout.

Deletion, export, retention period, and whether users can revoke a saved Story item are product/legal decisions to finalize before public launch.
