import { Schema } from "effect";
import { describe, expect, it } from "vitest";
import {
  HabiticaApiUserProfile,
  habiticaProfileFromApiUser,
} from "../src/habitica/HabiticaSchemas.js";

describe("habiticaProfileFromApiUser", () => {
  it("maps the Habitica /user profile shape to the public MCP profile", () => {
    const apiUser = Schema.decodeUnknownSync(HabiticaApiUserProfile)({
      id: "user-1",
      profile: { name: "Tatemz" },
      stats: { gp: 12, hp: 50, lvl: 7, mp: 20 },
    });

    expect(habiticaProfileFromApiUser(apiUser)).toMatchObject({
      displayName: "Tatemz",
      id: "user-1",
      stats: { gp: 12, hp: 50, lvl: 7, mp: 20 },
    });
  });
});
