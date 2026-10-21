# Shopify Agents + MCP

AI agents for Shopify stores, built on a **Model Context Protocol (MCP) server** that exposes a store's products, orders, customers, inventory and sales data as tools any AI assistant or agent can call.

One tool layer, two surfaces:

- **MCP server** (`src/mcp/`) — connect it to any MCP-compatible client and ask questions about the store in plain language.
- **Agent suite** (`src/agents/`) — four ready-made agents that use the same tools to do store-operations work on their own: catalog audits, order triage, inventory/reorder alerts and customer support answers, compiled into a daily briefing by an orchestrator.

Runs against a **real store** through the Shopify Admin GraphQL API, or in **demo mode** with a built-in sample store — no credentials needed to try it.

## Quick start

```bash
npm install

# 1. Full demo: exercises the MCP tools, then runs all agents
npm run demo

# 2. Just the agents' daily briefing
npm run agents

# 3. Run the MCP server (stdio) — normally launched by your MCP client
npm run mcp

# 4. Verify the MCP server end to end with a real MCP client
npm run verify-mcp

# Tests and type checking
npm test
npm run typecheck
```

With no environment variables set, everything runs in demo mode against the sample store "Northwind Living" (8 products, 6 orders, 5 customers — including a draft product, an out-of-stock bestseller and unfulfilled paid orders, so every agent has real work to report).

## Connect a real Shopify store

1. In Shopify admin: **Settings > Apps and sales channels > Develop apps > Create an app**.
2. Configure Admin API scopes: `read_products`, `write_products`, `read_orders`, `read_customers`, `read_inventory`.
3. Install the app and reveal the Admin API access token once.
4. Set the environment (copy `.env.example`):

```bash
export SHOPIFY_STORE_DOMAIN="my-store.myshopify.com"
export SHOPIFY_ADMIN_ACCESS_TOKEN="shpat_..."
# optional: SHOPIFY_API_VERSION=2025-01
```

The same code now runs live. The only write operation, `shopify_create_draft_product`, creates **draft** products only — it never publishes anything to the storefront on its own.

## Use with an MCP client

Build once (`npm run build`), then add the server to your MCP client's configuration:

```json
{
  "mcpServers": {
    "shopify": {
      "command": "node",
      "args": ["/path/to/shopify-agents-mcp/dist/mcp/server.js"],
      "env": {
        "SHOPIFY_STORE_DOMAIN": "my-store.myshopify.com",
        "SHOPIFY_ADMIN_ACCESS_TOKEN": "shpat_..."
      }
    }
  }
}
```

Omit the `env` block to explore with the demo store first.

## MCP tools

| Tool | What it does |
| --- | --- |
| `shopify_get_shop_info` | Store name, domain, email, currency, timezone |
| `shopify_list_products` | List products; filter by search term and status |
| `shopify_get_product` | Full product detail by ID or handle, incl. variants and stock |
| `shopify_create_draft_product` | Create a DRAFT product for review (never auto-publishes) |
| `shopify_list_orders` | List orders; filter by fulfillment / financial status |
| `shopify_get_order` | Full order detail by ID or order number (e.g. `#1042`) |
| `shopify_list_customers` | List customers with order counts and total spent |
| `shopify_get_low_stock` | Variants at or below a stock threshold, lowest first |
| `shopify_get_sales_summary` | Orders, gross sales, AOV and top products for the last N days |
| `shopify_search` | One search across products, orders and customers |

## Agents

| Agent | Job |
| --- | --- |
| **Catalog Agent** | Audits listings: missing descriptions/tags, SKUs, drafts stuck unpublished, active products out of stock; can draft product descriptions |
| **Orders Agent** | Morning triage: paid-but-unfulfilled queue (oldest first), high-value orders, pending payments, refunds |
| **Inventory Agent** | Low/out-of-stock report with reorder quantities based on the last 30 days of sales |
| **Support Agent** | Answers customer questions ("Where is my order?", stock, prices) from live store data; says so and offers escalation when it cannot find an answer |
| **Orchestrator** | Runs all agents and compiles one daily store briefing |

Example questions for the Support Agent (try them in the demo):

- "Where is my order #1042?"
- "Is the stoneware vase in stock?"
- "How much is the Belgian linen throw?"

## Project structure

```text
src/
  config.ts            Environment config; demo mode when no credentials
  shopify/
    types.ts           Shared store data types
    client.ts          Shopify Admin GraphQL client + demo-mode data service
    mock-data.ts       Built-in sample store for demo mode
  mcp/
    tools.ts           The 10 Shopify tools (single source of truth)
    server.ts          MCP server (stdio transport)
  agents/
    catalog-agent.ts   Listing audit + description drafting
    orders-agent.ts    Fulfillment triage
    inventory-agent.ts Low-stock + reorder suggestions
    support-agent.ts   Customer Q&A grounded in store data
    orchestrator.ts    Daily briefing across all agents
    run.ts             CLI: npm run agents
  demo.ts              CLI: npm run demo
scripts/
  verify-mcp.ts        Spawns the server and calls it as an MCP client
tests/
  shopify-agents-mcp.test.ts
docs/
  DEMO_GUIDE.md        A 5-minute walkthrough for showing this to a client
```

## How it is built

- TypeScript (strict), Node 20+, ESM
- `@modelcontextprotocol/sdk` for the MCP server, `zod` for tool input schemas
- Shopify Admin **GraphQL** API (2025-01) via `fetch` — no heavyweight SDK dependency
- `vitest` for tests; the suite runs entirely in demo mode, no network or store needed

## Roadmap ideas

- Fulfillment creation and tracking updates from the Orders Agent
- Discount and price-rule tools
- Webhook listener so agents react to new orders in real time
- HTTP/SSE transport for hosted MCP deployments

## License

MIT — see [LICENSE](LICENSE).

## Author

Saad Abdullah — full-stack developer (React, Django REST Framework, Node.js/TypeScript)
GitHub: [saadkhantareen](https://github.com/saadkhantareen)
