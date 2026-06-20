import { Effect, Schema } from "effect";
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

const TaskIdInput = Schema.Struct({ taskId: Schema.String });
const RewardIdInput = Schema.Struct({ rewardId: Schema.String });
const NotificationIdInput = Schema.Struct({ notificationId: Schema.String });
const ListTasksInput = Schema.Struct({ type: Schema.optional(TaskType) });
const ScoreTaskInput = Schema.Struct({ direction: Direction, taskId: Schema.String });
const AddChecklistItemInput = Schema.Struct({ taskId: Schema.String, text: Schema.String });
const DeleteChecklistItemInput = Schema.Struct({ itemId: Schema.String, taskId: Schema.String });
const PetFoodInput = Schema.Struct({ foodKey: Schema.String, petKey: Schema.String });
const HatchPetInput = Schema.Struct({ eggKey: Schema.String, hatchingPotionKey: Schema.String });
const PetInput = Schema.Struct({ petKey: Schema.String });
const MountInput = Schema.Struct({ mountKey: Schema.String });
const SkillInput = Schema.Struct({
  skillKey: Schema.String,
  targetId: Schema.optional(Schema.String),
});
const ShopItemInput = Schema.Struct({ key: Schema.String });
const HelloWorldInput = Schema.Struct({ name: Schema.optional(Schema.String) });
const HabiticaFailure = { failure: HabiticaErrorSchema } as const;

const HelloWorldTool = Tool.make("HelloWorldTool", {
  description: "Return a deterministic greeting for MCP smoke tests.",
  parameters: HelloWorldInput,
  success: Schema.String,
})
  .annotate(Tool.Readonly, true)
  .annotate(Tool.Destructive, false)
  .annotate(Tool.OpenWorld, false);

const GetUserProfileTool = Tool.make("GetUserProfileTool", {
  ...HabiticaFailure,
  description: "Read the current Habitica user profile.",
  success: HabiticaProfile,
})
  .annotate(Tool.Readonly, true)
  .annotate(Tool.Destructive, false)
  .annotate(Tool.OpenWorld, true);

const GetStatsTool = Tool.make("GetStatsTool", {
  ...HabiticaFailure,
  description: "Read the current Habitica stat block.",
  success: HabiticaProfile.fields.stats,
})
  .annotate(Tool.Readonly, true)
  .annotate(Tool.Destructive, false)
  .annotate(Tool.OpenWorld, true);

const ListTasksTool = Tool.make("ListTasksTool", {
  ...HabiticaFailure,
  description: "Read Habitica tasks, optionally filtered by task type.",
  parameters: ListTasksInput,
  success: Schema.Array(HabiticaTask),
})
  .annotate(Tool.Readonly, true)
  .annotate(Tool.Destructive, false)
  .annotate(Tool.OpenWorld, true);

const GetTaskTool = Tool.make("GetTaskTool", {
  ...HabiticaFailure,
  description: "Read a single Habitica task by id.",
  parameters: TaskIdInput,
  success: HabiticaTask,
})
  .annotate(Tool.Readonly, true)
  .annotate(Tool.Destructive, false)
  .annotate(Tool.OpenWorld, true);

const ListTagsTool = Tool.make("ListTagsTool", {
  ...HabiticaFailure,
  description: "Read Habitica tags.",
  success: Schema.Array(HabiticaTag),
})
  .annotate(Tool.Readonly, true)
  .annotate(Tool.Destructive, false)
  .annotate(Tool.OpenWorld, true);

const GetInventoryTool = Tool.make("GetInventoryTool", {
  ...HabiticaFailure,
  description: "Read Habitica inventory state.",
  success: HabiticaInventory,
})
  .annotate(Tool.Readonly, true)
  .annotate(Tool.Destructive, false)
  .annotate(Tool.OpenWorld, true);

const ListNotificationsTool = Tool.make("ListNotificationsTool", {
  ...HabiticaFailure,
  description: "Read Habitica notifications.",
  success: Schema.Array(HabiticaNotification),
})
  .annotate(Tool.Readonly, true)
  .annotate(Tool.Destructive, false)
  .annotate(Tool.OpenWorld, true);

const CreateTaskTool = Tool.make("CreateTaskTool", {
  ...HabiticaFailure,
  description: "Create a Habitica task.",
  parameters: CreateTaskInput,
  success: HabiticaTask,
  needsApproval: true,
})
  .annotate(Tool.Readonly, false)
  .annotate(Tool.Destructive, false)
  .annotate(Tool.OpenWorld, true);

const UpdateTaskTool = Tool.make("UpdateTaskTool", {
  ...HabiticaFailure,
  description: "Update a Habitica task.",
  parameters: UpdateTaskInput,
  success: HabiticaTask,
  needsApproval: true,
})
  .annotate(Tool.Readonly, false)
  .annotate(Tool.Destructive, false)
  .annotate(Tool.OpenWorld, true);

