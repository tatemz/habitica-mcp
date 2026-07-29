import { Effect } from "effect";
import { HabiticaGateway } from "../../src/habitica/HabiticaGateway.js";
import {
  HabiticaChecklistItem,
  HabiticaInventory,
  HabiticaMutationResult,
  HabiticaNotification,
  HabiticaProfile,
  HabiticaShopItem,
  HabiticaSkill,
  HabiticaTag,
  HabiticaTask,
} from "../../src/habitica/HabiticaSchemas.js";

export const profile = new HabiticaProfile({
  displayName: "Tatemz",
  id: "user-1",
  stats: { gp: 12, hp: 50, lvl: 7, mp: 20 },
});

export const todo = new HabiticaTask({
  checklist: [new HabiticaChecklistItem({ completed: false, id: "check-1", text: "Write test" })],
  id: "task-1",
  text: "Ship Habitica MCP",
  type: "todo",
});

export const reward = new HabiticaTask({ id: "reward-1", text: "Coffee", type: "reward" });
export const tag = new HabiticaTag({ id: "tag-1", name: "Focus" });
export const notification = new HabiticaNotification({
  id: "notification-1",
  seen: false,
  text: "Welcome back",
  type: "info",
});
export const mutation = new HabiticaMutationResult({ id: "task-1", message: "changed" });
export const inventory = new HabiticaInventory({
  eggs: { Wolf: 1 },
  food: { Meat: 2 },
  hatchingPotions: { Base: 1 },
  mounts: { "Wolf-Base": false },
  pets: { "Wolf-Base": 5 },
});
export const shopItem = new HabiticaShopItem({ key: "potion", text: "Potion", value: 25 });
export const skill = new HabiticaSkill({ key: "fireball", mana: 10, text: "Burst of Flames" });

export const fakeGateway = HabiticaGateway.of({
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
  /** Echoes the requested id so a caller that drops the argument is visible. */
  getTask: ({ taskId }) =>
    Effect.succeed(
      new HabiticaTask({
        checklist: todo.checklist,
        id: taskId,
        text: todo.text,
        type: todo.type,
      }),
    ),
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
