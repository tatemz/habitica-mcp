import { Schema } from "effect";
import { describe, expect, it } from "vitest";
import * as Schemas from "../src/habitica/HabiticaSchemas.js";

interface SchemaContract {
  readonly optional: ReadonlyArray<string>;
  readonly required: ReadonlyArray<string>;
  readonly valid: Readonly<Record<string, unknown>>;
}

const stats = { gp: 12, hp: 50, lvl: 7, mp: 20 };

/**
 * Whether a field is required is part of the published MCP contract, so each
 * schema is pinned by identity, field set, and per-field optionality rather than
 * by a single happy-path decode.
 */
const contracts: Readonly<Record<string, SchemaContract>> = {
  CreateTagInput: { optional: [], required: ["name"], valid: { name: "Focus" } },
  CreateTaskInput: {
    optional: ["notes"],
    required: ["text", "type"],
    valid: { text: "Ship it", type: "todo" },
  },
  HabiticaApiContent: {
    optional: [],
    required: ["spells"],
    valid: { spells: { wizard: { fireball: { key: "fireball", mana: 10, text: "Burst" } } } },
  },
  HabiticaApiInventory: {
    optional: [],
    required: ["items"],
    valid: {
      items: { eggs: {}, food: {}, hatchingPotions: {}, mounts: {}, pets: {} },
    },
  },
  HabiticaApiMarket: {
    optional: [],
    required: ["categories"],
    valid: { categories: [{ items: [] }] },
  },
  HabiticaApiMarketCategory: { optional: [], required: ["items"], valid: { items: [] } },
  HabiticaApiNotifications: {
    optional: [],
    required: ["notifications"],
    valid: { notifications: [] },
  },
  HabiticaApiUserProfile: {
    optional: [],
    required: ["id", "profile", "stats"],
    valid: { id: "u1", profile: { name: "Tatemz" }, stats },
  },
  HabiticaChecklistItem: {
    optional: [],
    required: ["completed", "id", "text"],
    valid: { completed: false, id: "c1", text: "Item" },
  },
  HabiticaInventory: {
    optional: [],
    required: ["eggs", "food", "hatchingPotions", "mounts", "pets"],
    valid: { eggs: {}, food: {}, hatchingPotions: {}, mounts: {}, pets: {} },
  },
  HabiticaMutationResult: {
    optional: [],
    required: ["id", "message"],
    valid: { id: "t1", message: "ok" },
  },
  HabiticaNotification: {
    optional: ["text"],
    required: ["id", "seen", "type"],
    valid: { id: "n1", seen: false, type: "info" },
  },
  HabiticaProfile: {
    optional: [],
    required: ["displayName", "id", "stats"],
    valid: { displayName: "Tatemz", id: "u1", stats },
  },
  HabiticaShopItem: {
    optional: [],
    required: ["key", "text", "value"],
    valid: { key: "k", text: "t", value: 1 },
  },
  HabiticaSkill: {
    optional: [],
    required: ["key", "mana", "text"],
    valid: { key: "fireball", mana: 10, text: "Burst" },
  },
  HabiticaTag: { optional: [], required: ["id", "name"], valid: { id: "tag-1", name: "Focus" } },
  HabiticaTask: {
    optional: ["checklist", "completed", "notes"],
    required: ["id", "text", "type"],
    valid: { id: "t1", text: "Ship it", type: "todo" },
  },
  UpdateChecklistItemInput: {
    optional: ["completed", "text"],
    required: ["itemId", "taskId"],
    valid: { itemId: "i1", taskId: "t1" },
  },
  UpdateTaskInput: {
    optional: ["completed", "notes", "text"],
    required: ["id"],
    valid: { id: "t1" },
  },
};

type SchemaClass = {
  readonly fields: Readonly<Record<string, unknown>>;
  readonly identifier: string;
};

const schemaFor = (name: string): SchemaClass =>
  (Schemas as unknown as Readonly<Record<string, SchemaClass>>)[name];

const contractEntries = Object.entries(contracts);

