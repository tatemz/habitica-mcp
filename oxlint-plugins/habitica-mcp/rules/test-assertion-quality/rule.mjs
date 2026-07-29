import { staticMemberName, walkAst } from "../shared/ast.mjs";
import { normalizedFilename } from "../shared/context.mjs";
import { testPath } from "../shared/paths.mjs";
import { createRule } from "../shared/rule.mjs";

export const testAssertionQualityRuleName = "test-assertion-quality";

/**
 * These matchers pass for almost any value, so a mutant that changes the value
 * still satisfies them. They are the assertions that make a green suite lie.
 */
const weakMatchers = new Set(["toBeDefined", "toBeTruthy", "toBeFalsy"]);

const isIdentifier = (node, name) => node?.type === "Identifier" && node.name === name;

const innerExpression = (expression) => {
  if (expression?.type === "CallExpression") {
    return expression.callee;
  }
  if (expression?.type === "MemberExpression") {
    return expression.object;
  }
  return expression?.type === "TSAsExpression" || expression?.type === "TSNonNullExpression"
    ? expression.expression
    : undefined;
};

const chainStartsWithExpect = (expression) =>
  isIdentifier(expression, "expect") ||
  (innerExpression(expression) !== undefined && chainStartsWithExpect(innerExpression(expression)));

const matcherName = (node) =>
  node.callee?.type === "MemberExpression" && node.callee.computed === false
    ? staticMemberName(node.callee)
    : undefined;

const isExpectMatcherCall = (node) =>
  node.type === "CallExpression" &&
  node.callee?.type === "MemberExpression" &&
  chainStartsWithExpect(node.callee.object);

const chainHasNot = (expression) =>
  staticMemberName(expression) === "not" ||
  (innerExpression(expression) !== undefined && chainHasNot(innerExpression(expression)));

/**
 * `toThrow()` only proves something threw, not that the right contract failed.
 * `.not.toThrow()` is exempt: it pins that a valid payload decodes cleanly, and
 * there is no argument that would sharpen it.
 */
const isBareToThrow = (node, name) =>
  name === "toThrow" && node.arguments.length === 0 && !chainHasNot(node.callee.object);

const isUsefulAssertion = (node) => {
  const name = matcherName(node);
  return (
    name !== undefined &&
    isExpectMatcherCall(node) &&
    !weakMatchers.has(name) &&
    !isBareToThrow(node, name)
  );
};

const callbackBody = (argument) =>
  argument?.type === "ArrowFunctionExpression" || argument?.type === "FunctionExpression"
    ? argument.body
    : undefined;

const testDetails = (node) => {
  const callee = node.callee;
  const name =
    callee?.type === "Identifier"
      ? callee.name
      : callee?.type === "MemberExpression"
        ? staticMemberName(callee)
        : undefined;

  if (name !== "it" && name !== "test") {
    return undefined;
  }

  const body = callbackBody(node.arguments[1]);
  const label =
    node.arguments[0]?.type === "Literal" && typeof node.arguments[0].value === "string"
      ? node.arguments[0].value
      : "<dynamic test name>";

  return body === undefined ? undefined : { body, label };
};

const hasUsefulAssertion = (body) => {
  let found = false;
  walkAst(body, (child) => {
    if (child.type === "CallExpression" && isUsefulAssertion(child)) {
      found = true;
    }
  });
  return found;
};

export const testAssertionQuality = createRule({
  description: "Require exact, mutation-killing assertions in tests.",
  messages: {
    bareThrow:
      "Replace bare toThrow() with an expected error contract, e.g. toThrow(/field/) or a _tag assertion.",
    missingAssertion: 'Test "{{label}}" has no useful assertion.',
    weakMatcher: "Replace weak matcher {{matcher}} with an exact behavioural assertion.",
  },
  create(context) {
    if (!testPath(normalizedFilename(context))) {
      return {};
    }

    return {
      CallExpression(node) {
        const matcher = matcherName(node);

        if (matcher !== undefined && isExpectMatcherCall(node)) {
          if (weakMatchers.has(matcher)) {
            context.report({ data: { matcher }, messageId: "weakMatcher", node });
          }
          if (isBareToThrow(node, matcher)) {
            context.report({ messageId: "bareThrow", node });
          }
        }

        const details = testDetails(node);
        if (details !== undefined && !hasUsefulAssertion(details.body)) {
          context.report({
            data: { label: details.label },
            messageId: "missingAssertion",
            node,
          });
        }
      },
    };
  },
});
