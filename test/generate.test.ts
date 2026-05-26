import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { generateReadme } from "../src/generate.js";
import type { McpToolsListResult, ServerJson, ToolCard } from "../src/types.js";

const here = fileURLToPath(new URL(".", import.meta.url));

function loadFixture<T>(name: string): T {
  return JSON.parse(readFileSync(`${here}/../fixtures/${name}`, "utf8")) as T;
}

function loadCards(): Record<string, ToolCard> {
  const dir = `${here}/../fixtures/cards`;
  const out: Record<string, ToolCard> = {};
  for (const entry of readdirSync(dir)) {
    if (!entry.endsWith(".json")) continue;
    const card = JSON.parse(readFileSync(`${dir}/${entry}`, "utf8")) as ToolCard;
    if (card.tool?.name) out[card.tool.name] = card;
  }
  return out;
}

describe("generateReadme", () => {
  it("emits a server header with the title and description", () => {
    const list = loadFixture<McpToolsListResult>("tools-list.json");
    const server = loadFixture<ServerJson>("server.json");
    const md = generateReadme(list, { server });
    expect(md).toContain("# research-mcp");
    expect(md).toContain("Research workbench MCP server");
    expect(md).toContain("**Version:** 1.4.0");
  });

  it("emits a TOC when there are 2+ tools", () => {
    const md = generateReadme(loadFixture<McpToolsListResult>("tools-list.json"));
    expect(md).toContain("## Tools (4)");
    expect(md).toContain("[`search-vectorstore`]");
  });

  it("emits a per-tool section with anchored heading + inputs table", () => {
    const md = generateReadme(loadFixture<McpToolsListResult>("tools-list.json"));
    expect(md).toContain(`<a id="tool-search-vectorstore"></a>`);
    expect(md).toContain("| param | type | required? | default | description |");
    expect(md).toMatch(/\| `query` \| `string` \| ✓ \| /);
    expect(md).toMatch(/\| `top_k` \| `integer` \| — \| `10` \|/);
  });

  it("formats enum types at the top level of inputSchema", () => {
    const md = generateReadme({
      tools: [
        {
          name: "pick",
          inputSchema: {
            type: "object",
            properties: { namespace: { type: "string", enum: ["public", "internal"] } }
          }
        }
      ]
    });
    expect(md).toContain(`enum(`);
    expect(md).toContain(`"public"`);
  });

  it("emits 'No input parameters.' when inputSchema has no properties", () => {
    const md = generateReadme(loadFixture<McpToolsListResult>("tools-list.json"));
    expect(md).toContain("_No input parameters._");
  });

  it("surfaces safety badges from tool cards", () => {
    const md = generateReadme(loadFixture<McpToolsListResult>("tools-list.json"), { toolCards: loadCards() });
    expect(md).toContain("🔴 destructive");
    expect(md).toContain("requires human approval");
    expect(md).toContain("not reversible");
    expect(md).toContain("PII: medium");
    expect(md).toContain("🟢 read");
  });

  it("surfaces performance + cost badges when present", () => {
    const md = generateReadme(loadFixture<McpToolsListResult>("tools-list.json"), { toolCards: loadCards() });
    expect(md).toContain("p50 90ms");
    expect(md).toContain("p95 400ms");
    expect(md).toContain("Cost: ~$0.0001/call");
  });

  it("respects --sort", () => {
    const md = generateReadme(loadFixture<McpToolsListResult>("tools-list.json"), { sort: true });
    const order = md.match(/<a id="tool-([^"]+)"/g)?.map((s) => s.replace(/<a id="tool-|"$/g, "")) ?? [];
    const sorted = [...order].sort();
    expect(order).toEqual(sorted);
  });

  it("uses custom anchorPrefix", () => {
    const md = generateReadme(loadFixture<McpToolsListResult>("tools-list.json"), { anchorPrefix: "t-" });
    expect(md).toContain(`<a id="t-search-vectorstore"></a>`);
  });

  it("throws on malformed input", () => {
    expect(() => generateReadme({} as McpToolsListResult)).toThrow();
    expect(() => generateReadme(null as unknown as McpToolsListResult)).toThrow();
  });

  it("omits TOC when only one tool", () => {
    const md = generateReadme({ tools: [{ name: "solo", description: "one tool" }] });
    expect(md).not.toContain("## Tools (");
    expect(md).toContain(`<a id="tool-solo"></a>`);
  });

  it("includes a 'this server exposes N tools' line", () => {
    expect(generateReadme({ tools: [{ name: "a" }] })).toContain("exposes **1** tool ");
    expect(generateReadme({ tools: [{ name: "a" }, { name: "b" }] })).toContain("exposes **2** tools");
  });

  it("renders array types with inner item type", () => {
    const md = generateReadme({
      tools: [
        {
          name: "tags",
          inputSchema: {
            type: "object",
            properties: { tags: { type: "array", items: { type: "string" } } }
          }
        }
      ]
    });
    expect(md).toContain("`array<string>`");
  });

  it("renders array with no items as array<any>", () => {
    const md = generateReadme({
      tools: [
        { name: "x", inputSchema: { type: "object", properties: { a: { type: "array" } } } }
      ]
    });
    expect(md).toContain("`array<any>`");
  });

  it("uses external server.json fields when supplied", () => {
    const md = generateReadme(loadFixture<McpToolsListResult>("tools-list.json"), {
      server: loadFixture<ServerJson>("server.json")
    });
    expect(md).toContain("**License:** AGPL-3.0-or-later");
    expect(md).toContain("**Repo:** https://github.com/example/research-mcp");
  });

  it("does not crash when a card has no safety block", () => {
    const cards: Record<string, ToolCard> = { summarize: { tool: { name: "summarize" } } };
    const md = generateReadme(loadFixture<McpToolsListResult>("tools-list.json"), { toolCards: cards });
    expect(md).toContain("summarize");
  });
});
