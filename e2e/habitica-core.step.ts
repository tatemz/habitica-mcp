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
const notificationIdCapture = Bdd.capture("notificationId", Schema.String);
const expectedCapture = Bdd.capture("expected", Schema.String);

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
      eggs: {},
      food: {},
      hatchingPotions: {},
      mounts: {},
      pets: {},
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
  listTasks: () => Effect.succeed([baseTask]),
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
    Effect.map((tasks) => ({ message: "", taskText: tasks[0]?.text ?? "" })),
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

const thenVisibleTask = Bdd.then`the visible task is ${expectedCapture}`(
  (
    { expected: expectedTask }: { readonly expected: string },
    state: { readonly taskText: string },
  ) =>
    state.taskText === expectedTask
      ? Effect.succeed(state)
      : Effect.fail(`expected task ${expectedTask}` as const),
);

const thenChangedTask = Bdd.then`the changed task is ${expectedCapture}`(
  (
    { expected: expectedTask }: { readonly expected: string },
    state: { readonly taskText: string },
  ) =>
    state.taskText === expectedTask
      ? Effect.succeed(state)
      : Effect.fail(`expected task ${expectedTask}` as const),
);

const thenMutationMessage = Bdd.then`the mutation message is ${expectedCapture}`(
  (
    { expected: expectedMessage }: { readonly expected: string },
    state: { readonly message: string },
  ) =>
    state.message === expectedMessage
      ? Effect.succeed(state)
      : Effect.fail(`expected message ${expectedMessage}` as const),
);

const thenMcpGreeting = Bdd.then`the MCP greeting is ${expectedCapture}`(
  (
    { expected: expectedMessage }: { readonly expected: string },
    state: { readonly message: string },
  ) =>
    state.message === expectedMessage
      ? Effect.succeed(state)
      : Effect.fail(`expected greeting ${expectedMessage}` as const),
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
const mutateChecklist = Bdd.scenario("Mutating a checklist item").pipe(
  givenFakeGateway,
  whenAddChecklistItem,
  thenChangedTask,
);
const readNotification = Bdd.scenario("Reading a notification").pipe(
  givenFakeGateway,
  whenReadNotification,
  thenMutationMessage,
);

export const habiticaCore = Bdd.feature("Habitica core tools").pipe(
  sayHello,
  listTodos,
  createTodo,
  updateTask,
  deleteTask,
  scoreHabit,
  mutateChecklist,
  readNotification,
);
