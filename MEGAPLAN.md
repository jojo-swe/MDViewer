# MDViewer Megaplan

Status: active roadmap after `v0.2.0-beta.1`
Planning horizon: beta hardening through `v1.0`
Primary target: reliable, fast, cross-platform desktop Markdown editing

## 1. Product outcome

Ship a `v1.0` that users can trust with real documents. The release should preserve Markdown accurately, never discard work without an explicit decision, behave consistently across Windows, macOS, and Linux, remain responsive on large files, and have a repeatable signed release process.

The order of work is intentional:

1. Protect user data.
2. Make editor state predictable.
3. Prove native workflows end to end.
4. Improve performance and accessibility.
5. Add focused authoring features.
6. Harden distribution and publish `v1.0`.

## 2. Current baseline

As of `v0.2.0-beta.1`:

- React 19, TypeScript, Vite, Milkdown/Crepe, and Tauri 2 are in place.
- WYSIWYG, source, and split modes exist.
- Tabs, recent files, explorer/outline, find/replace, linting, themes, shortcuts, autosave, image paste, Mermaid, KaTeX, syntax highlighting, and PDF export exist.
- `npm run lint`, `npm run typecheck`, `npm run test:coverage`, and `npm run build` pass locally.
- There are 214 passing tests across 27 test files.
- Overall coverage is about 59% statements / 60% lines, but `App.tsx` has no direct coverage and several integration-heavy components are untested.
- CI checks frontend lint, typecheck, tests, coverage generation, and web build on Ubuntu.
- Tagged releases build Tauri bundles on Windows, macOS, and Linux.
- The production web build succeeds but reports very large chunks, including an approximately 1.9 MB main chunk and several Mermaid/Shiki-related chunks above 500 KB.

### Implementation progress

Completed in the current development work:

- Typed save outcomes that distinguish success, cancellation, failure, and external conflict.
- Tab-targeted manual saves and autosave with stale-revision protection.
- Deterministic dirty-tab close queues for tab and window operations.
- Flushed temporary-file replacement with Windows rollback behavior.
- Save-time protection against externally changed or deleted files.
- Versioned, bounded crash-draft recovery for unclean shutdowns.
- Application integration coverage for the critical save and close paths.
- 247 passing frontend tests across 34 files, plus 4 Rust filesystem tests.
- Coverage floors raised to 70% lines/statements, 65% functions, and 60% branches.

Still pending from Phase 1: proactive filesystem watching, reload/compare UI, and cleanup/recovery for abandoned temporary or backup files. Later phases remain planned below.

## 3. Release principles and gates

Every milestone follows these rules:

- No silent data loss, even when save, filesystem, or rendering operations fail.
- File content has one authoritative in-memory representation per tab.
- UI components do not own persistence policy.
- Browser fallback remains useful for development, but desktop behavior is the product contract.
- New behavior includes unit tests; critical native flows include end-to-end coverage.
- Accessibility and keyboard operation are acceptance criteria, not cleanup work.
- Performance is measured with fixtures and budgets rather than judged by feel.
- A milestone is complete only when its exit gate is met.

Global `v1.0` gates:

- All quality commands pass on a clean checkout.
- Critical end-to-end workflows pass on all three desktop platforms.
- No open P0 or P1 data-loss defects.
- Crash-free smoke testing passes for open, edit, save, reopen, export, and close.
- Installers are signed/notarized where the platform requires it and update/release notes are published.
- User documentation matches the shipped UI and keyboard shortcuts.

## 4. Phase 0 — Reproducible baseline and decision log

Goal: make later work measurable and prevent accidental scope drift.

### P0-01: Create a product behavior matrix

Document expected behavior for desktop and browser across new, open, reopen, save, save as, autosave, close tab, close window, drag/drop, images, and PDF export.

Acceptance:

- Each operation states success, cancellation, and failure behavior.
- Desktop-only features are explicitly labeled.
- Windows, macOS, and Linux path differences are covered.

### P0-02: Add representative fixtures

Create small, medium, and large Markdown documents plus fixtures for GFM, tables, nested lists, Unicode, CRLF/LF, front matter, HTML, math, Mermaid, code blocks, local images, malformed syntax, and very long lines.

Acceptance:

- Fixtures contain no private data and can be committed.
- Round-trip expectations are recorded for constructs WYSIWYG cannot preserve exactly.

### P0-03: Establish budgets

Record startup, file-open, mode-switch, keystroke responsiveness, save latency, memory growth, test coverage, and bundle-size baselines.

Initial targets:

- No editor remount on a normal source keystroke.
- No visible typing stall for a 1 MB document on reference hardware.
- Main startup chunk below 750 KB minified unless a documented exception is approved.
- At least 80% line coverage for state/persistence modules and complete scenario coverage for data-loss paths.

