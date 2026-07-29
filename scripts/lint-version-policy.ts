import { readRepoJson } from "./policy-files.ts";
import { reportViolations } from "./policy-output.ts";

interface PackageJson {
  readonly bin?: Readonly<Record<string, string>>;
  readonly bugs?: { readonly url?: string };
  readonly dependencies?: Readonly<Record<string, string>>;
  readonly devDependencies?: Readonly<Record<string, string>>;
  readonly engines?: { readonly node?: string };
  readonly exports?: Readonly<Record<string, { readonly default?: string }>>;
  readonly homepage?: string;
  readonly packageManager?: string;
  readonly publishConfig?: { readonly access?: string; readonly provenance?: boolean };
  readonly repository?: { readonly url?: string };
  readonly scripts?: Readonly<Record<string, string>>;
  readonly version?: string;
}

const packageJson = readRepoJson("../package.json") as PackageJson;
const dependencies = packageJson.dependencies ?? {};
const devDependencies = packageJson.devDependencies ?? {};
const scripts = packageJson.scripts ?? {};
const violations: Array<string> = [];

/**
 * The pinned Effect version is read from the manifest rather than hardcoded
 * here. This gate enforces that the pin is exact and uniform, so bumping Effect
 * no longer requires editing the policy that guards it.
 */
const effectEntries = Object.entries({ ...dependencies, ...devDependencies }).filter(
  ([name]) => name === "effect" || name.startsWith("@effect/"),
);
const effectVersions = new Set(effectEntries.map(([, version]) => version));
const describeEntries = (): string =>
  effectEntries.map(([name, version]) => `${name}@${version}`).join(", ");

if (effectEntries.length === 0) {
  violations.push("Expected an effect dependency; found none.");
} else if (effectVersions.size !== 1) {
  violations.push(`All effect packages must share one exact version. Found: ${describeEntries()}`);
} else if (!/^4\.0\.0-beta\.\d+$/.test([...effectVersions][0])) {
  violations.push(
    `Effect packages must stay on an exact 4.0.0-beta.x pin with no range prefix. Found: ${describeEntries()}`,
  );
}

if (dependencies.habitica !== undefined || devDependencies.habitica !== undefined) {
  violations.push("Do not depend on the stale habitica npm SDK; use HabiticaGateway adapters.");
}

if (!/^pnpm@\d+\.\d+\.\d+$/.test(packageJson.packageManager ?? "")) {
  violations.push(
    `packageManager must stay an exact pnpm pin, got ${packageJson.packageManager}. This project ships a Node stdio binary; see AGENTS.md before changing package managers.`,
  );
}

if (!/^0\.0\.1-alpha\.\d+$/.test(packageJson.version ?? "")) {
  violations.push(
    `Publish version must stay on the 0.0.1-alpha.x train for now, got ${packageJson.version}.`,
  );
}

if (packageJson.engines?.node !== ">=22.12.0") {
  violations.push(`Node engine must stay >=22.12.0, got ${packageJson.engines?.node}.`);
}

if (packageJson.publishConfig?.access !== "public") {
  violations.push("publishConfig.access must be public.");
}

if (packageJson.publishConfig?.provenance !== true) {
  violations.push("publishConfig.provenance must be true.");
}

if (packageJson.repository?.url !== "git+https://github.com/tatemz/habitica-mcp.git") {
  violations.push("repository.url must point at tatemz/habitica-mcp.");
}

if (packageJson.homepage !== "https://github.com/tatemz/habitica-mcp#readme") {
  violations.push("homepage must point at the GitHub README.");
}

if (packageJson.bugs?.url !== "https://github.com/tatemz/habitica-mcp/issues") {
  violations.push("bugs.url must point at GitHub issues.");
}

if (packageJson.bin?.["habitica-mcp"] !== "dist/main.js") {
  violations.push("The habitica-mcp binary must point at dist/main.js.");
}

if (packageJson.exports?.["."]?.default !== "./dist/HabiticaMcp.js") {
  violations.push("The package root export must point at ./dist/HabiticaMcp.js.");
}

for (const requiredScript of [
  "lint:coverage-policy",
  "lint:custom-rule-tests",
  "lint:deps",
  "lint:knip",
  "lint:mutation-baselines",
  "lint:mutation-report-health",
  "lint:mutation-scope",
  "lint:noop-scripts",
  "lint:oxlint",
  "lint:policy-exception-health",
  "lint:repo-path-policy",
  "lint:rules",
  "lint:stryker-config",
  "lint:suppression-policy",
  "lint:versions",
  "mutation",
  "prepack",
  "test:coverage",
  "typecheck:tools",
]) {
  if (typeof scripts[requiredScript] !== "string") {
    violations.push(`Missing required deterministic gate script: ${requiredScript}.`);
  }
}

/**
 * `check` delegates, so each stage is verified against the script that actually
 * runs it. Otherwise a stage can be dropped from the ladder while `check` still
 * looks intact.
 */
for (const stage of ["pnpm check:without-mutation", "pnpm mutation"]) {
  if (!scripts.check?.includes(stage)) {
    violations.push(`pnpm check must run ${stage}.`);
  }
}

for (const stage of [
  "pnpm build",
  "pnpm typecheck",
  "pnpm lint",
  "pnpm format:check",
  "pnpm test:coverage",
  "pnpm e2e",
]) {
  if (!scripts["check:without-mutation"]?.includes(stage)) {
    violations.push(`pnpm check:without-mutation must run ${stage}.`);
  }
}

for (const stage of [
  "pnpm lint:policy",
  "pnpm lint:deps",
  "pnpm lint:custom-rule-tests",
  "pnpm lint:oxlint",
  "pnpm lint:knip",
]) {
  if (!scripts.lint?.includes(stage)) {
    violations.push(`pnpm lint must run ${stage}.`);
  }
}

for (const stage of [
  "pnpm lint:suppression-policy",
  "pnpm lint:repo-path-policy",
  "pnpm lint:noop-scripts",
  "pnpm lint:rules",
  "pnpm lint:versions",
  "pnpm lint:policy-exception-health",
  "pnpm lint:mutation-scope",
  "pnpm lint:stryker-config",
  "pnpm lint:coverage-policy",
]) {
  if (!scripts["lint:policy"]?.includes(stage)) {
    violations.push(`pnpm lint:policy must run ${stage}.`);
  }
}

if (!scripts.mutation?.includes("lint:mutation-report-health")) {
  violations.push(
    "pnpm mutation must run lint:mutation-report-health so survived and no-coverage mutants fail the gate.",
  );
}

if (!scripts.mutation?.includes("lint:mutation-baselines")) {
  violations.push("pnpm mutation must run lint:mutation-baselines so the mutant ratchet applies.");
}

reportViolations("Version policy violations", violations);
