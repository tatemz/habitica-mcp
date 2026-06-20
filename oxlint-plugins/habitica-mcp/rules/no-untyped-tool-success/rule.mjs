import { hasObjectProperties, isStaticCall } from "../shared/ast.mjs";
import { createRule, report } from "../shared/rule.mjs";

export const noUntypedToolSuccessRuleName = "no-untyped-tool-success";

export const noUntypedToolSuccess = createRule({
  description: "Require every Effect MCP Tool.make call to declare a success schema.",
  messages: {
    invariant: "Tool.make must declare a success schema so MCP responses stay typed.",
  },
  create(context) {
    return {
      CallExpression(node) {
        if (
          isStaticCall(node, "Tool", "make") &&
          !hasObjectProperties(node.arguments[1], ["success"])
        ) {
          report(context, node, "invariant");
        }
      },
    };
  },
});
