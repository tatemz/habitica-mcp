import { readFile, readdir } from "node:fs/promises";

const requiredRuleFiles = ["deterministic-delivery.mdc", "effect-v4-mcp.mdc", "ponytail.mdc"];
const requiredAgentText = [
  "Effect v4 beta",
  "MCP stdout is protocol-owned",
  "pnpm check",
  "Do not bypass failing checks",
];
const failures = [];
const rulesDirectory = new URL("../.cursor/rules/", import.meta.url);
const ruleFiles = (await readdir(rulesDirectory)).filter((file) => file.endsWith(".mdc"));

for (const requiredFile of requiredRuleFiles) {
  if (!ruleFiles.includes(requiredFile)) {
    failures.push(`Missing required Cursor rule: .cursor/rules/${requiredFile}`);
  }
}

for (const ruleFile of ruleFiles) {
  const content = await readFile(new URL(ruleFile, rulesDirectory), "utf8");
  const lines = content.trimEnd().split("\n");

  if (!content.startsWith("---\n")) {
    failures.push(`${ruleFile} must start with YAML frontmatter.`);
  }

  if (!/\ndescription:\s*\S/.test(content)) {
    failures.push(`${ruleFile} must declare a description.`);
  }

  if (!/\nalwaysApply:\s*true\b/.test(content)) {
    failures.push(`${ruleFile} must always apply in this repo.`);
  }

  if (lines.length > 50) {
    failures.push(`${ruleFile} must stay concise; found ${lines.length} lines.`);
  }
}

const agents = await readFile(new URL("../AGENTS.md", import.meta.url), "utf8");

for (const requiredText of requiredAgentText) {
  if (!agents.includes(requiredText)) {
    failures.push(`AGENTS.md must mention: ${requiredText}`);
  }
}

if (failures.length > 0) {
  throw new Error(`Rules policy violations:\n${failures.join("\n")}`);
}
