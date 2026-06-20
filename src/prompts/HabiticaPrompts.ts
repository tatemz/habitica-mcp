import { Effect, Schema } from "effect";
import { McpServer } from "effect/unstable/ai";

export const DailyPlanningPrompt = McpServer.prompt({
  name: "Daily Planning",
  description: "Plan a Habitica day from current tasks and stats.",
  parameters: {
    focus: Schema.optional(Schema.String),
  },
  completion: {
    focus: () => Effect.succeed(["dailies", "todos", "habits", "rewards"]),
  },
  content: ({ focus }) =>
    Effect.succeed(
      `Use GetStatsTool and ListTasksTool to plan today's Habitica work${focus === undefined ? "." : ` for ${focus}.`}`,
    ),
});

export const TaskReviewPrompt = McpServer.prompt({
  name: "Task Review",
  description: "Review Habitica tasks and suggest safe updates.",
  parameters: {
    taskType: Schema.optional(Schema.String),
  },
  completion: {
    taskType: () => Effect.succeed(["habit", "daily", "todo", "reward"]),
  },
  content: ({ taskType }) =>
    Effect.succeed(
      `Use ListTasksTool${taskType === undefined ? "" : ` filtered to ${taskType}`} and propose explicit changes before using mutating tools.`,
    ),
});

export const HabitCheckInPrompt = McpServer.prompt({
  name: "Habit Check-In",
  description: "Check in on Habitica habits without scoring them automatically.",
  parameters: {
    mood: Schema.optional(Schema.String),
  },
  completion: {
    mood: () => Effect.succeed(["steady", "blocked", "low-energy", "high-energy"]),
  },
  content: ({ mood }) =>
    Effect.succeed(
      `Use ListTasksTool for habits and ask before ScoreTaskTool${mood === undefined ? "." : `; user mood: ${mood}.`}`,
    ),
});
