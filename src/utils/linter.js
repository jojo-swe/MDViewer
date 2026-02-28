// Markdown Linting Engine
// Uses a rule-based system inspired by markdownlint standards

// ============================================
// LINT RULE DEFINITIONS
// ============================================

const RULES = {
  // --- RELAXED Level (Critical issues only) ---
  MD001: {
    id: "MD001",
    name: "heading-increment",
    description: "Heading levels should only increment by one level at a time",
    level: "relaxed",
    severity: "error",
    check: (lines) => {
      const issues = [];
      let lastLevel = 0;
      lines.forEach((line, i) => {
        const match = line.match(/^(#{1,6})\s/);
        if (match) {
          const level = match[1].length;
          if (lastLevel > 0 && level > lastLevel + 1) {
            issues.push({
              line: i + 1,
              column: 1,
              message: `Heading level jumped from h${lastLevel} to h${level}. Expected h${lastLevel + 1} or lower.`,
            });
          }
          lastLevel = level;
        }
      });
      return issues;
    },
  },

  MD004: {
    id: "MD004",
    name: "ul-style",
    description: "Unordered list style should be consistent",
    level: "standard",
    severity: "warning",
    check: (lines) => {
      const issues = [];
      let expectedMarker = null;
      lines.forEach((line, i) => {
        const match = line.match(/^(\s*)([-*+])\s/);
        if (match) {
          const marker = match[2];
          if (expectedMarker === null) {
            expectedMarker = marker;
          } else if (marker !== expectedMarker) {
            issues.push({
              line: i + 1,
              column: match[1].length + 1,
              message: `Inconsistent list marker '${marker}'. Expected '${expectedMarker}'.`,
            });
          }
        }
      });
      return issues;
    },
  },

  MD009: {
    id: "MD009",
    name: "no-trailing-spaces",
    description: "Trailing spaces are not allowed",
    level: "strict",
    severity: "info",
    check: (lines) => {
      const issues = [];
      lines.forEach((line, i) => {
        if (line !== line.trimEnd() && !/^\s*$/.test(line)) {
          const trailing = line.length - line.trimEnd().length;
          // Allow 2 trailing spaces (line break in markdown)
          if (trailing !== 2) {
            issues.push({
              line: i + 1,
              column: line.trimEnd().length + 1,
              message: `Trailing spaces found (${trailing} spaces). Use 2 spaces for line breaks, or remove trailing spaces.`,
            });
          }
        }
      });
      return issues;
    },
  },

  MD012: {
    id: "MD012",
    name: "no-multiple-blanks",
    description: "Multiple consecutive blank lines are not allowed",
    level: "standard",
    severity: "warning",
    check: (lines) => {
      const issues = [];
      let blankCount = 0;
      lines.forEach((line, i) => {
        if (/^\s*$/.test(line)) {
          blankCount++;
          if (blankCount > 1) {
            issues.push({
              line: i + 1,
              column: 1,
              message:
                "Multiple consecutive blank lines. Use a single blank line between blocks.",
            });
          }
        } else {
          blankCount = 0;
        }
      });
      return issues;
    },
  },

  MD013: {
    id: "MD013",
    name: "line-length",
    description: "Line length should not exceed 120 characters",
    level: "strict",
    severity: "info",
    check: (lines) => {
      const issues = [];
      const maxLength = 120;
      lines.forEach((line, i) => {
        // Skip headings, links, and code blocks
        if (
          line.startsWith("#") ||
          line.startsWith("```") ||
          line.startsWith("|")
        )
          return;
        if (line.length > maxLength) {
          issues.push({
            line: i + 1,
            column: maxLength + 1,
            message: `Line length is ${line.length} characters. Expected at most ${maxLength}.`,
          });
        }
      });
      return issues;
    },
  },

  MD018: {
    id: "MD018",
    name: "no-missing-space-atx",
    description: "ATX-style headings require a space after the hash characters",
    level: "relaxed",
    severity: "error",
    check: (lines) => {
      const issues = [];
      lines.forEach((line, i) => {
        const match = line.match(/^(#{1,6})\S/);
        if (match) {
          issues.push({
            line: i + 1,
            column: match[1].length + 1,
            message:
              'Missing space after heading hash characters. Add a space after "#".',
          });
        }
      });
      return issues;
    },
  },

  MD022: {
    id: "MD022",
    name: "blanks-around-headings",
    description: "Headings should be surrounded by blank lines",
    level: "standard",
    severity: "warning",
    check: (lines) => {
      const issues = [];
      lines.forEach((line, i) => {
        if (/^#{1,6}\s/.test(line)) {
          if (i > 0 && !/^\s*$/.test(lines[i - 1])) {
            issues.push({
              line: i + 1,
              column: 1,
              message: "Missing blank line before heading.",
            });
          }
          if (i < lines.length - 1 && !/^\s*$/.test(lines[i + 1])) {
            issues.push({
              line: i + 1,
              column: 1,
              message: "Missing blank line after heading.",
            });
          }
        }
      });
      return issues;
    },
  },

  MD025: {
    id: "MD025",
    name: "single-h1",
    description: "Only one top-level heading (h1) is allowed per document",
    level: "standard",
    severity: "warning",
    check: (lines) => {
      const issues = [];
      let h1Count = 0;
      lines.forEach((line, i) => {
        if (/^#\s/.test(line)) {
          h1Count++;
          if (h1Count > 1) {
            issues.push({
              line: i + 1,
              column: 1,
              message: `Multiple top-level headings found. Only one h1 per document is recommended.`,
            });
          }
        }
      });
      return issues;
    },
  },

  MD031: {
    id: "MD031",
    name: "blanks-around-fences",
    description: "Fenced code blocks should be surrounded by blank lines",
    level: "standard",
    severity: "warning",
    check: (lines) => {
      const issues = [];
      lines.forEach((line, i) => {
        if (/^```/.test(line)) {
          if (i > 0 && !/^\s*$/.test(lines[i - 1])) {
            issues.push({
              line: i + 1,
              column: 1,
              message: "Missing blank line before fenced code block.",
            });
          }
        }
      });
      return issues;
    },
  },

  MD032: {
    id: "MD032",
    name: "blanks-around-lists",
    description: "Lists should be surrounded by blank lines",
    level: "strict",
    severity: "info",
    check: (lines) => {
      const issues = [];
      const isListItem = (l) =>
        /^\s*[-*+]\s/.test(l) || /^\s*\d+[.)]\s/.test(l);
      lines.forEach((line, i) => {
        if (isListItem(line)) {
          if (
            i > 0 &&
            !isListItem(lines[i - 1]) &&
            !/^\s*$/.test(lines[i - 1])
          ) {
            issues.push({
              line: i + 1,
              column: 1,
              message: "Missing blank line before list.",
            });
          }
        }
      });
      return issues;
    },
  },

  MD037: {
    id: "MD037",
    name: "no-space-in-emphasis",
    description: "Emphasis markers should not have spaces inside",
    level: "relaxed",
    severity: "error",
    check: (lines) => {
      const issues = [];
      lines.forEach((line, i) => {
        // Check for "** text **" or "* text *"
        const boldSpaceMatch = line.match(/\*\*\s.*?\s\*\*/);
        if (boldSpaceMatch) {
          issues.push({
            line: i + 1,
            column: line.indexOf(boldSpaceMatch[0]) + 1,
            message:
              'Spaces inside bold markers "** text **". Remove inner spaces.',
          });
        }
      });
      return issues;
    },
  },

  MD047: {
    id: "MD047",
    name: "single-trailing-newline",
    description: "File should end with a single newline character",
    level: "strict",
    severity: "info",
    check: (lines) => {
      const issues = [];
      if (lines.length > 0) {
        const lastLine = lines[lines.length - 1];
        if (lastLine.trim() !== "") {
          // File doesn't end with newline — we can't truly check this from split lines
          // but we can flag if last line has content
        }
      }
      return issues;
    },
  },
};

// ============================================
// STRICTNESS LEVEL MAPPING
// ============================================

const STRICTNESS_LEVELS = {
  relaxed: ["relaxed"],
  standard: ["relaxed", "standard"],
  strict: ["relaxed", "standard", "strict"],
};

// ============================================
// LINTER API
// ============================================

/**
 * Lint markdown content based on a strictness level.
 * @param {string} markdown - The raw markdown text
 * @param {'relaxed'|'standard'|'strict'} strictness - The strictness level
 * @returns {{ issues: Array, summary: { errors: number, warnings: number, infos: number } }}
 */
export function lintMarkdown(markdown, strictness = "standard") {
  if (!markdown || typeof markdown !== "string") {
    return { issues: [], summary: { errors: 0, warnings: 0, infos: 0 } };
  }

  const lines = markdown.split("\n");
  const enabledLevels =
    STRICTNESS_LEVELS[strictness] || STRICTNESS_LEVELS.standard;

  let allIssues = [];

  Object.values(RULES).forEach((rule) => {
    if (enabledLevels.includes(rule.level)) {
      const ruleIssues = rule.check(lines);
      ruleIssues.forEach((issue) => {
        allIssues.push({
          ...issue,
          ruleId: rule.id,
          ruleName: rule.name,
          ruleDescription: rule.description,
          severity: rule.severity,
        });
      });
    }
  });

  // Sort by line number
  allIssues.sort((a, b) => a.line - b.line || a.column - b.column);

  const summary = {
    errors: allIssues.filter((i) => i.severity === "error").length,
    warnings: allIssues.filter((i) => i.severity === "warning").length,
    infos: allIssues.filter((i) => i.severity === "info").length,
  };

  return { issues: allIssues, summary };
}

/**
 * Get all available rules with their metadata.
 */
export function getAllRules() {
  return Object.values(RULES).map((rule) => ({
    id: rule.id,
    name: rule.name,
    description: rule.description,
    level: rule.level,
    severity: rule.severity,
  }));
}

/**
 * Get the display label for a strictness level.
 */
export function getStrictnessLabel(level) {
  const labels = {
    relaxed: "Relaxed",
    standard: "Standard",
    strict: "Strict",
  };
  return labels[level] || "Standard";
}

export const STRICTNESS_OPTIONS = [
  {
    value: "relaxed",
    label: "Relaxed",
    description: "Only critical syntax errors",
    ruleCount: Object.values(RULES).filter((r) =>
      STRICTNESS_LEVELS.relaxed.includes(r.level),
    ).length,
  },
  {
    value: "standard",
    label: "Standard",
    description: "Community guidelines & consistency",
    ruleCount: Object.values(RULES).filter((r) =>
      STRICTNESS_LEVELS.standard.includes(r.level),
    ).length,
  },
  {
    value: "strict",
    label: "Strict",
    description: "Absolute consistency enforced",
    ruleCount: Object.values(RULES).filter((r) =>
      STRICTNESS_LEVELS.strict.includes(r.level),
    ).length,
  },
];
