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

if (packageJson.engines?.node !== ">=22.12.0") {
  failures.push(`Node engine must stay >=22.12.0, got ${packageJson.engines?.node}.`);
}

for (const requiredScript of [
  "lint:deps",
  "lint:knip",
  "lint:oxlint",
  "lint:policy",
  "lint:quality-scope",
  "lint:versions",
  "mutation",
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
