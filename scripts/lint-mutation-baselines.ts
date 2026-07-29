import { readMutationTotals } from "./mutation-report.ts";
import { readRepoJson } from "./policy-files.ts";
import { reportViolations } from "./policy-output.ts";

interface Baseline {
  readonly errors: number;
  readonly mutantCount: number;
  readonly rationale: string;
  readonly survived: number;
  readonly noCoverage: number;
}

interface Baselines {
  readonly baseline: Baseline;
  readonly schemaVersion: number;
}

const mutantCountTolerance = 1.15;
const { baseline } = readRepoJson("../policy/mutation-baselines.json") as Baselines;
const totals = readMutationTotals();
const violations: Array<string> = [];
const ceiling = Math.floor(baseline.mutantCount * mutantCountTolerance);

/**
 * A sudden mutant-count drop means the mutate scope shrank, which is the exact
 * failure lint-mutation-scope cannot see once a glob still technically matches.
 */
if (totals.mutantCount > ceiling) {
  violations.push(
    `Mutant count ${totals.mutantCount} exceeds the baseline ceiling ${ceiling} (baseline ${baseline.mutantCount} x ${mutantCountTolerance}). Update policy/mutation-baselines.json deliberately if the growth is real.`,
  );
}

if (totals.mutantCount < baseline.mutantCount) {
  violations.push(
    `Mutant count ${totals.mutantCount} dropped below the baseline ${baseline.mutantCount}. Source was deleted or the mutate scope narrowed; lower the baseline deliberately if the deletion is real.`,
  );
}

for (const metric of ["errors", "noCoverage", "survived"] as const) {
  if (totals[metric] > baseline[metric]) {
    violations.push(
      `${metric} rose to ${totals[metric]} against a baseline of ${baseline[metric]}. This ratchet only moves down.`,
    );
  }
}

reportViolations("Mutation baseline violations", violations);
