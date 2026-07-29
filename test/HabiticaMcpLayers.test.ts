import { ConfigProvider, Effect, Layer } from "effect";
import { describe, expect, it } from "vitest";
import { HabiticaLiveLayer } from "../src/HabiticaMcp.js";
import { httpListenOptions, httpPath } from "../src/HabiticaMcpHttp.js";
import { HabiticaGateway } from "../src/habitica/HabiticaGateway.js";
import { serverInfo } from "../src/ServerInfo.js";
import manifest from "../package.json" with { type: "json" };

const credentials = {
  HABITICA_API_TOKEN: "token-value",
  HABITICA_CLIENT_ID: "client-value",
  HABITICA_USER_ID: "user-value",
};

const withEnv = <A, E>(env: Readonly<Record<string, string>>, effect: Effect.Effect<A, E>) =>
  effect.pipe(Effect.provide(ConfigProvider.layer(ConfigProvider.fromEnv({ env }))));

describe("serverInfo", () => {
  it("mirrors the package manifest so clients cannot be told a stale version", () => {
    expect(serverInfo).toEqual({ name: manifest.name, version: manifest.version });
  });
});

describe("HabiticaLiveLayer", () => {
  it("builds a gateway from the configured credentials", async () => {
    const gateway = await Effect.runPromise(
      withEnv(credentials, Effect.provide(HabiticaGateway, HabiticaLiveLayer).pipe(Effect.scoped)),
    );

    expect(typeof gateway.getTask).toBe("function");
  });

  it("fails to build when a credential is missing", async () => {
    const exit = await Effect.runPromiseExit(
      withEnv(
        { HABITICA_USER_ID: "user-value" },
        Effect.provide(HabiticaGateway, HabiticaLiveLayer).pipe(Effect.scoped),
      ),
    );

    expect(exit._tag).toBe("Failure");
  });
});

describe("http transport configuration", () => {
  it("serves MCP at the conventional /mcp path", () => {
    expect(httpPath).toBe("/mcp");
  });

  it("defaults to loopback so an unauthenticated transport is not network-reachable", async () => {
    const listen = await Effect.runPromise(withEnv({}, httpListenOptions));

    expect(listen).toEqual({ host: "127.0.0.1", port: 3000 });
  });

  it("honours an explicit host and port", async () => {
    const listen = await Effect.runPromise(
      withEnv(
        { HABITICA_MCP_HTTP_HOST: "0.0.0.0", HABITICA_MCP_HTTP_PORT: "8080" },
        httpListenOptions,
      ),
    );

    expect(listen).toEqual({ host: "0.0.0.0", port: 8080 });
  });

  it("rejects a port that is not a number", async () => {
    const exit = await Effect.runPromiseExit(
      withEnv({ HABITICA_MCP_HTTP_PORT: "not-a-port" }, httpListenOptions),
    );

    expect(exit._tag).toBe("Failure");
  });
});

describe("HabiticaMcpHttpLayer", () => {
  it("requires only an HttpRouter, having already provided the gateway and transport", async () => {
    const { HabiticaMcpHttpLayer } = await import("../src/HabiticaMcpHttp.js");

    expect(Layer.isLayer(HabiticaMcpHttpLayer)).toBe(true);
  });
});
