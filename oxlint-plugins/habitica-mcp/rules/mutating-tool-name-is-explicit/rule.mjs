import { isStaticCall } from "../shared/ast.mjs";
import { createRule, report } from "../shared/rule.mjs";

export const mutatingToolNameIsExplicitRuleName = "mutating-tool-name-is-explicit";

/**
 * A verb only counts when the description opens with it, describing the tool's
 * own action. Matching anywhere flagged read tools whose prose merely mentions a
 * mutation, as in "rewards the user can buy with gold".
 */
const mutatingDescription =
  /^(add|create|update|delete|score|mark|toggle|buy|cast|feed|hatch|equip)\b/i;

/**
 * Tool names are the public MCP surface and are namespaced snake_case, so the
 * mutating verb must appear as its own segment right after the namespace.
 */
const explicitMutationName =
  /^habitica_(add|create|update|delete|score|mark|read|toggle|buy|cast|feed|hatch|equip)_/;

const stringValue = (node) =>
  node?.type === "Literal" && typeof node.value === "string"
    ? node.value
    : node?.type === "TemplateLiteral" && node.expressions.length === 0
      ? node.quasis[0]?.value?.cooked
      : undefined;

const propertyString = (object, propertyName) => {
  if (object?.type !== "ObjectExpression") {
    return undefined;
  }

  const property = object.properties.find(
    (candidate) =>
      candidate.type === "Property" &&
      candidate.key.type === "Identifier" &&
      candidate.key.name === propertyName,
  );

  return property?.type === "Property" ? stringValue(property.value) : undefined;
};

const propertyIsTrue = (object, propertyName) =>
  object?.type === "ObjectExpression" &&
  object.properties.some(
    (candidate) =>
      candidate.type === "Property" &&
      candidate.key.type === "Identifier" &&
      candidate.key.name === propertyName &&
      candidate.value.type === "Literal" &&
      candidate.value.value === true,
  );

export const mutatingToolNameIsExplicit = createRule({
  description: "Require mutating MCP tools to advertise mutation in the tool name.",
  messages: {
    invariant:
      "Mutating Habitica tools must name the verb explicitly, as in habitica_create_task or habitica_delete_reward.",
  },
  create(context) {
    return {
      CallExpression(node) {
        if (!isStaticCall(node, "Tool", "make")) {
          return;
        }

        const name = stringValue(node.arguments[0]);
        const description = propertyString(node.arguments[1], "description");
        /**
         * needsApproval is the structural mutation signal; the description verb
         * is the backstop for a mutating tool that forgot to ask for approval.
         */
        const mutates =
          propertyIsTrue(node.arguments[1], "needsApproval") ||
          (description !== undefined && mutatingDescription.test(description));

        if (name !== undefined && mutates && !explicitMutationName.test(name)) {
          report(context, node, "invariant");
        }
      },
    };
  },
});
