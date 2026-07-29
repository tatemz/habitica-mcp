import type { HabiticaTask } from "../habitica/HabiticaSchemas.js";

export const capabilitiesMarkdown = `# Habitica MCP Capabilities

This server exposes typed Habitica tools for profile, stats, tasks, tags, checklists, notifications,
inventory, rewards, shop items, pets, mounts, and skills.

Tool names are namespaced \`habitica_*\` and mutating tools name their verb explicitly, request
approval, and declare MCP destructive and idempotency hints. Stdio stdout is reserved for MCP
JSON-RPC.

Individual tasks are also readable as resources at \`habitica://task/{taskId}\`.`;

export const taskTemplateJson = (): string =>
  JSON.stringify(
    {
      notes: "Optional notes visible on the task.",
      text: "Clear task text.",
      type: "habit | daily | todo | reward",
    },
    null,
    2,
  );

export const taskResourceJson = (task: HabiticaTask): string => JSON.stringify(task, null, 2);
