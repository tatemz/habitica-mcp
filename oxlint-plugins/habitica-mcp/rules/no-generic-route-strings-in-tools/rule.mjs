import { normalizedFilename } from "../shared/context.mjs";
import { toolPath } from "../shared/paths.mjs";
import { createRule, report } from "../shared/rule.mjs";

export const noGenericRouteStringsInToolsRuleName = "no-generic-route-strings-in-tools";

const habiticaRoute =
  /^\/(?:api\/v3\/)?(?:user|tasks|tags|notifications|shops|content|groups|members|challenges)\b/;

export const noGenericRouteStringsInTools = createRule({
  description: "Reject raw Habitica route strings inside MCP tool modules.",
  messages: {
    invariant: "Habitica route strings belong in adapter modules, not MCP tools.",
  },
  create(context) {
    if (!toolPath(normalizedFilename(context))) {
      return {};
    }

    return {
      Literal(node) {
        if (typeof node.value === "string" && habiticaRoute.test(node.value)) {
          report(context, node, "invariant");
        }
      },
    };
  },
});