Exit gate: behavior matrix, fixtures, and baseline measurements are committed and reviewed.

## 5. Phase 1 — Data safety and file lifecycle

Goal: eliminate known paths that can lose or misdirect content.

### P1-01: Centralize document commands

Introduce a document service/controller with explicit operations such as `openDocument`, `saveDocument(tabId)`, `saveDocumentAs(tabId)`, `requestCloseTabs(tabIds)`, and `requestWindowClose`.

Acceptance:

- Save always targets the requested tab, not whichever tab happens to be active later.
- Results are typed as saved, cancelled, or failed.
- Components do not infer success from a missing exception.
- File I/O errors retain dirty state and surface actionable messages.

### P1-02: Fix save-before-close semantics

Current risk: the close path continues after Save As cancellation or a save exception.

Acceptance:

- Cancelled Save As leaves the tab open and dirty.
- Failed save leaves the tab open and dirty.
- Discard closes only after an explicit discard action.
- Window close processes dirty tabs deterministically.
- Tests cover saved, cancelled, failed, discarded, and multi-tab cases.

### P1-03: Replace parallel bulk-close prompts with a close queue

Current risk: Close Others and Close All trigger multiple state updates, so later dialogs can overwrite earlier ones.

Acceptance:

- A single queue owns the close sequence.
- The dialog can clearly identify the current file and remaining count.
- Cancel stops the entire operation without affecting unprocessed dirty tabs.
- Optional “save all” and “discard all” choices are added only after the basic queue is proven.

### P1-04: Make autosave tab-specific

Current risk: the autosave hook receives a tab but invokes a callback bound to active-tab state.

Acceptance:

- Timer identity includes tab ID and content revision.
- Switching tabs cannot save content into the wrong path.
- A stale completion cannot mark newer content as saved.
- Save failures produce an error status and leave the document dirty.
- Untitled documents never open an automatic Save As dialog.

### P1-05: Add atomic desktop saves

Write to a sibling temporary file, flush when supported, and replace the destination. Preserve original content if replacement fails.

Acceptance:

- Interrupted writes do not truncate the original document.
- Recovery/cleanup behavior for abandoned temporary files is documented.
- Windows replacement semantics are tested separately.

### P1-06: Handle external file changes

Track modification metadata and detect changes made outside MDViewer.

Acceptance:

- Clean tabs can offer safe reload.
- Dirty tabs show a conflict dialog with keep, reload, and compare-oriented choices.
- Deleted or moved files do not silently recreate on autosave.

### P1-07: Restore sessions and recover drafts

Persist open tabs, active tab, unsaved content snapshots, sidebar state, and editor mode with a schema version.

Acceptance:

- Unclean shutdown recovery is distinguishable from normal session restore.
- Recovery data is updated with bounded debounce and size limits.
- A corrupt session store falls back safely.
- Users can discard recovered drafts.

Exit gate: automated tests demonstrate no content loss across save cancellation/failure, bulk close, tab switching during autosave, and simulated restart.

## 6. Phase 2 — Editor state and Markdown fidelity

Goal: establish one predictable content pipeline across all three modes.

### P2-01: Define the document state model

Use a reducer or external store with normalized tabs and revision counters. Separate persisted content, current content, editor view state, file metadata, and asynchronous operation state.

Acceptance:

- State transitions are pure and directly tested.
- Dirty state is derived from revisions or canonical content.
- Async actions reject stale completions.
- `App.tsx` becomes orchestration/layout rather than the owner of every workflow.

### P2-02: Stabilize Milkdown lifecycle

Current risk: initialization starts with default content, external content can trigger another creation, and content/theme changes can destroy and recreate the editor.

Acceptance:

- The editor initializes exactly once per tab attachment.
- Opening an empty document does not inject welcome Markdown.
- Programmatic updates do not echo as user edits.
- Theme changes do not rebuild the document.
- Async create/destroy operations cannot attach a stale instance.

### P2-03: Replace split-view remounting with controlled synchronization

Current risk: each source edit increments a React key and rebuilds the WYSIWYG pane.

Acceptance:

- Source edits update preview incrementally or with a measured debounce.
- Cursor, scroll, and selection remain stable where practical.
- WYSIWYG edits update source without feedback loops.
- Large-document typing meets the Phase 0 responsiveness budget.

### P2-04: Establish a Markdown fidelity contract

Run fixtures through parse/edit/serialize cycles and classify syntax as preserved, normalized, displayed read-only, or unsupported.

Acceptance:

- GFM basics, code fences, tables, task lists, links, images, Unicode, and line endings have explicit tests.
- Unsupported constructs warn before a destructive WYSIWYG round trip.
- Front matter and raw HTML receive a deliberate product decision.

### P2-05: Make rendering safe and observable

