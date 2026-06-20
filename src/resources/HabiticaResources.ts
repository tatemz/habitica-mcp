import { Effect } from "effect";
import { McpServer } from "effect/unstable/ai";

export const CapabilitiesResource = McpServer.resource({
  uri: "habitica-mcp://capabilities",
  name: "Habitica MCP Capabilities",
  description: "Describes the supported Habitica read and write tool domains.",
  mimeType: "text/markdown",
  content: Effect.succeed(`# Habitica MCP Capabilities

This server exposes typed Habitica tools for profile, stats, tasks, tags, checklists, notifications,
inventory, rewards, shop items, pets, mounts, and skills.

Mutating tools use explicit verb names and request approval. Stdio stdout is reserved for MCP JSON-RPC.`),
});

export const TaskTemplateResource = McpServer.resource({
  uri: "habitica-mcp://task-template",
  name: "Habitica Task Template",
  description: "Suggested fields for creating or updating Habitica tasks.",
  mimeType: "application/json",
  content: Effect.succeed(
    JSON.stringify(
      {
        notes: "Optional notes visible on the task.",
        text: "Clear task text.",
        type: "habit | daily | todo | reward",
      },
      null,
      2,
    ),
  ),
});
