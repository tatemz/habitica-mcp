import { sourcePath } from "../shared/paths.mjs";
import { sourceRule } from "../shared/source-rule.mjs";

export const noRawHabiticaCredentialsRuleName = "no-raw-habitica-credentials";

export const noRawHabiticaCredentials = sourceRule({
  description: "Reject logging or exposing Habitica credential material.",
  message: "Do not log or expose Habitica tokens, API keys, auth headers, or credential values.",
  patterns: [
    /\b(log\w*|debug|info|warn|error)\s*\([^)]*(apiToken|api_token|token|x-api-key|x-api-user)/is,
    /\bconsole\.\w+\s*\([^)]*(apiToken|api_token|token|x-api-key|x-api-user)/is,
  ],
  shouldRun: sourcePath,
});
