import manifest from "../package.json" with { type: "json" };

/**
 * The manifest is the single source of truth for what the server reports over
 * MCP `initialize`. Hardcoding it here once let the advertised version drift
 * behind the published one, which every client could see and none could trust.
 */
export const serverInfo: {
  readonly name: string;
  readonly version: string;
} = {
  name: manifest.name,
  version: manifest.version,
};
