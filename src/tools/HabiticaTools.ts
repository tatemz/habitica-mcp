import { Context, Effect, Schema } from "effect";
import { Tool, Toolkit } from "effect/unstable/ai";
import { HabiticaErrorSchema } from "../habitica/HabiticaErrors.js";
import { HabiticaGateway } from "../habitica/HabiticaGateway.js";
import {
  CreateTagInput,
  CreateTaskInput,
  Direction,
  HabiticaInventory,
  HabiticaMutationResult,
  HabiticaNotification,
  HabiticaProfile,
  HabiticaShopItem,
  HabiticaSkill,
  HabiticaTag,
  HabiticaTask,
  TaskType,
  UpdateChecklistItemInput,
  UpdateTaskInput,
} from "../habitica/HabiticaSchemas.js";

/**
 * Every parameter carries a description because the model chooses arguments from
 * these strings alone. An undescribed field is a guess waiting to happen.
 */
const taskId = Schema.String.annotate({
  description: "Habitica task id, as returned by list or get task tools.",
});
const itemId = Schema.String.annotate({
  description: "Checklist item id belonging to the given task.",
});
const describedTaskType = TaskType.annotate({
  description: "Habitica task type: habit, daily, todo, or reward.",
});

const TaskIdInput = Schema.Struct({ taskId });
const RewardIdInput = Schema.Struct({
  rewardId: Schema.String.annotate({ description: "Habitica reward task id." }),
});
const NotificationIdInput = Schema.Struct({
  notificationId: Schema.String.annotate({ description: "Habitica notification id." }),
});
const ListTasksInput = Schema.Struct({ type: Schema.optional(describedTaskType) });
const ScoreTaskInput = Schema.Struct({
  direction: Direction.annotate({
    description: "Score up to reward the habit or complete the task, down to penalise it.",
  }),
  taskId,
});
const AddChecklistItemInput = Schema.Struct({
  taskId,
  text: Schema.String.annotate({ description: "Text of the new checklist item." }),
});
const DeleteChecklistItemInput = Schema.Struct({ itemId, taskId });
const PetFoodInput = Schema.Struct({
  foodKey: Schema.String.annotate({ description: "Food key from inventory, for example Meat." }),
  petKey: Schema.String.annotate({ description: "Pet key, for example Wolf-Base." }),
});
const HatchPetInput = Schema.Struct({
  eggKey: Schema.String.annotate({ description: "Egg key from inventory, for example Wolf." }),
  hatchingPotionKey: Schema.String.annotate({
    description: "Hatching potion key from inventory, for example Base.",
  }),
});
const PetInput = Schema.Struct({
  petKey: Schema.String.annotate({ description: "Pet key to equip, for example Wolf-Base." }),
});
const MountInput = Schema.Struct({
  mountKey: Schema.String.annotate({ description: "Mount key to equip, for example Wolf-Base." }),
});
const SkillInput = Schema.Struct({
  skillKey: Schema.String.annotate({
    description: "Skill key to cast, for example fireball. Costs mana.",
  }),
  targetId: Schema.optional(
    Schema.String.annotate({
      description: "Task or party member id to target, when the skill takes one.",
    }),
  ),
});
const ShopItemInput = Schema.Struct({
  key: Schema.String.annotate({
    description: "Shop item key, as returned by the shop item list tool.",
  }),
});
const HelloWorldInput = Schema.Struct({
  name: Schema.optional(
    Schema.String.annotate({ description: 'Name to greet. Defaults to "world".' }),
  ),
});
const HabiticaFailure = { failure: HabiticaErrorSchema } as const;

/**
 * MCP surfaces four behaviour hints per tool. Building them as contexts keeps 31
 * tools from repeating the same four-call annotate chain, and makes the
 * idempotency claim per category explicit rather than accidental.
 */
