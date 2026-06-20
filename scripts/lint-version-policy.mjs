import { readFile } from "node:fs/promises";

const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
const dependencies = packageJson.dependencies ?? {};
const devDependencies = packageJson.devDependencies ?? {};
const allDependencies = { ...dependencies, ...devDependencies };
const scripts = packageJson.scripts ?? {};

const failures = [];
const effectEntries = Object.entries(allDependencies).filter(
  ([name]) => name === "effect" || name.startsWith("@effect/"),
);
const effectVersions = new Set(effectEntries.map(([, version]) => version));

if (!effectVersions.has("4.0.0-beta.78") || effectVersions.size !== 1) {
  failures.push(
    `Effect packages must all be pinned to 4.0.0-beta.78. Found: ${effectEntries
      .map(([name, version]) => `${name}@${version}`)
      .join(", ")}`,
  );
}

if (dependencies.habitica !== undefined || devDependencies.habitica !== undefined) {
  failures.push("Do not depend on the stale habitica npm SDK; use HabiticaGateway adapters.");
}

if (packageJson.packageManager !== "pnpm@10.16.1") {
  failures.push(
    `packageManager must stay pinned to pnpm@10.16.1, got ${packageJson.packageManager}.`,
  );
}

if (!/^0\.0\.1-alpha\.\d+$/.test(packageJson.version)) {
  failures.push(
    `Publish version must stay on the 0.0.1-alpha.x train for now, got ${packageJson.version}.`,
  );
}

if (packageJson.engines?.node !== ">=22.12.0") {
  failures.push(`Node engine must stay >=22.12.0, got ${packageJson.engines?.node}.`);
}

if (packageJson.publishConfig?.access !== "public") {
  failures.push("publishConfig.access must be public.");
}

if (packageJson.publishConfig?.provenance !== true) {
  failures.push("publishConfig.provenance must be true.");
}

if (packageJson.repository?.url !== "git+https://github.com/tatemz/habitica-mcp.git") {
  failures.push("repository.url must point at tatemz/habitica-mcp.");
}

if (packageJson.homepage !== "https://github.com/tatemz/habitica-mcp#readme") {
  failures.push("homepage must point at the GitHub README.");
}

if (packageJson.bugs?.url !== "https://github.com/tatemz/habitica-mcp/issues") {
  failures.push("bugs.url must point at GitHub issues.");
}

if (packageJson.bin?.["habitica-mcp"] !== "dist/main.js") {
  failures.push("The habitica-mcp binary must point at dist/main.js.");
}

if (packageJson.exports?.["."]?.default !== "./dist/HabiticaMcp.js") {
  failures.push("The package root export must point at ./dist/HabiticaMcp.js.");
}

for (const requiredScript of [
  "lint:deps",
  "lint:knip",
  "lint:oxlint",
  "lint:policy",
  "lint:quality-scope",
  "lint:rules",
  "lint:versions",
  "mutation",
  "prepack",
  "test:coverage",
]) {
  if (typeof scripts[requiredScript] !== "string") {
    failures.push(`Missing required deterministic gate script: ${requiredScript}.`);
  }
}

if (!scripts.check?.includes("pnpm lint")) {
  failures.push("pnpm check must run pnpm lint.");
}

if (failures.length > 0) {
  throw new Error(`Version policy violations:\n${failures.join("\n")}`);
}
