import { isStaticCall } from "../shared/ast.mjs";
import { createRule, report } from "../shared/rule.mjs";

export const mutatingToolNameIsExplicitRuleName = "mutating-tool-name-is-explicit";

const mutatingDescription =
  /\b(add|create|update|delete|score|mark|read notification|buy|cast|feed|hatch|equip)\b/i;
const explicitMutationName =
  /^(Add|Create|Update|Delete|Score|Mark|Read|Buy|Cast|Feed|Hatch|Equip)/;

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

export const mutatingToolNameIsExplicit = createRule({
  description: "Require mutating MCP tools to advertise mutation in the tool name.",
  messages: {
    invariant:
      "Mutating Habitica tools must start with an explicit verb such as Create, Update, Delete, or Score.",
  },
  create(context) {
    return {
      CallExpression(node) {
        if (!isStaticCall(node, "Tool", "make")) {
          return;
        }

        const name = stringValue(node.arguments[0]);
        const description = propertyString(node.arguments[1], "description");

        if (
          name !== undefined &&
          description !== undefined &&
          mutatingDescription.test(description) &&
          !explicitMutationName.test(name)
        ) {
          report(context, node, "invariant");
        }
      },
    };
  },
});
