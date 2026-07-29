import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { failPolicy } from "./policy-output.ts";

const repoRoot = new URL("..", import.meta.url).pathname;

const gitFileLines = (args: ReadonlyArray<string>): ReadonlyArray<string> => {
  try {
    return execFileSync("git", ["ls-files", ...args], { cwd: repoRoot, encoding: "utf8" })
      .split("\n")
      .filter((path) => path !== "");
  } catch (error) {
    return failPolicy(`Could not list repository files: ${String(error)}`);
  }
};

/**
 * Tracked plus untracked-but-not-ignored files, minus paths deleted from the
 * working tree. Policies run against what a commit would contain, not against
 * whatever build output happens to be sitting on disk.
 */
export const trackedFiles = (): ReadonlyArray<string> => {
  const deleted = new Set(gitFileLines(["--deleted"]));
  return gitFileLines(["--cached", "--others", "--exclude-standard"]).filter(
    (path) => !deleted.has(path),
  );
};

const textFilePattern =
  /(?:^|\/)(?:AGENTS\.md|package\.json|tsconfig(?:\.[^.]+)?\.json|\.oxlintrc\.json|\.oxfmtrc\.json|knip\.jsonc|stryker\.config\.json|lefthook\.yml|.*\.(?:ts|tsx|js|mjs|cjs|json|jsonc|md|mdc|toml|yaml|yml|feature))$/;

export const trackedTextFiles = (): ReadonlyArray<string> =>
  trackedFiles().filter((path) => textFilePattern.test(path));

export const readRepoFile = (path: string): string =>
  readFileSync(new URL(path, import.meta.url), "utf8");

export const readRepoJson = (path: string): unknown => JSON.parse(readRepoFile(path));

export const sourceFiles = (): ReadonlyArray<string> =>
  trackedFiles()
    .filter((path) => path.startsWith("src/") && path.endsWith(".ts"))
    .toSorted();
