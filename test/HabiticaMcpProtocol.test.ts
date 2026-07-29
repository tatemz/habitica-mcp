import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import manifest from "../package.json" with { type: "json" };
import { fakeGateway } from "./support/fakeGateway.js";
import { callMcp, type JsonRpcResponse } from "./support/McpTestClient.js";

const drive = (
  ...requests: ReadonlyArray<{ readonly method: string; readonly params?: unknown }>
): Promise<ReadonlyArray<JsonRpcResponse>> => Effect.runPromise(callMcp(fakeGateway, requests));

const resultOf = async (method: string, params?: unknown): Promise<Record<string, unknown>> => {
  const responses = await drive({ method, params });
  const reply = responses.at(-1);
  if (reply?.result === undefined) {
    throw new Error(`${method} returned no result: ${JSON.stringify(reply)}`);
  }
  return reply.result;
};

/**
 * An optional parameter renders as an anyOf, so its description can sit on a
 * nested branch. Collecting every description in the subtree and requiring a
 * substantive one covers both shapes without asserting on JSON Schema layout.
 */
const descriptions = (schema: unknown): ReadonlyArray<string> =>
  typeof schema !== "object" || schema === null
    ? []
    : Object.entries(schema).flatMap(([key, value]) =>
        key === "description" && typeof value === "string" ? [value] : descriptions(value),
      );

describe("initialize", () => {
  it("advertises the published package version, not a hardcoded copy", async () => {
    const responses = await drive();

    expect(responses[0]?.result?.["serverInfo"]).toEqual({
      name: manifest.name,
      version: manifest.version,
    });
  });

  it("declares the tool, prompt, resource, and completion capabilities", async () => {
    const responses = await drive();

    expect(Object.keys(responses[0]?.result?.["capabilities"] as object).toSorted()).toEqual([
      "completions",
      "prompts",
      "resources",
      "tools",
    ]);
  });
});

describe("tools/list", () => {
  it("namespaces every tool name in snake_case", async () => {
    const result = await resultOf("tools/list");
    const names = (result["tools"] as ReadonlyArray<{ readonly name: string }>).map(
      (tool) => tool.name,
    );

    expect(names.filter((name) => !/^habitica_[a-z0-9_]+$/.test(name))).toEqual([]);
  });

  /**
   * Emptiness matters as much as presence here: an empty title or description is
   * still a title or description as far as a presence check is concerned, but it
   * tells the model and the user nothing.
   */
  it("gives every tool a substantive description, a title, and a full set of behaviour hints", async () => {
    const result = await resultOf("tools/list");
    const tools = result["tools"] as ReadonlyArray<{
      readonly annotations?: Record<string, unknown>;
      readonly description?: string;
      readonly name: string;
    }>;

    const incomplete = tools.filter(
      (tool) =>
        (tool.description ?? "").length < 20 ||
        ((tool.annotations?.["title"] ?? "") as string).length < 3 ||
        typeof tool.annotations?.["readOnlyHint"] !== "boolean" ||
        typeof tool.annotations["destructiveHint"] !== "boolean" ||
        typeof tool.annotations["idempotentHint"] !== "boolean" ||
        typeof tool.annotations["openWorldHint"] !== "boolean",
    );

    expect(incomplete.map((tool) => tool.name)).toEqual([]);
  });

  it("marks reads readonly and idempotent, and deletes destructive", async () => {
    const result = await resultOf("tools/list");
    const byName = new Map(
      (result["tools"] as ReadonlyArray<{ readonly annotations: Record<string, unknown> }>).map(
        (tool) => [(tool as unknown as { name: string }).name, tool.annotations],
      ),
    );

    expect({
      create: byName.get("habitica_create_task"),
      del: byName.get("habitica_delete_task"),
      read: byName.get("habitica_list_tasks"),
    }).toEqual({
      create: {
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
        readOnlyHint: false,
        title: "Create Task",
      },
      del: {
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
        readOnlyHint: false,
        title: "Delete Task",
      },
      read: {
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
        readOnlyHint: true,
        title: "List Tasks",
      },
    });
  });

  it("describes every tool parameter so the model is not guessing", async () => {
    const result = await resultOf("tools/list");
    const tools = result["tools"] as ReadonlyArray<{
      readonly inputSchema: { readonly properties?: Record<string, unknown> };
      readonly name: string;
    }>;

    const undescribed = tools.flatMap((tool) =>
      Object.entries(tool.inputSchema.properties ?? {})
        .filter(([, schema]) => !descriptions(schema).some((text) => text.length >= 15))
        .map(([field]) => `${tool.name}.${field}`),
    );

    expect(undescribed).toEqual([]);
  });
});

describe("tools/call", () => {
  it("returns structured content alongside the text block", async () => {
    const result = await resultOf("tools/call", {
      name: "habitica_get_task",
      arguments: { taskId: "task-1" },
    });

    expect(result).toMatchObject({
      isError: false,
      structuredContent: { id: "task-1", text: "Ship Habitica MCP", type: "todo" },
    });
  });

  it("reports a missing required argument as a tool error, not a transport crash", async () => {
    const result = await resultOf("tools/call", {
      name: "habitica_get_task",
      arguments: {},
    });

    expect(result).toMatchObject({
      isError: true,
      content: [{ type: "text", text: expect.stringContaining('Missing key\n  at ["taskId"]') }],
    });
  });

  it("fails a call to an unregistered tool name", async () => {
    const responses = await drive({
      method: "tools/call",
      params: { name: "habitica_not_a_tool", arguments: {} },
    });

    expect(JSON.stringify(responses.at(-1))).toContain("habitica_not_a_tool");
  });
});

