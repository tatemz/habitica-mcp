export const focusCompletions: ReadonlyArray<string> = ["dailies", "todos", "habits", "rewards"];

export const taskTypeCompletions: ReadonlyArray<string> = ["habit", "daily", "todo", "reward"];

export const moodCompletions: ReadonlyArray<string> = [
  "steady",
  "blocked",
  "low-energy",
  "high-energy",
];

export const dailyPlanningContent = (focus: string | undefined): string =>
  `Use habitica_get_stats and habitica_list_tasks to plan today's Habitica work${focus === undefined ? "." : ` for ${focus}.`}`;

export const taskReviewContent = (taskType: string | undefined): string =>
  `Use habitica_list_tasks${taskType === undefined ? "" : ` filtered to ${taskType}`} and propose explicit changes before using mutating tools.`;

export const habitCheckInContent = (mood: string | undefined): string =>
  `Use habitica_list_tasks for habits and ask before habitica_score_task${mood === undefined ? "." : `; user mood: ${mood}.`}`;
