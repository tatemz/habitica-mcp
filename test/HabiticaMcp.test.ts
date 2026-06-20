import { describe, expect, it } from "vitest";
import { greetingMessage } from "../src/Greeting.js";

describe("greetingMessage", () => {
  it("returns the deterministic hello-world response", () => {
    expect(greetingMessage("Tatemz")).toBe("Hello, Tatemz. Habitica MCP is alive.");
  });
});
