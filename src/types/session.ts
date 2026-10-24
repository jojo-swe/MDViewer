import type { Tab } from './tab';

export interface TabSessionState {
  tabs: Tab[];
  activeId: number;
}

export interface SessionSnapshot extends TabSessionState {
  version: 1;
  updatedAt: number;
  cleanExit: boolean;
  incomplete: boolean;
}

export interface RecoveryResult {
  state: TabSessionState | null;
  incomplete: boolean;
}
