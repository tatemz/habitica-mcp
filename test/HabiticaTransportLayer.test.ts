import { Effect, Layer, Schema } from "effect";
import { HttpClient, HttpClientError, HttpClientResponse } from "effect/unstable/http";
import { describe, expect, it } from "vitest";
import { HabiticaConfig } from "../src/config/HabiticaConfig.js";
import { HabiticaDecodeError } from "../src/habitica/HabiticaErrors.js";
import { HabiticaHttpAdapter } from "../src/habitica/HabiticaHttpAdapter.js";
import { HabiticaTransport } from "../src/habitica/HabiticaTransport.js";

interface Recorded {
  readonly body: string | undefined;
  readonly headers: Readonly<Record<string, string>>;
  readonly method: string;
  readonly url: string;
  readonly urlParams: Readonly<Record<string, string>>;
}

const configLayer = HabiticaConfig.from({
  apiBaseUrl: "https://example.test/api/v3",
  apiToken: "token-value",
  clientId: "client-value",
  userId: "user-value",
});

/**
 * Records every outbound request and replays a canned response so header
 * decoration, method mapping, status handling, and decoding are all asserted
 * against the real HttpClient pipeline rather than a hand-rolled fake.
 */
const stubTransport = (respond: () => Response) => {
  const recorded: Array<Recorded> = [];
  const client = HttpClient.make((request) =>
    Effect.sync(() => {
      recorded.push({
        body:
          request.body._tag === "Uint8Array"
            ? new TextDecoder().decode(request.body.body)
            : undefined,
        headers: request.headers,
        method: request.method,
        url: request.url,
        urlParams: Object.fromEntries(request.urlParams.params),
      });
      return HttpClientResponse.fromWeb(request, respond());
    }),
  );

  return {
    layer: HabiticaHttpAdapter.transportLayer.pipe(
      Layer.provide(Layer.succeed(HttpClient.HttpClient)(client)),
      Layer.provide(configLayer),
    ),
    recorded,
  };
};

const jsonResponse = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify({ data, success: true }), {
    headers: { "content-type": "application/json" },
    status,
  });

const runRequest = <A>(
  respond: () => Response,
  use: (transport: HabiticaTransport["Service"]) => Effect.Effect<A, unknown>,
) => {
  const { layer, recorded } = stubTransport(respond);
  return {
    exit: Effect.runPromiseExit(Effect.flatMap(HabiticaTransport, use).pipe(Effect.provide(layer))),
    recorded,
  };
};

const decodeNumber = (value: unknown) => Effect.succeed((value as { readonly data: number }).data);

