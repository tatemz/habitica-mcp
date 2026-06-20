import { NodeRuntime, NodeStdio } from "@effect/platform-node";
import { Effect, Layer, Logger, Schema } from "effect";
import { McpServer, Tool, Toolkit } from "effect/unstable/ai";
import { HabiticaConfig } from "./config/HabiticaConfig.js";
import { greetingMessage } from "./Greeting.js";
import { HabiticaHttpAdapter } from "./habitica/HabiticaHttpAdapter.js";
import {
  DailyPlanningPrompt,
  HabitCheckInPrompt,
  TaskReviewPrompt,
} from "./prompts/HabiticaPrompts.js";
import { CapabilitiesResource, TaskTemplateResource } from "./resources/HabiticaResources.js";
import { HabiticaToolLayer, HabiticaToolkit } from "./tools/HabiticaTools.js";

const GreetingTool = Tool.make("GreetingTool", {
  description: "Return a deterministic greeting for a Habitica MCP caller",
  parameters: Schema.Struct({
    name: Schema.String,
  }),
  success: Schema.String,
});

const GreetingToolkit = Toolkit.make(GreetingTool);

const ReadmeResource = McpServer.resource({
  uri: "file:///README.md",
  name: "README",
  description: "Project README",
  mimeType: "text/markdown",
  content: Effect.succeed("# habitica-mcp\n\nHello from the Effect MCP server."),
});

const HelloPrompt = McpServer.prompt({
  name: "Say Hello",
  description: "Ask the server to greet a Habitica user",
  parameters: {
    name: Schema.String,
  },
  completion: {
    name: () => Effect.succeed(["Adventurer", "Habitican", "Tatemz"]),
  },
  content: ({ name }) => Effect.succeed(`Use GreetingTool to greet ${name}.`),
});

const GreetingToolkitLayer = McpServer.toolkit(GreetingToolkit).pipe(
  Layer.provideMerge(
    GreetingToolkit.toLayer({
      GreetingTool: ({ name }) => Effect.succeed(greetingMessage(name)),
    }),
  ),
);

const HabiticaToolkitLayer = McpServer.toolkit(HabiticaToolkit).pipe(
  Layer.provideMerge(
    HabiticaToolLayer.pipe(
      Layer.provide(HabiticaHttpAdapter.gatewayLayer),
      Layer.provide(HabiticaConfig.layer),
    ),
  ),
);

const HabiticaMcpPartsLayer = Layer.mergeAll(
  ReadmeResource,
  CapabilitiesResource,
  TaskTemplateResource,
  HelloPrompt,
  DailyPlanningPrompt,
  HabitCheckInPrompt,
  TaskReviewPrompt,
  GreetingToolkitLayer,
  HabiticaToolkitLayer,
);

const ServerLayer = HabiticaMcpPartsLayer.pipe(
  Layer.provide(
    McpServer.layerStdio({
      name: "Habitica MCP",
      version: "0.0.0",
    }),
  ),
  Layer.provide(NodeStdio.layer),
  Layer.provide(Layer.succeed(Logger.LogToStderr)(true)),
);

export const run = (): void => {
  Layer.launch(ServerLayer).pipe(NodeRuntime.runMain);
};
