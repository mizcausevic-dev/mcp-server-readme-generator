# Changelog

## v0.1.0 — 2026-05-27

- Initial release: generate a human-readable Markdown README from an MCP `tools/list` snapshot.
- Per-tool sections with anchored headings + inputs tables. Type formatter handles `array<inner>`, `enum(…)`, primitives, default values.
- Optional enrichment from `server.json` (registry shape: name, version, license, repository, homepage).
- Optional enrichment from a directory of Tool Cards (mcp-tool-card-spec): surfaces 🟢🟡🟠🔴 side-effect class, _requires human approval_, _not reversible_, PII / secrets exposure, p50/p95 latency, per-call cost.
- Library API: `generateReadme(list, opts)` → Markdown string.
- CLI: `mcp-server-readme-generator <tools-list.json> [--server-json …] [--cards-dir …] [--sort] [--out FILE]`.
- Composes with `mcp-tools-snapshot` (input), `mcp-tool-card-spec` + `mcp-tool-card-generator` (per-tool cards), `mcp-tool-card-summary`, `mcp-tools-snapshot-stats`.
- Node 20/22 CI (lint, typecheck, coverage, build, demo, `npm audit`), AGPL-3.0-or-later, Dependabot.
