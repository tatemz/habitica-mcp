import type { Config } from "effect";
import { Layer } from "effect";
import { McpServer } from "effect/unstable/ai";
import { HabiticaConfig } from "./config/HabiticaConfig.js";
import type { HabiticaGateway } from "./habitica/HabiticaGateway.js";
import { HabiticaHttpAdapter } from "./habitica/HabiticaHttpAdapter.js";
import {
  DailyPlanningPrompt,
  HabitCheckInPrompt,
  TaskReviewPrompt,
} from "./prompts/HabiticaPrompts.js";
import {
  CapabilitiesResource,
  TaskResourceTemplate,
  TaskTemplateResource,
} from "./resources/HabiticaResources.js";
import { HabiticaToolLayer, HabiticaToolkit } from "./tools/HabiticaTools.js";

/**
 * Every tool, prompt, and resource the server exposes, over any transport and
 * against any gateway. Keeping the gateway and the transport as requirements is
 * what lets the protocol tests drive this exact layer in-process, so the wiring
 * under test is the wiring that ships.
 */
export const HabiticaMcpParts: Layer.Layer<never, never, HabiticaGateway | McpServer.McpServer> =
  Layer.mergeAll(
    CapabilitiesResource,
    TaskTemplateResource,
    TaskResourceTemplate,
    DailyPlanningPrompt,
    HabitCheckInPrompt,
    TaskReviewPrompt,
    McpServer.toolkit(HabiticaToolkit).pipe(Layer.provideMerge(HabiticaToolLayer)),
  );

/** The live Habitica gateway, shared by the toolkit and the task resource template. */
export const HabiticaLiveLayer: Layer.Layer<HabiticaGateway, Config.ConfigError> =
  HabiticaHttpAdapter.layer.pipe(Layer.provide(HabiticaConfig.layer));
