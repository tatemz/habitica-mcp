# habitica-mcp

Habitica Model Context Protocol server built with Effect v4 beta.

The server exposes typed Habitica read/write tools over stdio, with an opt-in
Streamable HTTP transport. Tool handlers depend on an Effect `HabiticaGateway`
port; the live adapter uses Effect HTTP and schema-decodes Habitica API responses
at the boundary.

## Requirements

- Node.js `>=22.12.0`
- pnpm `>=10`

This repo uses pnpm rather than bun because the server runs on Node stdio, the
lockfile is already deterministic, and the Effect MCP docs target Node runtime
primitives.

## Install

```sh
pnpm add -g habitica-mcp@alpha
```

For local development:

```sh
pnpm install
```

Required variables:

- `HABITICA_USER_ID`
- `HABITICA_API_TOKEN`
- `HABITICA_CLIENT_ID`
- `HABITICA_API_BASE_URL` defaults to `https://habitica.com/api/v3`

For a local checkout, copy the example env file and fill in your Habitica credentials:

```sh
cp .env.example .env
```

## Commands

```sh
pnpm dev                    # run the stdio MCP server from TypeScript
pnpm dev:http               # run the Streamable HTTP server from TypeScript
pnpm build                  # emit dist
pnpm check                  # every gate, mutation included
pnpm check:without-mutation # every gate except mutation
pnpm test                   # run unit tests
pnpm test:coverage          # run unit tests with 100% coverage thresholds
pnpm e2e                    # run strict effect-bdd Gherkin tests
pnpm mutation               # Stryker at 100%, then report health and baselines
pnpm mutation:dev           # incremental Stryker run for local iteration
pnpm lint                   # policy scripts, dep graph, rule tests, oxlint, knip
```

`pnpm e2e` is a deterministic fake-gateway suite. It exercises the full MCP tool
handler surface without live Habitica credentials or network calls.

`pnpm test` includes a protocol suite that speaks real JSON-RPC to the real
server layer. It swaps the process streams for in-memory ones with
`Stdio.layerTest`, then drives `initialize`, `tools/list`, `tools/call`,
`resources/list`, `resources/read`, `resources/templates/list`, `prompts/list`,
`prompts/get`, and `completion/complete`. Nothing about the MCP wiring is
stubbed, so a registration that never reaches the protocol fails there rather
than passing an in-memory assertion. A second suite mounts the same layer over
HTTP on an ephemeral port to confirm both transports report the same identity.

## Feedback Ladder

Run the smallest relevant command while developing, then widen:

1. `pnpm test`
2. `pnpm test:coverage`
3. `pnpm e2e`
4. `pnpm lint`
5. `pnpm build`
6. `pnpm check:without-mutation`
7. `pnpm mutation`
8. `pnpm check`

## Deterministic Gate

`pnpm check` is `pnpm check:without-mutation` followed by `pnpm mutation`.

`pnpm check:without-mutation` runs build, typecheck (source and policy scripts),
`pnpm lint`, format check, 100% unit coverage, and the strict `effect-bdd`
Gherkin e2e suite.

`pnpm lint` runs, in order:

- `lint:policy` — the deterministic policy scripts in `scripts/`, covering
  suppression comments, repository-relative paths, no-op scripts, `.cursor/rules`
  health, version pinning, policy-exception health, mutation scope, Stryker
  config, and coverage config.
- `lint:deps` — `dependency-cruiser` architectural boundaries.
- `lint:custom-rule-tests` — every custom oxlint rule has `RuleTester` coverage,
  then runs those rule tests.
- `lint:oxlint` — type-aware oxlint with `complexity: 4` and the custom
  `habitica-mcp` plugin.
- `lint:knip` — unused files, dependencies, and exports.

`pnpm mutation` runs Stryker at a 100% break threshold, then
`lint:mutation-report-health` (no survivors, no uncovered mutants) and
`lint:mutation-baselines` (a ratchet that only moves down, and a mutant-count
floor so the mutate scope cannot quietly shrink).

### Coverage and Mutation Scope

Coverage and mutation both start from all of `src/**/*.ts`. Narrowing is only
possible through a named exception in `scripts/policy-exceptions.ts` that carries
a rationale, a removal condition, and an owning policy script. `lint-coverage-policy`
and `lint-mutation-scope` fail if `vitest.config.ts` or `stryker.config.json`
excludes a path that no exception covers, and also if an exception goes stale.