const hints = (options: {
  readonly destructive: boolean;
  readonly idempotent: boolean;
  readonly openWorld: boolean;
  readonly readOnly: boolean;
}): Context.Context<never> =>
  Context.empty().pipe(
    Context.add(Tool.Readonly, options.readOnly),
    Context.add(Tool.Destructive, options.destructive),
    Context.add(Tool.Idempotent, options.idempotent),
    Context.add(Tool.OpenWorld, options.openWorld),
  );

/** Reads never change state, so repeating one is always safe. */
const readHints = hints({
  destructive: false,
  idempotent: true,
  openWorld: true,
  readOnly: true,
});

/** Creates, purchases, and consuming actions stack up when repeated. */
const createHints = hints({
  destructive: false,
  idempotent: false,
  openWorld: true,
  readOnly: false,
});

/** Writes that converge on the same final state whatever the call count. */
const updateHints = hints({
  destructive: false,
  idempotent: true,
  openWorld: true,
  readOnly: false,
});

/** Deletions are destructive but idempotent: the second call finds nothing left. */
const deleteHints = hints({
  destructive: true,
  idempotent: true,
  openWorld: true,
  readOnly: false,
});

/** The smoke test touches no external system. */
const localHints = hints({
  destructive: false,
  idempotent: true,
  openWorld: false,
  readOnly: true,
});
const HabiticaTasksOutput = Schema.Struct({ tasks: Schema.Array(HabiticaTask) });
const HabiticaTagsOutput = Schema.Struct({ tags: Schema.Array(HabiticaTag) });
const HabiticaNotificationsOutput = Schema.Struct({
  notifications: Schema.Array(HabiticaNotification),
});
const HabiticaShopItemsOutput = Schema.Struct({ shopItems: Schema.Array(HabiticaShopItem) });
const HabiticaSkillsOutput = Schema.Struct({ skills: Schema.Array(HabiticaSkill) });

const HelloWorldTool = Tool.make("habitica_hello_world", {
  description:
    "Return a deterministic greeting. Use this to verify the MCP connection without Habitica credentials.",
  parameters: HelloWorldInput,
  success: Schema.String,
})
  .annotateMerge(localHints)
  .annotate(Tool.Title, "Hello World");

const GetUserProfileTool = Tool.make("habitica_get_user_profile", {
  ...HabiticaFailure,
  description: "Read the current Habitica user profile, including display name and stat block.",
  success: HabiticaProfile,
})
  .annotateMerge(readHints)
  .annotate(Tool.Title, "Get User Profile");

const GetStatsTool = Tool.make("habitica_get_stats", {
  ...HabiticaFailure,
  description:
    "Read the current Habitica stat block: health, mana, experience, level, gold, and class.",
  success: HabiticaProfile.fields.stats,
})
  .annotateMerge(readHints)
  .annotate(Tool.Title, "Get Stats");

const ListTasksTool = Tool.make("habitica_list_tasks", {
  ...HabiticaFailure,
  description: "List Habitica tasks, optionally filtered to one task type.",
  parameters: ListTasksInput,
  success: HabiticaTasksOutput,
})
  .annotateMerge(readHints)
  .annotate(Tool.Title, "List Tasks");

const GetTaskTool = Tool.make("habitica_get_task", {
  ...HabiticaFailure,
  description: "Read a single Habitica task by id, including its checklist.",
  parameters: TaskIdInput,
  success: HabiticaTask,
})
  .annotateMerge(readHints)
  .annotate(Tool.Title, "Get Task");

const ListTagsTool = Tool.make("habitica_list_tags", {
  ...HabiticaFailure,
  description: "List the Habitica tags defined on the account.",
  success: HabiticaTagsOutput,
})
  .annotateMerge(readHints)
  .annotate(Tool.Title, "List Tags");

const GetInventoryTool = Tool.make("habitica_get_inventory", {
  ...HabiticaFailure,
  description: "Read Habitica inventory: eggs, hatching potions, food, pets, and mounts.",
  success: HabiticaInventory,
})
  .annotateMerge(readHints)
  .annotate(Tool.Title, "Get Inventory");

