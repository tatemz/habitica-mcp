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
