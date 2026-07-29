import { readRepoJson } from "./policy-files.ts";
import { reportViolations } from "./policy-output.ts";

interface StrykerConfig {
  readonly coverageAnalysis?: string;
  readonly reporters?: ReadonlyArray<string>;
  readonly testRunner?: string;
  readonly thresholds?: Readonly<Record<string, number>>;
}

const config = readRepoJson("../stryker.config.json") as StrykerConfig;
const violations: Array<string> = [];

if (config.coverageAnalysis !== "perTest") {
  violations.push(
    `stryker.config.json: coverageAnalysis must be "perTest" so surviving mutants are attributed to a test, got ${JSON.stringify(config.coverageAnalysis)}.`,
  );
}

if (config.testRunner !== "vitest") {
  violations.push(
    `stryker.config.json: testRunner must be "vitest" to match the unit suite, got ${JSON.stringify(config.testRunner)}.`,
  );
}

for (const threshold of ["break", "high", "low"]) {
  if (config.thresholds?.[threshold] !== 100) {
    violations.push(
      `stryker.config.json: thresholds.${threshold} must be 100, got ${JSON.stringify(config.thresholds?.[threshold])}.`,
    );
  }
}

/**
 * The json reporter is what lint-mutation-report-health and
 * lint-mutation-baselines read. Without it those gates silently pass.
 */
if (!(config.reporters ?? []).includes("json")) {
  violations.push(
    `stryker.config.json: reporters must include "json" so the post-mutation policies have a report to read, got ${JSON.stringify(config.reporters)}.`,
  );
}

reportViolations("Stryker config violations", violations);
