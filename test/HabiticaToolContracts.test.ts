import { Context } from "effect";
import { Tool } from "effect/unstable/ai";
import { describe, expect, it } from "vitest";
import { HabiticaToolkit } from "../src/tools/HabiticaTools.js";

interface ToolContract {
  readonly destructive: boolean;
  readonly idempotent: boolean;
  readonly openWorld: boolean;
  readonly parameters: ReadonlyArray<string>;
  readonly readonly: boolean;
}

/**
 * MCP clients decide whether to auto-run a tool from these annotations, so the
 * whole triple is pinned per tool. A flipped flag here is the difference between
 * a suggestion and a silent account mutation.
 */
const contracts: Readonly<Record<string, ToolContract>> = {
  habitica_add_checklist_item: {
    destructive: false,
    idempotent: false,
    openWorld: true,
    parameters: ["taskId", "text"],
    readonly: false,
  },
  habitica_buy_reward: {
    destructive: false,
    idempotent: false,
    openWorld: true,
    parameters: ["rewardId"],
    readonly: false,
  },
  habitica_buy_shop_item: {
    destructive: false,
    idempotent: false,
    openWorld: true,
    parameters: ["key"],
    readonly: false,
  },
  habitica_cast_skill: {
    destructive: false,
    idempotent: false,
    openWorld: true,
    parameters: ["skillKey", "targetId"],
    readonly: false,
  },
  habitica_create_reward: {
    destructive: false,
    idempotent: false,
    openWorld: true,
    parameters: ["notes", "text", "type"],
    readonly: false,
  },
  habitica_create_tag: {
    destructive: false,
    idempotent: false,
    openWorld: true,
    parameters: ["name"],
    readonly: false,
  },
  habitica_create_task: {
    destructive: false,
    idempotent: false,
    openWorld: true,
    parameters: ["notes", "text", "type"],
    readonly: false,
  },
  habitica_delete_checklist_item: {
    destructive: true,
    idempotent: true,
    openWorld: true,
    parameters: ["itemId", "taskId"],
    readonly: false,
  },
  habitica_delete_reward: {
    destructive: true,
    idempotent: true,
    openWorld: true,
    parameters: ["rewardId"],
    readonly: false,
  },
  habitica_delete_task: {
    destructive: true,
    idempotent: true,
    openWorld: true,
    parameters: ["taskId"],
    readonly: false,
  },
  habitica_equip_mount: {
    destructive: false,
    idempotent: false,
    openWorld: true,
    parameters: ["mountKey"],
    readonly: false,
  },
  habitica_equip_pet: {
    destructive: false,
    idempotent: false,
    openWorld: true,
    parameters: ["petKey"],
    readonly: false,
  },
  habitica_feed_pet: {
    destructive: false,
    idempotent: false,
    openWorld: true,
    parameters: ["foodKey", "petKey"],
    readonly: false,
  },
  habitica_get_inventory: {
    destructive: false,
    idempotent: true,
    openWorld: true,
    parameters: [],
    readonly: true,
  },
  habitica_get_stats: {
    destructive: false,
    idempotent: true,
    openWorld: true,
    parameters: [],
    readonly: true,
  },
  habitica_get_task: {
    destructive: false,
    idempotent: true,
    openWorld: true,
    parameters: ["taskId"],
    readonly: true,
  },
  habitica_get_user_profile: {
    destructive: false,
    idempotent: true,
    openWorld: true,
    parameters: [],
    readonly: true,
  },
  habitica_hatch_pet: {
    destructive: false,
    idempotent: false,
    openWorld: true,
    parameters: ["eggKey", "hatchingPotionKey"],
    readonly: false,
  },
  habitica_list_notifications: {
    destructive: false,
    idempotent: true,
    openWorld: true,
    parameters: [],
    readonly: true,
  },
  habitica_list_rewards: {
    destructive: false,
    idempotent: true,
    openWorld: true,
    parameters: [],
    readonly: true,
  },
  habitica_list_shop_items: {
    destructive: false,
    idempotent: true,
    openWorld: true,
    parameters: [],
    readonly: true,
  },
  habitica_list_skills: {
    destructive: false,
    idempotent: true,
    openWorld: true,
    parameters: [],
    readonly: true,
  },
  habitica_list_tags: {
    destructive: false,
    idempotent: true,
    openWorld: true,
    parameters: [],
    readonly: true,
  },
  habitica_list_tasks: {
    destructive: false,
    idempotent: true,
    openWorld: true,
    parameters: ["type"],
    readonly: true,
  },
  habitica_read_notification: {
    destructive: false,
    idempotent: true,
    openWorld: true,
    parameters: ["notificationId"],
    readonly: false,
  },
  habitica_score_checklist_item: {
    destructive: false,
    idempotent: false,
    openWorld: true,
    parameters: ["itemId", "taskId"],
    readonly: false,
  },
  habitica_score_task: {
    destructive: false,
    idempotent: false,
    openWorld: true,
    parameters: ["direction", "taskId"],
    readonly: false,
  },
  habitica_update_checklist_item: {
    destructive: false,
    idempotent: true,
    openWorld: true,
    parameters: ["completed", "itemId", "taskId", "text"],
    readonly: false,
  },
  habitica_update_reward: {
    destructive: false,
    idempotent: true,
    openWorld: true,
    parameters: ["completed", "id", "notes", "text"],
    readonly: false,
  },
  habitica_update_task: {
    destructive: false,
    idempotent: true,
    openWorld: true,
    parameters: ["completed", "id", "notes", "text"],
    readonly: false,
  },
};

