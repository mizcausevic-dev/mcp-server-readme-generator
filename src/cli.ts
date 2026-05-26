#!/usr/bin/env node
import { readFileSync, readdirSync, statSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { generateReadme } from "./generate.js";
import type { GenerateOptions, McpToolsListResult, ServerJson, ToolCard } from "./types.js";

interface Args {
  toolsList?: string;
  serverJson?: string;
  cardsDir?: string;
  out?: string;
  sort: boolean;
  help: boolean;
}

function parseArgs(argv: string[]): Args {
  const args: Args = { sort: false, help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "-h" || a === "--help") args.help = true;
    else if (a === "--server-json") args.serverJson = argv[++i];
    else if (a === "--cards-dir") args.cardsDir = argv[++i];
    else if (a === "--out") args.out = argv[++i];
    else if (a === "--sort") args.sort = true;
    else if (!a.startsWith("-")) args.toolsList = a;
    else throw new Error(`Unknown option: ${a}`);
  }
  return args;
}

const HELP = `mcp-server-readme-generator — emit a Markdown README from an MCP tools/list snapshot

Usage:
  mcp-server-readme-generator <tools-list.json>
      [--server-json server.json]
      [--cards-dir ./cards]
      [--sort]
      [--out README.md]

\`<tools-list.json>\` is the MCP tools/list result shape (typically captured by
mcp-tools-snapshot). Optional enrichment:
  - --server-json     adds the registry header (name, version, license, repo)
  - --cards-dir       directory of {tool.name}.json Tool Cards (mcp-tool-card-spec)
                      — surfaces side-effect class, PII / secrets exposure,
                      reversibility, human-approval, performance, cost.

Exit codes:
  0 — README emitted
  2 — usage / I/O error`;

function loadCards(dir: string): Record<string, ToolCard> {
  const out: Record<string, ToolCard> = {};
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    if (!entry.endsWith(".json")) continue;
    const full = join(dir, entry);
    if (!statSync(full).isFile()) continue;
    const card = JSON.parse(readFileSync(full, "utf8")) as ToolCard;
    if (card.tool?.name) out[card.tool.name] = card;
  }
  return out;
}

export function run(argv: string[]): number {
  let args: Args;
  try {
    args = parseArgs(argv);
  } catch (e) {
    process.stderr.write(`${(e as Error).message}\n`);
    return 2;
  }
  if (args.help || !args.toolsList) {
    process.stdout.write(`${HELP}\n`);
    return args.help ? 0 : 2;
  }

  let list: McpToolsListResult;
  try {
    list = JSON.parse(readFileSync(args.toolsList, "utf8")) as McpToolsListResult;
  } catch (e) {
    process.stderr.write(`error reading tools/list: ${(e as Error).message}\n`);
    return 2;
  }

  const opts: GenerateOptions = { sort: args.sort };
  if (args.serverJson) {
    try {
      opts.server = JSON.parse(readFileSync(args.serverJson, "utf8")) as ServerJson;
    } catch (e) {
      process.stderr.write(`error reading --server-json: ${(e as Error).message}\n`);
      return 2;
    }
  }
  if (args.cardsDir) {
    try {
      opts.toolCards = loadCards(args.cardsDir);
    } catch (e) {
      process.stderr.write(`error reading --cards-dir: ${(e as Error).message}\n`);
      return 2;
    }
  }

  let md: string;
  try {
    md = generateReadme(list, opts);
  } catch (e) {
    process.stderr.write(`${(e as Error).message}\n`);
    return 2;
  }

  if (args.out) writeFileSync(args.out, md, "utf8");
  else process.stdout.write(md);
  return 0;
}

const invokedDirectly =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  try {
    process.exit(run(process.argv.slice(2)));
  } catch (e) {
    process.stderr.write(`fatal: ${(e as Error).message}\n`);
    process.exit(2);
  }
}
