import { isStaticCall, staticMemberName } from "../shared/ast.mjs";
import { normalizedFilename } from "../shared/context.mjs";
import { adapterPath, habiticaBoundaryPath } from "../shared/paths.mjs";
import { createRule, report } from "../shared/rule.mjs";

export const noUncheckedJsonBoundaryRuleName = "no-unchecked-json-boundary";

export const noUncheckedJsonBoundary = createRule({
  description: "Reject unchecked JSON parsing at the Habitica API boundary.",
  messages: {
    invariant:
      "Decode Habitica JSON through Schema at the boundary instead of raw json()/JSON.parse.",
  },
  create(context) {
    const filename = normalizedFilename(context);
    if (!habiticaBoundaryPath(filename) || !adapterPath(filename)) {
      return {};
    }

    return {
      CallExpression(node) {
        if (
          isStaticCall(node, "JSON", "parse") ||
          (node.callee?.type === "MemberExpression" &&
            node.callee.computed === false &&
            staticMemberName(node.callee) === "json")
        ) {
          report(context, node, "invariant");
        }
      },
    };
  },
});
