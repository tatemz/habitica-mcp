import { readRepoJson } from "./policy-files.ts";
import { reportViolations } from "./policy-output.ts";

interface PackageJson {
  readonly scripts?: Readonly<Record<string, string>>;
}

const noopPatterns = [/^true$/, /^:$/, /^exit 0$/, /^echo\b/];
const scripts = (readRepoJson("../package.json") as PackageJson).scripts ?? {};

const violations = Object.entries(scripts)
  .filter(([, command]) => noopPatterns.some((pattern) => pattern.test(command.trim())))
  .map(
    ([name, command]) =>
      `package.json: scripts.${name} is a no-op (${command}). A gate that runs nothing must be deleted, not faked.`,
  );

reportViolations("No-op script violations", violations);
