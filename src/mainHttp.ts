#!/usr/bin/env node

import { createServer } from "node:http";
import { NodeHttpServer, NodeRuntime } from "@effect/platform-node";
import { Effect, Layer } from "effect";
import { HabiticaMcpHttpLayer, httpListenOptions } from "./HabiticaMcpHttp.js";
import { HttpRouter } from "effect/unstable/http";

/**
 * Process entry for the Streamable HTTP transport. Like the stdio entry, this
 * holds only the binding a test cannot perform in-process.
 */
HttpRouter.serve(HabiticaMcpHttpLayer).pipe(
  Layer.provide(
    Layer.unwrap(
      Effect.map(httpListenOptions, (listen) => NodeHttpServer.layer(() => createServer(), listen)),
    ),
  ),
  Layer.launch,
  NodeRuntime.runMain,
);