const DeleteTaskTool = Tool.make("DeleteTaskTool", {
  ...HabiticaFailure,
  description: "Delete a Habitica task.",
  parameters: TaskIdInput,
  success: HabiticaMutationResult,
  needsApproval: true,
})
  .annotate(Tool.Readonly, false)
  .annotate(Tool.Destructive, true)
  .annotate(Tool.OpenWorld, true);

const ScoreTaskTool = Tool.make("ScoreTaskTool", {
  ...HabiticaFailure,
  description: "Score a Habitica task up or down.",
  parameters: ScoreTaskInput,
  success: HabiticaTask,
  needsApproval: true,
})
  .annotate(Tool.Readonly, false)
  .annotate(Tool.Destructive, false)
  .annotate(Tool.OpenWorld, true);

const CreateTagTool = Tool.make("CreateTagTool", {
  ...HabiticaFailure,
  description: "Create a Habitica tag.",
  parameters: CreateTagInput,
  success: HabiticaTag,
  needsApproval: true,
})
  .annotate(Tool.Readonly, false)
  .annotate(Tool.Destructive, false)
  .annotate(Tool.OpenWorld, true);

const AddChecklistItemTool = Tool.make("AddChecklistItemTool", {
  ...HabiticaFailure,
  description: "Create a checklist item on a Habitica task.",
  parameters: AddChecklistItemInput,
  success: HabiticaTask,
  needsApproval: true,
})
  .annotate(Tool.Readonly, false)
  .annotate(Tool.Destructive, false)
  .annotate(Tool.OpenWorld, true);

const UpdateChecklistItemTool = Tool.make("UpdateChecklistItemTool", {
  ...HabiticaFailure,
  description: "Update a Habitica task checklist item.",
  parameters: UpdateChecklistItemInput,
  success: HabiticaTask,
  needsApproval: true,
})
  .annotate(Tool.Readonly, false)
  .annotate(Tool.Destructive, false)
  .annotate(Tool.OpenWorld, true);

const DeleteChecklistItemTool = Tool.make("DeleteChecklistItemTool", {
  ...HabiticaFailure,
  description: "Delete a Habitica task checklist item.",
  parameters: DeleteChecklistItemInput,
  success: HabiticaTask,
  needsApproval: true,
})
  .annotate(Tool.Readonly, false)
  .annotate(Tool.Destructive, true)
  .annotate(Tool.OpenWorld, true);

const ScoreChecklistItemTool = Tool.make("ScoreChecklistItemTool", {
  ...HabiticaFailure,
  description: "Score a Habitica task checklist item.",
  parameters: DeleteChecklistItemInput,
  success: HabiticaTask,
  needsApproval: true,
})
  .annotate(Tool.Readonly, false)
  .annotate(Tool.Destructive, false)
  .annotate(Tool.OpenWorld, true);

const ReadNotificationTool = Tool.make("ReadNotificationTool", {
  ...HabiticaFailure,
  description: "Mark a Habitica notification as read.",
  parameters: NotificationIdInput,
  success: HabiticaMutationResult,
  needsApproval: true,
})
  .annotate(Tool.Readonly, false)
  .annotate(Tool.Destructive, false)
  .annotate(Tool.OpenWorld, true);

const ListRewardsTool = Tool.make("ListRewardsTool", {
  ...HabiticaFailure,
  description: "Read Habitica reward tasks.",
  success: Schema.Array(HabiticaTask),
})
  .annotate(Tool.Readonly, true)
  .annotate(Tool.Destructive, false)
  .annotate(Tool.OpenWorld, true);

const CreateRewardTool = Tool.make("CreateRewardTool", {
  ...HabiticaFailure,
  description: "Create a Habitica reward.",
  parameters: CreateTaskInput,
  success: HabiticaTask,
  needsApproval: true,
})
  .annotate(Tool.Readonly, false)
  .annotate(Tool.Destructive, false)
  .annotate(Tool.OpenWorld, true);

const UpdateRewardTool = Tool.make("UpdateRewardTool", {
  ...HabiticaFailure,
  description: "Update a Habitica reward.",
  parameters: UpdateTaskInput,
  success: HabiticaTask,
  needsApproval: true,
})
  .annotate(Tool.Readonly, false)
  .annotate(Tool.Destructive, false)
  .annotate(Tool.OpenWorld, true);

const DeleteRewardTool = Tool.make("DeleteRewardTool", {
  ...HabiticaFailure,
  description: "Delete a Habitica reward.",
  parameters: RewardIdInput,
  success: HabiticaMutationResult,
  needsApproval: true,
})
  .annotate(Tool.Readonly, false)
  .annotate(Tool.Destructive, true)
  .annotate(Tool.OpenWorld, true);

const BuyRewardTool = Tool.make("BuyRewardTool", {
  ...HabiticaFailure,
  description: "Buy a Habitica reward.",
  parameters: RewardIdInput,
  success: HabiticaMutationResult,
  needsApproval: true,
})
  .annotate(Tool.Readonly, false)
  .annotate(Tool.Destructive, false)
  .annotate(Tool.OpenWorld, true);

