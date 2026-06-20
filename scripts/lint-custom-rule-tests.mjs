import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const rulesDirectory = new URL("../oxlint-plugins/habitica-mcp/rules/", import.meta.url);
const testFile = new URL("../test/unit/oxlint-rules.test.mjs", import.meta.url);

const entries = await readdir(rulesDirectory, { withFileTypes: true });
const ruleNames = entries
  .filter((entry) => entry.isDirectory() && entry.name !== "shared")
  .map((entry) => entry.name)
  .toSorted();

const testSource = await readFile(testFile, "utf8");
const missing = ruleNames.filter((ruleName) => !testSource.includes(`tester.run("${ruleName}"`));

if (missing.length > 0) {
  throw new Error(`Missing RuleTester coverage for custom oxlint rule(s): ${missing.join(", ")}`);
}

const pluginSource = await readFile(join(rulesDirectory.pathname, "../index.mjs"), "utf8");
const unregistered = ruleNames.filter(
  (ruleName) => !pluginSource.includes(`./rules/${ruleName}/rule.mjs`),
);

if (unregistered.length > 0) {
  throw new Error(`Custom oxlint rule(s) are not registered: ${unregistered.join(", ")}`);
}
