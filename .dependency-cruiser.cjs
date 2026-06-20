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
      name: "main-is-only-runtime-launch-edge",
      severity: "error",
      comment: "src/main.ts should stay a tiny executable edge.",
      from: {
        path: "^src/main\\.ts$",
      },
      to: {
        pathNot: "^src/HabiticaMcp\\.ts$",
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
      name: "resources-and-prompts-stay-passive",
      severity: "error",
      comment: "Resources and prompts describe capabilities; they should not call Habitica.",
      from: {
        path: "^src/(resources|prompts)/",
      },
      to: {
        path: "^src/(config/|habitica/|tools/)",
      },
    },
    {
      name: "tests-do-not-import-runtime-main",
      severity: "error",
      comment: "Tests should exercise behavior, not launch the process edge.",
      from: {
        path: "^(test|e2e)/",
      },
      to: {
        path: "^src/main\\.ts$",
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