Unify Shiki, Mermaid, KaTeX, and image rendering behind cancellable jobs keyed by document revision.

Acceptance:

- Rendering errors appear inline without damaging source.
- Stale rendering results are ignored.
- Mermaid SVG handling has an explicit sanitization policy.
- Repeated theme changes do not leak DOM nodes or workers.

### P2-06: Upgrade source editing ergonomics

Implement multi-line indent/outdent, preserve selection, configurable tab width, line/column navigation, and undo-safe programmatic changes. Evaluate a code-editor component only against bundle, accessibility, and fidelity budgets.

Exit gate: fixture round trips pass at the declared fidelity level, editor instances remain stable during routine edits, and mode switching is covered by integration tests.

## 7. Phase 3 — Native integration and end-to-end proof

Goal: test the desktop application users actually install.

### P3-01: Add application integration tests

Test `App` workflows with mocked adapters before introducing full native automation.

Priority scenarios:

- Open into untouched tab and open duplicate file.
- Edit, save, Save As cancel, and save failure.
- Autosave while switching tabs.
- Close one, close others, close all, and window close.
- Session recovery.
- Source/WYSIWYG/split synchronization.
- Recent-file missing path and external file conflict.

### P3-02: Add desktop smoke automation

Use a supported Tauri/WebDriver path or a thin test harness around the platform adapters.

Acceptance:

- CI exercises real temporary files.
- At least one smoke workflow runs on each release platform.
- Screenshots and logs are retained on failure.

### P3-03: Expand CI

Acceptance:

- Frontend quality runs on the minimum supported Node version and current LTS.
- Rust formatting, linting, and tests run in CI.
- Tauri compile checks run before release tags.
- Coverage thresholds prevent regression in critical modules.
- Dependency caching is deterministic and lockfiles are enforced.

### P3-04: Test platform behavior

Cover file associations, Unicode paths, long paths, CRLF/LF, permission denial, network/removable drives, sandbox restrictions, window controls, drag/drop, and native dialogs.

Exit gate: the release candidate smoke suite passes on Windows, macOS, and Linux using packaged binaries.

## 8. Phase 4 — Performance and resource use

Goal: keep the application lightweight in actual startup and editing paths.

### P4-01: Audit and split bundles

Lazy-load settings, command palette, PDF export, Mermaid, KaTeX, and syntax languages where meaningful. Configure deliberate Rollup chunks and a bundle report.

Acceptance:

- Startup does not fetch diagram/math/highlighting engines until needed.
- Only supported/common Shiki languages ship eagerly; uncommon languages load on demand.
- CI records bundle sizes and rejects material regressions.

### P4-02: Bound background work

Debounce and cancel lint, outline parsing, highlighting, diagram rendering, session snapshots, and split preview updates by revision.

Acceptance:

- No unbounded queue grows during rapid typing.
- Closing/switching a tab cancels irrelevant work.
- Memory returns near baseline after repeatedly opening and closing large documents.

### P4-03: Optimize large-document UI

Avoid rendering one React node per line number for huge files, virtualize expensive lists/trees, and measure sidebar traversal.

Exit gate: startup, typing, mode switch, and memory budgets from Phase 0 pass on all reference fixtures.

## 9. Phase 5 — Accessibility and UX consistency

Goal: make every core workflow understandable and operable without a mouse.

### P5-01: Keyboard and focus system

Acceptance:

- Dialogs and panels trap/restore focus correctly.
- Tab bar, explorer, outline, menus, palette, settings, and lint results follow standard keyboard patterns.
- Escape behavior is layered so only the topmost surface closes.
- Shortcut conflicts include reserved/system combinations.

### P5-02: Semantic UI and announcements

Add labels, roles, names, selected/expanded states, live announcements for save/errors, and accessible dirty-state indicators.

### P5-03: Visual accessibility

Verify theme contrast, visible focus, zoom/reflow, reduced motion, high contrast, and 200% text scaling.

### P5-04: Error and empty states

Replace silent catches in rendering/image flows with contextual, non-destructive feedback. Add recovery actions for missing recent files, inaccessible folders, unsupported syntax, and export failures.

Exit gate: automated accessibility checks pass and a manual keyboard/screen-reader checklist covers every core workflow.

## 10. Phase 6 — Focused authoring improvements

Goal: add features only after reliability and fidelity foundations are stable.

Recommended order:

1. Document formatting commands shared by toolbar, shortcuts, context menu, and palette.
2. Link and image dialogs with relative-path handling and alt-text prompts.
3. Table editing improvements.
4. Workspace-wide search with bounded/cancellable traversal.
5. File create, rename, move, and delete with confirmation and open-tab reconciliation.
6. Optional spellchecking using native capabilities where available.
7. Export improvements: controlled HTML/PDF styling and deterministic print layout.

