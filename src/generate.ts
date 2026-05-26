import type {
  GenerateOptions,
  JsonSchema,
  McpTool,
  McpToolsListResult,
  ServerJson,
  ToolCard
} from "./types.js";

/** Build a Markdown anchor slug from a tool name. */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Format a schema type (incl. arrays / enums) for the README table. */
function formatType(s: JsonSchema | undefined): string {
  if (!s) return "—";
  if (s.enum) return `enum(${(s.enum as unknown[]).slice(0, 6).map((v) => JSON.stringify(v)).join(", ")}${(s.enum as unknown[]).length > 6 ? ", …" : ""})`;
  if (s.type === "array") {
    const inner = !s.items ? "any" : Array.isArray(s.items) ? "tuple" : formatType(s.items as JsonSchema);
    return `array<${inner}>`;
  }
  return s.type ?? "any";
}

function defaultStr(v: unknown): string {
  if (v === undefined) return "";
  if (typeof v === "string") return `\`${JSON.stringify(v)}\``;
  return `\`${JSON.stringify(v)}\``;
}

function inputsTable(schema: JsonSchema | undefined): string {
  if (!schema || !schema.properties || Object.keys(schema.properties).length === 0) {
    return `_No input parameters._`;
  }
  const required = new Set(schema.required ?? []);
  const lines: string[] = [];
  lines.push(`| param | type | required? | default | description |`);
  lines.push(`|---|---|:---:|---|---|`);
  for (const [k, prop] of Object.entries(schema.properties)) {
    const req = required.has(k) ? "✓" : "—";
    const def = defaultStr((prop as JsonSchema).default);
    const desc = ((prop as JsonSchema).description ?? "").replace(/\n/g, " ");
    lines.push(`| \`${k}\` | \`${formatType(prop as JsonSchema)}\` | ${req} | ${def} | ${desc} |`);
  }
  return lines.join("\n");
}

function safetyBadge(card: ToolCard | undefined): string {
  const s = card?.safety;
  if (!s?.side_effect_class) return "";
  const icon: Record<NonNullable<ToolCardSafety["side_effect_class"]>, string> = {
    read: "🟢 read",
    mutating: "🟡 mutating",
    external: "🟠 external",
    destructive: "🔴 destructive"
  } as Record<NonNullable<ToolCardSafety["side_effect_class"]>, string>;
  const badges = [`**${icon[s.side_effect_class]}**`];
  if (s.human_approval_required) badges.push("requires human approval");
  if (s.reversible === false) badges.push("not reversible");
  if (s.pii_exposure && s.pii_exposure !== "none") badges.push(`PII: ${s.pii_exposure}`);
  if (s.secrets_exposure && s.secrets_exposure !== "none") badges.push(`secrets: ${s.secrets_exposure}`);
  return badges.join(" · ");
}

type ToolCardSafety = NonNullable<ToolCard["safety"]>;

function performanceBadge(card: ToolCard | undefined): string {
  const p = card?.performance;
  if (!p) return "";
  const parts: string[] = [];
  if (p.p50_latency_ms !== undefined) parts.push(`p50 ${p.p50_latency_ms}ms`);
  if (p.p95_latency_ms !== undefined) parts.push(`p95 ${p.p95_latency_ms}ms`);
  return parts.length ? `Performance: ${parts.join(" · ")}` : "";
}

function costBadge(card: ToolCard | undefined): string {
  const c = card?.cost;
  if (!c?.per_call_cost_usd) return "";
  return `Cost: ~$${c.per_call_cost_usd.toFixed(4)}/call`;
}

function tocBlock(tools: McpTool[], anchorPrefix: string): string {
  if (tools.length <= 1) return "";
  const lines: string[] = [`## Tools (${tools.length})`, ""];
  for (const t of tools) lines.push(`- [\`${t.name}\`](#${anchorPrefix}${slugify(t.name)})${t.description ? ` — ${t.description.split("\n")[0]}` : ""}`);
  return lines.join("\n");
}

function serverHeader(server: ServerJson | undefined, tools: McpTool[]): string {
  const lines: string[] = [];
  const title = server?.name ?? "MCP Server";
  lines.push(`# ${title}`);
  lines.push("");
  if (server?.description) lines.push(server.description);
  const meta: string[] = [];
  if (server?.version) meta.push(`**Version:** ${server.version}`);
  if (server?.license) meta.push(`**License:** ${server.license}`);
  if (server?.repository?.url) meta.push(`**Repo:** ${server.repository.url}`);
  if (server?.homepage) meta.push(`**Homepage:** ${server.homepage}`);
  if (meta.length) {
    lines.push("");
    lines.push(meta.join(" · "));
  }
  lines.push("");
  lines.push(`This server exposes **${tools.length}** tool${tools.length === 1 ? "" : "s"} over MCP.`);
  return lines.join("\n");
}

function toolBlock(tool: McpTool, card: ToolCard | undefined, anchorPrefix: string): string {
  const lines: string[] = [];
  lines.push(`### <a id="${anchorPrefix}${slugify(tool.name)}"></a>\`${tool.name}\``);
  lines.push("");
  if (tool.description) lines.push(tool.description);

  const badges = [safetyBadge(card), performanceBadge(card), costBadge(card)].filter(Boolean);
  if (badges.length) {
    lines.push("");
    lines.push(badges.join("  ·  "));
  }

  lines.push("");
  lines.push(`**Inputs**`);
  lines.push("");
  lines.push(inputsTable(tool.inputSchema));
  return lines.join("\n");
}

export function generateReadme(list: McpToolsListResult, opts: GenerateOptions = {}): string {
  if (!list || !Array.isArray(list.tools)) {
    throw new Error("tools/list result must have a tools array");
  }
  const tools = opts.sort ? [...list.tools].sort((a, b) => a.name.localeCompare(b.name)) : list.tools;
  const anchorPrefix = opts.anchorPrefix ?? "tool-";

  const sections: string[] = [];
  sections.push(serverHeader(opts.server, tools));
  const toc = tocBlock(tools, anchorPrefix);
  if (toc) sections.push(toc);
  for (const t of tools) {
    sections.push(toolBlock(t, opts.toolCards?.[t.name], anchorPrefix));
  }
  return sections.join("\n\n").trimEnd() + "\n";
}
