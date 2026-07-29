import { readFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { trackedTextFiles } from "./policy-files.ts";
import { reportViolations } from "./policy-output.ts";

const repoRoot = new URL("..", import.meta.url).pathname;
const homePrefixes = [/\/Users\/[a-z0-9._-]+\//i, /\/home\/[a-z0-9._-]+\//i];
const relativePathLiteral = /["'`](\.\.?\/[^"'`\n]+)["'`]/g;
const violations: Array<string> = [];

/**
 * Depth matters: "../.." from test/unit lands on the repo root, while the same
 * literal in a root-level file escapes. Each candidate is resolved against its
 * own directory rather than matched on shape.
 */
const escapesRepo = (fromFile: string, relativePath: string): boolean => {
  const resolved = resolve(repoRoot, dirname(fromFile), relativePath);
  return relative(repoRoot, resolved).startsWith("..");
};

for (const path of trackedTextFiles()) {
  if (path === "scripts/lint-repo-path-policy.ts") {
    continue;
  }

  const text = readFileSync(`${repoRoot}${path}`, "utf8");

  for (const prefix of homePrefixes) {
    const match = prefix.exec(text);
    if (match !== null) {
      violations.push(
        `${path}: contains an absolute home-directory path (${match[0]}). Committed paths must resolve inside the repository.`,
      );
    }
  }

  for (const [, relativePath] of text.matchAll(relativePathLiteral)) {
    if (escapesRepo(path, relativePath)) {
      violations.push(
        `${path}: relative path "${relativePath}" resolves outside the repository root.`,
      );
    }
  }
}

reportViolations("Repository path policy violations", violations);