const ListNotificationsTool = Tool.make("habitica_list_notifications", {
  ...HabiticaFailure,
  description: "List Habitica notifications and whether each has been seen.",
  success: HabiticaNotificationsOutput,
})
  .annotateMerge(readHints)
  .annotate(Tool.Title, "List Notifications");

const CreateTaskTool = Tool.make("habitica_create_task", {
  ...HabiticaFailure,
  description:
    "Create a Habitica task. Calling this twice creates two tasks, so confirm the text first.",
  parameters: CreateTaskInput,
  success: HabiticaTask,
  needsApproval: true,
})
  .annotateMerge(createHints)
  .annotate(Tool.Title, "Create Task");

const UpdateTaskTool = Tool.make("habitica_update_task", {
  ...HabiticaFailure,
  description: "Update the text or notes of an existing Habitica task.",
  parameters: UpdateTaskInput,
  success: HabiticaTask,
  needsApproval: true,
})
  .annotateMerge(updateHints)
  .annotate(Tool.Title, "Update Task");

const DeleteTaskTool = Tool.make("habitica_delete_task", {
  ...HabiticaFailure,
  description: "Permanently delete a Habitica task. This cannot be undone.",
  parameters: TaskIdInput,
  success: HabiticaMutationResult,
  needsApproval: true,
})
  .annotateMerge(deleteHints)
  .annotate(Tool.Title, "Delete Task");

const ScoreTaskTool = Tool.make("habitica_score_task", {
  ...HabiticaFailure,
  description:
    "Score a Habitica task up or down. This changes stats and rewards, and each call scores again.",
  parameters: ScoreTaskInput,
  success: HabiticaTask,
  needsApproval: true,
})
  .annotateMerge(createHints)
  .annotate(Tool.Title, "Score Task");

const CreateTagTool = Tool.make("habitica_create_tag", {
  ...HabiticaFailure,
  description: "Create a Habitica tag. Calling this twice creates two tags with the same name.",
  parameters: CreateTagInput,
  success: HabiticaTag,
  needsApproval: true,
})
  .annotateMerge(createHints)
  .annotate(Tool.Title, "Create Tag");

const AddChecklistItemTool = Tool.make("habitica_add_checklist_item", {
  ...HabiticaFailure,
  description: "Add a checklist item to a Habitica task. Calling this twice adds two items.",
  parameters: AddChecklistItemInput,
  success: HabiticaTask,
  needsApproval: true,
})
  .annotateMerge(createHints)
  .annotate(Tool.Title, "Add Checklist Item");

const UpdateChecklistItemTool = Tool.make("habitica_update_checklist_item", {
  ...HabiticaFailure,
  description: "Update the text of a checklist item on a Habitica task.",
  parameters: UpdateChecklistItemInput,
  success: HabiticaTask,
  needsApproval: true,
})
  .annotateMerge(updateHints)
  .annotate(Tool.Title, "Update Checklist Item");

const DeleteChecklistItemTool = Tool.make("habitica_delete_checklist_item", {
  ...HabiticaFailure,
  description: "Permanently delete a checklist item from a Habitica task.",
  parameters: DeleteChecklistItemInput,
  success: HabiticaTask,
  needsApproval: true,
})
  .annotateMerge(deleteHints)
  .annotate(Tool.Title, "Delete Checklist Item");

const ScoreChecklistItemTool = Tool.make("habitica_score_checklist_item", {
  ...HabiticaFailure,
  description:
    "Toggle the completed state of a Habitica task checklist item. Each call flips it again.",
  parameters: DeleteChecklistItemInput,
  success: HabiticaTask,
  needsApproval: true,
})
  .annotateMerge(createHints)
  .annotate(Tool.Title, "Score Checklist Item");

const ReadNotificationTool = Tool.make("habitica_read_notification", {
  ...HabiticaFailure,
  description: "Mark a Habitica notification as read.",
  parameters: NotificationIdInput,
  success: HabiticaMutationResult,
  needsApproval: true,
})
  .annotateMerge(updateHints)
  .annotate(Tool.Title, "Mark Notification Read");

