import { Bdd } from "effect-bdd";
import { Effect, Schema } from "effect";
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

const taskNameCapture = Bdd.capture("taskName", Schema.String);
const taskIdCapture = Bdd.capture("taskId", Schema.String);
const directionCapture = Bdd.capture("direction", Schema.Literals(["up", "down"]));
const checklistTextCapture = Bdd.capture("checklistText", Schema.String);
const checklistItemIdCapture = Bdd.capture("checklistItemId", Schema.String);
const notificationIdCapture = Bdd.capture("notificationId", Schema.String);
const tagNameCapture = Bdd.capture("tagName", Schema.String);
const rewardIdCapture = Bdd.capture("rewardId", Schema.String);
const rewardNameCapture = Bdd.capture("rewardName", Schema.String);
const shopItemKeyCapture = Bdd.capture("shopItemKey", Schema.String);
const eggKeyCapture = Bdd.capture("eggKey", Schema.String);
const hatchingPotionKeyCapture = Bdd.capture("hatchingPotionKey", Schema.String);
const petKeyCapture = Bdd.capture("petKey", Schema.String);
const foodKeyCapture = Bdd.capture("foodKey", Schema.String);
const mountKeyCapture = Bdd.capture("mountKey", Schema.String);
const skillKeyCapture = Bdd.capture("skillKey", Schema.String);
const expectedCapture = Bdd.capture("expected", Schema.String);

interface ScenarioState {
  readonly message: string;
  readonly taskText: string;
}

const profile = new HabiticaProfile({
  displayName: "Tatemz",
  id: "user-1",
  stats: { gp: 12, hp: 50, lvl: 7, mp: 20 },
});
const baseTask = new HabiticaTask({
  checklist: [
    new HabiticaChecklistItem({ completed: false, id: "check-1", text: "Review output" }),
  ],
  id: "task-1",
  text: "Ship Habitica MCP",
  type: "todo",
});
const rewardTask = new HabiticaTask({
  id: "reward-1",
  text: "Coffee",
  type: "reward",
});
const mutation = new HabiticaMutationResult({ id: "task-1", message: "changed" });
const fakeGateway = HabiticaGateway.of({
  addChecklistItem: () => Effect.succeed(baseTask),
  buyReward: () => Effect.succeed(mutation),
  buyShopItem: () => Effect.succeed(mutation),
  castSkill: () => Effect.succeed(mutation),
  createReward: ({ text }) =>
    Effect.succeed(new HabiticaTask({ id: "reward-1", text, type: "reward" })),
  createTag: ({ name }) => Effect.succeed(new HabiticaTag({ id: "tag-1", name })),
  createTask: ({ text, type }) => Effect.succeed(new HabiticaTask({ id: "created-1", text, type })),
  deleteChecklistItem: () => Effect.succeed(baseTask),
  deleteReward: () => Effect.succeed(mutation),
  deleteTask: () => Effect.succeed(mutation),
  equipMount: () => Effect.succeed(mutation),
  equipPet: () => Effect.succeed(mutation),
  feedPet: () => Effect.succeed(mutation),
  getInventory: Effect.succeed(
    new HabiticaInventory({
      eggs: { Wolf: 1 },
      food: { Meat: 2 },
      hatchingPotions: { Base: 1 },
      mounts: { "Wolf-Base": false },
      pets: { "Wolf-Base": 5 },
    }),
  ),
  getStats: Effect.succeed(profile.stats),
  getTask: () => Effect.succeed(baseTask),
  getUserProfile: Effect.succeed(profile),
  hatchPet: () => Effect.succeed(mutation),
  listNotifications: Effect.succeed([
    new HabiticaNotification({ id: "notification-1", seen: false, text: "Welcome", type: "info" }),
  ]),
  listShopItems: Effect.succeed([
    new HabiticaShopItem({ key: "potion", text: "Potion", value: 25 }),
  ]),
  listSkills: Effect.succeed([
    new HabiticaSkill({ key: "fireball", mana: 10, text: "Burst of Flames" }),
  ]),
  listTags: Effect.succeed([new HabiticaTag({ id: "tag-1", name: "Focus" })]),
  listTasks: ({ type }) => Effect.succeed(type === "reward" ? [rewardTask] : [baseTask]),
  readNotification: () => Effect.succeed(mutation),
  scoreChecklistItem: () => Effect.succeed(baseTask),
  scoreTask: () => Effect.succeed(baseTask),
  updateChecklistItem: () => Effect.succeed(baseTask),
  updateReward: ({ id, text }) =>
    Effect.succeed(new HabiticaTask({ id, text: text ?? "Updated reward", type: "reward" })),
  updateTask: ({ id, text }) =>
    Effect.succeed(new HabiticaTask({ id, text: text ?? baseTask.text, type: "todo" })),
});

