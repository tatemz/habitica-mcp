import { readMutationTotals, reportPath } from "./mutation-report.ts";
import { reportViolations } from "./policy-output.ts";

const totals = readMutationTotals();
const violations: Array<string> = [];

if (totals.mutantCount === 0) {
  violations.push(
    `${reportPath}: report contains zero mutants. Either the mutate scope collapsed or the run never executed.`,
  );
}

if (totals.survived > 0) {
  violations.push(
    `${reportPath}: ${totals.survived} mutant(s) survived. A surviving mutant is a behaviour no test pins down.`,
  );
}

if (totals.noCoverage > 0) {
  violations.push(
    `${reportPath}: ${totals.noCoverage} mutant(s) had no test coverage. Cover the code or except the file in scripts/policy-exceptions.ts.`,
  );
}

reportViolations("Mutation report health violations", violations);
