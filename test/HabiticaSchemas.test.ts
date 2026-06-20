import { Schema } from "effect";
import { describe, expect, it } from "vitest";
import {
  HabiticaApiContent,
  HabiticaApiInventory,
  HabiticaApiMarket,
  HabiticaApiNotifications,
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

describe("HabiticaApiInventory", () => {
  it("decodes inventory from the Habitica /user items envelope", () => {
    const apiInventory = Schema.decodeUnknownSync(HabiticaApiInventory)({
      items: {
        eggs: { Wolf: 1 },
        food: { Meat: 2 },
        hatchingPotions: { Base: 1 },
        mounts: { "Wolf-Base": false },
        pets: { "Wolf-Base": 5 },
      },
    });

    expect(apiInventory.items).toMatchObject({
      eggs: { Wolf: 1 },
      food: { Meat: 2 },
      hatchingPotions: { Base: 1 },
      mounts: { "Wolf-Base": false },
      pets: { "Wolf-Base": 5 },
    });
  });
});

describe("HabiticaApiNotifications", () => {
  it("decodes notifications from the Habitica /user notifications envelope", () => {
    const apiNotifications = Schema.decodeUnknownSync(HabiticaApiNotifications)({
      notifications: [{ id: "notification-1", seen: false, type: "info" }],
    });

    expect(apiNotifications.notifications).toEqual([
      { id: "notification-1", seen: false, type: "info" },
    ]);
  });
});

describe("HabiticaApiMarket", () => {
  it("decodes shop items nested under market categories", () => {
    const market = Schema.decodeUnknownSync(HabiticaApiMarket)({
      categories: [
        {
          items: [{ key: "BearCub", text: "Bear Cub Egg", value: 3 }],
        },
      ],
    });

    expect(market.categories[0]?.items).toEqual([
      { key: "BearCub", text: "Bear Cub Egg", value: 3 },
    ]);
  });
});

describe("HabiticaApiContent", () => {
  it("decodes skills grouped under content spells", () => {
    const content = Schema.decodeUnknownSync(HabiticaApiContent)({
      spells: {
        warrior: {
          smash: { key: "smash", mana: 10, text: "Brutal Smash" },
        },
      },
    });

    expect(content.spells.warrior?.smash).toEqual({
      key: "smash",
      mana: 10,
      text: "Brutal Smash",
    });
  });
});
