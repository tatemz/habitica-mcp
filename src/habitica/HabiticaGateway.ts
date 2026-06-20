import { Context, type Effect } from "effect";
import type { HabiticaError } from "./HabiticaErrors.js";
import type {
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
} from "./HabiticaSchemas.js";

export interface HabiticaGatewayShape {
  readonly addChecklistItem: (input: {
    readonly taskId: string;
    readonly text: string;
  }) => Effect.Effect<HabiticaTask, HabiticaError>;
  readonly buyReward: (input: {
    readonly rewardId: string;
  }) => Effect.Effect<HabiticaMutationResult, HabiticaError>;
  readonly buyShopItem: (input: {
    readonly key: string;
  }) => Effect.Effect<HabiticaMutationResult, HabiticaError>;
  readonly castSkill: (input: {
    readonly skillKey: string;
    readonly targetId?: string | undefined;
  }) => Effect.Effect<HabiticaMutationResult, HabiticaError>;
  readonly createReward: (input: CreateTaskInput) => Effect.Effect<HabiticaTask, HabiticaError>;
  readonly createTag: (input: CreateTagInput) => Effect.Effect<HabiticaTag, HabiticaError>;
  readonly createTask: (input: CreateTaskInput) => Effect.Effect<HabiticaTask, HabiticaError>;
  readonly deleteChecklistItem: (input: {
    readonly itemId: string;
    readonly taskId: string;
  }) => Effect.Effect<HabiticaTask, HabiticaError>;
  readonly deleteReward: (input: {
    readonly rewardId: string;
  }) => Effect.Effect<HabiticaMutationResult, HabiticaError>;
  readonly deleteTask: (input: {
    readonly taskId: string;
  }) => Effect.Effect<HabiticaMutationResult, HabiticaError>;
  readonly equipMount: (input: {
    readonly mountKey: string;
  }) => Effect.Effect<HabiticaMutationResult, HabiticaError>;
  readonly equipPet: (input: {
    readonly petKey: string;
  }) => Effect.Effect<HabiticaMutationResult, HabiticaError>;
  readonly feedPet: (input: {
    readonly foodKey: string;
    readonly petKey: string;
  }) => Effect.Effect<HabiticaMutationResult, HabiticaError>;
  readonly getInventory: Effect.Effect<HabiticaInventory, HabiticaError>;
  readonly getStats: Effect.Effect<HabiticaProfile["stats"], HabiticaError>;
  readonly getTask: (input: {
    readonly taskId: string;
  }) => Effect.Effect<HabiticaTask, HabiticaError>;
  readonly getUserProfile: Effect.Effect<HabiticaProfile, HabiticaError>;
  readonly hatchPet: (input: {
    readonly eggKey: string;
    readonly hatchingPotionKey: string;
  }) => Effect.Effect<HabiticaMutationResult, HabiticaError>;
  readonly listNotifications: Effect.Effect<ReadonlyArray<HabiticaNotification>, HabiticaError>;
  readonly listShopItems: Effect.Effect<ReadonlyArray<HabiticaShopItem>, HabiticaError>;
  readonly listSkills: Effect.Effect<ReadonlyArray<HabiticaSkill>, HabiticaError>;
  readonly listTags: Effect.Effect<ReadonlyArray<HabiticaTag>, HabiticaError>;
  readonly listTasks: (input: {
    readonly type?: TaskType | undefined;
  }) => Effect.Effect<ReadonlyArray<HabiticaTask>, HabiticaError>;
  readonly readNotification: (input: {
    readonly notificationId: string;
  }) => Effect.Effect<HabiticaMutationResult, HabiticaError>;
  readonly scoreChecklistItem: (input: {
    readonly itemId: string;
    readonly taskId: string;
  }) => Effect.Effect<HabiticaTask, HabiticaError>;
  readonly scoreTask: (input: {
    readonly direction: Direction;
    readonly taskId: string;
  }) => Effect.Effect<HabiticaTask, HabiticaError>;
  readonly updateChecklistItem: (
    input: UpdateChecklistItemInput,
  ) => Effect.Effect<HabiticaTask, HabiticaError>;
  readonly updateReward: (input: UpdateTaskInput) => Effect.Effect<HabiticaTask, HabiticaError>;
  readonly updateTask: (input: UpdateTaskInput) => Effect.Effect<HabiticaTask, HabiticaError>;
}

export class HabiticaGateway extends Context.Service<HabiticaGateway, HabiticaGatewayShape>()(
  "habitica-mcp/HabiticaGateway",
) {}
