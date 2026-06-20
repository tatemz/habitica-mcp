import {
  effectTryPromiseRequiresCatch,
  effectTryPromiseRequiresCatchRuleName,
} from "./rules/effect-trypromise-requires-catch/rule.mjs";
import {
  mcpStdoutIsProtocol,
  mcpStdoutIsProtocolRuleName,
} from "./rules/mcp-stdout-is-protocol/rule.mjs";
import {
  mutatingToolNameIsExplicit,
  mutatingToolNameIsExplicitRuleName,
} from "./rules/mutating-tool-name-is-explicit/rule.mjs";
import {
  noFallibleModuleScopeMake,
  noFallibleModuleScopeMakeRuleName,
} from "./rules/no-fallible-module-scope-make/rule.mjs";
import {
  noGenericRouteStringsInTools,
  noGenericRouteStringsInToolsRuleName,
} from "./rules/no-generic-route-strings-in-tools/rule.mjs";
import {
  noLowercaseEffectOrder,
  noLowercaseEffectOrderRuleName,
} from "./rules/no-lowercase-effect-order/rule.mjs";
import {
  noOptionReturningFilterMap,
  noOptionReturningFilterMapRuleName,
} from "./rules/no-option-returning-filter-map/rule.mjs";
import {
  noRawHabiticaCredentials,
  noRawHabiticaCredentialsRuleName,
} from "./rules/no-raw-habitica-credentials/rule.mjs";
import {
  noUncheckedJsonBoundary,
  noUncheckedJsonBoundaryRuleName,
} from "./rules/no-unchecked-json-boundary/rule.mjs";
import {
  noUntypedToolSuccess,
  noUntypedToolSuccessRuleName,
} from "./rules/no-untyped-tool-success/rule.mjs";
import {
  toolsDependOnGatewayPort,
  toolsDependOnGatewayPortRuleName,
} from "./rules/tools-depend-on-gateway-port/rule.mjs";

export const rules = {
  [effectTryPromiseRequiresCatchRuleName]: effectTryPromiseRequiresCatch,
  [mcpStdoutIsProtocolRuleName]: mcpStdoutIsProtocol,
  [mutatingToolNameIsExplicitRuleName]: mutatingToolNameIsExplicit,
  [noFallibleModuleScopeMakeRuleName]: noFallibleModuleScopeMake,
  [noGenericRouteStringsInToolsRuleName]: noGenericRouteStringsInTools,
  [noLowercaseEffectOrderRuleName]: noLowercaseEffectOrder,
  [noOptionReturningFilterMapRuleName]: noOptionReturningFilterMap,
  [noRawHabiticaCredentialsRuleName]: noRawHabiticaCredentials,
  [noUncheckedJsonBoundaryRuleName]: noUncheckedJsonBoundary,
  [noUntypedToolSuccessRuleName]: noUntypedToolSuccess,
  [toolsDependOnGatewayPortRuleName]: toolsDependOnGatewayPort,
};

export default {
  meta: { name: "habitica-mcp" },
  rules,
};