const givenFakeGateway = Bdd.given`the fake Habitica gateway is available`(() =>
  Effect.succeed({ message: "", taskText: "" }),
);

const whenAskForHelloWorld = Bdd.when`I ask for hello world`(() =>
  HabiticaToolHandlers.pipe(
    Effect.provideService(HabiticaGateway, fakeGateway),
    Effect.flatMap((handlers) => handlers.HelloWorldTool({})),
    Effect.map((greeting) => ({ message: greeting, taskText: "" })),
  ),
);

const whenListTodoTasks = Bdd.when`I list todo tasks`(() =>
  HabiticaToolHandlers.pipe(
    Effect.provideService(HabiticaGateway, fakeGateway),
    Effect.flatMap((handlers) => handlers.ListTasksTool({ type: "todo" })),
    Effect.map(({ tasks }) => ({ message: "", taskText: tasks[0]?.text ?? "" })),
  ),
);

const whenReadUserProfile = Bdd.when`I read the user profile`(() =>
  HabiticaToolHandlers.pipe(
    Effect.provideService(HabiticaGateway, fakeGateway),
    Effect.flatMap((handlers) => handlers.GetUserProfileTool()),
    Effect.map((user) => ({ message: user.displayName, taskText: "" })),
  ),
);

const whenReadStats = Bdd.when`I read stats`(() =>
  HabiticaToolHandlers.pipe(
    Effect.provideService(HabiticaGateway, fakeGateway),
    Effect.flatMap((handlers) => handlers.GetStatsTool()),
    Effect.map((stats) => ({ message: `level ${stats.lvl}`, taskText: "" })),
  ),
);

const whenGetTask = Bdd.when`I get task ${taskIdCapture}`(
  ({ taskId: capturedTaskId }: { readonly taskId: string }) =>
    HabiticaToolHandlers.pipe(
      Effect.provideService(HabiticaGateway, fakeGateway),
      Effect.flatMap((handlers) => handlers.GetTaskTool({ taskId: capturedTaskId })),
      Effect.map((task) => ({ message: "", taskText: task.text })),
    ),
);

const whenCreateTodo = Bdd.when`I create a todo named ${taskNameCapture}`(
  ({ taskName: capturedTaskName }: { readonly taskName: string }) =>
    HabiticaToolHandlers.pipe(
      Effect.provideService(HabiticaGateway, fakeGateway),
      Effect.flatMap((handlers) =>
        handlers.CreateTaskTool({ text: capturedTaskName, type: "todo" }),
      ),
      Effect.map((task) => ({ message: "", taskText: task.text })),
    ),
);

const whenUpdateTask = Bdd.when`I update task ${taskIdCapture} to ${taskNameCapture}`(
  ({
    taskId: capturedTaskId,
    taskName: capturedTaskName,
  }: {
    readonly taskId: string;
    readonly taskName: string;
  }) =>
    HabiticaToolHandlers.pipe(
      Effect.provideService(HabiticaGateway, fakeGateway),
      Effect.flatMap((handlers) =>
        handlers.UpdateTaskTool({ id: capturedTaskId, text: capturedTaskName }),
      ),
      Effect.map((task) => ({ message: "", taskText: task.text })),
    ),
);

const whenDeleteTask = Bdd.when`I delete task ${taskIdCapture}`(
  ({ taskId: capturedTaskId }: { readonly taskId: string }) =>
    HabiticaToolHandlers.pipe(
      Effect.provideService(HabiticaGateway, fakeGateway),
      Effect.flatMap((handlers) => handlers.DeleteTaskTool({ taskId: capturedTaskId })),
      Effect.map((result) => ({ message: result.message, taskText: "" })),
    ),
);

