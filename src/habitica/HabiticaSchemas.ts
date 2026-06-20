import { Schema } from "effect";

export const TaskType = Schema.Literals(["habit", "daily", "todo", "reward"]);
export type TaskType = typeof TaskType.Type;

export const Direction = Schema.Literals(["up", "down"]);
export type Direction = typeof Direction.Type;

class HabiticaStats extends Schema.Class<HabiticaStats>("HabiticaStats")({
  class: Schema.optional(Schema.String),
  gp: Schema.Number,
  hp: Schema.Number,
  lvl: Schema.Number,
  mp: Schema.Number,
  toNextLevel: Schema.optional(Schema.Number),
}) {}

export class HabiticaProfile extends Schema.Class<HabiticaProfile>("HabiticaProfile")({
  id: Schema.String,
  displayName: Schema.String,
  stats: HabiticaStats,
}) {}

export class HabiticaApiUserProfile extends Schema.Class<HabiticaApiUserProfile>(
  "HabiticaApiUserProfile",
)({
  id: Schema.String,
  profile: Schema.Struct({ name: Schema.String }),
  stats: HabiticaStats,
}) {}

export const habiticaProfileFromApiUser = (user: HabiticaApiUserProfile): HabiticaProfile =>
  new HabiticaProfile({
    displayName: user.profile.name,
    id: user.id,
    stats: user.stats,
  });

export class HabiticaChecklistItem extends Schema.Class<HabiticaChecklistItem>(
  "HabiticaChecklistItem",
)({
  completed: Schema.Boolean,
  id: Schema.String,
  text: Schema.String,
}) {}

export class HabiticaTask extends Schema.Class<HabiticaTask>("HabiticaTask")({
  checklist: Schema.optional(Schema.Array(HabiticaChecklistItem)),
  completed: Schema.optional(Schema.Boolean),
  id: Schema.String,
  notes: Schema.optional(Schema.String),
  text: Schema.String,
  type: TaskType,
}) {}

export class HabiticaTag extends Schema.Class<HabiticaTag>("HabiticaTag")({
  id: Schema.String,
  name: Schema.String,
}) {}

export class HabiticaNotification extends Schema.Class<HabiticaNotification>(
  "HabiticaNotification",
)({
  id: Schema.String,
  seen: Schema.Boolean,
  text: Schema.optional(Schema.String),
  type: Schema.String,
}) {}

export class HabiticaApiNotifications extends Schema.Class<HabiticaApiNotifications>(
  "HabiticaApiNotifications",
)({
  notifications: Schema.Array(HabiticaNotification),
}) {}

export class HabiticaInventory extends Schema.Class<HabiticaInventory>("HabiticaInventory")({
  eggs: Schema.Record(Schema.String, Schema.Number),
  food: Schema.Record(Schema.String, Schema.Number),
  hatchingPotions: Schema.Record(Schema.String, Schema.Number),
  mounts: Schema.Record(Schema.String, Schema.Boolean),
  pets: Schema.Record(Schema.String, Schema.Number),
}) {}

export class HabiticaApiInventory extends Schema.Class<HabiticaApiInventory>(
  "HabiticaApiInventory",
)({
  items: HabiticaInventory,
}) {}

export class HabiticaShopItem extends Schema.Class<HabiticaShopItem>("HabiticaShopItem")({
  key: Schema.String,
  text: Schema.String,
  value: Schema.Number,
}) {}

export class HabiticaApiMarketCategory extends Schema.Class<HabiticaApiMarketCategory>(
  "HabiticaApiMarketCategory",
)({
  items: Schema.Array(HabiticaShopItem),
}) {}

export class HabiticaApiMarket extends Schema.Class<HabiticaApiMarket>("HabiticaApiMarket")({
  categories: Schema.Array(HabiticaApiMarketCategory),
}) {}

export class HabiticaSkill extends Schema.Class<HabiticaSkill>("HabiticaSkill")({
  key: Schema.String,
  mana: Schema.Number,
  text: Schema.String,
}) {}

export class HabiticaMutationResult extends Schema.Class<HabiticaMutationResult>(
  "HabiticaMutationResult",
)({
  id: Schema.String,
  message: Schema.String,
}) {}

export class CreateTaskInput extends Schema.Class<CreateTaskInput>("CreateTaskInput")({
  notes: Schema.optional(Schema.String),
  text: Schema.String,
  type: TaskType,
}) {}

export class UpdateTaskInput extends Schema.Class<UpdateTaskInput>("UpdateTaskInput")({
  completed: Schema.optional(Schema.Boolean),
  id: Schema.String,
  notes: Schema.optional(Schema.String),
  text: Schema.optional(Schema.String),
}) {}

export class CreateTagInput extends Schema.Class<CreateTagInput>("CreateTagInput")({
  name: Schema.String,
}) {}

export class UpdateChecklistItemInput extends Schema.Class<UpdateChecklistItemInput>(
  "UpdateChecklistItemInput",
)({
  completed: Schema.optional(Schema.Boolean),
  itemId: Schema.String,
  taskId: Schema.String,
  text: Schema.optional(Schema.String),
}) {}
