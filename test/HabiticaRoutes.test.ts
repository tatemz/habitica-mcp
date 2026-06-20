import { describe, expect, it } from "vitest";
import { HabiticaRoutes, taskListUrlParams } from "../src/habitica/HabiticaRoutes.js";

describe("HabiticaRoutes", () => {
  it("builds user and collection routes", () => {
    expect(HabiticaRoutes.user()).toBe("/user");
    expect(HabiticaRoutes.inventory()).toBe("/user/inventory");
    expect(HabiticaRoutes.tasksUser()).toBe("/tasks/user");
    expect(HabiticaRoutes.tags()).toBe("/tags");
    expect(HabiticaRoutes.notifications()).toBe("/notifications");
    expect(HabiticaRoutes.market()).toBe("/shops/market");
    expect(HabiticaRoutes.skillList()).toBe("/user/class/cast");
  });

  it("builds task and checklist routes", () => {
    expect(HabiticaRoutes.task("task-1")).toBe("/tasks/task-1");
    expect(HabiticaRoutes.taskScore("task-1", "up")).toBe("/tasks/task-1/score/up");
    expect(HabiticaRoutes.checklist("task-1")).toBe("/tasks/task-1/checklist");
    expect(HabiticaRoutes.checklistItem("task-1", "check-1")).toBe(
      "/tasks/task-1/checklist/check-1",
    );
    expect(HabiticaRoutes.checklistItemScore("task-1", "check-1")).toBe(
      "/tasks/task-1/checklist/check-1/score",
    );
  });

  it("builds notifications and expanded gameplay routes", () => {
    expect(HabiticaRoutes.notificationRead("notification-1")).toBe(
      "/notifications/notification-1/read",
    );
    expect(HabiticaRoutes.buySpecialSpell("potion")).toBe("/user/buy-special-spell/potion");
    expect(HabiticaRoutes.castSkill("fireball")).toBe("/user/class/cast/fireball");
    expect(HabiticaRoutes.hatchPet("Wolf", "Base")).toBe("/user/hatch/Wolf/Base");
    expect(HabiticaRoutes.feedPet("Wolf-Base", "Meat")).toBe("/user/feed/Wolf-Base/Meat");
    expect(HabiticaRoutes.equipPet("Wolf-Base")).toBe("/user/equip/pet/Wolf-Base");
    expect(HabiticaRoutes.equipMount("Wolf-Base")).toBe("/user/equip/mount/Wolf-Base");
  });
});

describe("taskListUrlParams", () => {
  it("omits params when no task type is provided", () => {
    expect(taskListUrlParams(undefined)).toBeUndefined();
  });

  it("maps task type query parameters to Habitica API values", () => {
    expect(taskListUrlParams("habit")).toEqual({ type: "habits" });
    expect(taskListUrlParams("daily")).toEqual({ type: "dailys" });
    expect(taskListUrlParams("todo")).toEqual({ type: "todos" });
    expect(taskListUrlParams("reward")).toEqual({ type: "rewards" });
  });
});
