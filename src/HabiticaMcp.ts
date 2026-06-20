import { NodeRuntime, NodeStdio } from "@effect/platform-node";
import { Effect, Layer, Logger, Schema } from "effect";
import { McpServer, Tool, Toolkit } from "effect/unstable/ai";
import { greetingMessage } from "./Greeting.js";

const GreetingTool = Tool.make("GreetingTool", {
  description: "Return a deterministic greeting for a Habitica MCP caller",
  parameters: Schema.Struct({
    name: Schema.String,
  }),
  success: Schema.String,
});

const HabiticaToolkit = Toolkit.make(GreetingTool);

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

const ServerLayer = Layer.mergeAll(
  ReadmeResource,
  HelloPrompt,
  McpServer.toolkit(HabiticaToolkit).pipe(
    Layer.provideMerge(
      HabiticaToolkit.toLayer({
        GreetingTool: ({ name }) => Effect.succeed(greetingMessage(name)),
      }),
    ),
  ),
).pipe(
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
