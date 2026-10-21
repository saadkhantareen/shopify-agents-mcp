# Demo guide — showing Shopify Agents + MCP in 5 minutes

Everything below runs with no Shopify account and no API key (demo mode,
sample store data). To run it live against a real store, set the two
environment variables in `.env.example` first — nothing else changes.

## 1. Setup (30 seconds)

```bash
npm install
```

## 2. The one-command demo (2 minutes)

```bash
npm run demo
```

What you will see, in order:

1. The 10 MCP tools the server exposes.
2. Live tool calls: shop info, product list, low-stock report, 30-day sales
   summary, and a new DRAFT product being created safely (never published).
3. The Support Agent answering a real customer question ("Where is my order
   #1042?") from store data.
4. The full daily briefing from all four agents.

Talking points:

- The MCP tools are the only way anything touches store data. Agents, chat
  assistants and automations all go through the same audited layer.
- The only write tool creates drafts, so nothing reaches the storefront
  without a human review.

## 3. The agent briefing on its own (1 minute)

```bash
npm run agents
```

- Catalog Agent finds: a product with no description or tags, a finished
  product stuck in DRAFT, and an active product that is out of stock.
- Orders Agent queues the two paid orders waiting to ship, oldest first, and
  flags the pending payment on the out-of-stock board.
- Inventory Agent lists the out-of-stock and low-stock variants and suggests
  reorder quantities from the last 30 days of sales.
- Support Agent answers sample customer questions, and honestly says it
  cannot find order #9999 instead of inventing a status.

## 4. Prove the MCP server is real (1 minute)

```bash
npm run verify-mcp
```

This spawns the server over stdio exactly like an MCP client would, lists
its tools and calls three of them. Then connect it to any MCP-compatible
client using the JSON snippet in the README and ask the store questions in
plain language, for example:

- "Which products are running low on stock?"
- "Show me unpaid or unfulfilled orders."
- "Who are my top customers by total spent?"
- "Create a draft product for a scented reed diffuser at $39."

## 5. Tests (30 seconds)

```bash
npm test
```

The full suite (client, tool layer, all four agents) runs in demo mode with
no network access.
