import { readFileSync } from "node:fs";
import { trackedTextFiles } from "./policy-files.ts";
import { reportViolations } from "./policy-output.ts";

const repoRoot = new URL("..", import.meta.url).pathname;
const forbidden = [
  { label: "oxlint-disable", pattern: /oxlint-disable/ },
  { label: "oxlint-ignore", pattern: /oxlint-ignore/ },
  { label: "@ts-ignore", pattern: /@ts-ignore/ },
  { label: "@ts-expect-error", pattern: /@ts-expect-error/ },
  { label: "@ts-nocheck", pattern: /@ts-nocheck/ },
  { label: "Stryker disable", pattern: /Stryker\s+disable/i },
  { label: "eslint-disable", pattern: /eslint-disable/ },
];

/**
 * The canary proves the patterns still match before trusting a clean report, so
 * a broken regex fails loudly instead of quietly passing every file.
 */
const canary = [
  "oxlint-disable",
  "oxlint-ignore",
  "@ts-ignore",
  "@ts-expect-error",
  "@ts-nocheck",
  "Stryker disable",
  "eslint-disable",
].join(" ");

const unmatched = forbidden.filter(({ pattern }) => !pattern.test(canary));

if (unmatched.length > 0) {
  reportViolations(
    "Suppression policy self-test failed",
    unmatched.map(({ label }) => `${label}: pattern no longer matches its own canary.`),
  );
}

const violations: Array<string> = [];

/**
 * Only files a tool actually reads suppressions from. Prose may name these
 * markers, and documenting what is banned must not itself trip the ban.
 */
const suppressible = (path: string): boolean => /\.(?:ts|tsx|js|mjs|cjs|json|jsonc)$/.test(path);

for (const path of trackedTextFiles().filter(suppressible)) {
  if (path === "scripts/lint-suppression-policy.ts") {
    continue;
  }

  const text = readFileSync(`${repoRoot}${path}`, "utf8");

  for (const { label, pattern } of forbidden) {
    if (pattern.test(text)) {
      violations.push(
        `${path}: ${label} comments are not allowed. Fix the code or delete the rule.`,
      );
    }
  }
}

reportViolations("Suppression policy violations", violations);
