import { Effect, Schema } from "effect";
import { McpServer } from "effect/unstable/ai";
import {
  dailyPlanningContent,
  focusCompletions,
  habitCheckInContent,
  moodCompletions,
  taskReviewContent,
  taskTypeCompletions,
} from "./HabiticaPromptContent.js";

export const DailyPlanningPrompt = McpServer.prompt({
  name: "habitica_daily_planning",
  description: "Plan a Habitica day from current tasks and stats.",
  parameters: {
    focus: Schema.optional(Schema.String).annotate({
      description: "Task area to plan around, such as dailies, todos, habits, or rewards.",
    }),
  },
  completion: {
    focus: () => Effect.succeed([...focusCompletions]),
  },
  content: ({ focus }) => Effect.succeed(dailyPlanningContent(focus)),
});

export const TaskReviewPrompt = McpServer.prompt({
  name: "habitica_task_review",
  description: "Review Habitica tasks and suggest safe updates.",
  parameters: {
    taskType: Schema.optional(Schema.String).annotate({
      description: "Restrict the review to one task type: habit, daily, todo, or reward.",
    }),
  },
  completion: {
    taskType: () => Effect.succeed([...taskTypeCompletions]),
  },
  content: ({ taskType }) => Effect.succeed(taskReviewContent(taskType)),
});

export const HabitCheckInPrompt = McpServer.prompt({
  name: "habitica_habit_check_in",
  description: "Check in on Habitica habits without scoring them automatically.",
  parameters: {
    mood: Schema.optional(Schema.String).annotate({
      description: "Current energy or mood, such as steady, blocked, low-energy, or high-energy.",
    }),
  },
  completion: {
    mood: () => Effect.succeed([...moodCompletions]),
  },
  content: ({ mood }) => Effect.succeed(habitCheckInContent(mood)),
});