const whenScoreTask = Bdd.when`I score task ${taskIdCapture} ${directionCapture}`(
  ({
    direction: capturedDirection,
    taskId: capturedTaskId,
  }: {
    readonly direction: "up" | "down";
    readonly taskId: string;
  }) =>
    HabiticaToolHandlers.pipe(
      Effect.provideService(HabiticaGateway, fakeGateway),
      Effect.flatMap((handlers) =>
        handlers.ScoreTaskTool({ direction: capturedDirection, taskId: capturedTaskId }),
      ),
      Effect.map((task) => ({ message: "", taskText: task.text })),
    ),
);

const whenListTags = Bdd.when`I list tags`(() =>
  HabiticaToolHandlers.pipe(
    Effect.provideService(HabiticaGateway, fakeGateway),
    Effect.flatMap((handlers) => handlers.ListTagsTool()),
    Effect.map(({ tags }) => ({ message: tags[0]?.name ?? "", taskText: "" })),
  ),
);

const whenCreateTag = Bdd.when`I create tag ${tagNameCapture}`(
  ({ tagName: capturedTagName }: { readonly tagName: string }) =>
    HabiticaToolHandlers.pipe(
      Effect.provideService(HabiticaGateway, fakeGateway),
      Effect.flatMap((handlers) => handlers.CreateTagTool({ name: capturedTagName })),
      Effect.map((tag) => ({ message: tag.name, taskText: "" })),
    ),
);

const whenAddChecklistItem =
  Bdd.when`I add checklist item ${checklistTextCapture} to task ${taskIdCapture}`(
    ({
      checklistText: capturedChecklistText,
      taskId: capturedTaskId,
    }: {
      readonly checklistText: string;
      readonly taskId: string;
    }) =>
      HabiticaToolHandlers.pipe(
        Effect.provideService(HabiticaGateway, fakeGateway),
        Effect.flatMap((handlers) =>
          handlers.AddChecklistItemTool({ taskId: capturedTaskId, text: capturedChecklistText }),
        ),
        Effect.map((task) => ({ message: "", taskText: task.text })),
      ),
  );

const whenUpdateChecklistItem =
  Bdd.when`I update checklist item ${checklistItemIdCapture} on task ${taskIdCapture} to ${checklistTextCapture}`(
    ({
      checklistItemId: capturedChecklistItemId,
      checklistText: capturedChecklistText,
      taskId: capturedTaskId,
    }: {
      readonly checklistItemId: string;
      readonly checklistText: string;
      readonly taskId: string;
    }) =>
      HabiticaToolHandlers.pipe(
        Effect.provideService(HabiticaGateway, fakeGateway),
        Effect.flatMap((handlers) =>
          handlers.UpdateChecklistItemTool({
            itemId: capturedChecklistItemId,
            taskId: capturedTaskId,
            text: capturedChecklistText,
          }),
        ),
        Effect.map((task) => ({ message: "", taskText: task.text })),
      ),
  );

const whenScoreChecklistItem =
  Bdd.when`I score checklist item ${checklistItemIdCapture} on task ${taskIdCapture}`(
    ({
      checklistItemId: capturedChecklistItemId,
      taskId: capturedTaskId,
    }: {
      readonly checklistItemId: string;
      readonly taskId: string;
    }) =>
      HabiticaToolHandlers.pipe(
        Effect.provideService(HabiticaGateway, fakeGateway),
        Effect.flatMap((handlers) =>
          handlers.ScoreChecklistItemTool({
            itemId: capturedChecklistItemId,
            taskId: capturedTaskId,
          }),
        ),
        Effect.map((task) => ({ message: "", taskText: task.text })),
      ),
  );

const whenDeleteChecklistItem =
  Bdd.when`I delete checklist item ${checklistItemIdCapture} on task ${taskIdCapture}`(
    ({
      checklistItemId: capturedChecklistItemId,
      taskId: capturedTaskId,
    }: {
      readonly checklistItemId: string;
      readonly taskId: string;
    }) =>
      HabiticaToolHandlers.pipe(
        Effect.provideService(HabiticaGateway, fakeGateway),
        Effect.flatMap((handlers) =>
          handlers.DeleteChecklistItemTool({
            itemId: capturedChecklistItemId,
            taskId: capturedTaskId,
          }),
        ),
        Effect.map((task) => ({ message: "", taskText: task.text })),
      ),
  );

const whenReadInventory = Bdd.when`I read inventory`(() =>
  HabiticaToolHandlers.pipe(
    Effect.provideService(HabiticaGateway, fakeGateway),
    Effect.flatMap((handlers) => handlers.GetInventoryTool()),
    Effect.map((inventory) => ({ message: Object.keys(inventory.pets)[0] ?? "", taskText: "" })),
  ),
);

