import { useMemo, useCallback } from 'react';
import { createCommands } from '../commands/registry';
import type { Command, CommandContext } from '../types/command';

/**
 * Hook to create and manage the command registry.
 * Returns all commands bound to the provided context.
 */
export function useCommands(ctx: CommandContext): Command[] {
  const commands = useMemo(() => createCommands(ctx), [ctx]);

  const executeCommand = useCallback(
    (id: string) => {
      const cmd = commands.find((c) => c.id === id);
      if (cmd) {
        cmd.action(ctx);
      }
    },
    [commands, ctx]
  );

  // Expose executeCommand via the commands array for convenience
  // (the component can also just call cmd.action directly)
  void executeCommand;

  return commands;
}
