import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      exclude: ["src/HabiticaMcp.ts", "src/main.ts"],
      include: ["src/Greeting.ts", "src/habitica/HabiticaRoutes.ts"],
      thresholds: {
        branches: 100,
        functions: 100,
        lines: 100,
        statements: 100,
      },
    },
    exclude: ["dist/**", "node_modules/**"],
    include: ["test/**/*.test.ts"],
  },
});