const whenListNotifications = Bdd.when`I list notifications`(() =>
  HabiticaToolHandlers.pipe(
    Effect.provideService(HabiticaGateway, fakeGateway),
    Effect.flatMap((handlers) => handlers.ListNotificationsTool()),
    Effect.map(({ notifications }) => ({ message: notifications[0]?.text ?? "", taskText: "" })),
  ),
);

const whenReadNotification = Bdd.when`I read notification ${notificationIdCapture}`(
  ({ notificationId: capturedNotificationId }: { readonly notificationId: string }) =>
    HabiticaToolHandlers.pipe(
      Effect.provideService(HabiticaGateway, fakeGateway),
      Effect.flatMap((handlers) =>
        handlers.ReadNotificationTool({ notificationId: capturedNotificationId }),
      ),
      Effect.map((result) => ({ message: result.message, taskText: "" })),
    ),
);

const whenListRewards = Bdd.when`I list rewards`(() =>
  HabiticaToolHandlers.pipe(
    Effect.provideService(HabiticaGateway, fakeGateway),
    Effect.flatMap((handlers) => handlers.ListRewardsTool()),
    Effect.map(({ tasks }) => ({ message: "", taskText: tasks[0]?.text ?? "" })),
  ),
);

const whenCreateReward = Bdd.when`I create reward ${rewardNameCapture}`(
  ({ rewardName: capturedRewardName }: { readonly rewardName: string }) =>
    HabiticaToolHandlers.pipe(
      Effect.provideService(HabiticaGateway, fakeGateway),
      Effect.flatMap((handlers) =>
        handlers.CreateRewardTool({ text: capturedRewardName, type: "reward" }),
      ),
      Effect.map((task) => ({ message: "", taskText: task.text })),
    ),
);

const whenUpdateReward = Bdd.when`I update reward ${rewardIdCapture} to ${rewardNameCapture}`(
  ({
    rewardId: capturedRewardId,
    rewardName: capturedRewardName,
  }: {
    readonly rewardId: string;
    readonly rewardName: string;
  }) =>
    HabiticaToolHandlers.pipe(
      Effect.provideService(HabiticaGateway, fakeGateway),
      Effect.flatMap((handlers) =>
        handlers.UpdateRewardTool({ id: capturedRewardId, text: capturedRewardName }),
      ),
      Effect.map((task) => ({ message: "", taskText: task.text })),
    ),
);

const whenBuyReward = Bdd.when`I buy reward ${rewardIdCapture}`(
  ({ rewardId: capturedRewardId }: { readonly rewardId: string }) =>
    HabiticaToolHandlers.pipe(
      Effect.provideService(HabiticaGateway, fakeGateway),
      Effect.flatMap((handlers) => handlers.BuyRewardTool({ rewardId: capturedRewardId })),
      Effect.map((result) => ({ message: result.message, taskText: "" })),
    ),
);

const whenDeleteReward = Bdd.when`I delete reward ${rewardIdCapture}`(
  ({ rewardId: capturedRewardId }: { readonly rewardId: string }) =>
    HabiticaToolHandlers.pipe(
      Effect.provideService(HabiticaGateway, fakeGateway),
      Effect.flatMap((handlers) => handlers.DeleteRewardTool({ rewardId: capturedRewardId })),
      Effect.map((result) => ({ message: result.message, taskText: "" })),
    ),
);

const whenListShopItems = Bdd.when`I list shop items`(() =>
  HabiticaToolHandlers.pipe(
    Effect.provideService(HabiticaGateway, fakeGateway),
    Effect.flatMap((handlers) => handlers.ListShopItemsTool()),
    Effect.map(({ shopItems }) => ({ message: shopItems[0]?.text ?? "", taskText: "" })),
  ),
);

const whenBuyShopItem = Bdd.when`I buy shop item ${shopItemKeyCapture}`(
  ({ shopItemKey: capturedShopItemKey }: { readonly shopItemKey: string }) =>
    HabiticaToolHandlers.pipe(
      Effect.provideService(HabiticaGateway, fakeGateway),
      Effect.flatMap((handlers) => handlers.BuyShopItemTool({ key: capturedShopItemKey })),
      Effect.map((result) => ({ message: result.message, taskText: "" })),
    ),
);