const tools = HabiticaToolkit.tools as Readonly<
  Record<
    string,
    {
      readonly annotations: Context.Context<never>;
      readonly description: string;
      readonly name: string;
      readonly parametersSchema: { readonly fields?: Readonly<Record<string, unknown>> };
      readonly successSchema: unknown;
    }
  >
>;

const contractEntries = Object.entries(contracts);

describe("Habitica tool contracts", () => {
  it("covers every registered tool", () => {
    expect(Object.keys(tools).toSorted()).toEqual(Object.keys(contracts).toSorted());
  });

  it.each(contractEntries)("%s declares the documented annotations", (name, contract) => {
    const annotations = tools[name].annotations;

    expect(Context.get(annotations, Tool.Readonly)).toBe(contract.readonly);
    expect(Context.get(annotations, Tool.Destructive)).toBe(contract.destructive);
    expect(Context.get(annotations, Tool.Idempotent)).toBe(contract.idempotent);
    expect(Context.get(annotations, Tool.OpenWorld)).toBe(contract.openWorld);
  });

  it.each(contractEntries)("%s declares the documented parameters", (name, contract) => {
    expect(Object.keys(tools[name].parametersSchema.fields ?? {}).toSorted()).toEqual(
      [...contract.parameters].toSorted(),
    );
  });

  /**
   * Descriptions are the model's only signal for tool selection, so they must
   * be present and mention the domain rather than merely be non-empty.
   */
  it.each(contractEntries)("%s carries a usable description", (name) => {
    const { description } = tools[name];

    expect(description.length).toBeGreaterThan(15);
    expect(description.endsWith(".")).toBe(true);
    expect(description).toMatch(/Habitica|MCP/);
  });

  /**
   * Tool names are the public MCP surface. Namespacing them keeps this server's
   * tools distinguishable when a client has several servers connected, and
   * snake_case matches the convention the wider MCP ecosystem uses.
   */
  it("namespaces every tool name in lower snake_case", () => {
    const offenders = Object.entries(tools)
      .filter(
        ([name, tool]) => tool.name !== name || !/^habitica_[a-z0-9]+(?:_[a-z0-9]+)*$/.test(name),
      )
      .map(([name]) => name);

    expect(offenders).toEqual([]);
  });

  /**
   * Titles are what a client shows a human in an approval dialog, so a tool
   * without one is a tool the user is asked to approve by raw identifier.
   */
  it("gives every tool a human-readable title", () => {
    const untitled = Object.entries(tools)
      .filter(([, tool]) => Context.getOrUndefined(tool.annotations, Tool.Title) === undefined)
      .map(([name]) => name);

    expect(untitled).toEqual([]);
  });

  /**
   * A read-only tool that claims to be non-idempotent tells clients that retrying
   * a plain GET is unsafe, which suppresses legitimate retries.
   */
  it("marks every read-only tool idempotent", () => {
    const inconsistent = Object.entries(tools)
      .filter(
        ([, tool]) =>
          Context.get(tool.annotations, Tool.Readonly) &&
          !Context.get(tool.annotations, Tool.Idempotent),
      )
      .map(([name]) => name);

    expect(inconsistent).toEqual([]);
  });

  /** A destructive tool must never also be advertised as read-only. */
  it("never marks a tool both read-only and destructive", () => {
    const contradictory = Object.entries(tools)
      .filter(
        ([, tool]) =>
          Context.get(tool.annotations, Tool.Readonly) &&
          Context.get(tool.annotations, Tool.Destructive),
      )
      .map(([name]) => name);

    expect(contradictory).toEqual([]);
  });

  /**
   * List tools wrap their payload under a named key. The wrapper is what MCPO
   * and other clients destructure, so an emptied success schema would silently
   * publish an unconstrained object.
   */
  it.each([
    ["habitica_list_tasks", "tasks"],
    ["habitica_list_rewards", "tasks"],
    ["habitica_list_tags", "tags"],
    ["habitica_list_notifications", "notifications"],
    ["habitica_list_shop_items", "shopItems"],
    ["habitica_list_skills", "skills"],
  ])("%s wraps its payload under the %s key", (name, key) => {
    const success = tools[name].successSchema as {
      readonly fields: Readonly<Record<string, unknown>>;
    };

    expect(Object.keys(success.fields)).toEqual([key]);
  });

  it.each([
    ["habitica_get_user_profile", "HabiticaProfile"],
    ["habitica_get_task", "HabiticaTask"],
    ["habitica_get_inventory", "HabiticaInventory"],
    ["habitica_create_task", "HabiticaTask"],
    ["habitica_delete_task", "HabiticaMutationResult"],
    ["habitica_create_tag", "HabiticaTag"],
  ])("%s returns %s directly", (name, identifier) => {
    const success = tools[name].successSchema as { readonly identifier: string };

    expect(success.identifier).toBe(identifier);
  });
});
