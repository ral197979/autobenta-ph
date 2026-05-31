# Ryderr MCP Server

An MCP (Model Context Protocol) server that exposes Ryderr marketplace data as callable tools for AI agents like Claude. Once connected, an AI agent can search inventory, inspect listings, pull dealer leads, and query platform analytics directly — no human copy-paste required.

---

## Available Tools

| Tool | Description | Key Parameters |
|---|---|---|
| `search_inventory` | Search active vehicle listings with filters | `make`, `model`, `year_min/max`, `price_min/max`, `fuel_type`, `transmission`, `city`, `condition`, `limit` |
| `get_listing` | Retrieve full details of a single listing | `id` (listing ID) |
| `get_dealer_leads` | Get buyer inquiries for a dealer | `dealer_id`, `status` (new/contacted/qualified/closed), `limit` |
| `get_lead` | Retrieve full details of a single lead | `id` (lead ID) |
| `get_dealer_analytics` | Performance stats for a dealer | `dealer_id` |
| `get_network_stats` | Platform-wide marketplace stats (admin) | none |

---

## Running Locally

From the `backend/` directory:

```bash
npm run mcp
```

Or directly:

```bash
node src/mcp/server.js
```

The server communicates over stdio. You should see on stderr:

```
Ryderr MCP server running on stdio
```

---

## Connecting to Claude Desktop

1. Open (or create) `~/Library/Application Support/Claude/claude_desktop_config.json`
2. Merge in the contents of `claude-desktop-config.json` (this directory), replacing the `DATABASE_URL` placeholder with your actual value
3. Restart Claude Desktop

The `ryderr` server will appear in Claude's tool list. You can then ask Claude things like:
- "Search for Toyota Fortuner listings under PHP 1.5M in Makati"
- "Show me all new leads for dealer ID abc123"
- "How many active listings does the platform have today?"

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string, e.g. `postgresql://user:pass@host:5432/dbname` |

The server inherits `.env` from the backend root if you load it explicitly, or you can set `DATABASE_URL` in the Claude Desktop config's `env` block (see `claude-desktop-config.json`).

---

## Testing

Run the server and send a raw MCP message to stdin to verify it responds:

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | node src/mcp/server.js
```

You should receive a JSON response listing all 6 tools.

Alternatively, use the MCP Inspector:

```bash
npx @modelcontextprotocol/inspector node src/mcp/server.js
```

---

## Future Tools

The following tools are planned for future implementation:

- `create_listing` — create a new vehicle listing
- `update_listing` — update price, status, or details on an existing listing
- `submit_inquiry` — submit a buyer inquiry on behalf of a user
- `get_financing_options` — return available financing tiers for a given listing price
