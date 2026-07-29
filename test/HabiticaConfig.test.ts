import { ConfigProvider, Effect } from "effect";
import { describe, expect, it } from "vitest";
import { HabiticaConfig } from "../src/config/HabiticaConfig.js";

const credentials = {
  HABITICA_API_TOKEN: "token-value",
  HABITICA_CLIENT_ID: "client-value",
  HABITICA_USER_ID: "user-value",
};

const resolve = (env: Readonly<Record<string, string>>) =>
  Effect.provide(HabiticaConfig, HabiticaConfig.layer).pipe(
    Effect.provide(ConfigProvider.layer(ConfigProvider.fromEnv({ env }))),
  );

describe("HabiticaConfig.layer", () => {
  it("defaults the API base url to the Habitica v3 endpoint", async () => {
    const config = await Effect.runPromise(resolve(credentials));

    expect(config.apiBaseUrl).toBe("https://habitica.com/api/v3");
  });

  it("prefers an explicitly configured API base url", async () => {
    const config = await Effect.runPromise(
      resolve({ ...credentials, HABITICA_API_BASE_URL: "https://example.test/api/v3" }),
    );

    expect(config.apiBaseUrl).toBe("https://example.test/api/v3");
  });

  it("unwraps the redacted API token so the transport can send it", async () => {
    const config = await Effect.runPromise(resolve(credentials));

    expect(config.apiToken).toBe("token-value");
  });

  it("carries the client and user identifiers through unchanged", async () => {
    const config = await Effect.runPromise(resolve(credentials));

    expect(config.clientId).toBe("client-value");
    expect(config.userId).toBe("user-value");
  });

  it("fails when a required credential is missing", async () => {
    const exit = await Effect.runPromiseExit(resolve({ HABITICA_USER_ID: "user-value" }));

    expect(exit._tag).toBe("Failure");
  });
});

describe("HabiticaConfig.from", () => {
  it("supplies a fixed configuration without reading the environment", async () => {
    const shape = {
      apiBaseUrl: "https://example.test/api/v3",
      apiToken: "fixed-token",
      clientId: "fixed-client",
      userId: "fixed-user",
    };

    const config = await Effect.runPromise(
      Effect.provide(HabiticaConfig, HabiticaConfig.from(shape)),
    );

    expect(config).toEqual(shape);
  });
});
