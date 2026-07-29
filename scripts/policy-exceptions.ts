/**
 * Every gate narrowing lives here, named and owned. A policy script may only
 * skip a path if that path is listed under an exception below, so widening the
 * blind spot requires editing this file and stating why in review.
 */
export interface PolicyException {
  readonly name: string;
  readonly rationale: string;
  readonly removalCondition: string;
  readonly ownerScript: string;
  readonly paths: ReadonlyArray<string>;
}

export const policyExceptions: ReadonlyArray<PolicyException> = [
  {
    name: "process-entry",
    rationale:
      "These two files do nothing but bind a real transport and launch. Binding process stdio would take over stdout, which the MCP protocol owns, and binding a real port makes a unit test a network test. Everything above the binding lives in HabiticaMcp.ts and HabiticaMcpHttp.ts, which the protocol and layer suites drive directly.",
    removalCondition:
      "Remove when these files contain any branch, computed value, or logic beyond Layer.provide plumbing and the launch call. Adding anything decidable to them means it belongs in a gated module instead.",
    ownerScript: "scripts/lint-mutation-scope.ts",
    paths: ["src/main.ts", "src/mainHttp.ts"],
  },
];

export const anyExceptionAllowsPath = (path: string): boolean =>
  policyExceptions.some((exception) => exception.paths.includes(path));

export const exceptedPaths = (): ReadonlyArray<string> =>
  policyExceptions.flatMap((exception) => exception.paths).toSorted();
