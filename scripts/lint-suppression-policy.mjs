import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const ignoredDirectories = new Set([
  ".git",
  ".stryker-tmp",
  "coverage",
  "dist",
  "node_modules",
  "reports",
]);
const ignoredFiles = new Set(["lint-suppression-policy.mjs", "pnpm-lock.yaml"]);
const forbidden = [
  { pattern: /oxlint-disable/, label: "oxlint-disable" },
  { pattern: /@ts-ignore/, label: "@ts-ignore" },
  { pattern: /@ts-expect-error/, label: "@ts-expect-error" },
  { pattern: /Stryker\s+disable/i, label: "Stryker disable" },
];

const sourceExtensions = new Set([".json", ".jsonc", ".js", ".mjs", ".ts", ".tsx", ".md", ".yml"]);

const extensionOf = (path) => {
  const index = path.lastIndexOf(".");
  return index === -1 ? "" : path.slice(index);
};

const walk = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) {
        files.push(...(await walk(path)));
      }
      continue;
    }

    if (!ignoredFiles.has(entry.name) && sourceExtensions.has(extensionOf(entry.name))) {
      files.push(path);
    }
  }

  return files;
};

const violations = [];

for (const file of await walk(root)) {
  const text = await readFile(file, "utf8");
  for (const { pattern, label } of forbidden) {
    if (pattern.test(text)) {
      violations.push(`${file.replace(root, "")}: ${label}`);
    }
  }
}

if (violations.length > 0) {
  throw new Error(`Suppression policy violations:\n${violations.join("\n")}`);
}
