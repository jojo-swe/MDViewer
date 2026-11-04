# HANDOVER.md

Överlämning mellan agenter och sessioner. Läs innan du börjar, uppdatera innan du slutar.

## Aktuellt läge

*Senast inventerat 2026-11-04 av Claude (Cowork).*

Projekt: **Powerful. Lightweight. Beautiful.**

- Huvudbranch: `main`
- Senaste commit på `main`: 2026-11-01 `8043eed` chore: add privacy guard for the working tree (#13)
- Öppna PR:er: 5
- Andra brancher på remote: 8

## Pågående arbete

| Agent/vem | Branch | Status | Beskrivning |
|-----------|--------|--------|-------------|
| app/dependabot | `dependabot/cargo/src-tauri/tauri-2.11.1` | PR #12 öppen, uppdaterad 2026-10-24 | chore(deps): bump tauri from 2.10.2 to 2.11.1 in /src-tauri |
| app/dependabot | `dependabot/cargo/src-tauri/serde_with-3.22.0` | PR #11 öppen, uppdaterad 2026-10-24 | chore(deps): bump serde_with from 3.17.0 to 3.22.0 in /src-tauri |
| app/dependabot | `dependabot/npm_and_yarn/source-map-js-1.2.2` | PR #6 öppen, uppdaterad 2026-10-15 | chore(deps): bump source-map-js from 1.2.1 to 1.2.2 |
| app/dependabot | `dependabot/npm_and_yarn/dompurify-3.4.17` | PR #4 öppen, uppdaterad 2026-10-15 | chore(deps): bump dompurify from 3.4.11 to 3.4.17 |
| app/dependabot | `dependabot/npm_and_yarn/multi-05c505ab13` | PR #2 öppen, uppdaterad 2026-10-15 | chore(deps): bump brace-expansion |
| Cursor | `cursor/privacy-guard-kit-b223` | branch utan PR, senaste commit 2026-11-01 | chore: add privacy guard for the working tree |
| Codex | `codex/release-hardening-0.4.0` | branch utan PR, senaste commit 2026-10-24 | test: make recovery failure coverage deterministic |
| Claude | `claude/add-claude-documentation-E5upJ` | branch utan PR, senaste commit 2026-09-28 | ci: use numeric pre-release versions so Windows releases build |

## Nästa steg

- Granska och besluta om de öppna PR:erna ovan (merga eller stäng).
- Gå igenom brancher utan PR: öppna PR, merga eller radera (fråga användaren innan radering).
- Fyll på "Bygga och testa" i AGENTS.md om något saknas eller är fel.

## Kända problem

- Inga dokumenterade ännu.

## Senaste commits

- 2026-11-01 `8043eed` chore: add privacy guard for the working tree (#13)
- 2026-10-24 `391ce73` chore(release): harden v0.4.0-1 prerelease
- 2026-10-24 `cae3a99` test: make recovery failure coverage deterministic
- 2026-10-24 `7f68795` chore: harden 0.4.0 prerelease
- 2026-10-24 `36dc27e` chore(release): merge v0.2.0-3 Linux packaging fix
- 2026-10-24 `4978032` fix(release): support Linux prerelease bundles
- 2026-10-24 `9937bb1` chore(release): merge v0.2.0-2 release candidate
- 2026-10-24 `5f2c0c2` chore(release): prepare v0.2.0-2 candidate
- 2026-10-24 `a1335e9` feat: protect document data and recover sessions
- 2026-09-29 `67941e7` Merge pull request #1 from jojo-swe/claude/add-claude-documentation-E5upJ

## Logg

| Datum | Agent | Vad som gjordes |
|-------|-------|-----------------|
| 2026-11-04 | Claude (Cowork) | Lade till AGENTS.md, HANDOVER.md och CLAUDE.md; inventerade PR:er, brancher och commits. |
