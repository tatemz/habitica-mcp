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

- Tool names are stable PascalCase nouns ending in `Tool` only when using Effect
  `Tool.make`.
- Every tool has a narrow schema, explicit success type, and deterministic
  text/JSON output.
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

## Boundaries

- `src/main.ts` is the executable edge.
- `src/HabiticaMcp.ts` owns current MCP wiring.
- `test/**` checks behavior through public exports.

When Habitica API integration arrives, put HTTP/auth at the boundary and decode
responses before exposing them to tools. A failed decode is a bug signal, not
something to smear into `unknown`.

## Feedback Ladder

Run the smallest relevant command while developing:

1. `pnpm test`
2. `pnpm test:coverage`
3. `pnpm e2e`
4. `pnpm mutation`
5. `pnpm build`
6. `pnpm lint`
7. `pnpm check`

Do not bypass failing checks by weakening rules. Fix the code or delete the bad
rule with a specific reason.
