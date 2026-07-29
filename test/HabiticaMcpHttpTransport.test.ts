import { NodeHttpServer } from "@effect/platform-node";
import { Effect, Layer } from "effect";
import { HttpClient, HttpClientRequest, HttpRouter } from "effect/unstable/http";
import { describe, expect, it } from "vitest";
import manifest from "../package.json" with { type: "json" };
import { HabiticaMcpHttpTransport, httpPath } from "../src/HabiticaMcpHttp.js";
import { HabiticaGateway } from "../src/habitica/HabiticaGateway.js";
import { fakeGateway } from "./support/fakeGateway.js";

/**
 * The same capability layer as the stdio transport, mounted over Streamable HTTP
 * on an ephemeral port. This proves the HTTP entrypoint serves MCP at the path it
 * advertises and reports the same identity, rather than assuming the two
 * transports agree.
 */
const TestHttpLayer = HttpRouter.serve(
  HabiticaMcpHttpTransport.pipe(Layer.provide(Layer.succeed(HabiticaGateway)(fakeGateway))),
  { disableListenLog: true, disableLogger: true },
).pipe(Layer.provideMerge(NodeHttpServer.layerTest));

const post = (body: unknown) =>
  Effect.gen(function* () {
    const client = yield* HttpClient.HttpClient;
    const response = yield* client.execute(
      HttpClientRequest.post(httpPath).pipe(
        HttpClientRequest.setHeaders({
          accept: "application/json",
          "content-type": "application/json",
        }),
        HttpClientRequest.bodyJsonUnsafe(body),
      ),
    );
    return { body: yield* response.json, status: response.status };
  }).pipe(Effect.provide(TestHttpLayer), Effect.scoped, Effect.runPromise);

const initialize = {
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: {
    protocolVersion: "2025-06-18",
    capabilities: {},
    clientInfo: { name: "habitica-mcp-tests", version: "1.0.0" },
  },
};

describe("Streamable HTTP transport", () => {
  it("answers initialize at the advertised path with the published identity", async () => {
    const response = await post(initialize);

    expect(response).toMatchObject({
      status: 200,
      body: {
        result: { serverInfo: { name: manifest.name, version: manifest.version } },
      },
    });
  });

  it("negotiates the same protocol version as the stdio transport", async () => {
    const response = await post(initialize);

    expect((response.body as { result: { protocolVersion: string } }).result.protocolVersion).toBe(
      "2025-06-18",
    );
  });

  it("refuses a GET on the MCP endpoint, which is POST-only", async () => {
    const response = await Effect.gen(function* () {
      const client = yield* HttpClient.HttpClient;
      const result = yield* client.execute(HttpClientRequest.get(httpPath));
      return { allow: result.headers["allow"], status: result.status };
    }).pipe(Effect.provide(TestHttpLayer), Effect.scoped, Effect.runPromise);

    expect(response).toEqual({ allow: "POST", status: 405 });
  });
});
