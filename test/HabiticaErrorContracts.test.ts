import { Schema } from "effect";
import { describe, expect, it } from "vitest";
import {
  HabiticaApiError,
  HabiticaAuthError,
  HabiticaDecodeError,
  HabiticaErrorSchema,
  HabiticaNotFoundError,
  HabiticaRateLimitError,
  isHabiticaError,
} from "../src/habitica/HabiticaErrors.js";
import { HabiticaConfig } from "../src/config/HabiticaConfig.js";
import { HabiticaGateway } from "../src/habitica/HabiticaGateway.js";
import { HabiticaTransport } from "../src/habitica/HabiticaTransport.js";

const errorClasses = [
  HabiticaApiError,
  HabiticaAuthError,
  HabiticaDecodeError,
  HabiticaNotFoundError,
  HabiticaRateLimitError,
] as const;

describe("Habitica error contracts", () => {
  it.each(errorClasses.map((error) => [error.identifier, error] as const))(
    "%s carries a message field and its own tag",
    (identifier, error) => {
      const instance = new (error as typeof HabiticaAuthError)({ message: "boom" });

      expect(instance._tag).toBe(identifier);
      expect(instance.message).toBe("boom");
      expect(Object.keys(error.fields)).toContain("message");
    },
  );

  /**
   * This predicate decides whether a boundary failure passes through typed or
   * gets flattened into HabiticaApiError, so each branch is pinned directly.
   */
  it.each(errorClasses.map((error) => [error.identifier, error] as const))(
    "recognises %s as a Habitica failure",
    (_identifier, error) => {
      expect(isHabiticaError(new (error as typeof HabiticaAuthError)({ message: "boom" }))).toBe(
        true,
      );
    },
  );

  it.each([
    ["a plain Error carrying no tag", new Error("offline")],
    ["an Error carrying a foreign tag", Object.assign(new Error("nope"), { _tag: "OtherError" })],
    ["a tag-shaped plain object that is not an Error", { _tag: "HabiticaApiError" }],
    ["undefined", undefined],
  ])("rejects %s", (_label, value) => {
    expect(isHabiticaError(value)).toBe(false);
  });

  it("keeps an optional status only on the generic API error", () => {
    expect(Object.keys(HabiticaApiError.fields).toSorted()).toEqual(["_tag", "message", "status"]);
    expect(new HabiticaApiError({ message: "boom", status: 503 }).status).toBe(503);
    expect(new HabiticaApiError({ message: "boom" }).status).toBeUndefined();
  });

  it.each(errorClasses.map((error) => [error.identifier, error] as const))(
    "%s is a member of the HabiticaError union",
    (_identifier, error) => {
      const instance = new (error as typeof HabiticaAuthError)({ message: "boom" });

      expect(() => Schema.decodeUnknownSync(HabiticaErrorSchema)(instance)).not.toThrow();
    },
  );

  it("rejects a foreign tagged error from the union", () => {
    expect(() =>
      Schema.decodeUnknownSync(HabiticaErrorSchema)({ _tag: "SomeOtherError", message: "boom" }),
    ).toThrow('got {"_tag":"SomeOtherError","message":"boom"}');
  });

  it("requires a message on every union member", () => {
    for (const error of errorClasses) {
      expect(() =>
        Schema.decodeUnknownSync(HabiticaErrorSchema)({ _tag: error.identifier }),
      ).toThrow('Missing key\n  at ["message"]');
    }
  });

  it("publishes exactly the five reachable Habitica failures", () => {
    expect(errorClasses.map((error) => error.identifier).toSorted()).toEqual([
      "HabiticaApiError",
      "HabiticaAuthError",
      "HabiticaDecodeError",
      "HabiticaNotFoundError",
      "HabiticaRateLimitError",
    ]);
  });
});

/**
 * Service keys are the identity Effect uses to resolve dependencies. A silent
 * rename would swap a real gateway for a missing-service defect at runtime.
 */
describe("Habitica service identities", () => {
  it.each([
    ["habitica-mcp/HabiticaConfig", HabiticaConfig],
    ["habitica-mcp/HabiticaGateway", HabiticaGateway],
    ["habitica-mcp/HabiticaTransport", HabiticaTransport],
  ])("is keyed as %s", (key, service) => {
    expect(service.key).toBe(key);
  });
});
