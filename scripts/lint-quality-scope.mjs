import { readFile } from "node:fs/promises";

const deterministicModules = ["src/habitica/HabiticaRoutes.ts"];

const vitestConfig = await readFile(new URL("../vitest.config.ts", import.meta.url), "utf8");
const strykerConfig = await readFile(new URL("../stryker.config.json", import.meta.url), "utf8");

const missingCoverage = deterministicModules.filter((path) => !vitestConfig.includes(`"${path}"`));
const missingMutation = deterministicModules.filter((path) => !strykerConfig.includes(`"${path}"`));

if (missingCoverage.length > 0 || missingMutation.length > 0) {
  throw new Error(
    [
      missingCoverage.length === 0
        ? ""
        : `Missing coverage scope for deterministic module(s): ${missingCoverage.join(", ")}`,
      missingMutation.length === 0
        ? ""
        : `Missing mutation scope for deterministic module(s): ${missingMutation.join(", ")}`,
    ]
      .filter(Boolean)
      .join("\n"),
  );
}
