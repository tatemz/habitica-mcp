import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { HabiticaGateway } from "../src/habitica/HabiticaGateway.js";
import {
  HabiticaInventory,
  HabiticaChecklistItem,
  HabiticaMutationResult,
  HabiticaNotification,
  HabiticaProfile,
  HabiticaShopItem,
  HabiticaSkill,
  HabiticaTag,
  HabiticaTask,
} from "../src/habitica/HabiticaSchemas.js";
import { HabiticaToolHandlers, HabiticaToolkit } from "../src/tools/HabiticaTools.js";

const profile = new HabiticaProfile({
  displayName: "Tatemz",
  id: "user-1",
  stats: { gp: 12, hp: 50, lvl: 7, mp: 20 },
});

const todo = new HabiticaTask({
  checklist: [new HabiticaChecklistItem({ completed: false, id: "check-1", text: "Write test" })],
  id: "task-1",
  text: "Ship Habitica MCP",
  type: "todo",
});

const reward = new HabiticaTask({ id: "reward-1", text: "Coffee", type: "reward" });
const tag = new HabiticaTag({ id: "tag-1", name: "Focus" });
const notification = new HabiticaNotification({
  id: "notification-1",
  seen: false,
  text: "Welcome back",
  type: "info",
});
const mutation = new HabiticaMutationResult({ id: "task-1", message: "changed" });
const inventory = new HabiticaInventory({
  eggs: { Wolf: 1 },
  food: { Meat: 2 },
  hatchingPotions: { Base: 1 },
  mounts: { "Wolf-Base": false },
  pets: { "Wolf-Base": 5 },
});
const shopItem = new HabiticaShopItem({ key: "potion", text: "Potion", value: 25 });
const skill = new HabiticaSkill({ key: "fireball", mana: 10, text: "Burst of Flames" });

const fakeGateway = HabiticaGateway.of({
  addChecklistItem: () => Effect.succeed(todo),
  buyReward: () => Effect.succeed(mutation),
  buyShopItem: () => Effect.succeed(mutation),
  castSkill: () => Effect.succeed(mutation),
  createReward: () => Effect.succeed(reward),
  createTag: ({ name }) => Effect.succeed(new HabiticaTag({ id: "tag-created", name })),
  createTask: ({ text, type }) =>
    Effect.succeed(new HabiticaTask({ id: "task-created", text, type })),
  deleteChecklistItem: () => Effect.succeed(todo),
  deleteReward: () => Effect.succeed(mutation),
  deleteTask: () => Effect.succeed(mutation),
  equipMount: () => Effect.succeed(mutation),
  equipPet: () => Effect.succeed(mutation),
  feedPet: () => Effect.succeed(mutation),
  getInventory: Effect.succeed(inventory),
  getStats: Effect.succeed(profile.stats),
  getTask: () => Effect.succeed(todo),
  getUserProfile: Effect.succeed(profile),
  hatchPet: () => Effect.succeed(mutation),
  listNotifications: Effect.succeed([notification]),
  listShopItems: Effect.succeed([shopItem]),
  listSkills: Effect.succeed([skill]),
  listTags: Effect.succeed([tag]),
  listTasks: ({ type }) => Effect.succeed(type === "reward" ? [reward] : [todo]),
  readNotification: () => Effect.succeed(mutation),
  scoreChecklistItem: () => Effect.succeed(todo),
  scoreTask: () => Effect.succeed(todo),
  updateChecklistItem: () => Effect.succeed(todo),
  updateReward: () => Effect.succeed(reward),
  updateTask: ({ id, text }) =>
    Effect.succeed(new HabiticaTask({ id, text: text ?? todo.text, type: todo.type })),
});

const handlers = await Effect.runPromise(
  Effect.provideService(HabiticaToolHandlers, HabiticaGateway, fakeGateway),
);

/**
 * Every handler is invoked with a representative payload and its exact result is
 * pinned, so no tool can be registered without a test driving it and no handler
 * can be rewired to a different gateway call without this table failing.
 */
const invocations: ReadonlyArray<
  readonly [string, () => Effect.Effect<unknown, unknown>, unknown]