Lefthook runs `pnpm check` on pre-commit:

```sh
pnpm prepare
```

GitHub Actions splits the same work into two jobs: `gates` runs
`check:without-mutation`, and `mutation` runs Stryker incrementally on pull
requests and in full on pushes to `main` and on a nightly schedule.

## Tool Surface

`habitica_hello_world` returns a deterministic greeting and does not require
Habitica credentials. Use it as the first MCP smoke test.

Core tools cover profile, stats, tasks, tags, checklists, and notifications.
Expanded tools cover rewards, inventory, shop items, pets, mounts, and skills.

All 31 tool names are namespaced lower `snake_case`, so they stay
distinguishable when a client has several MCP servers connected. Every tool also
carries a human-readable `title` for approval dialogs, a description, and a
full set of MCP behaviour hints:

| Hint              | Meaning                                                    |
| ----------------- | ---------------------------------------------------------- |
| `readOnlyHint`    | The tool never changes Habitica state.                     |
| `destructiveHint` | The tool deletes something that cannot be recovered.       |
| `idempotentHint`  | Repeating the call with the same arguments adds no effect. |
| `openWorldHint`   | The tool talks to Habitica rather than computing locally.  |

Mutating tools name their verb explicitly, as in `habitica_create_task`,
`habitica_delete_task`, `habitica_score_task`, and `habitica_cast_skill`. They
request approval and return typed structured results. Read tools are idempotent;
creates, purchases, casts, and toggles are not, because repeating them spends
gold, mana, or inventory.

Every tool parameter carries a description, since those strings are the only
signal the model has when choosing arguments.

## Prompts and Resources

Three prompts are registered with `snake_case` identifiers and completions for
their arguments: `habitica_daily_planning`, `habitica_task_review`, and
`habitica_habit_check_in`.

Two static resources describe the server itself:

- `habitica-mcp://capabilities` (markdown)
- `habitica-mcp://task-template` (JSON)

One resource template exposes individual tasks so a client can attach a single
task as context instead of pulling the whole list through a tool call:

- `habitica://task/{taskId}`, with completion over the current task ids

## Transports

Both transports mount the same capability layer, so they cannot advertise
different tools.

- **stdio** (`habitica-mcp`) is the default and what MCP clients expect.
- **Streamable HTTP** (`habitica-mcp-http`) serves MCP at `POST /mcp`.

The HTTP transport binds `127.0.0.1:3000` by default and performs no
authentication of its own. It carries live Habitica credentials, so only change
`HABITICA_MCP_HTTP_HOST` if you are putting an authenticating proxy in front of
it.

- `HABITICA_MCP_HTTP_HOST` defaults to `127.0.0.1`
- `HABITICA_MCP_HTTP_PORT` defaults to `3000`

## Architecture Guardrails

- MCP stdout is protocol-owned; logs go to stderr.
- Tools import `HabiticaGateway`, not `HabiticaHttpAdapter` or raw route
  strings. Resource templates may read through the same port.
- Habitica credentials and auth headers must never be logged.
- Every `Tool.make` call declares a success schema.
- The server reports its version from `package.json`, so what a client sees on
  `initialize` cannot drift from what was published.
- Deterministic modules must be listed in coverage and mutation scope. The only
  exclusions are `src/main.ts` and `src/mainHttp.ts`, which bind a transport and
  launch; anything decidable belongs above them.

## MCP Config

Use the local TypeScript entrypoint while developing:

```json
{
  "mcpServers": {
    "habitica": {
      "command": "pnpm",
      "args": ["--dir", "/absolute/path/to/habitica-mcp", "dev"]
    }
  }
}
```

After `pnpm build`, use the package binary:

```json
{
  "mcpServers": {
    "habitica": {
      "command": "node",
      "args": ["/absolute/path/to/habitica-mcp/dist/main.js"]
    }
  }
}
```

After installing from npm, use the binary:

```json
{
  "mcpServers": {
    "habitica": {
      "command": "habitica-mcp"
    }
  }
}
```

## Publishing

This package is intentionally pre-1.0. Publish early builds with the manual
`Publish` GitHub Actions workflow. It uses the repository `NPM_TOKEN` secret,
runs `pnpm check`, and publishes with npm provenance on the `alpha` dist-tag.

Equivalent local command:

```sh
pnpm check
npm publish --tag alpha --provenance
```

`prepack` builds `dist/`; `publishConfig` marks the package public and enables npm provenance.
