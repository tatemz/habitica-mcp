import { Layer } from "effect";
import { describe, expect, it } from "vitest";

/**
 * Prompt and resource registrations run at module scope, where a bad declaration
 * throws on import rather than failing an assertion. Importing inside the test
 * turns that crash into a normal failure, which is what keeps a broken
 * registration from looking like a passing suite that simply loaded nothing.
 */
describe("declaration modules construct without throwing", () => {
  it("registers three prompt layers", async () => {
    const prompts = await import("../src/prompts/HabiticaPrompts.js");

    expect(Object.entries(prompts).map(([name, value]) => [name, Layer.isLayer(value)])).toEqual([
      ["DailyPlanningPrompt", true],
      ["TaskReviewPrompt", true],
      ["HabitCheckInPrompt", true],
    ]);
  });

  it("registers two static resources and one resource template", async () => {
    const resources = await import("../src/resources/HabiticaResources.js");

    expect(Object.entries(resources).map(([name, value]) => [name, Layer.isLayer(value)])).toEqual([
      ["CapabilitiesResource", true],
      ["TaskTemplateResource", true],
      ["TaskResourceTemplate", true],
    ]);
  });

  it("composes the toolkit and gateway layers", async () => {
    const mcp = await import("../src/HabiticaMcp.js");

    expect([Layer.isLayer(mcp.HabiticaMcpParts), Layer.isLayer(mcp.HabiticaLiveLayer)]).toEqual([
      true,
      true,
    ]);
  });
});
