import { anyExceptionAllowsPath, exceptedPaths } from "./policy-exceptions.ts";
import { readRepoJson, sourceFiles } from "./policy-files.ts";
import { reportViolations } from "./policy-output.ts";

interface StrykerConfig {
  readonly mutate?: ReadonlyArray<string>;
}

const mutate = (readRepoJson("../stryker.config.json") as StrykerConfig).mutate ?? [];
const includes = mutate.filter((pattern) => !pattern.startsWith("!"));
const excludes = mutate.filter((pattern) => pattern.startsWith("!")).map((p) => p.slice(1));
const sources = sourceFiles();
const violations: Array<string> = [];

if (includes.length !== 1 || includes[0] !== "src/**/*.ts") {
  violations.push(
    `stryker.config.json: mutate must open with exactly one positive pattern, "src/**/*.ts", got ${JSON.stringify(includes)}. Narrow with "!" exclusions backed by a named policy exception instead of shrinking the positive pattern.`,
  );
}

for (const excluded of excludes.filter((candidate) => !anyExceptionAllowsPath(candidate))) {
  violations.push(
    `stryker.config.json: mutate excludes "${excluded}" with no matching path in scripts/policy-exceptions.ts. Add a named exception carrying a rationale and removal condition, or delete the exclusion.`,
  );
}

for (const excepted of exceptedPaths()) {
  if (!excludes.includes(excepted)) {
    violations.push(
      `scripts/policy-exceptions.ts: "${excepted}" is excepted but stryker.config.json no longer excludes it. Delete the stale exception path.`,
    );
  }
  if (!sources.includes(excepted)) {
    violations.push(
      `scripts/policy-exceptions.ts: "${excepted}" is not a tracked source file. Delete the stale exception path.`,
    );
  }
}

reportViolations("Mutation scope violations", violations);
