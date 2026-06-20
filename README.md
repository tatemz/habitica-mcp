# habitica-mcp

Habitica Model Context Protocol server built with Effect v4 beta.

The server exposes typed Habitica read/write tools over stdio. Tool handlers
depend on an Effect `HabiticaGateway` port; the live adapter uses Effect HTTP
and schema-decodes Habitica API responses at the boundary.

## Requirements

- Node.js `>=22.12.0`
- pnpm `>=10`

## Install

```sh
pnpm install
```

Copy the example env file and fill in your Habitica credentials:

```sh
cp .env.example .env
```

Required variables:

- `HABITICA_USER_ID`
- `HABITICA_API_TOKEN`
- `HABITICA_CLIENT_ID`
- `HABITICA_API_BASE_URL` defaults to `https://habitica.com/api/v3`

## Commands

```sh
pnpm dev          # run the stdio MCP server from TypeScript
pnpm build        # emit dist
pnpm check        # full deterministic gate used by Lefthook
pnpm test         # run unit tests
pnpm test:coverage # run unit tests with 100% coverage threshold
pnpm e2e          # run strict effect-bdd Gherkin tests
pnpm mutation     # run Stryker with 100% mutation threshold
```

## Deterministic Gate

`pnpm check` runs build, typecheck, suppression policy, deterministic scope
policy, custom oxlint RuleTester coverage, oxlint, format check, 100% unit
coverage, strict `effect-bdd` Gherkin e2e, 100% Stryker mutation coverage for
the deterministic core, and `knip`.

Lefthook runs `pnpm check` on pre-commit:

```sh
pnpm prepare
```

GitHub Actions runs the same `pnpm check` gate on pushes to `main` and pull
requests.

## Tool Surface

Core tools cover profile, stats, tasks, tags, checklists, and notifications.
Expanded tools cover rewards, inventory, shop items, pets, mounts, and skills.

Mutating tools use explicit verb names such as `CreateTaskTool`,
`UpdateTaskTool`, `DeleteTaskTool`, `ScoreTaskTool`, `ReadNotificationTool`,
`BuyRewardTool`, and `CastSkillTool`. They request approval and return typed
structured results.

## Architecture Guardrails

- MCP stdout is protocol-owned; logs go to stderr.
- Tools import `HabiticaGateway`, not `HabiticaHttpAdapter` or raw route
  strings.
- Habitica credentials and auth headers must never be logged.
- Every `Tool.make` call declares a success schema.
- Deterministic modules must be listed in coverage and mutation scope.

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