const whenHatchPet = Bdd.when`I hatch pet ${eggKeyCapture} ${hatchingPotionKeyCapture}`(
  ({
    eggKey: capturedEggKey,
    hatchingPotionKey: capturedHatchingPotionKey,
  }: {
    readonly eggKey: string;
    readonly hatchingPotionKey: string;
  }) =>
    HabiticaToolHandlers.pipe(
      Effect.provideService(HabiticaGateway, fakeGateway),
      Effect.flatMap((handlers) =>
        handlers.HatchPetTool({
          eggKey: capturedEggKey,
          hatchingPotionKey: capturedHatchingPotionKey,
        }),
      ),
      Effect.map((result) => ({ message: result.message, taskText: "" })),
    ),
);

const whenFeedPet = Bdd.when`I feed pet ${petKeyCapture} ${foodKeyCapture}`(
  ({
    foodKey: capturedFoodKey,
    petKey: capturedPetKey,
  }: {
    readonly foodKey: string;
    readonly petKey: string;
  }) =>
    HabiticaToolHandlers.pipe(
      Effect.provideService(HabiticaGateway, fakeGateway),
      Effect.flatMap((handlers) =>
        handlers.FeedPetTool({ foodKey: capturedFoodKey, petKey: capturedPetKey }),
      ),
      Effect.map((result) => ({ message: result.message, taskText: "" })),
    ),
);

const whenEquipPet = Bdd.when`I equip pet ${petKeyCapture}`(
  ({ petKey: capturedPetKey }: { readonly petKey: string }) =>
    HabiticaToolHandlers.pipe(
      Effect.provideService(HabiticaGateway, fakeGateway),
      Effect.flatMap((handlers) => handlers.EquipPetTool({ petKey: capturedPetKey })),
      Effect.map((result) => ({ message: result.message, taskText: "" })),
    ),
);

const whenEquipMount = Bdd.when`I equip mount ${mountKeyCapture}`(
  ({ mountKey: capturedMountKey }: { readonly mountKey: string }) =>
    HabiticaToolHandlers.pipe(
      Effect.provideService(HabiticaGateway, fakeGateway),
      Effect.flatMap((handlers) => handlers.EquipMountTool({ mountKey: capturedMountKey })),
      Effect.map((result) => ({ message: result.message, taskText: "" })),
    ),
);

const whenListSkills = Bdd.when`I list skills`(() =>
  HabiticaToolHandlers.pipe(
    Effect.provideService(HabiticaGateway, fakeGateway),
    Effect.flatMap((handlers) => handlers.ListSkillsTool()),
    Effect.map(({ skills }) => ({ message: skills[0]?.text ?? "", taskText: "" })),
  ),
);

const whenCastSkill = Bdd.when`I cast skill ${skillKeyCapture} at ${taskIdCapture}`(
  ({
    skillKey: capturedSkillKey,
    taskId: capturedTaskId,
  }: {
    readonly skillKey: string;
    readonly taskId: string;
  }) =>
    HabiticaToolHandlers.pipe(
      Effect.provideService(HabiticaGateway, fakeGateway),
      Effect.flatMap((handlers) =>
        handlers.CastSkillTool({ skillKey: capturedSkillKey, targetId: capturedTaskId }),
      ),
      Effect.map((result) => ({ message: result.message, taskText: "" })),
    ),
);

const thenVisibleTask = Bdd.then`the visible task is ${expectedCapture}`(
  ({ expected: expectedTask }: { readonly expected: string }, state: ScenarioState) =>
    state.taskText === expectedTask
      ? Effect.succeed(state)
      : Effect.fail(`expected task ${expectedTask}` as const),
);

const thenChangedTask = Bdd.then`the changed task is ${expectedCapture}`(
  ({ expected: expectedTask }: { readonly expected: string }, state: ScenarioState) =>
    state.taskText === expectedTask
      ? Effect.succeed(state)
      : Effect.fail(`expected task ${expectedTask}` as const),
);

const thenMutationMessage = Bdd.then`the mutation message is ${expectedCapture}`(
  ({ expected: expectedMessage }: { readonly expected: string }, state: ScenarioState) =>
    state.message === expectedMessage
      ? Effect.succeed(state)
      : Effect.fail(`expected message ${expectedMessage}` as const),
);

