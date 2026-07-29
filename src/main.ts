#!/usr/bin/env node

import { NodeRuntime, NodeStdio } from "@effect/platform-node";
import { Layer, Logger } from "effect";
import { McpServer } from "effect/unstable/ai";
import { HabiticaLiveLayer, HabiticaMcpParts } from "./HabiticaMcp.js";
import { serverInfo } from "./ServerInfo.js";

/**
 * Process entry for the stdio transport. Binding real stdio is the one thing a
 * test cannot do in-process, because MCP owns stdout, so this file holds only
 * that binding and nothing worth branching on.
 */
Layer.launch(
  HabiticaMcpParts.pipe(
    Layer.provide(HabiticaLiveLayer),
    Layer.provide(McpServer.layerStdio(serverInfo)),
    Layer.provide(NodeStdio.layer),
    Layer.provide(Layer.succeed(Logger.LogToStderr)(true)),
  ),
).pipe(NodeRuntime.runMain);
