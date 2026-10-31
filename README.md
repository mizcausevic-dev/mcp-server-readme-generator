# mcp-server-readme-generator

Generate a human-readable **Markdown README** from an MCP `tools/list` snapshot. Optionally enrich with `server.json` (the registry shape) and per-tool [Tool Cards](https://github.com/mizcausevic-dev/mcp-tool-card-spec) to surface safety class, PII / secrets exposure, reversibility, human-approval, performance, and per-call cost.

Pure offline transform — no `mcp` CLI, no cluster, no remote fetch.

> **Retirement notice, 2026-10-30:** This source-only utility is being prepared for reversible, read-only GitHub archival. Check the repository's archive badge for its current state. The full-server `tools/list` renderer and its `server.json` and Tool Card enrichment remain in this source; the Tool Card README generator covers individual cards and is not a drop-in replacement. The public npm registry returned `E404` for `mcp-server-readme-generator`, `@mizcausevic-dev/mcp-server-readme-generator`, and `@kineticgain/mcp-server-readme-generator` on this date. The old `npx` command is unavailable. External catalog links exist; private or unindexed consumers were not verified.

Version 0.1.0 source is configured for Node 20/22 CI. Git history and source remain available after archival; a demonstrated consumer need can justify restoring maintenance.

## Run from source

```bash
git clone https://github.com/mizcausevic-dev/mcp-server-readme-generator.git
cd mcp-server-readme-generator
npm ci
npm run build
node dist/cli.js fixtures/tools-list.json --server-json fixtures/server.json --cards-dir fixtures/cards --sort
```

The locked source-build toolchain currently has unresolved npm audit findings. Run `npm ci` in an isolated checkout; do not use this repository as a production dependency while it is unmaintained.

Replace the fixture paths with your own snapshot, registry manifest, and Tool Card directory. The CLI accepts `--out` to write the generated Markdown to a file.

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
// From this checkout after `npm run build`:
import { generateReadme } from "./dist/index.js";

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
- [**`mcp-tool-card-fleet-summary`**](https://github.com/mizcausevic-dev/mcp-tool-card-fleet-summary) — fleet-level posture across the same cards.
- [**`mcp-tools-snapshot-stats`**](https://github.com/mizcausevic-dev/mcp-tools-snapshot-stats) — sibling: statistical analyzer over the same `tools/list`.

## Develop

```
npm install
npm run lint && npm run typecheck && npm run coverage && npm run build
npm run demo
```

## License

[AGPL-3.0-or-later](LICENSE)