describe("HabiticaHttpAdapter.transportLayer", () => {
  it("prepends the configured base url and attaches Habitica credential headers", async () => {
    const { exit, recorded } = runRequest(
      () => jsonResponse(1),
      (transport) => transport.request({ method: "GET", path: "/user" }, decodeNumber),
    );

    await exit;

    expect(recorded[0].url).toBe("https://example.test/api/v3/user");
    expect(recorded[0].headers["x-api-key"]).toBe("token-value");
    expect(recorded[0].headers["x-api-user"]).toBe("user-value");
    expect(recorded[0].headers["x-client"]).toBe("client-value");
    expect(recorded[0].headers.accept).toBe("application/json");
  });

  it.each([
    ["GET", undefined],
    ["POST", { text: "value" }],
    ["PUT", { text: "value" }],
    ["DELETE", undefined],
  ] as const)("maps the %s method onto the HTTP request", async (method, body) => {
    const { exit, recorded } = runRequest(
      () => jsonResponse(1),
      (transport) =>
        transport.request(
          body === undefined ? { method, path: "/user" } : { body, method, path: "/user" },
          decodeNumber,
        ),
    );

    await exit;

    expect(recorded[0].method).toBe(method);
    expect(recorded[0].body).toBe(body === undefined ? undefined : JSON.stringify(body));
  });

  it("forwards url params", async () => {
    const { exit, recorded } = runRequest(
      () => jsonResponse(1),
      (transport) =>
        transport.request(
          { method: "GET", path: "/tasks/user", urlParams: { type: "todos" } },
          decodeNumber,
        ),
    );

    await exit;

    expect(recorded[0].urlParams).toEqual({ type: "todos" });
  });

  it("sends no url params when none are supplied", async () => {
    const { exit, recorded } = runRequest(
      () => jsonResponse(1),
      (transport) => transport.request({ method: "GET", path: "/tasks/user" }, decodeNumber),
    );

    await exit;

    expect(recorded[0].urlParams).toEqual({});
  });

  it("decodes a successful body through the supplied decoder", async () => {
    const { exit } = runRequest(
      () => jsonResponse(42),
      (transport) => transport.request({ method: "GET", path: "/user" }, decodeNumber),
    );

    await expect(exit).resolves.toMatchObject({ _tag: "Success", value: 42 });
  });

  it.each([
    [401, "HabiticaAuthError", "Habitica rejected the configured credentials."],
    [403, "HabiticaAuthError", "Habitica rejected the configured credentials."],
    [404, "HabiticaNotFoundError", "Habitica resource was not found."],
    [429, "HabiticaRateLimitError", "Habitica rate limit exceeded."],
    [500, "HabiticaApiError", "Habitica API request failed."],
    [418, "HabiticaApiError", "Habitica API request failed."],
  ])("maps status %i onto %s carrying its own message", async (status, tag, message) => {
    const { exit } = runRequest(
      () => jsonResponse(null, status),
      (transport) => transport.request({ method: "GET", path: "/user" }, decodeNumber),
    );

    const serialised = JSON.stringify(await exit);

    expect(serialised).toContain(tag);
    expect(serialised).toContain(message);
  });

  it("reports the upstream status on a generic API error", async () => {
    const { exit } = runRequest(
      () => jsonResponse(null, 503),
      (transport) => transport.request({ method: "GET", path: "/user" }, decodeNumber),
    );

    expect(JSON.stringify(await exit)).toContain('"status":503');
  });

  /**
   * 200 and 299 pin the edges of the success window and 300 pins the first
   * failure outside it, so an off-by-one at the boundary cannot read as passing.
   */
  it.each([200, 299])("accepts status %i as success", async (status) => {
    const { exit } = runRequest(
      () => jsonResponse(7, status),
      (transport) => transport.request({ method: "GET", path: "/user" }, decodeNumber),
    );

    await expect(exit).resolves.toMatchObject({ _tag: "Success", value: 7 });
  });

  it.each([300, 301])("rejects status %i as a failure", async (status) => {
    const { exit } = runRequest(
      () => jsonResponse(7, status),
      (transport) => transport.request({ method: "GET", path: "/user" }, decodeNumber),
    );

    expect((await exit)._tag).toBe("Failure");
  });

  it("propagates a decoder failure untouched", async () => {
    const { exit } = runRequest(
      () => jsonResponse({ unexpected: true }),
      (transport) =>
        transport.request({ method: "GET", path: "/user" }, (value) =>
          Effect.try({
            try: () => Schema.decodeUnknownSync(Schema.Number)(value),
            catch: () => new HabiticaDecodeError({ message: "decoder rejected the payload" }),
          }),
        ),
    );

    expect(JSON.stringify(await exit)).toContain("decoder rejected the payload");
  });

  it("wraps a non-Habitica transport failure as HabiticaApiError", async () => {
    const client = HttpClient.make((request) =>
      Effect.fail(
        new HttpClientError.HttpClientError({
          reason: new HttpClientError.TransportError({
            cause: new Error("offline"),
            request,
          }),
        }),
      ),
    );
    const layer = HabiticaHttpAdapter.transportLayer.pipe(
      Layer.provide(Layer.succeed(HttpClient.HttpClient)(client)),
      Layer.provide(configLayer),
    );

    const result = await Effect.runPromiseExit(
      Effect.flatMap(HabiticaTransport, (transport) =>
        transport.request({ method: "GET", path: "/user" }, decodeNumber),
      ).pipe(Effect.provide(layer)),
    );

    expect(result._tag).toBe("Failure");
    expect(JSON.stringify(result)).toContain("Habitica HTTP transport failed.");
  });
});
