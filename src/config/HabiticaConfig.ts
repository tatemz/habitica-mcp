import { Config, Context, Effect, Layer, Redacted } from "effect";

export interface HabiticaConfigShape {
  readonly apiBaseUrl: string;
  readonly apiToken: string;
  readonly clientId: string;
  readonly userId: string;
}

export class HabiticaConfig extends Context.Service<HabiticaConfig, HabiticaConfigShape>()(
  "habitica-mcp/HabiticaConfig",
) {
  static readonly layer = Layer.effect(
    HabiticaConfig,
    Effect.gen(function* () {
      const userId = yield* Config.string("HABITICA_USER_ID");
      const apiToken = yield* Config.redacted("HABITICA_API_TOKEN");
      const clientId = yield* Config.string("HABITICA_CLIENT_ID");
      const apiBaseUrl = yield* Config.string("HABITICA_API_BASE_URL").pipe(
        Config.withDefault("https://habitica.com/api/v3"),
      );

      return HabiticaConfig.of({
        apiBaseUrl,
        apiToken: Redacted.value(apiToken),
        clientId,
        userId,
      });
    }),
  );

  static readonly from = (config: HabiticaConfigShape) =>
    Layer.succeed(HabiticaConfig)(HabiticaConfig.of(config));
}
