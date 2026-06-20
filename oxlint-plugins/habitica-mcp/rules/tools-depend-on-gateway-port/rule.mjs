import { normalizedFilename } from "../shared/context.mjs";
import { toolPath } from "../shared/paths.mjs";
import { createRule, report } from "../shared/rule.mjs";

export const toolsDependOnGatewayPortRuleName = "tools-depend-on-gateway-port";

const forbiddenToolImports =
  /(?:HabiticaHttpAdapter|HabiticaTransport|node_modules|from\s+["']habitica["'])/;

export const toolsDependOnGatewayPort = createRule({
  description: "Keep MCP tools depending on HabiticaGateway instead of adapters or SDKs.",
  messages: {
    invariant:
      "Tool modules must depend on HabiticaGateway ports, not adapters, transports, or third-party SDKs.",
  },
  create(context) {
    if (!toolPath(normalizedFilename(context))) {
      return {};
    }

    return {
      ImportDeclaration(node) {
        const source = String(node.source.value ?? "");
        if (forbiddenToolImports.test(source)) {
          report(context, node, "invariant");
        }
      },
    };
  },
});