const ListRewardsTool = Tool.make("habitica_list_rewards", {
  ...HabiticaFailure,
  description: "List the custom Habitica rewards the user can buy with gold.",
  success: HabiticaTasksOutput,
})
  .annotateMerge(readHints)
  .annotate(Tool.Title, "List Rewards");

const CreateRewardTool = Tool.make("habitica_create_reward", {
  ...HabiticaFailure,
  description: "Create a custom Habitica reward. Calling this twice creates two rewards.",
  parameters: CreateTaskInput,
  success: HabiticaTask,
  needsApproval: true,
})
  .annotateMerge(createHints)
  .annotate(Tool.Title, "Create Reward");

const UpdateRewardTool = Tool.make("habitica_update_reward", {
  ...HabiticaFailure,
  description: "Update the text or notes of a custom Habitica reward.",
  parameters: UpdateTaskInput,
  success: HabiticaTask,
  needsApproval: true,
})
  .annotateMerge(updateHints)
  .annotate(Tool.Title, "Update Reward");

const DeleteRewardTool = Tool.make("habitica_delete_reward", {
  ...HabiticaFailure,
  description: "Permanently delete a custom Habitica reward. This cannot be undone.",
  parameters: RewardIdInput,
  success: HabiticaMutationResult,
  needsApproval: true,
})
  .annotateMerge(deleteHints)
  .annotate(Tool.Title, "Delete Reward");

const BuyRewardTool = Tool.make("habitica_buy_reward", {
  ...HabiticaFailure,
  description: "Buy a custom Habitica reward. This spends gold every time it is called.",
  parameters: RewardIdInput,
  success: HabiticaMutationResult,
  needsApproval: true,
})
  .annotateMerge(createHints)
  .annotate(Tool.Title, "Buy Reward");

const ListShopItemsTool = Tool.make("habitica_list_shop_items", {
  ...HabiticaFailure,
  description: "List items available in the Habitica market, with their gold cost.",
  success: HabiticaShopItemsOutput,
})
  .annotateMerge(readHints)
  .annotate(Tool.Title, "List Shop Items");

const BuyShopItemTool = Tool.make("habitica_buy_shop_item", {
  ...HabiticaFailure,
  description: "Buy an item from the Habitica market. This spends gold every time it is called.",
  parameters: ShopItemInput,
  success: HabiticaMutationResult,
  needsApproval: true,
})
  .annotateMerge(createHints)
  .annotate(Tool.Title, "Buy Shop Item");

const HatchPetTool = Tool.make("habitica_hatch_pet", {
  ...HabiticaFailure,
  description: "Hatch a Habitica pet. This consumes the egg and the hatching potion.",
  parameters: HatchPetInput,
  success: HabiticaMutationResult,
  needsApproval: true,
})
  .annotateMerge(createHints)
  .annotate(Tool.Title, "Hatch Pet");

const FeedPetTool = Tool.make("habitica_feed_pet", {
  ...HabiticaFailure,
  description: "Feed a Habitica pet. This consumes the food item.",
  parameters: PetFoodInput,
  success: HabiticaMutationResult,
  needsApproval: true,
})
  .annotateMerge(createHints)
  .annotate(Tool.Title, "Feed Pet");

const EquipPetTool = Tool.make("habitica_equip_pet", {
  ...HabiticaFailure,
  description: "Equip a Habitica pet. Habitica toggles this, so calling it twice unequips the pet.",
  parameters: PetInput,
  success: HabiticaMutationResult,
  needsApproval: true,
})
  .annotateMerge(createHints)
  .annotate(Tool.Title, "Equip Pet");

const EquipMountTool = Tool.make("habitica_equip_mount", {
  ...HabiticaFailure,
  description:
    "Equip a Habitica mount. Habitica toggles this, so calling it twice unequips the mount.",
  parameters: MountInput,
  success: HabiticaMutationResult,
  needsApproval: true,
})
  .annotateMerge(createHints)
  .annotate(Tool.Title, "Equip Mount");