describe("Habitica schema contracts", () => {
  it.each(contractEntries)("%s keeps its schema identity", (name) => {
    expect(schemaFor(name).identifier).toBe(name);
  });

  it.each(contractEntries)("%s declares exactly the documented fields", (name, contract) => {
    expect(Object.keys(schemaFor(name).fields).toSorted()).toEqual(
      [...contract.required, ...contract.optional].toSorted(),
    );
  });

  it.each(contractEntries)("%s decodes its minimal valid payload", (name, contract) => {
    expect(() => Schema.decodeUnknownSync(schemaFor(name) as never)(contract.valid)).not.toThrow();
  });

  it.each(contractEntries.filter(([, contract]) => contract.required.length > 0))(
    "%s rejects a payload missing any required field",
    (name, contract) => {
      for (const field of contract.required) {
        const partial = { ...contract.valid };
        delete partial[field];

        // Pin the field name so the rejection is attributable, not incidental.
        expect(() => Schema.decodeUnknownSync(schemaFor(name) as never)(partial)).toThrow(
          `Missing key\n  at ["${field}"]`,
        );
      }
    },
  );

  it.each(contractEntries.filter(([, contract]) => contract.optional.length > 0))(
    "%s accepts a payload omitting every optional field",
    (name, contract) => {
      const withoutOptional = { ...contract.valid };
      for (const field of contract.optional) {
        delete withoutOptional[field];
      }

      expect(() =>
        Schema.decodeUnknownSync(schemaFor(name) as never)(withoutOptional),
      ).not.toThrow();
    },
  );
});

describe("HabiticaApiUserProfile", () => {
  it("requires a name inside the nested Habitica profile object", () => {
    expect(() =>
      Schema.decodeUnknownSync(Schemas.HabiticaApiUserProfile)({
        id: "u1",
        profile: {},
        stats,
      }),
    ).toThrow('Missing key\n  at ["profile"]["name"]');
  });
});

describe("Habitica literal unions", () => {
  it("accepts exactly the four Habitica task types", () => {
    expect(Schemas.TaskType.literals).toEqual(["habit", "daily", "todo", "reward"]);
    expect(() => Schema.decodeUnknownSync(Schemas.TaskType)("epic")).toThrow(
      'Expected "habit" | "daily" | "todo" | "reward", got "epic"',
    );
  });

  it("accepts exactly the two scoring directions", () => {
    expect(Schemas.Direction.literals).toEqual(["up", "down"]);
    expect(() => Schema.decodeUnknownSync(Schemas.Direction)("sideways")).toThrow(
      'Expected "up" | "down", got "sideways"',
    );
  });
});

describe("HabiticaTask optional field decoding", () => {
  it("carries a checklist when Habitica supplies one", () => {
    const task = Schema.decodeUnknownSync(Schemas.HabiticaTask)({
      checklist: [{ completed: true, id: "c1", text: "Item" }],
      completed: true,
      id: "t1",
      notes: "Notes",
      text: "Ship it",
      type: "todo",
    });

    expect(task.checklist).toEqual([{ completed: true, id: "c1", text: "Item" }]);
    expect(task.completed).toBe(true);
    expect(task.notes).toBe("Notes");
  });
});

describe("HabiticaStats", () => {
  it("keeps its schema identity even though the class stays private", () => {
    const statsSchema = Schemas.HabiticaProfile.fields.stats as unknown as {
      readonly identifier: string;
    };

    expect(statsSchema.identifier).toBe("HabiticaStats");
  });

  it("treats class and toNextLevel as optional Habitica extras", () => {
    const profile = Schema.decodeUnknownSync(Schemas.HabiticaProfile)({
      displayName: "Tatemz",
      id: "u1",
      stats: { ...stats, class: "wizard", toNextLevel: 120 },
    });

    expect(profile.stats.class).toBe("wizard");
    expect(profile.stats.toNextLevel).toBe(120);
  });

  it("requires the core stat block fields", () => {
    expect(() =>
      Schema.decodeUnknownSync(Schemas.HabiticaProfile)({
        displayName: "Tatemz",
        id: "u1",
        stats: { gp: 1, hp: 2, lvl: 3 },
      }),
    ).toThrow('Missing key\n  at ["stats"]["mp"]');
  });
});