const thenMcpGreeting = Bdd.then`the MCP greeting is ${expectedCapture}`(
  ({ expected: expectedMessage }: { readonly expected: string }, state: ScenarioState) =>
    state.message === expectedMessage
      ? Effect.succeed(state)
      : Effect.fail(`expected greeting ${expectedMessage}` as const),
);

const thenResultText = Bdd.then`the result text is ${expectedCapture}`(
  ({ expected: expectedMessage }: { readonly expected: string }, state: ScenarioState) =>
    state.message === expectedMessage
      ? Effect.succeed(state)
      : Effect.fail(`expected result ${expectedMessage}` as const),
);

const sayHello = Bdd.scenario("Saying hello without Habitica credentials").pipe(
  givenFakeGateway,
  whenAskForHelloWorld,
  thenMcpGreeting,
);
const listTodos = Bdd.scenario("Listing todo tasks").pipe(
  givenFakeGateway,
  whenListTodoTasks,
  thenVisibleTask,
);
const readProfileAndStats = Bdd.scenario("Reading profile and stats").pipe(
  givenFakeGateway,
  whenReadUserProfile,
  thenResultText,
  whenReadStats,
  thenResultText,
);
const readTask = Bdd.scenario("Reading a single task").pipe(
  givenFakeGateway,
  whenGetTask,
  thenVisibleTask,
);
const createTodo = Bdd.scenario("Creating a todo").pipe(
  givenFakeGateway,
  whenCreateTodo,
  thenChangedTask,
);
const updateTask = Bdd.scenario("Updating a task").pipe(
  givenFakeGateway,
  whenUpdateTask,
  thenChangedTask,
);
const deleteTask = Bdd.scenario("Deleting a task").pipe(
  givenFakeGateway,
  whenDeleteTask,
  thenMutationMessage,
);
const scoreHabit = Bdd.scenario("Scoring a habit").pipe(
  givenFakeGateway,
  whenScoreTask,
  thenChangedTask,
);
const manageTags = Bdd.scenario("Managing tags").pipe(
  givenFakeGateway,
  whenListTags,
  thenResultText,
  whenCreateTag,
  thenResultText,
);
const manageChecklistItems = Bdd.scenario("Managing checklist items").pipe(
  givenFakeGateway,
  whenAddChecklistItem,
  thenChangedTask,
  whenUpdateChecklistItem,
  thenChangedTask,
  whenScoreChecklistItem,
  thenChangedTask,
  whenDeleteChecklistItem,
  thenChangedTask,
);
const readInventory = Bdd.scenario("Reading inventory").pipe(
  givenFakeGateway,
  whenReadInventory,
  thenResultText,
);
const readNotification = Bdd.scenario("Reading a notification").pipe(
  givenFakeGateway,
  whenListNotifications,
  thenResultText,
  whenReadNotification,
  thenMutationMessage,
);
const manageRewards = Bdd.scenario("Managing rewards").pipe(
  givenFakeGateway,
  whenListRewards,
  thenVisibleTask,
  whenCreateReward,
  thenChangedTask,
  whenUpdateReward,
  thenChangedTask,
  whenBuyReward,
  thenMutationMessage,
  whenDeleteReward,
  thenMutationMessage,
);
const buyShopItems = Bdd.scenario("Buying shop items").pipe(
  givenFakeGateway,
  whenListShopItems,
  thenResultText,
  whenBuyShopItem,
  thenMutationMessage,
);
const managePetsAndMounts = Bdd.scenario("Managing pets and mounts").pipe(
  givenFakeGateway,
  whenHatchPet,
  thenMutationMessage,
  whenFeedPet,
  thenMutationMessage,
  whenEquipPet,
  thenMutationMessage,
  whenEquipMount,
  thenMutationMessage,
);
const castSkills = Bdd.scenario("Casting skills").pipe(
  givenFakeGateway,
  whenListSkills,
  thenResultText,
  whenCastSkill,
  thenMutationMessage,
);

export const habiticaCore = Bdd.feature("Habitica core tools").pipe(
  sayHello,
  listTodos,
  readProfileAndStats,
  readTask,
  createTodo,
  updateTask,
  deleteTask,
  scoreHabit,
  manageTags,
  manageChecklistItems,
  readInventory,
  readNotification,
  manageRewards,
  buyShopItems,
  managePetsAndMounts,
  castSkills,
);
