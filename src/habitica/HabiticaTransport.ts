import { Context, type Effect } from "effect";
import type { HabiticaError } from "./HabiticaErrors.js";

export interface HabiticaTransportRequest {
  readonly body?: unknown;
  readonly method: "DELETE" | "GET" | "POST" | "PUT";
  readonly path: string;
  readonly urlParams?: Readonly<Record<string, string>>;
}

export interface HabiticaTransportShape {
  readonly request: <A>(
    request: HabiticaTransportRequest,
    decode: (value: unknown) => Effect.Effect<A, HabiticaError>,
  ) => Effect.Effect<A, HabiticaError>;
}

export class HabiticaTransport extends Context.Service<HabiticaTransport, HabiticaTransportShape>()(
  "habitica-mcp/HabiticaTransport",
) {}
