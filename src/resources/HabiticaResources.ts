import { Effect, Schema } from "effect";
import { McpSchema, McpServer } from "effect/unstable/ai";
import { HabiticaGateway } from "../habitica/HabiticaGateway.js";
import {
  capabilitiesMarkdown,
  taskResourceJson,
  taskTemplateJson,
} from "./HabiticaResourceContent.js";

export const CapabilitiesResource = McpServer.resource({
  uri: "habitica-mcp://capabilities",
  name: "Habitica MCP Capabilities",
  description: "Describes the supported Habitica read and write tool domains.",
  mimeType: "text/markdown",
  content: Effect.succeed(capabilitiesMarkdown),
});

export const TaskTemplateResource = McpServer.resource({
  uri: "habitica-mcp://task-template",
  name: "Habitica Task Template",
  description: "Suggested fields for creating or updating Habitica tasks.",
  mimeType: "application/json",
  content: Effect.succeed(taskTemplateJson()),
});

const taskIdParam = McpSchema.param("taskId", Schema.String);

/**
 * Exposes each task as an addressable resource so a client can attach one task
 * as context instead of pulling the whole list through a tool call. Completion
 * offers the current task ids rather than making the caller guess.
 */
export const TaskResourceTemplate = McpServer.resource`habitica://task/${taskIdParam}`({
  name: "Habitica Task",
  description: "A single Habitica task, addressed by its task id.",
  mimeType: "application/json",
  completion: {
    taskId: () =>
      HabiticaGateway.pipe(
        Effect.flatMap((gateway) => gateway.listTasks({})),
        Effect.map((tasks) => tasks.map((task) => task.id)),
      ),
  },
  content: (_uri, taskId) =>
    HabiticaGateway.pipe(
      Effect.flatMap((gateway) => gateway.getTask({ taskId })),
      Effect.map(taskResourceJson),
    ),
});
