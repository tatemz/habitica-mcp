import { readdirSync, readFileSync } from "node:fs";
import { reportViolations } from "./policy-output.ts";

const rulesDirectory = new URL("../oxlint-plugins/habitica-mcp/rules/", import.meta.url);
const ruleNames = readdirSync(rulesDirectory, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && entry.name !== "shared")
  .map((entry) => entry.name)
  .toSorted();

const testSource = readFileSync(
  new URL("../test/unit/oxlint-rules.test.mjs", import.meta.url),
  "utf8",
);
const pluginSource = readFileSync(
  new URL("../oxlint-plugins/habitica-mcp/index.mjs", import.meta.url),
  "utf8",
);
const violations: Array<string> = [];

for (const ruleName of ruleNames) {
  if (!testSource.includes(`tester.run("${ruleName}"`)) {
    violations.push(`${ruleName}: missing RuleTester coverage in test/unit/oxlint-rules.test.mjs.`);
  }

  if (!pluginSource.includes(`./rules/${ruleName}/rule.mjs`)) {
    violations.push(`${ruleName}: not registered in oxlint-plugins/habitica-mcp/index.mjs.`);
  }
}

reportViolations("Custom rule test violations", violations);
