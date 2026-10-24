# Releasing MDViewer

MDViewer releases are created by pushing a version tag. GitHub Actions then builds and publishes platform bundles. Do not create or push a tag until the exact commit has passed CI and the checks below.

## Version rules

The version must match in:

- `package.json`
- `package-lock.json`
- `src-tauri/tauri.conf.json`
- `src-tauri/Cargo.toml`
- `src-tauri/Cargo.lock`

Windows MSI builds require numeric pre-release identifiers. Use `0.2.0-2`, not `0.2.0-beta.2`; the matching tag is `v0.2.0-2`.

Run `npm run check:version` after every version change. On a tag, the same check also rejects a tag that does not exactly match the package version.

## Pre-tag gate

Start from a clean checkout of the commit that will be tagged:

```bash
npm ci
npm run check:version
npm run lint
npm run typecheck
npm run test:coverage
npm run build
npm audit --audit-level=moderate
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
cargo test --manifest-path src-tauri/Cargo.toml
cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings
git diff --check
```

For a beta release, also verify these desktop flows on Windows before tagging:

1. Open, edit, save, close, and reopen an existing Markdown file.
2. Modify the same file externally and confirm MDViewer refuses to overwrite it.
3. Cancel Save As while closing a dirty tab and confirm the tab remains open.
4. Force an unclean shutdown with unsaved content and confirm the recovery warning and recovered draft appear on restart.

Automated checks do not replace this packaged-app smoke test.

## Publish

After the release candidate is merged to `main` and CI passes on that exact commit:

```bash
git switch main
git pull --ff-only
git tag v0.2.0-2
git push origin v0.2.0-2
```

The `Release` workflow publishes automatically. Verify that all three matrix jobs pass and that the GitHub release contains usable Windows, macOS, and Linux bundles. Download at least the Windows installer and repeat the basic open/edit/save/reopen smoke test from the installed build.

The current workflow does not configure Windows code signing or Apple notarization. Keep releases marked as pre-release until signing, clean-machine testing, and platform acceptance are complete.

If a published candidate is broken, do not move or reuse its tag. Fix the problem, increment the numeric pre-release suffix, and publish a new candidate.
