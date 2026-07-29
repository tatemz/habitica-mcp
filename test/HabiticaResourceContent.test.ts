import { describe, expect, it } from "vitest";
import { HabiticaTask } from "../src/habitica/HabiticaSchemas.js";
import {
  capabilitiesMarkdown,
  taskResourceJson,
  taskTemplateJson,
} from "../src/resources/HabiticaResourceContent.js";

describe("capabilitiesMarkdown", () => {
  it("leads with a markdown heading", () => {
    expect(capabilitiesMarkdown.startsWith("# Habitica MCP Capabilities")).toBe(true);
  });

  it("states that mutating tools name their verb and request approval", () => {
    expect(capabilitiesMarkdown).toContain(
      "mutating tools name their verb explicitly, request\napproval",
    );
  });

  it("reserves stdout for the MCP protocol", () => {
    expect(capabilitiesMarkdown).toContain("Stdio stdout is reserved for MCP\nJSON-RPC.");
  });

  it("advertises the task resource template", () => {
    expect(capabilitiesMarkdown).toContain("habitica://task/{taskId}");
  });
});

describe("taskResourceJson", () => {
  it("pretty-prints the task so a client can read it as a resource", () => {
    const task = new HabiticaTask({ id: "task-1", text: "Ship it", type: "todo" });

    expect(JSON.parse(taskResourceJson(task))).toMatchObject({
      id: "task-1",
      text: "Ship it",
      type: "todo",
    });
  });
});

describe("taskTemplateJson", () => {
  it("emits the documented task fields", () => {
    expect(JSON.parse(taskTemplateJson())).toEqual({
      notes: "Optional notes visible on the task.",
      text: "Clear task text.",
      type: "habit | daily | todo | reward",
    });
  });

  it("pretty-prints with a two space indent so the resource stays readable", () => {
    expect(taskTemplateJson()).toContain('\n  "notes"');
  });
});
