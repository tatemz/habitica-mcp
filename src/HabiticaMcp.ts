import { NodeRuntime, NodeStdio } from "@effect/platform-node";
import { Layer, Logger } from "effect";
import { McpServer } from "effect/unstable/ai";
import { HabiticaConfig } from "./config/HabiticaConfig.js";
import { HabiticaHttpAdapter } from "./habitica/HabiticaHttpAdapter.js";
import {
  DailyPlanningPrompt,
  HabitCheckInPrompt,
  TaskReviewPrompt,
} from "./prompts/HabiticaPrompts.js";
import { CapabilitiesResource, TaskTemplateResource } from "./resources/HabiticaResources.js";
import { HabiticaToolLayer, HabiticaToolkit } from "./tools/HabiticaTools.js";

const HabiticaToolkitLayer = McpServer.toolkit(HabiticaToolkit).pipe(
  Layer.provideMerge(
    HabiticaToolLayer.pipe(
      Layer.provide(HabiticaHttpAdapter.gatewayLayer),
      Layer.provide(HabiticaConfig.layer),
    ),
  ),
);

const HabiticaMcpPartsLayer = Layer.mergeAll(
  CapabilitiesResource,
  TaskTemplateResource,
  DailyPlanningPrompt,
  HabitCheckInPrompt,
  TaskReviewPrompt,
  HabiticaToolkitLayer,
);

const ServerLayer = HabiticaMcpPartsLayer.pipe(
  Layer.provide(
    McpServer.layerStdio({
      name: "Habitica MCP",
      version: "0.0.1-alpha.0",
    }),
  ),
  Layer.provide(NodeStdio.layer),
  Layer.provide(Layer.succeed(Logger.LogToStderr)(true)),
);

export const run = (): void => {
  Layer.launch(ServerLayer).pipe(NodeRuntime.runMain);
};
