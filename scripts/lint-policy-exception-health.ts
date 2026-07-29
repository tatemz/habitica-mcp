import { readFileSync } from "node:fs";
import { policyExceptions } from "./policy-exceptions.ts";
import { trackedFiles } from "./policy-files.ts";
import { reportViolations } from "./policy-output.ts";

const repoRoot = new URL("..", import.meta.url).pathname;
const policyScripts = trackedFiles().filter(
  (path) =>
    path.startsWith("scripts/") && path.endsWith(".ts") && path !== "scripts/policy-exceptions.ts",
);
const policyScriptSource = policyScripts
  .map((path) => readFileSync(`${repoRoot}${path}`, "utf8"))
  .join("\n");
const violations: Array<string> = [];

for (const exception of policyExceptions) {
  if (exception.paths.length === 0) {
    violations.push(`${exception.name}: allows no paths. Delete the exception.`);
  }

  if (exception.rationale.length < 40) {
    violations.push(
      `${exception.name}: rationale must explain why the gate cannot cover these paths.`,
    );
  }

  if (exception.removalCondition.length < 40) {
    violations.push(
      `${exception.name}: removalCondition must state the concrete change that retires this exception.`,
    );
  }

  if (!policyScripts.includes(exception.ownerScript)) {
    violations.push(
      `${exception.name}: ownerScript "${exception.ownerScript}" is not a tracked policy script.`,
    );
  }

  if (!policyScriptSource.includes(`"${exception.name}"`) && !usesBroadLookup()) {
    violations.push(
      `${exception.name}: no policy script references this exception, so it grants a silent blind spot.`,
    );
  }
}

/**
 * lint-mutation-scope and lint-coverage-policy consult every exception through
 * anyExceptionAllowsPath rather than naming them one by one, so a name-literal
 * search alone would produce false positives.
 */
function usesBroadLookup(): boolean {
  return policyScriptSource.includes("anyExceptionAllowsPath");
}

const duplicateNames = policyExceptions
  .map((exception) => exception.name)
  .filter((name, index, names) => names.indexOf(name) !== index);

for (const name of new Set(duplicateNames)) {
  violations.push(`${name}: duplicate exception name.`);
}

reportViolations("Policy exception health violations", violations);
