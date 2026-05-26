# Security Policy

`mcp-server-readme-generator` is a pure-transform library and CLI: it reads JSON files and emits Markdown. No network listener, no remote fetch, no execution of user-supplied code, no MCP CLI invocation.

The input may include internal tool names and `inputSchema` definitions that are sensitive in your environment. The Markdown output includes those names verbatim — be deliberate about where you publish the rendered README.

## Supported versions

Only the latest tagged release is supported.

## Reporting a vulnerability

Please use GitHub Security Advisories for private disclosure:

- [Open a security advisory](https://github.com/mizcausevic-dev/mcp-server-readme-generator/security/advisories/new)

Do not file public issues for security reports.