Each feature must include:

- Command registration and discoverable UI.
- Keyboard and screen-reader behavior.
- Undo/redo semantics.
- Markdown round-trip tests.
- Large-document and error-path tests where relevant.

Deferred beyond `v1.0` unless user evidence changes priority:

- Plugin ecosystem.
- Cloud sync or collaboration.
- Git client features.
- Mobile applications.
- Proprietary document formats.

## 11. Phase 7 — Security, privacy, and dependency hygiene

Goal: make the local-first trust model explicit and keep the attack surface narrow.

### P7-01: Threat model document content

Review raw HTML, link protocols, image sources, Mermaid SVG, pasted files, folder traversal, and exported markup.

### P7-02: Tighten Tauri permissions

Scope filesystem access to user-selected files/directories where Tauri permits it. Remove redundant capability grants and test denial paths.

### P7-03: Harden content policies

Maintain a minimal CSP, block unsafe navigation schemes, decide how external links open, and sanitize any generated/injected markup according to its trust boundary.

### P7-04: Automate dependency maintenance

Enable update PRs, vulnerability review, license checks, and a documented response policy. Pin CI actions to reviewed versions or immutable references where practical.

Exit gate: threat model reviewed, no unresolved high-severity dependency findings, and permissions match documented product behavior.

## 12. Phase 8 — Packaging, updates, and `v1.0`

Goal: make releases boring, repeatable, and reversible.

### P8-01: Version and changelog automation

Keep `package.json`, Tauri config, tags, release notes, and in-app version synchronized. Generate human-readable changes from curated entries.

### P8-02: Signing and notarization

Configure Windows code signing, Apple signing/notarization, and appropriate Linux metadata. Keep secrets out of forks and logs.

### P8-03: Update strategy

Decide whether `v1.0` includes Tauri updater support. If included, verify signed manifests, stable/beta channels, rollback behavior, and interrupted updates. If deferred, document manual update UX.

### P8-04: Distribution quality

Verify install, upgrade from beta, uninstall, file associations, icons, metadata, license inclusion, and clean-machine launch.

### P8-05: Documentation and support

Publish installation troubleshooting, data locations, backup/recovery behavior, supported Markdown, privacy statement, known limitations, and issue templates with diagnostics guidance.

Exit gate: a release candidate survives a full clean-machine matrix, recovery drill, and signed publishing dry run before the final tag.

## 13. Suggested milestone map

### `v0.2.0-beta.2` — Data safety

- Complete P0 and P1.
- Add App/document-service integration tests.
- Do not add major features.

### `v0.3.0-beta.1` — Editor fidelity

- Complete P2.
- Publish supported-Markdown behavior.
- Meet routine-edit lifecycle and responsiveness targets.

### `v0.4.0-beta.1` — Native confidence

- Complete P3 and core P4 work.
- Produce packaged smoke results for all platforms.

### `v0.5.0-beta.1` — UX and authoring

- Complete P5.
- Select and ship only the highest-value P6 items.

### `v1.0.0-rc.1` — Release hardening

- Complete P7 and P8.
- Freeze features; accept only release blockers and documentation fixes.

### `v1.0.0`

- Publish only after all global gates pass.

## 14. Execution model

Use small vertical pull requests that leave the application releasable:

- One behavior change or refactor seam per PR.
- Tests land with the behavior they protect.
- Risky state migrations include rollback/fallback handling.
- Each PR records user-visible changes, test evidence, performance impact, and platform caveats.
- Architecture decisions that constrain later work receive a short ADR.

Recommended first implementation slice:

1. Add typed save outcomes and tab-targeted save commands.
2. Fix save-before-close cancellation/failure behavior.
3. Add the deterministic close queue.
4. Make autosave target a stable tab/revision.
5. Cover those workflows at the App/service boundary.

That slice reduces the largest user-data risks without requiring the editor-state rewrite first, and it creates the service boundary needed by later phases.

## 15. Open product decisions

These should be decided before their dependent phase begins:

- Is the browser build a supported product or only a development/demo surface?
- Which Markdown constructs must be byte-preserved versus semantically preserved?
- Should raw HTML be rendered, escaped, or disabled?
- Should `v1.0` restore all prior tabs automatically or prompt after an unclean shutdown?
- Is built-in automatic updating required for `v1.0`?
- Which platforms and minimum OS versions are officially supported?
- Is PDF export via the system print dialog sufficient for `v1.0`?
- Which authoring improvements have actual user demand and therefore belong before feature freeze?

Until answered, the plan assumes desktop-first, local-only storage, semantic Markdown preservation with warnings for unsupported constructs, automatic recovery only after unclean shutdowns, all three desktop platforms, and no cloud or collaboration scope.
