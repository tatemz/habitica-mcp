/** Diagnostics go to stderr; stdout belongs to the MCP protocol. */
export const failPolicy = (message: string): never => {
  process.stderr.write(`${message}\n`);
  process.exit(1);
};

export const reportViolations = (label: string, violations: ReadonlyArray<string>): void => {
  if (violations.length > 0) {
    failPolicy([`${label}:`, ...violations].join("\n"));
  }
};