const ListSkillsTool = Tool.make("habitica_list_skills", {
  ...HabiticaFailure,
  description: "List the Habitica skills the user can cast, with their mana cost.",
  success: HabiticaSkillsOutput,
})
  .annotateMerge(readHints)
  .annotate(Tool.Title, "List Skills");

const CastSkillTool = Tool.make("habitica_cast_skill", {
  ...HabiticaFailure,
  description: "Cast a Habitica skill. This spends mana every time it is called.",
  parameters: SkillInput,
  success: HabiticaMutationResult,
  needsApproval: true,
})
  .annotateMerge(createHints)
  .annotate(Tool.Title, "Cast Skill");

/** @internal */
export const HabiticaToolkit = Toolkit.make(
  HelloWorldTool,
  GetUserProfileTool,
  GetStatsTool,
  ListTasksTool,
  GetTaskTool,
  ListTagsTool,
  GetInventoryTool,
  ListNotificationsTool,
  CreateTaskTool,
  UpdateTaskTool,
  DeleteTaskTool,
  ScoreTaskTool,
  CreateTagTool,
  AddChecklistItemTool,
  UpdateChecklistItemTool,
  DeleteChecklistItemTool,
  ScoreChecklistItemTool,
  ReadNotificationTool,
  ListRewardsTool,
  CreateRewardTool,
  UpdateRewardTool,
  DeleteRewardTool,
  BuyRewardTool,
  ListShopItemsTool,
  BuyShopItemTool,
  HatchPetTool,
  FeedPetTool,
  EquipPetTool,
  EquipMountTool,
  ListSkillsTool,
  CastSkillTool,
);

/** @internal */
export const HabiticaToolHandlers = Effect.gen(function* () {
  const gateway = yield* HabiticaGateway;

  return HabiticaToolkit.of({
    habitica_add_checklist_item: gateway.addChecklistItem,
    habitica_buy_reward: gateway.buyReward,
    habitica_buy_shop_item: gateway.buyShopItem,
    habitica_cast_skill: gateway.castSkill,
    habitica_create_reward: gateway.createReward,
    habitica_create_tag: gateway.createTag,
    habitica_create_task: gateway.createTask,
    habitica_delete_checklist_item: gateway.deleteChecklistItem,
    habitica_delete_reward: gateway.deleteReward,
    habitica_delete_task: gateway.deleteTask,
    habitica_equip_mount: gateway.equipMount,
    habitica_equip_pet: gateway.equipPet,
    habitica_feed_pet: gateway.feedPet,
    habitica_get_inventory: () => gateway.getInventory,
    habitica_get_stats: () => gateway.getStats,
    habitica_get_task: gateway.getTask,
    habitica_get_user_profile: () => gateway.getUserProfile,
    habitica_hatch_pet: gateway.hatchPet,
    habitica_hello_world: ({ name }) => Effect.succeed(`Hello, ${name ?? "world"}!`),
    habitica_list_notifications: () =>
      gateway.listNotifications.pipe(Effect.map((notifications) => ({ notifications }))),
    habitica_list_rewards: () =>
      gateway.listTasks({ type: "reward" }).pipe(Effect.map((tasks) => ({ tasks }))),
    habitica_list_shop_items: () =>
      gateway.listShopItems.pipe(Effect.map((shopItems) => ({ shopItems }))),
    habitica_list_skills: () => gateway.listSkills.pipe(Effect.map((skills) => ({ skills }))),
    habitica_list_tags: () => gateway.listTags.pipe(Effect.map((tags) => ({ tags }))),
    habitica_list_tasks: (input) =>
      gateway.listTasks(input).pipe(Effect.map((tasks) => ({ tasks }))),
    habitica_read_notification: gateway.readNotification,
    habitica_score_checklist_item: gateway.scoreChecklistItem,
    habitica_score_task: gateway.scoreTask,
    habitica_update_checklist_item: gateway.updateChecklistItem,
    habitica_update_reward: gateway.updateReward,
    habitica_update_task: gateway.updateTask,
  });
});

/** @internal */
export const HabiticaToolLayer = HabiticaToolkit.toLayer(HabiticaToolHandlers);