describe("resources", () => {
  it("lists the static resources with names, descriptions, and mime types", async () => {
    const result = await resultOf("resources/list");

    expect(result["resources"]).toMatchObject([
      {
        uri: "habitica-mcp://capabilities",
        name: "Habitica MCP Capabilities",
        description: "Describes the supported Habitica read and write tool domains.",
        mimeType: "text/markdown",
      },
      {
        uri: "habitica-mcp://task-template",
        name: "Habitica Task Template",
        description: "Suggested fields for creating or updating Habitica tasks.",
        mimeType: "application/json",
      },
    ]);
  });

  it("reads the capabilities document as markdown", async () => {
    const result = await resultOf("resources/read", { uri: "habitica-mcp://capabilities" });

    expect(result["contents"]).toMatchObject([
      { uri: "habitica-mcp://capabilities", text: expect.stringContaining("# Habitica MCP") },
    ]);
  });

  it("publishes the task URI template with its name, description, and mime type", async () => {
    const result = await resultOf("resources/templates/list");

    expect(result["resourceTemplates"]).toMatchObject([
      {
        uriTemplate: "habitica://task/{taskId}",
        name: "Habitica Task",
        description: "A single Habitica task, addressed by its task id.",
        mimeType: "application/json",
      },
    ]);
  });

  it("resolves a templated task URI through the gateway", async () => {
    const result = await resultOf("resources/read", { uri: "habitica://task/task-1" });

    expect(result["contents"]).toMatchObject([
      {
        uri: "habitica://task/task-1",
        text: expect.stringContaining('"text": "Ship Habitica MCP"'),
      },
    ]);
  });
});

describe("prompts", () => {
  it("uses snake_case prompt identifiers", async () => {
    const result = await resultOf("prompts/list");

    expect(
      (result["prompts"] as ReadonlyArray<{ readonly name: string }>)
        .map((prompt) => prompt.name)
        .toSorted(),
    ).toEqual(["habitica_daily_planning", "habitica_habit_check_in", "habitica_task_review"]);
  });

  it("describes every prompt and every prompt argument", async () => {
    const result = await resultOf("prompts/list");
    const prompts = result["prompts"] as ReadonlyArray<{
      readonly arguments: ReadonlyArray<{ readonly description?: string; readonly name: string }>;
      readonly description?: string;
      readonly name: string;
    }>;

    const undescribed = prompts.flatMap((prompt) => [
      ...((prompt.description ?? "").length < 20 ? [prompt.name] : []),
      ...prompt.arguments
        .filter((argument) => (argument.description ?? "").length < 20)
        .map((argument) => `${prompt.name}.${argument.name}`),
    ]);

    expect(undescribed).toEqual([]);
  });

  it.each([
    [
      "habitica_daily_planning",
      { focus: "dailies" },
      "Use habitica_get_stats and habitica_list_tasks to plan today's Habitica work for dailies.",
    ],
    [
      "habitica_task_review",
      { taskType: "habit" },
      "Use habitica_list_tasks filtered to habit and propose explicit changes before using mutating tools.",
    ],
    [
      "habitica_habit_check_in",
      { mood: "blocked" },
      "Use habitica_list_tasks for habits and ask before habitica_score_task; user mood: blocked.",
    ],
  ])("renders %s content naming the namespaced tools", async (name, args, text) => {
    const result = await resultOf("prompts/get", { name, arguments: args });

    expect(result["messages"]).toEqual([{ role: "user", content: { type: "text", text } }]);
  });
});

describe("completion/complete", () => {
  it("completes a prompt argument from the offered values", async () => {
    const result = await resultOf("completion/complete", {
      ref: { type: "ref/prompt", name: "habitica_daily_planning" },
      argument: { name: "focus", value: "da" },
    });

    expect(result["completion"]).toEqual({
      hasMore: false,
      total: 4,
      values: ["dailies", "todos", "habits", "rewards"],
    });
  });

  it("completes the task review argument with the four task types", async () => {
    const result = await resultOf("completion/complete", {
      ref: { type: "ref/prompt", name: "habitica_task_review" },
      argument: { name: "taskType", value: "" },
    });

    expect(result["completion"]).toMatchObject({
      values: ["habit", "daily", "todo", "reward"],
    });
  });

  it("completes the check-in mood argument", async () => {
    const result = await resultOf("completion/complete", {
      ref: { type: "ref/prompt", name: "habitica_habit_check_in" },
      argument: { name: "mood", value: "" },
    });

    expect(result["completion"]).toMatchObject({
      values: ["steady", "blocked", "low-energy", "high-energy"],
    });
  });

  it("completes a task id for the resource template from live tasks", async () => {
    const result = await resultOf("completion/complete", {
      ref: { type: "ref/resource", uri: "habitica://task/{taskId}" },
      argument: { name: "taskId", value: "" },
    });

    expect(result["completion"]).toMatchObject({ values: ["task-1"] });
  });
});
