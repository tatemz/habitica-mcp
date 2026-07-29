import { Effect, Layer } from "effect";
import { describe, expect, it } from "vitest";
import { HabiticaGateway } from "../src/habitica/HabiticaGateway.js";
import { HabiticaHttpAdapter } from "../src/habitica/HabiticaHttpAdapter.js";
import { HabiticaTransport } from "../src/habitica/HabiticaTransport.js";
import type { HabiticaTransportRequest } from "../src/habitica/HabiticaTransport.js";

/**
 * Drives the gateway against a recording transport so each method's route,
 * verb, and body are asserted, and the supplied decoder is exercised against a
 * realistic Habitica envelope.
 */
type GatewayUse = (gateway: HabiticaGateway["Service"]) => Effect.Effect<unknown, unknown>;

const withGateway = (responseData: unknown, use: GatewayUse) => {
  const recorded: Array<HabiticaTransportRequest> = [];
  const transport = Layer.succeed(HabiticaTransport)(
    HabiticaTransport.of({
      /**
       * Recording is deferred to execution because the gateway builds some
       * request Effects eagerly at layer construction; recording on call would
       * capture those instead of the request under test.
       */
      request: (request, decode) =>
        Effect.suspend(() => {
          recorded.push(request);
          return decode({ data: responseData, success: true });
        }),
    }),
  );

  return {
    recorded,
    result: Effect.runPromiseExit(
      Effect.flatMap(HabiticaGateway, use).pipe(
        Effect.provide(HabiticaHttpAdapter.gatewayLayer.pipe(Layer.provide(transport))),
      ),
    ),
  };
};

const task = { id: "task-1", text: "Ship it", type: "todo" };
const tag = { id: "tag-1", name: "Focus" };
const mutation = { id: "task-1", message: "changed" };
const stats = { gp: 1, hp: 50, lvl: 3, mp: 10 };

