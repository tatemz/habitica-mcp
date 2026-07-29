import { readdirSync, readFileSync } from "node:fs";
import { reportViolations } from "./policy-output.ts";

const requiredRuleFiles = ["deterministic-delivery.mdc", "effect-v4-mcp.mdc", "ponytail.mdc"];
const requiredAgentText = [
  "Effect v4 beta",
  "MCP stdout is protocol-owned",
  "pnpm check",
  "Do not bypass failing checks",
];
const rulesDirectory = new URL("../.cursor/rules/", import.meta.url);
const ruleFiles = readdirSync(rulesDirectory).filter((file) => file.endsWith(".mdc"));
const violations: Array<string> = [];

for (const requiredFile of requiredRuleFiles) {
  if (!ruleFiles.includes(requiredFile)) {
    violations.push(`Missing required Cursor rule: .cursor/rules/${requiredFile}`);
  }
}

for (const ruleFile of ruleFiles) {
  const content = readFileSync(new URL(ruleFile, rulesDirectory), "utf8");
  const lines = content.trimEnd().split("\n");

  if (!content.startsWith("---\n")) {
    violations.push(`${ruleFile} must start with YAML frontmatter.`);
  }

  if (!/\ndescription:\s*\S/.test(content)) {
    violations.push(`${ruleFile} must declare a description.`);
  }

  if (!/\nalwaysApply:\s*true\b/.test(content)) {
    violations.push(`${ruleFile} must always apply in this repo.`);
  }

  if (lines.length > 50) {
    violations.push(`${ruleFile} must stay concise; found ${lines.length} lines.`);
  }
}

const agents = readFileSync(new URL("../AGENTS.md", import.meta.url), "utf8");

for (const requiredText of requiredAgentText) {
  if (!agents.includes(requiredText)) {
    violations.push(`AGENTS.md must mention: ${requiredText}`);
  }
}

reportViolations("Rules policy violations", violations);
