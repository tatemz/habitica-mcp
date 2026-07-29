import { Schema } from "effect";

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
  | HabiticaDecodeError
  | HabiticaNotFoundError
  | HabiticaRateLimitError;

export const HabiticaErrorSchema = Schema.Union([
  HabiticaApiError,
  HabiticaAuthError,
  HabiticaDecodeError,
  HabiticaNotFoundError,
  HabiticaRateLimitError,
]);

/**
 * Derived from the union rather than a hand-written list, so a new member added
 * above cannot be silently misclassified as a foreign failure at the boundary.
 */
const habiticaErrorTags: ReadonlySet<unknown> = new Set(
  HabiticaErrorSchema.members.map((member) => member.identifier),
);

export const isHabiticaError = (value: unknown): value is HabiticaError =>
  value instanceof Error && habiticaErrorTags.has((value as { readonly _tag?: string })._tag);
