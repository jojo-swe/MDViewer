export type StrictnessLevel = 'relaxed' | 'standard' | 'strict';

export type IssueSeverity = 'error' | 'warning' | 'info';

export interface LintIssue {
  line: number;
  column: number;
  message: string;
  ruleId: string;
  severity: IssueSeverity;
}

export interface LintSummary {
  errors: number;
  warnings: number;
  infos: number;
}

export interface LintResult {
  issues: LintIssue[];
  summary: LintSummary;
}

export interface StrictnessOption {
  value: StrictnessLevel;
  label: string;
  description: string;
  ruleCount: number;
}

export interface LintRule {
  id: string;
  name: string;
  description: string;
  level: StrictnessLevel;
  severity: IssueSeverity;
  check: (lines: string[]) => Omit<LintIssue, 'ruleId' | 'severity'>[];
}
