import { describe, expect, it } from "vitest";
import {
  dailyPlanningContent,
  focusCompletions,
  habitCheckInContent,
  moodCompletions,
  taskReviewContent,
  taskTypeCompletions,
} from "../src/prompts/HabiticaPromptContent.js";

describe("dailyPlanningContent", () => {
  it("ends with a bare period when no focus is supplied", () => {
    expect(dailyPlanningContent(undefined)).toBe(
      "Use habitica_get_stats and habitica_list_tasks to plan today's Habitica work.",
    );
  });

  it("names the requested focus", () => {
    expect(dailyPlanningContent("dailies")).toBe(
      "Use habitica_get_stats and habitica_list_tasks to plan today's Habitica work for dailies.",
    );
  });
});

describe("taskReviewContent", () => {
  it("omits the filter clause when no task type is supplied", () => {
    expect(taskReviewContent(undefined)).toBe(
      "Use habitica_list_tasks and propose explicit changes before using mutating tools.",
    );
  });

  it("names the requested task type", () => {
    expect(taskReviewContent("habit")).toBe(
      "Use habitica_list_tasks filtered to habit and propose explicit changes before using mutating tools.",
    );
  });
});

describe("habitCheckInContent", () => {
  it("ends with a bare period when no mood is supplied", () => {
    expect(habitCheckInContent(undefined)).toBe(
      "Use habitica_list_tasks for habits and ask before habitica_score_task.",
    );
  });

  it("appends the reported mood", () => {
    expect(habitCheckInContent("blocked")).toBe(
      "Use habitica_list_tasks for habits and ask before habitica_score_task; user mood: blocked.",
    );
  });
});

describe("prompt completions", () => {
  it("offers the Habitica task surfaces as focus options", () => {
    expect(focusCompletions).toEqual(["dailies", "todos", "habits", "rewards"]);
  });

  it("offers exactly the four Habitica task types", () => {
    expect(taskTypeCompletions).toEqual(["habit", "daily", "todo", "reward"]);
  });

  it("offers the supported mood options", () => {
    expect(moodCompletions).toEqual(["steady", "blocked", "low-energy", "high-energy"]);
  });
});