> = [
  [
    "habitica_add_checklist_item",
    () => handlers.habitica_add_checklist_item({ taskId: "t1", text: "Item" }),
    todo,
  ],
  ["habitica_buy_reward", () => handlers.habitica_buy_reward({ rewardId: "r1" }), mutation],
  ["habitica_buy_shop_item", () => handlers.habitica_buy_shop_item({ key: "potion" }), mutation],
  ["habitica_cast_skill", () => handlers.habitica_cast_skill({ skillKey: "fireball" }), mutation],
  [
    "habitica_create_reward",
    () => handlers.habitica_create_reward({ text: "Coffee", type: "reward" }),
    reward,
  ],
  [
    "habitica_create_tag",
    () => handlers.habitica_create_tag({ name: "Focus" }),
    new HabiticaTag({ id: "tag-created", name: "Focus" }),
  ],
  [
    "habitica_create_task",
    () => handlers.habitica_create_task({ text: "New todo", type: "todo" }),
    new HabiticaTask({ id: "task-created", text: "New todo", type: "todo" }),
  ],
  [
    "habitica_delete_checklist_item",
    () => handlers.habitica_delete_checklist_item({ itemId: "i1", taskId: "t1" }),
    todo,
  ],
  ["habitica_delete_reward", () => handlers.habitica_delete_reward({ rewardId: "r1" }), mutation],
  ["habitica_delete_task", () => handlers.habitica_delete_task({ taskId: "t1" }), mutation],
  [
    "habitica_equip_mount",
    () => handlers.habitica_equip_mount({ mountKey: "Wolf-Base" }),
    mutation,
  ],
  ["habitica_equip_pet", () => handlers.habitica_equip_pet({ petKey: "Wolf-Base" }), mutation],
  [
    "habitica_feed_pet",
    () => handlers.habitica_feed_pet({ foodKey: "Meat", petKey: "Wolf-Base" }),
    mutation,
  ],
  ["habitica_get_inventory", () => handlers.habitica_get_inventory(), inventory],
  ["habitica_get_stats", () => handlers.habitica_get_stats(), profile.stats],
  ["habitica_get_task", () => handlers.habitica_get_task({ taskId: "t1" }), todo],
  ["habitica_get_user_profile", () => handlers.habitica_get_user_profile(), profile],
  [
    "habitica_hatch_pet",
    () => handlers.habitica_hatch_pet({ eggKey: "Wolf", hatchingPotionKey: "Base" }),
    mutation,
  ],
  [
    "habitica_list_notifications",
    () => handlers.habitica_list_notifications(),
    { notifications: [notification] },
  ],
  ["habitica_list_rewards", () => handlers.habitica_list_rewards(), { tasks: [reward] }],
  [
    "habitica_list_shop_items",
    () => handlers.habitica_list_shop_items(),
    { shopItems: [shopItem] },
  ],
  ["habitica_list_skills", () => handlers.habitica_list_skills(), { skills: [skill] }],
  ["habitica_list_tags", () => handlers.habitica_list_tags(), { tags: [tag] }],
  ["habitica_list_tasks", () => handlers.habitica_list_tasks({}), { tasks: [todo] }],
  [
    "habitica_read_notification",
    () => handlers.habitica_read_notification({ notificationId: "n1" }),
    mutation,
  ],
  [
    "habitica_score_checklist_item",
    () => handlers.habitica_score_checklist_item({ itemId: "i1", taskId: "t1" }),
    todo,
  ],
  [
    "habitica_score_task",
    () => handlers.habitica_score_task({ direction: "up", taskId: "t1" }),
    todo,
  ],
  [
    "habitica_update_checklist_item",
    () => handlers.habitica_update_checklist_item({ itemId: "i1", taskId: "t1", text: "Edited" }),
    todo,
  ],
  [
    "habitica_update_reward",
    () => handlers.habitica_update_reward({ id: "r1", text: "Edited" }),
    reward,
  ],
  [
    "habitica_update_task",
    () => handlers.habitica_update_task({ id: "t1", text: "Edited" }),
    new HabiticaTask({ id: "t1", text: "Edited", type: "todo" }),
  ],
];

describe("HabiticaToolkit", () => {
  it("registers exactly the tools that the handler suite drives", () => {
    expect(Object.keys(HabiticaToolkit.tools).toSorted()).toEqual(
      invocations.map(([name]) => name).toSorted(),
    );
  });

  /**
   * The approval flag is the only thing standing between a model and an
   * unattended account mutation, so it is asserted per tool rather than in
   * aggregate.
   */
  it("requires approval for exactly the mutating tools", () => {
    const approving = Object.values(HabiticaToolkit.tools)
      .filter((tool) => tool.needsApproval)
      .map((tool) => tool.name)
      .toSorted();

    expect(approving).toEqual([
      "habitica_add_checklist_item",
      "habitica_buy_reward",
      "habitica_buy_shop_item",
      "habitica_cast_skill",
      "habitica_create_reward",
      "habitica_create_tag",
      "habitica_create_task",
      "habitica_delete_checklist_item",
      "habitica_delete_reward",
      "habitica_delete_task",
      "habitica_equip_mount",
      "habitica_equip_pet",
      "habitica_feed_pet",
      "habitica_hatch_pet",
      "habitica_read_notification",
      "habitica_score_checklist_item",
      "habitica_score_task",
      "habitica_update_checklist_item",
      "habitica_update_reward",
      "habitica_update_task",
    ]);
  });

  it("leaves every read tool free of an approval prompt", () => {
    const readOnly = Object.values(HabiticaToolkit.tools)
      .filter((tool) => !tool.needsApproval)
      .map((tool) => tool.name)
      .toSorted();

    expect(readOnly).toEqual([
      "habitica_get_inventory",
      "habitica_get_stats",
      "habitica_get_task",
      "habitica_get_user_profile",
      "habitica_list_notifications",
      "habitica_list_rewards",
      "habitica_list_shop_items",
      "habitica_list_skills",
      "habitica_list_tags",
      "habitica_list_tasks",
    ]);
  });
});

describe("HabiticaToolHandlers", () => {
  it.each(invocations)(
    "%s returns exactly what the gateway supplies",
    async (_name, invoke, expected) => {
      await expect(Effect.runPromise(invoke())).resolves.toEqual(expected);
    },
  );

  it("passes the requested task type through to the gateway", async () => {
    await expect(
      Effect.runPromise(handlers.habitica_list_tasks({ type: "reward" })),
    ).resolves.toEqual({
      tasks: [reward],
    });
  });
});
