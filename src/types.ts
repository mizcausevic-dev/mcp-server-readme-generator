// Generate a server-level README.md from an MCP `tools/list` snapshot,
// optionally enriched with `server.json` (the registry shape) and per-tool
// Tool Cards (mcp-tool-card-spec) for safety / cost / latency details.

export interface JsonSchema {
  type?: string;
  description?: string;
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema | JsonSchema[];
  required?: string[];
  enum?: unknown[];
  default?: unknown;
  format?: string;
  [key: string]: unknown;
}

export interface McpTool {
  name: string;
  description?: string;
  inputSchema?: JsonSchema;
}

export interface McpToolsListResult {
  tools: McpTool[];
}

/** Subset of an mcp-tool-card-spec safety block we surface in the README. */
export interface ToolCardSafety {
  side_effect_class?: "read" | "mutating" | "external" | "destructive";
  reversible?: boolean;
  rate_limited?: boolean;
  pii_exposure?: "none" | "low" | "medium" | "high";
  secrets_exposure?: string;
  human_approval_required?: boolean;
}

export interface ToolCard {
  tool: { name: string; version?: string; description?: string };
  safety?: ToolCardSafety;
  performance?: { p50_latency_ms?: number; p95_latency_ms?: number };
  cost?: { per_call_cost_usd?: number };
}

/** Server-level metadata (mirrors the MCP registry server.json shape). */
export interface ServerJson {
  name?: string;
  description?: string;
  version?: string;
  repository?: { url?: string };
  homepage?: string;
  license?: string;
}

export interface GenerateOptions {
  /** Optional registry metadata block. */
  server?: ServerJson;
  /** Per-tool Tool Cards keyed by tool name. */
  toolCards?: Record<string, ToolCard>;
  /** When true, sort tools alphabetically. Default false (preserve list order). */
  sort?: boolean;
  /** Heading anchor prefix (default "tool-"). */
  anchorPrefix?: string;
}