const ListShopItemsTool = Tool.make("ListShopItemsTool", {
  ...HabiticaFailure,
  description: "Read Habitica shop items.",
  success: Schema.Array(HabiticaShopItem),
})
  .annotate(Tool.Readonly, true)
  .annotate(Tool.Destructive, false)
  .annotate(Tool.OpenWorld, true);

const BuyShopItemTool = Tool.make("BuyShopItemTool", {
  ...HabiticaFailure,
  description: "Buy a Habitica shop item.",
  parameters: ShopItemInput,
  success: HabiticaMutationResult,
  needsApproval: true,
})
  .annotate(Tool.Readonly, false)
  .annotate(Tool.Destructive, false)
  .annotate(Tool.OpenWorld, true);

const HatchPetTool = Tool.make("HatchPetTool", {
  ...HabiticaFailure,
  description: "Hatch a Habitica pet.",
  parameters: HatchPetInput,
  success: HabiticaMutationResult,
  needsApproval: true,
})
  .annotate(Tool.Readonly, false)
  .annotate(Tool.Destructive, false)
  .annotate(Tool.OpenWorld, true);

const FeedPetTool = Tool.make("FeedPetTool", {
  ...HabiticaFailure,
  description: "Feed a Habitica pet.",
  parameters: PetFoodInput,
  success: HabiticaMutationResult,
  needsApproval: true,
})
  .annotate(Tool.Readonly, false)
  .annotate(Tool.Destructive, false)
  .annotate(Tool.OpenWorld, true);

const EquipPetTool = Tool.make("EquipPetTool", {
  ...HabiticaFailure,
  description: "Equip a Habitica pet.",
  parameters: PetInput,
  success: HabiticaMutationResult,
  needsApproval: true,
})
  .annotate(Tool.Readonly, false)
  .annotate(Tool.Destructive, false)
  .annotate(Tool.OpenWorld, true);

const EquipMountTool = Tool.make("EquipMountTool", {
  ...HabiticaFailure,
  description: "Equip a Habitica mount.",
  parameters: MountInput,
  success: HabiticaMutationResult,
  needsApproval: true,
})
  .annotate(Tool.Readonly, false)
  .annotate(Tool.Destructive, false)
  .annotate(Tool.OpenWorld, true);

const ListSkillsTool = Tool.make("ListSkillsTool", {
  ...HabiticaFailure,
  description: "Read usable Habitica skills.",
  success: Schema.Array(HabiticaSkill),
})
  .annotate(Tool.Readonly, true)
  .annotate(Tool.Destructive, false)
  .annotate(Tool.OpenWorld, true);

const CastSkillTool = Tool.make("CastSkillTool", {
  ...HabiticaFailure,
  description: "Cast a Habitica skill.",
  parameters: SkillInput,
  success: HabiticaMutationResult,
  needsApproval: true,
})
  .annotate(Tool.Readonly, false)
  .annotate(Tool.Destructive, false)
  .annotate(Tool.OpenWorld, true);

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
    AddChecklistItemTool: gateway.addChecklistItem,
    BuyRewardTool: gateway.buyReward,
    BuyShopItemTool: gateway.buyShopItem,
    CastSkillTool: gateway.castSkill,
    CreateRewardTool: gateway.createReward,
    CreateTagTool: gateway.createTag,
    CreateTaskTool: gateway.createTask,
    DeleteChecklistItemTool: gateway.deleteChecklistItem,
    DeleteRewardTool: gateway.deleteReward,
    DeleteTaskTool: gateway.deleteTask,
    EquipMountTool: gateway.equipMount,
    EquipPetTool: gateway.equipPet,
    FeedPetTool: gateway.feedPet,
    GetInventoryTool: () => gateway.getInventory,
    GetStatsTool: () => gateway.getStats,
    GetTaskTool: gateway.getTask,
    GetUserProfileTool: () => gateway.getUserProfile,
    HelloWorldTool: ({ name }) => Effect.succeed(`Hello, ${name ?? "world"}!`),
    HatchPetTool: gateway.hatchPet,
    ListNotificationsTool: () => gateway.listNotifications,
    ListRewardsTool: () => gateway.listTasks({ type: "reward" }),
    ListShopItemsTool: () => gateway.listShopItems,
    ListSkillsTool: () => gateway.listSkills,
    ListTagsTool: () => gateway.listTags,
    ListTasksTool: gateway.listTasks,
    ReadNotificationTool: gateway.readNotification,
    ScoreChecklistItemTool: gateway.scoreChecklistItem,
    ScoreTaskTool: gateway.scoreTask,
    UpdateChecklistItemTool: gateway.updateChecklistItem,
    UpdateRewardTool: gateway.updateReward,
    UpdateTaskTool: gateway.updateTask,
  });
});

/** @internal */
export const HabiticaToolLayer = HabiticaToolkit.toLayer(HabiticaToolHandlers);
