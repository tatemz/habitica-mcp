import { sourcePath } from "../shared/paths.mjs";
import { sourceRule } from "../shared/source-rule.mjs";

export const mcpStdoutIsProtocolRuleName = "mcp-stdout-is-protocol";

export const mcpStdoutIsProtocol = sourceRule({
  description: "Reject stdout writes in MCP server source.",
  message: "MCP stdio owns stdout; write logs to stderr through Effect logging.",
  patterns: [/\bconsole\.log\s*\(/, /\bprocess\.stdout\b/],
  shouldRun: sourcePath,
});
