# Data Safety & Recovery

MDViewer treats the in-memory tab content as the user's work and the last successfully saved content as the disk version it expects. Save, close, conflict, and crash-recovery paths are designed around that distinction.

## Protected saves

Desktop saves are written to a uniquely named sibling temporary file and flushed before the destination is replaced.

- On macOS and Linux, the flushed temporary file inherits the destination's ownership, Unix mode bits, ACL, and extended attributes before it is renamed over the destination. The save fails closed if that metadata cannot be preserved.
- On Windows, `ReplaceFileW` performs the replacement and preserves the original file's ACLs, encryption, compression, streams, and supported attributes. A sibling backup is retained when replacement reports a recoverable failure.
- Existing-file writes are serialized within MDViewer and require a path approved by the native file dialog. Symbolic-link destinations are rejected; use Save As for an explicit new destination.
- Save failures leave the tab dirty.
- A save completion for an older revision never overwrites newer in-memory typing or incorrectly marks it clean.

Save As is an explicit destination choice and establishes a new expected disk version after it succeeds.

## External file conflicts

Before overwriting an existing desktop file, MDViewer compares its current disk content with the content last opened or saved by that tab. It checks once before preparing the temporary file and again immediately before replacement. This is strong conflict detection, not an operating-system transaction: an external process with write access can still race the final comparison and replacement.

If the file changed externally:

- The external content is not overwritten.
- The editor remains open and dirty.
- Close confirmation remains open when the conflict occurred during close.
- The user can preserve their version with Save As.

If the file was deleted externally, MDViewer does not silently recreate it through Save or autosave. Use Save As to choose a new destination.

This protection currently runs when saving. Proactive filesystem notifications and a visual compare/reload dialog are planned but not yet implemented.

### Local path-race limitation

Native reads and pasted-image writes reject ordinary symbolic links, non-regular files, oversized inputs, and paths outside their validated document relationship. A different local process that can rename entries inside the selected document directory may still race validation and the final open/create operation. Fully closing that low-severity local race requires platform-specific handle-relative path APIs; keep shared or attacker-writable document directories outside high-trust workflows.

## Closing dirty tabs

Close, Close Others, Close All, and application exit use one ordered close queue. Each dirty tab must be saved, explicitly discarded, or cancelled before the operation proceeds.

- Cancelling Save As keeps the tab open.
- A failed or conflicted save keeps the tab open.
- Cancelling stops the remaining dirty-tab close sequence.
- Dialog actions are disabled while a save is in progress.

## Crash-draft recovery

While MDViewer is running, it stores a debounced snapshot containing open tabs, the active tab, current content, last saved content, paths, and dirty state. A controlled application exit deletes that plaintext recovery snapshot.

On the next launch:

- Dirty tabs are restored only when the previous snapshot indicates an unclean shutdown.
- Clean exits remove the recovery entry; sessions without unsaved work are ignored.
- Recovered tabs retain their dirty state and active-tab selection.
- A notification explains that unsaved work was recovered.

Recovery snapshots use schema version `1` and the local storage key `mdviewer-recovery-session`.

### Recovery limits

Snapshots are limited to 50 tabs with a 4.5-million-character serialized storage budget. Every dirty tab is prioritized ahead of clean tabs; active state is only a tie-breaker within those groups. Document text is never truncated: a tab that does not fit is omitted, the snapshot is marked incomplete, and MDViewer warns immediately that recovery is degraded. If browser storage rejects a snapshot, MDViewer retries while dropping the lowest-priority tabs.

Native documents are opened once, checked as regular non-symlink files, and read through that same handle with a 5 MiB limit. Browser files are size-checked before `File.text()`. Pasted images are rejected above 10 MiB before browser serialization; persistent image writes require an existing regular document and reject a symlinked `images` directory. Enhanced Shiki and Mermaid post-processing is limited to the first 50 code blocks, and blocks above 100,000 characters stay as plain code.

Recovery storage is a last-resort safety net, not a replacement for saving important documents or maintaining backups.
