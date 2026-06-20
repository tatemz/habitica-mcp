import { Schema } from "effect";

class HabiticaConfigError extends Schema.TaggedErrorClass<HabiticaConfigError>()(
  "HabiticaConfigError",
  {
    message: Schema.String,
  },
) {}

export class HabiticaAuthError extends Schema.TaggedErrorClass<HabiticaAuthError>()(
  "HabiticaAuthError",
  {
    message: Schema.String,
  },
) {}

export class HabiticaRateLimitError extends Schema.TaggedErrorClass<HabiticaRateLimitError>()(
  "HabiticaRateLimitError",
  {
    message: Schema.String,
  },
) {}

export class HabiticaNotFoundError extends Schema.TaggedErrorClass<HabiticaNotFoundError>()(
  "HabiticaNotFoundError",
  {
    message: Schema.String,
  },
) {}

export class HabiticaApiError extends Schema.TaggedErrorClass<HabiticaApiError>()(
  "HabiticaApiError",
  {
    message: Schema.String,
    status: Schema.optional(Schema.Number),
  },
) {}

export class HabiticaDecodeError extends Schema.TaggedErrorClass<HabiticaDecodeError>()(
  "HabiticaDecodeError",
  {
    message: Schema.String,
  },
) {}

export type HabiticaError =
  | HabiticaApiError
  | HabiticaAuthError
  | HabiticaConfigError
  | HabiticaDecodeError
  | HabiticaNotFoundError
  | HabiticaRateLimitError;

export const HabiticaErrorSchema = Schema.Union([
  HabiticaApiError,
  HabiticaAuthError,
  HabiticaConfigError,
  HabiticaDecodeError,
  HabiticaNotFoundError,
  HabiticaRateLimitError,
]);
