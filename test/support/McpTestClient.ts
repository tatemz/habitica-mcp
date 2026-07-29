import { Effect, Fiber, Layer, Logger, Sink, Stdio, Stream } from "effect";
import { McpServer } from "effect/unstable/ai";
import { HabiticaMcpParts } from "../../src/HabiticaMcp.js";
import { HabiticaGateway } from "../../src/habitica/HabiticaGateway.js";
import { serverInfo } from "../../src/ServerInfo.js";

export interface JsonRpcRequest {
  readonly method: string;
  readonly params?: unknown;
}

export interface JsonRpcResponse {
  readonly id?: number;
  readonly error?: { readonly message: string };
  readonly result?: Record<string, unknown>;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const initialize: JsonRpcRequest = {
  method: "initialize",
  params: {
    protocolVersion: "2025-06-18",
    capabilities: {},
    clientInfo: { name: "habitica-mcp-tests", version: "1.0.0" },
  },
};

/**
 * Drives the real server layer over the real stdio JSON-RPC protocol, with the
 * process streams swapped for in-memory ones. Nothing about the MCP wiring is
 * stubbed: a registration that fails to reach the protocol fails here.
 *
 * Requests are written as one NDJSON batch and every response is collected after
 * stdin ends, so ordering assertions stay deterministic.
 */
export const callMcp = (
  gateway: typeof HabiticaGateway.Service,
  requests: ReadonlyArray<JsonRpcRequest>,
): Effect.Effect<ReadonlyArray<JsonRpcResponse>> =>
  Effect.gen(function* () {
    const lines: Array<string> = [];
    const outbound = [initialize, { method: "notifications/initialized" }, ...requests];

    /**
     * The protocol interrupts itself as soon as stdin ends, which would cut off
     * responses still queued for stdout. Holding the stream open means the test
     * decides when the server stops, once it has the replies it asked for.
     */
    const stdin = Stream.fromIterable(
      outbound.map((request, index) =>
        encoder.encode(
          `${JSON.stringify(
            request.method === "notifications/initialized"
              ? { jsonrpc: "2.0", ...request }
              : { jsonrpc: "2.0", id: index, ...request },
          )}\n`,
        ),
      ),
    ).pipe(Stream.concat(Stream.never));

    const stdout = () =>
      Sink.forEach((chunk: string | Uint8Array) =>
        Effect.sync(() => {
          lines.push(typeof chunk === "string" ? chunk : decoder.decode(chunk));
        }),
      );

    const collected = (): ReadonlyArray<JsonRpcResponse> =>
      lines
        .join("")
        .split("\n")
        .filter((line) => line.trim() !== "")
        .map((line) => JSON.parse(line) as JsonRpcResponse);

    /** One response per request carrying an id; the initialized notification gets none. */
    const expected = outbound.filter(
      (request) => request.method !== "notifications/initialized",
    ).length;

    /**
     * The stdio protocol interrupts its own fiber once stdin ends, so the server
     * runs forked and that interrupt lands on the child rather than the test.
     */
    const server = yield* Effect.gen(function* () {
      yield* Layer.build(
        HabiticaMcpParts.pipe(
          Layer.provide(Layer.succeed(HabiticaGateway)(gateway)),
          Layer.provide(McpServer.layerStdio(serverInfo)),
          Layer.provide(Stdio.layerTest({ stdin, stdout })),
          Layer.provide(Layer.succeed(Logger.LogToStderr)(true)),
        ),
      );
      yield* Effect.never;
    }).pipe(Effect.scoped, Effect.forkChild());

    yield* Effect.sleep("5 millis").pipe(
      Effect.repeat({ until: () => collected().length >= expected, times: 400 }),
    );
    yield* Fiber.interrupt(server);

    return collected();
  });
