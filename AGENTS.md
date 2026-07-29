# AGENTS.md

This is the operating manual for contributors and agents. Start with `README.md`
for setup and commands.

## Product Pitch

`habitica-mcp` is a local-first MCP server for Habitica. Its job is to expose
small, audited Habitica capabilities to AI clients without hiding account
mutation behind vague natural-language magic.

## Operating Principles

- Prefer deletion over accommodation. This repo is pre-release; replace weak
  paths rather than preserving compatibility with unshipped work.
- Determinism beats cleverness. Every tool should have a stable schema, stable
  response shape, and boring failure behavior.
- One behavior change, one check. Non-trivial logic needs the smallest runnable
  test or self-check that would fail if the logic regresses.
- Do not introduce abstractions until duplication proves the boundary exists.
- Never log Habitica API tokens, user tokens, request auth headers, or full
  profile payloads.

## Codebase Style

Use pnpm. Do not migrate to bun unless the runtime actually changes away from
Node stdio and the lockfile/tooling story gets simpler, not merely different.

Use Effect v4 beta interfaces. Keep Effect package versions aligned exactly.
Prefer generators and `pipe()` chains when they clarify sequencing; do not wrap
plain synchronous logic in Effect just to look functional.

MCP stdout is protocol-owned. Logs go to stderr only.

### Effect v4 Beta

- Use Effect v4 beta APIs only. Keep `effect` and every `@effect/*` package on
  the same `4.0.0-beta.x` version.
- Import schema from `effect` unless local docs prove a narrower import is
  required.
- Prefer `Effect.gen` or `pipe()` when sequencing is meaningful.
- Keep pure synchronous calculations pure; do not wrap everything in
  `Effect.succeed`.
- Use Layers at runtime boundaries: MCP server, platform services, HTTP clients.
- Do not call schema constructors at module scope for data that can fail
  validation.
- Avoid compatibility shims for pre-release code. Replace the old path.
- If an Effect v3 habit conflicts with v4 docs, trust the v4 docs and leave a
  focused test.

### MCP Contracts

MCP tools are an API. Treat schemas and response shapes as contracts.

- Tool names are stable, namespaced lower `snake_case` identifiers prefixed
  `habitica_`. Prompt names follow the same rule. These are wire identifiers;
  renaming one breaks clients.
- Every tool carries a `Tool.Title` for display, a description, and the full set
  of behaviour hints: `Tool.Readonly`, `Tool.Destructive`, `Tool.Idempotent`,
  `Tool.OpenWorld`. Use the shared `hints()` helpers in `HabiticaTools.ts` rather
  than hand-annotating, so a whole class of tools cannot drift.
- Every tool parameter and prompt argument has a description. Those strings are
  the model's only guidance when picking arguments.
- Every tool has a narrow schema, explicit success type, and deterministic
  text/JSON output.
- `habitica_hello_world` is the credential-free smoke test. Keep it boring and
  deterministic.
- Do not print to stdout. Stdio MCP owns stdout; logs go to stderr.
- Never expose Habitica credentials, auth headers, raw tokens, or full account
  dumps.
- Mutating Habitica operations must be explicit in tool names and descriptions.
- Prefer read-only tools first. Add writes only with tests and clear failure
  behavior.
- Decode external API responses at the boundary before passing data to MCP
  responses.
- Do not catch-and-hide API failures. Return a useful typed failure or let Effect
  report the defect.
- Both transports mount the same capability layer. Never register a capability on
  one transport only.

## Boundaries

- `src/main.ts` and `src/mainHttp.ts` are the executable edges. They bind a
  transport and launch, nothing more: they are the only files excluded from
  coverage and mutation, so anything decidable belongs above them.
- `src/HabiticaMcp.ts` owns the transport-agnostic capability layer and takes
  `HabiticaGateway` as a requirement so tests can supply a fake.
- `src/ServerInfo.ts` derives MCP server identity from `package.json`. Do not
  hardcode a version.
- `test/**` checks behavior through public exports.
- `test/support/McpTestClient.ts` drives the real server over in-memory stdio
  streams. New capabilities need a protocol-level assertion there, not just a
  unit test on the handler.

When Habitica API integration arrives, put HTTP/auth at the boundary and decode
responses before exposing them to tools. A failed decode is a bug signal, not
something to smear into `unknown`.

## Feedback Ladder

Run the smallest relevant command while developing:

1. `pnpm test`
2. `pnpm test:coverage`
3. `pnpm e2e`
4. `pnpm lint`
5. `pnpm build`
6. `pnpm check:without-mutation`
7. `pnpm mutation`
8. `pnpm check`

Do not bypass failing checks by weakening rules. Fix the code or delete the bad
rule with a specific reason.

## Quality Gates

Coverage and mutation both start from all of `src/**/*.ts`. There is no way to
quietly shrink that scope.

- Narrowing requires a named entry in `scripts/policy-exceptions.ts` carrying a
  `rationale`, a `removalCondition`, and an `ownerScript`.
- `lint-coverage-policy` and `lint-mutation-scope` fail when `vitest.config.ts`
  or `stryker.config.json` excludes a path that no exception covers, and when an
  exception no longer matches a tracked source file.
- `lint-policy-exception-health` fails when an exception is unreferenced, has a
  thin rationale, or names a script that does not exist.
- `lint-mutation-report-health` fails on any survivor or uncovered mutant.
- `lint-mutation-baselines` is a ratchet: `survived`, `errors`, and `noCoverage`
  only move down, and `mutantCount` has a floor so deleting source or narrowing
  scope cannot pass unnoticed. Lowering it is a deliberate edit with a stated
  reason, as when a refactor legitimately removes conditional mutants.
- `lint-suppression-policy` forbids suppression comments outright. There is no
  `oxlint-disable`, `@ts-ignore`, or `Stryker disable` escape hatch.

Policy scripts live in `scripts/`, are typechecked by `tsconfig.tools.json`, and
use plain Node APIs. Do not wrap them in Effect; they are deterministic
file-reading checks, not runtime code.

## Test Assertions

`habitica-mcp/test-assertion-quality` is enforced on `test/**` and `e2e/**`:

- No `toBeDefined`, `toBeTruthy`, or `toBeFalsy`. Assert the actual value.
- No bare `toThrow()`. Pin the failure, for example
  `toThrow('Missing key\n  at ["text"]')`. `.not.toThrow()` is allowed, since it
  already pins that a valid payload decodes.
- Every `it`/`test` needs at least one real assertion.

Prefer one table-driven contract test that pins exact results over a smoke test
that only proves a call resolved.
