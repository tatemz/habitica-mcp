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
import { HabiticaToolHandlers } from "../src/tools/HabiticaTools.js";

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
  createReward: () =>
    Effect.succeed(new HabiticaTask({ id: "reward-1", text: "Coffee", type: "reward" })),
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
  listTasks: ({ type }) =>
    Effect.succeed(
      type === "reward" ? [new HabiticaTask({ id: "reward-1", text: "Coffee", type })] : [todo],
    ),
  readNotification: () => Effect.succeed(mutation),
  scoreChecklistItem: () => Effect.succeed(todo),
  scoreTask: () => Effect.succeed(todo),
  updateChecklistItem: () => Effect.succeed(todo),
  updateReward: () =>
    Effect.succeed(new HabiticaTask({ id: "reward-1", text: "Coffee updated", type: "reward" })),
  updateTask: ({ id, text }) =>
    Effect.succeed(new HabiticaTask({ id, text: text ?? todo.text, type: todo.type })),
});

const getHandlers = Effect.provideService(HabiticaToolHandlers, HabiticaGateway, fakeGateway);

describe("HabiticaToolHandlers", () => {
  it("dispatches read tools through HabiticaGateway", async () => {
    const handlers = await Effect.runPromise(getHandlers);

    await expect(Effect.runPromise(handlers.HelloWorldTool({}))).resolves.toBe("Hello, world!");
    await expect(Effect.runPromise(handlers.GetUserProfileTool())).resolves.toEqual(profile);
    await expect(Effect.runPromise(handlers.ListTasksTool({ type: "todo" }))).resolves.toEqual([
      todo,
    ]);
  });

  it("dispatches core write tools through HabiticaGateway", async () => {
    const handlers = await Effect.runPromise(getHandlers);

    await expect(
      Effect.runPromise(handlers.CreateTaskTool({ text: "New todo", type: "todo" })),
    ).resolves.toMatchObject({ id: "task-created", text: "New todo", type: "todo" });
    await expect(
      Effect.runPromise(handlers.ReadNotificationTool({ notificationId: "notification-1" })),
    ).resolves.toEqual(mutation);
  });

  it("dispatches expanded gameplay tools through HabiticaGateway", async () => {
    const handlers = await Effect.runPromise(getHandlers);

    await expect(Effect.runPromise(handlers.ListShopItemsTool())).resolves.toEqual([shopItem]);
    await expect(
      Effect.runPromise(handlers.CastSkillTool({ skillKey: "fireball", targetId: "task-1" })),
    ).resolves.toEqual(mutation);
  });
});
