import { anyExceptionAllowsPath, exceptedPaths } from "./policy-exceptions.ts";
import { readRepoFile, sourceFiles } from "./policy-files.ts";
import { reportViolations } from "./policy-output.ts";

const config = readRepoFile("../vitest.config.ts");
const violations: Array<string> = [];

const arrayEntries = (key: string): ReadonlyArray<string> => {
  const block = new RegExp(`${key}:\\s*\\[([^\\]]*)\\]`).exec(config);
  return block === null
    ? []
    : [...block[1].matchAll(/"([^"]+)"/g)].map((match) => match[1]).toSorted();
};

if (!arrayEntries("include").includes("src/**/*.ts")) {
  violations.push(
    'vitest.config.ts: coverage.include must be ["src/**/*.ts"] so every source file is measured. Narrow with coverage.exclude entries backed by a named policy exception instead.',
  );
}

const excluded = arrayEntries("exclude");

for (const dropped of excluded.filter((candidate) => !anyExceptionAllowsPath(candidate))) {
  violations.push(
    `vitest.config.ts: coverage.exclude drops "${dropped}" with no matching path in scripts/policy-exceptions.ts. Add a named exception, or delete the exclusion.`,
  );
}

for (const excepted of exceptedPaths().filter((candidate) => !excluded.includes(candidate))) {
  violations.push(
    `scripts/policy-exceptions.ts: "${excepted}" is excepted but vitest.config.ts no longer excludes it from coverage. Delete the stale exception path.`,
  );
}

for (const threshold of ["branches", "functions", "lines", "statements"]) {
  if (!new RegExp(`${threshold}:\\s*100\\b`).test(config)) {
    violations.push(`vitest.config.ts: coverage.thresholds.${threshold} must be 100.`);
  }
}

const gated = sourceFiles().filter((path) => !anyExceptionAllowsPath(path));

if (gated.length === 0) {
  violations.push(
    "scripts/policy-exceptions.ts: every source file is excepted, so the coverage gate measures nothing.",
  );
}

reportViolations("Coverage policy violations", violations);
