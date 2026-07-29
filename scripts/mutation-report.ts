import { readFileSync } from "node:fs";
import { failPolicy } from "./policy-output.ts";

export const reportPath = "reports/mutation/mutation.json";

interface MutationFileResult {
  readonly mutants: ReadonlyArray<{ readonly status: string }>;
}

interface MutationReport {
  readonly files: Readonly<Record<string, MutationFileResult>>;
}

export interface MutationTotals {
  readonly errors: number;
  readonly mutantCount: number;
  readonly noCoverage: number;
  readonly survived: number;
  readonly timeouts: number;
}

const countStatus = (mutants: ReadonlyArray<{ readonly status: string }>, status: string): number =>
  mutants.filter((mutant) => mutant.status === status).length;

export const readMutationTotals = (): MutationTotals => {
  const root = new URL("..", import.meta.url).pathname;
  let report: MutationReport;

  try {
    report = JSON.parse(readFileSync(`${root}${reportPath}`, "utf8")) as MutationReport;
  } catch {
    return failPolicy(
      `Could not read ${reportPath}. Run "pnpm mutation:run" first; the json reporter must be enabled in stryker.config.json.`,
    );
  }

  const mutants = Object.values(report.files).flatMap((file) => file.mutants);

  return {
    errors: countStatus(mutants, "CompileError") + countStatus(mutants, "RuntimeError"),
    mutantCount: mutants.length,
    noCoverage: countStatus(mutants, "NoCoverage"),
    survived: countStatus(mutants, "Survived"),
    timeouts: countStatus(mutants, "Timeout"),
  };
};
