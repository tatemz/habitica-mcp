# habitica-mcp

Habitica Model Context Protocol server built with Effect v4 beta.

This repo is intentionally small while the MCP surface is being shaped. The
first executable server exposes a deterministic hello-world tool, resource, and
prompt over stdio.

## Requirements

- Node.js `>=22.12.0`
- pnpm `>=10`

## Install

```sh
pnpm install
```

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

`pnpm check` runs build, typecheck, lint, format check, 100% unit coverage,
strict `effect-bdd` Gherkin e2e, 100% Stryker mutation coverage for the
deterministic core, and `knip`.

Lefthook runs `pnpm check` on pre-commit:

```sh
pnpm prepare
```

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
