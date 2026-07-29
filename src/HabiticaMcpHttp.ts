import { Config, Effect, Layer } from "effect";
import { McpServer } from "effect/unstable/ai";
import { HabiticaLiveLayer, HabiticaMcpParts } from "./HabiticaMcp.js";
import { serverInfo } from "./ServerInfo.js";

export const httpPath = "/mcp";

/**
 * Loopback by default. This transport carries live Habitica credentials and
 * performs no authentication of its own, so binding every interface would hand
 * the account to anything on the network. Overriding the host is a deliberate
 * act that should be paired with an authenticating proxy.
 */
export const httpListenOptions: Effect.Effect<
  { readonly host: string; readonly port: number },
  Config.ConfigError
> = Effect.all({
  host: Config.string("HABITICA_MCP_HTTP_HOST").pipe(Config.withDefault("127.0.0.1")),
  port: Config.port("HABITICA_MCP_HTTP_PORT").pipe(Config.withDefault(3000)),
});

/**
 * Streamable HTTP transport over the same capability layer the stdio entrypoint
 * uses, so the two transports cannot advertise a different capability set. The
 * gateway is left open so the transport tests can drive this exact layer against
 * a fake instead of re-declaring the mount and testing a copy of it.
 */
export const HabiticaMcpHttpTransport = HabiticaMcpParts.pipe(
  Layer.provide(McpServer.layerHttp({ ...serverInfo, path: httpPath })),
);

export const HabiticaMcpHttpLayer = HabiticaMcpHttpTransport.pipe(Layer.provide(HabiticaLiveLayer));
