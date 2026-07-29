/** @type {import("dependency-cruiser").IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "no-circular-dependencies",
      severity: "error",
      comment: "Cycles are architecture debt. Break the direction instead of tolerating it.",
      from: {},
      to: {
        circular: true,
      },
    },
    {
      name: "no-unresolved-dependencies",
      severity: "error",
      comment: "Every import must resolve under the same rules TypeScript uses.",
      from: {},
      to: {
        couldNotResolve: true,
      },
    },
    {
      name: "no-deprecated-dependencies",
      severity: "error",
      comment: "Deprecated packages should not enter the architecture silently.",
      from: {},
      to: {
        dependencyTypes: ["deprecated"],
      },
    },
    {
      name: "production-does-not-import-tests",
      severity: "error",
      comment: "Runtime source cannot depend on test or e2e support.",
      from: {
        path: "^src/",
      },
      to: {
        path: "^(test|e2e)/",
      },
    },
    {
      name: "process-entries-import-only-composed-layers",
      severity: "error",
      comment:
        "The entry files exist to bind a transport and launch, which is the one thing tests cannot do in-process. They may compose the exported layers and the server identity, but reaching into tools, resources, prompts, or the Habitica client would put untestable logic behind a process boundary.",
      from: {
        path: "^src/main[A-Za-z]*\\.ts$",
      },
      to: {
        path: "^src/",
        pathNot: "^src/(HabiticaMcp\\.ts|HabiticaMcpHttp\\.ts|ServerInfo\\.ts)$",
      },
    },
    {
      name: "tools-depend-on-habitica-port",
      severity: "error",
      comment: "MCP tools depend on the gateway port and schemas, not transport details.",
      from: {
        path: "^src/tools/",
      },
      to: {
        path: "^src/(config/|habitica/(HabiticaHttpAdapter|HabiticaTransport|HabiticaRoutes)\\.ts$)",
      },
    },
    {
      name: "habitica-port-has-no-adapter-knowledge",
      severity: "error",
      comment: "The gateway port must not know about HTTP, config, transport, or route builders.",
      from: {
        path: "^src/habitica/HabiticaGateway\\.ts$",
      },
      to: {
        path: "^src/(config/|habitica/(HabiticaHttpAdapter|HabiticaTransport|HabiticaRoutes)\\.ts$)",
      },
    },
    {
      name: "schemas-have-no-runtime-boundaries",
      severity: "error",
      comment: "API schemas should be pure contracts, not runtime clients in disguise.",
      from: {
        path: "^src/habitica/HabiticaSchemas\\.ts$",
      },
      to: {
        path: "^src/(config/|tools/|resources/|prompts/|habitica/(HabiticaGateway|HabiticaHttpAdapter|HabiticaTransport|HabiticaRoutes)\\.ts$)",
      },
    },
    {
      name: "resources-and-prompts-depend-on-habitica-port",
      severity: "error",
      comment:
        "A resource template may read through the gateway port, the same as a tool does. It must not reach transport details, config, or the tool layer, so the port stays the only way into Habitica.",
      from: {
        path: "^src/(resources|prompts)/",
      },
      to: {
        path: "^src/(config/|tools/|habitica/(HabiticaHttpAdapter|HabiticaTransport|HabiticaRoutes)\\.ts$)",
      },
    },
    {
      name: "tests-do-not-import-runtime-entries",
      severity: "error",
      comment:
        "Importing an entry file launches a transport. Tests drive the composed layers instead, which is why the entries hold nothing but the binding.",
      from: {
        path: "^(test|e2e)/",
      },
      to: {
        path: "^src/main[A-Za-z]*\\.ts$",
      },
    },
    {
      name: "custom-oxlint-rules-do-not-import-product-source",
      severity: "error",
      comment: "Lint rules inspect source; they must not depend on product modules.",
      from: {
        path: "^oxlint-plugins/",
      },
      to: {
        path: "^src/",
      },
    },
    {
      name: "scripts-do-not-import-product-source",
      severity: "error",
      comment: "Policy scripts inspect the repo; they should not couple to runtime modules.",
      from: {
        path: "^scripts/",
      },
      to: {
        path: "^src/",
      },
    },
  ],
  options: {
    doNotFollow: {
      path: "node_modules",
    },
    enhancedResolveOptions: {
      conditionNames: ["node", "import", "default"],
      exportsFields: ["exports"],
    },
    tsConfig: {
      fileName: "tsconfig.test.json",
    },
    tsPreCompilationDeps: true,
  },
};
