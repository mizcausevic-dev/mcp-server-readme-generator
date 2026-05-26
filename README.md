# mcp-server-readme-generator

Generate a human-readable **Markdown README** from an MCP `tools/list` snapshot. Optionally enrich with `server.json` (the registry shape) and per-tool [Tool Cards](https://github.com/mizcausevic-dev/mcp-tool-card-spec) to surface safety class, PII / secrets exposure, reversibility, human-approval, performance, and per-call cost.

Pure offline transform — no `mcp` CLI, no cluster, no remote fetch.

> Status: v0.1.0 — Node 20/22 supported, library + CLI.

## CLI

```
npx mcp-server-readme-generator <tools-list.json>
    [--server-json server.json]
    [--cards-dir ./cards]
    [--sort]
    [--out README.md]
```

- `<tools-list.json>` — the MCP `tools/list` result (typically captured by [`mcp-tools-snapshot`](https://github.com/mizcausevic-dev/mcp-tools-snapshot)).
- `--server-json` — optional registry header (name, version, license, repo, homepage).
- `--cards-dir` — optional directory of `{tool.name}.json` Tool Cards.
- `--sort` — sort tools alphabetically (default: preserve `tools/list` order).
- `--out` — write to a file instead of stdout.

## What the output looks like

Without enrichment, you get a header + per-tool sections with anchored headings + inputs tables.

With a `--cards-dir` supplied, each tool also surfaces:

- 🟢 read / 🟡 mutating / 🟠 external / 🔴 destructive
- _requires human approval_
- _not reversible_
- _PII: low/medium/high_
- _secrets: reads_secret_material / handles_keys / …_
- Performance: p50 / p95 latency
- Cost: per-call USD

## Library

```ts
import { generateReadme } from "mcp-server-readme-generator";

const md = generateReadme(toolsList, {
  server: { name: "research-mcp", version: "1.4.0", license: "AGPL-3.0-or-later" },
  toolCards: { "delete-document": deleteDocumentCard, "search-vectorstore": searchCard },
  sort: true
});
```

## Composes with

- [**`mcp-tools-snapshot`**](https://github.com/mizcausevic-dev/mcp-tools-snapshot) — captures the `tools/list` JSON.
- [**`mcp-tool-card-spec`**](https://github.com/mizcausevic-dev/mcp-tool-card-spec) — the safety/disclosure card schema this surfaces.
- [**`mcp-tool-card-generator`**](https://github.com/mizcausevic-dev/mcp-tool-card-generator) — produces those cards.
- [**`mcp-tool-card-summary`**](https://github.com/mizcausevic-dev/mcp-tool-card-summary) — fleet-level posture across the same cards.
- [**`mcp-tools-snapshot-stats`**](https://github.com/mizcausevic-dev/mcp-tools-snapshot-stats) — sibling: statistical analyzer over the same `tools/list`.

## Develop

```
npm install
npm run lint && npm run typecheck && npm run coverage && npm run build
npm run demo
```

## License

[AGPL-3.0-or-later](LICENSE)
