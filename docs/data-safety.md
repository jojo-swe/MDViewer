# Data Safety & Recovery

MDViewer treats the in-memory tab content as the user's work and the last successfully saved content as the disk version it expects. Save, close, conflict, and crash-recovery paths are designed around that distinction.

## Protected saves

Desktop saves are written to a uniquely named sibling temporary file and flushed before the destination is replaced.

- On macOS and Linux, the flushed temporary file is renamed over the destination.
- On Windows, the existing destination is moved to a temporary backup first. If replacement fails, MDViewer attempts to restore that backup.
- Save failures leave the tab dirty.
- A save completion for an older revision never overwrites newer in-memory typing or incorrectly marks it clean.

Save As is an explicit destination choice and establishes a new expected disk version after it succeeds.

## External file conflicts

Before overwriting an existing desktop file, MDViewer compares its current disk content with the content last opened or saved by that tab. It checks once before preparing the temporary file and again immediately before replacement.

If the file changed externally:

- The external content is not overwritten.
- The editor remains open and dirty.
- Close confirmation remains open when the conflict occurred during close.
- The user can preserve their version with Save As.

If the file was deleted externally, MDViewer does not silently recreate it through Save or autosave. Use Save As to choose a new destination.

This protection currently runs when saving. Proactive filesystem notifications and a visual compare/reload dialog are planned but not yet implemented.

## Closing dirty tabs

Close, Close Others, Close All, and application exit use one ordered close queue. Each dirty tab must be saved, explicitly discarded, or cancelled before the operation proceeds.

- Cancelling Save As keeps the tab open.
- A failed or conflicted save keeps the tab open.
- Cancelling stops the remaining dirty-tab close sequence.
- Dialog actions are disabled while a save is in progress.

## Crash-draft recovery

While MDViewer is running, it stores a debounced snapshot containing open tabs, the active tab, current content, last saved content, paths, and dirty state. A controlled application exit marks that snapshot clean.

On the next launch:

- Dirty tabs are restored only when the previous snapshot indicates an unclean shutdown.
- Clean exits and sessions without unsaved work are ignored.
- Recovered tabs retain their dirty state and active-tab selection.
- A notification explains that unsaved work was recovered.

Recovery snapshots use schema version `1` and the local storage key `mdviewer-recovery-session`.

### Recovery limits

Snapshots are limited to 50 tabs and five million characters across selected tab content. The active tab and dirty tabs receive priority. Document text is never truncated: a tab that does not fit is omitted, the snapshot is marked incomplete, and the recovery notification warns that some oversized tabs could not be restored.

Recovery storage is a last-resort safety net, not a replacement for saving important documents or maintaining backups.