describe("HabiticaHttpAdapter.gatewayLayer routes", () => {
  it.each([
    [
      "getTask",
      (g: HabiticaGateway["Service"]) => g.getTask({ taskId: "t1" }),
      task,
      "GET",
      "/tasks/t1",
      undefined,
    ],
    ["listTags", (g: HabiticaGateway["Service"]) => g.listTags, [tag], "GET", "/tags", undefined],
    [
      "listShopItems",
      (g: HabiticaGateway["Service"]) => g.listShopItems,
      { categories: [{ items: [{ key: "k", text: "t", value: 1 }] }] },
      "GET",
      "/shops/market",
      undefined,
    ],
    [
      "listSkills",
      (g: HabiticaGateway["Service"]) => g.listSkills,
      { spells: { wizard: { fireball: { key: "fireball", mana: 10, text: "Burst" } } } },
      "GET",
      "/content",
      undefined,
    ],
    [
      "createTask",
      (g: HabiticaGateway["Service"]) => g.createTask({ text: "New", type: "todo" }),
      task,
      "POST",
      "/tasks/user",
      { text: "New", type: "todo" },
    ],
    [
      "createTag",
      (g: HabiticaGateway["Service"]) => g.createTag({ name: "Focus" }),
      tag,
      "POST",
      "/tags",
      { name: "Focus" },
    ],
    [
      "deleteTask",
      (g: HabiticaGateway["Service"]) => g.deleteTask({ taskId: "t1" }),
      mutation,
      "DELETE",
      "/tasks/t1",
      undefined,
    ],
    [
      "scoreTask",
      (g: HabiticaGateway["Service"]) => g.scoreTask({ direction: "up", taskId: "t1" }),
      task,
      "POST",
      "/tasks/t1/score/up",
      {},
    ],
    [
      "addChecklistItem",
      (g: HabiticaGateway["Service"]) => g.addChecklistItem({ taskId: "t1", text: "Item" }),
      task,
      "POST",
      "/tasks/t1/checklist",
      { text: "Item" },
    ],
    [
      "deleteChecklistItem",
      (g: HabiticaGateway["Service"]) => g.deleteChecklistItem({ itemId: "i1", taskId: "t1" }),
      task,
      "DELETE",
      "/tasks/t1/checklist/i1",
      undefined,
    ],
    [
      "scoreChecklistItem",
      (g: HabiticaGateway["Service"]) => g.scoreChecklistItem({ itemId: "i1", taskId: "t1" }),
      task,
      "POST",
      "/tasks/t1/checklist/i1/score",
      {},
    ],
    [
      "readNotification",
      (g: HabiticaGateway["Service"]) => g.readNotification({ notificationId: "n1" }),
      mutation,
      "POST",
      "/notifications/n1/read",
      {},
    ],
    [
      "deleteReward",
      (g: HabiticaGateway["Service"]) => g.deleteReward({ rewardId: "r1" }),
      mutation,
      "DELETE",
      "/tasks/r1",
      undefined,
    ],
    [
      "buyReward",
      (g: HabiticaGateway["Service"]) => g.buyReward({ rewardId: "r1" }),
      mutation,
      "POST",
      "/tasks/r1/score/down",
      {},
    ],
    [
      "buyShopItem",
      (g: HabiticaGateway["Service"]) => g.buyShopItem({ key: "k1" }),
      mutation,
      "POST",
      "/user/buy-special-spell/k1",
      {},
    ],
    [
      "hatchPet",
      (g: HabiticaGateway["Service"]) => g.hatchPet({ eggKey: "Wolf", hatchingPotionKey: "Base" }),
      mutation,
      "POST",
      "/user/hatch/Wolf/Base",
      {},
    ],
    [
      "feedPet",
      (g: HabiticaGateway["Service"]) => g.feedPet({ foodKey: "Meat", petKey: "Wolf-Base" }),
      mutation,
      "POST",
      "/user/feed/Wolf-Base/Meat",
      {},
    ],
    [
      "equipPet",
      (g: HabiticaGateway["Service"]) => g.equipPet({ petKey: "Wolf-Base" }),
      mutation,
      "POST",
      "/user/equip/pet/Wolf-Base",
      {},
    ],
    [
      "equipMount",
      (g: HabiticaGateway["Service"]) => g.equipMount({ mountKey: "Wolf-Base" }),
      mutation,
      "POST",
      "/user/equip/mount/Wolf-Base",
      {},
    ],
    [
      "castSkill",
      (g: HabiticaGateway["Service"]) => g.castSkill({ skillKey: "fireball", targetId: "t1" }),
      mutation,
      "POST",
      "/user/class/cast/fireball",
      { targetId: "t1" },
    ],
    [
      "updateTask",
      (g: HabiticaGateway["Service"]) => g.updateTask({ id: "t1", text: "Edited" }),
      task,
      "PUT",
      "/tasks/t1",
      { id: "t1", text: "Edited" },
    ],
    [
      "updateReward",
      (g: HabiticaGateway["Service"]) => g.updateReward({ id: "r1", text: "Edited" }),
      task,
      "PUT",
      "/tasks/r1",
      { id: "r1", text: "Edited" },
    ],
    [
      "updateChecklistItem",
      (g: HabiticaGateway["Service"]) =>
        g.updateChecklistItem({ itemId: "i1", taskId: "t1", text: "Edited" }),
      task,
      "PUT",
      "/tasks/t1/checklist/i1",
      { itemId: "i1", taskId: "t1", text: "Edited" },
    ],
  ] as const)("%s issues the documented request", async (_name, use, data, method, path, body) => {
    const { recorded, result } = withGateway(data, use);

    expect((await result)._tag).toBe("Success");
    expect(recorded[0].method).toBe(method);
    expect(recorded[0].path).toBe(path);
    expect(recorded[0].body).toEqual(body);
  });

  it("reads the profile from /user and reshapes it", async () => {
    const { recorded, result } = withGateway(
      { id: "u1", profile: { name: "Tatemz" }, stats },
      (gateway) => gateway.getUserProfile,
    );

    expect(await result).toMatchObject({
      _tag: "Success",
      value: { displayName: "Tatemz", id: "u1", stats },
    });
    expect(recorded[0].method).toBe("GET");
    expect(recorded[0].path).toBe("/user");
  });

  it("derives stats from the profile rather than a separate endpoint", async () => {
    const { recorded, result } = withGateway(
      { id: "u1", profile: { name: "Tatemz" }, stats },
      (gateway) => gateway.getStats,
    );

    expect(await result).toMatchObject({ _tag: "Success", value: stats });
    expect(recorded[0].method).toBe("GET");
    expect(recorded[0].path).toBe("/user");
  });

  it("requests only the items field when reading inventory", async () => {
    const items = {
      eggs: { Wolf: 1 },
      food: { Meat: 2 },
      hatchingPotions: { Base: 1 },
      mounts: { "Wolf-Base": true },
      pets: { "Wolf-Base": 5 },
    };
    const { recorded, result } = withGateway({ items }, (gateway) => gateway.getInventory);

    expect(await result).toMatchObject({ _tag: "Success", value: items });
    expect(recorded[0].method).toBe("GET");
    expect(recorded[0].path).toBe("/user");
    expect(recorded[0].urlParams).toEqual({ userFields: "items" });
  });

  it("requests only the notifications field when listing notifications", async () => {
    const notifications = [{ id: "n1", seen: false, type: "info" }];
    const { recorded, result } = withGateway(
      { notifications },
      (gateway) => gateway.listNotifications,
    );

    expect(await result).toMatchObject({ _tag: "Success", value: notifications });
    expect(recorded[0].method).toBe("GET");
    expect(recorded[0].path).toBe("/user");
    expect(recorded[0].urlParams).toEqual({ userFields: "notifications" });
  });

  it("flattens market categories into a single shop item list", async () => {
    const { result } = withGateway(
      {
        categories: [
          { items: [{ key: "a", text: "A", value: 1 }] },
          { items: [{ key: "b", text: "B", value: 2 }] },
        ],
      },
      (gateway) => gateway.listShopItems,
    );

    expect(await result).toMatchObject({
      _tag: "Success",
      value: [
        { key: "a", text: "A", value: 1 },
        { key: "b", text: "B", value: 2 },
      ],
    });
  });

  it("flattens content spells across every class into a single skill list", async () => {
    const { result } = withGateway(
      {
        spells: {
          rogue: { backStab: { key: "backStab", mana: 5, text: "Backstab" } },
          wizard: { fireball: { key: "fireball", mana: 10, text: "Burst" } },
        },
      },
      (gateway) => gateway.listSkills,
    );

    expect(await result).toMatchObject({
      _tag: "Success",
      value: [
        { key: "backStab", mana: 5, text: "Backstab" },
        { key: "fireball", mana: 10, text: "Burst" },
      ],
    });
  });

  it.each([
    ["habit", "habits"],
    ["daily", "dailys"],
    ["todo", "todos"],
    ["reward", "rewards"],
  ] as const)("filters the task list for %s", async (type, expected) => {
    const { recorded, result } = withGateway([task], (gateway) => gateway.listTasks({ type }));

    expect((await result)._tag).toBe("Success");
    expect(recorded[0].method).toBe("GET");
    expect(recorded[0].path).toBe("/tasks/user");
    expect(recorded[0].urlParams).toEqual({ type: expected });
  });

  /**
   * The unfiltered request must omit the urlParams key entirely rather than
   * carry an explicit undefined, so key presence is asserted directly.
   */
  it("omits the type filter when listing every task", async () => {
    const { recorded, result } = withGateway([task], (gateway) => gateway.listTasks({}));

    expect((await result)._tag).toBe("Success");
    expect(recorded[0].method).toBe("GET");
    expect(Object.hasOwn(recorded[0], "urlParams")).toBe(false);
  });

  it("forces the reward type when creating a reward without notes", async () => {
    const { recorded, result } = withGateway({ ...task, type: "reward" }, (gateway) =>
      gateway.createReward({ text: "Coffee", type: "todo" }),
    );

    expect((await result)._tag).toBe("Success");
    expect(recorded[0].body).toEqual({ text: "Coffee", type: "reward" });
    expect(Object.hasOwn(recorded[0].body as object, "notes")).toBe(false);
  });

  it("keeps notes when creating a reward that supplies them", async () => {
    const { recorded, result } = withGateway({ ...task, type: "reward" }, (gateway) =>
      gateway.createReward({ notes: "Decaf", text: "Coffee", type: "todo" }),
    );

    expect((await result)._tag).toBe("Success");
    expect(recorded[0].body).toEqual({ notes: "Decaf", text: "Coffee", type: "reward" });
  });

  it("omits the target when casting a skill at no target", async () => {
    const { recorded, result } = withGateway(mutation, (gateway) =>
      gateway.castSkill({ skillKey: "fireball" }),
    );

    expect((await result)._tag).toBe("Success");
    expect(recorded[0].body).toEqual({ targetId: undefined });
  });

  it("fails with a decode error when Habitica returns an unexpected shape", async () => {
    const { result } = withGateway({ unexpected: true }, (gateway) =>
      gateway.getTask({ taskId: "t1" }),
    );

    const serialised = JSON.stringify(await result);

    expect(serialised).toContain("HabiticaDecodeError");
    expect(serialised).toContain("Habitica response did not match the expected schema.");
  });
});
