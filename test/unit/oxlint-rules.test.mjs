import { describe, it } from "node:test";

globalThis.describe = describe;
globalThis.it = it;

const { RuleTester } = await import("oxlint/plugins-dev");
const { default: habiticaMcpPlugin } = await import("../../oxlint-plugins/habitica-mcp/index.mjs");

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2023,
    sourceType: "module",
  },
});

const rules = habiticaMcpPlugin.rules;

describe("habitica-mcp oxlint plugin", () => {
  tester.run("no-lowercase-effect-order", rules["no-lowercase-effect-order"], {
    valid: ["const order = Order.String;"],
    invalid: [{ code: "const order = Order.string;", errors: [{ message: /Order.String/ }] }],
  });

  tester.run("no-option-returning-filter-map", rules["no-option-returning-filter-map"], {
    valid: ["const out = Arr.filterMap(items, (item) => Result.succeed(item));"],
    invalid: [
      {
        code: "const out = Arr.filterMap(items, (item) => Option.some(item));",
        errors: [{ message: /Result values/ }],
      },
    ],
  });

  tester.run("effect-trypromise-requires-catch", rules["effect-trypromise-requires-catch"], {
    valid: [
      {
        code: "const value = Effect.tryPromise({ try: () => fetch(url), catch: mapError });",
        filename: "/workspace/src/habitica/HabiticaHttpAdapter.ts",
      },
    ],
    invalid: [
      {
        code: "const value = Effect.tryPromise(() => fetch(url));",
        filename: "/workspace/src/habitica/HabiticaHttpAdapter.ts",
        errors: [{ message: /foreign promise failures/ }],
      },
    ],
  });

  tester.run("no-fallible-module-scope-make", rules["no-fallible-module-scope-make"], {
    valid: [
      {
        code: "export const ProfileTool = Tool.make('ProfileTool', { success: Schema.String });",
        filename: "/workspace/src/tools/ProfileTools.ts",
      },
      {
        code: "export const makeUser = (id) => UserId.make(id);",
        filename: "/workspace/src/habitica/Ids.ts",
      },
    ],
    invalid: [
      {
        code: "export const userId = UserId.make('user-1');",
        filename: "/workspace/src/habitica/Ids.ts",
        errors: [{ message: /module import/ }],
      },
    ],
  });

  tester.run("mcp-stdout-is-protocol", rules["mcp-stdout-is-protocol"], {
    valid: [{ code: "Effect.logInfo('ready');", filename: "/workspace/src/main.ts" }],
    invalid: [
      {
        code: "console.log('ready');",
        filename: "/workspace/src/main.ts",
        errors: [{ message: /stdout/ }],
      },
    ],
  });

  tester.run("no-raw-habitica-credentials", rules["no-raw-habitica-credentials"], {
    valid: [{ code: "Effect.logInfo('configured');", filename: "/workspace/src/config.ts" }],
    invalid: [
      {
        code: "Effect.logInfo(apiToken);",
        filename: "/workspace/src/config.ts",
        errors: [{ message: /tokens/ }],
      },
    ],
  });

  tester.run("no-untyped-tool-success", rules["no-untyped-tool-success"], {
    valid: ["const ToolA = Tool.make('ToolA', { success: Schema.String });"],
    invalid: [
      {
        code: "const ToolA = Tool.make('ToolA', { description: 'missing success' });",
        errors: [{ message: /success schema/ }],
      },
    ],
  });

  tester.run("mutating-tool-name-is-explicit", rules["mutating-tool-name-is-explicit"], {
    valid: [
      "const CreateTaskTool = Tool.make('CreateTaskTool', { description: 'Create a task', success: Schema.String });",
    ],
    invalid: [
      {
        code: "const TaskTool = Tool.make('TaskTool', { description: 'Create a task', success: Schema.String });",
        errors: [{ message: /explicit verb/ }],
      },
    ],
  });

  tester.run("tools-depend-on-gateway-port", rules["tools-depend-on-gateway-port"], {
    valid: [
      {
        code: "import { HabiticaGateway } from '../habitica/HabiticaGateway.js';",
        filename: "/workspace/src/tools/TaskTools.ts",
      },
    ],
    invalid: [
      {
        code: "import { HabiticaHttpAdapter } from '../habitica/HabiticaHttpAdapter.js';",
        filename: "/workspace/src/tools/TaskTools.ts",
        errors: [{ message: /HabiticaGateway/ }],
      },
    ],
  });

  tester.run("no-generic-route-strings-in-tools", rules["no-generic-route-strings-in-tools"], {
    valid: [{ code: "const name = 'tasks';", filename: "/workspace/src/tools/TaskTools.ts" }],
    invalid: [
      {
        code: "const route = '/tasks/user';",
        filename: "/workspace/src/tools/TaskTools.ts",
        errors: [{ message: /route strings/ }],
      },
    ],
  });

  tester.run("no-unchecked-json-boundary", rules["no-unchecked-json-boundary"], {
    valid: [
      {
        code: "const program = Effect.gen(function* () { const body = yield* HttpClientResponse.schemaBodyJson(schema)(response); });",
        filename: "/workspace/src/habitica/HabiticaHttpAdapter.ts",
      },
    ],
    invalid: [
      {
        code: "const body = await response.json();",
        filename: "/workspace/src/habitica/HabiticaHttpAdapter.ts",
        errors: [{ message: /Schema/ }],
      },
    ],
  });
});
