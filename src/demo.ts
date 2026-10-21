#!/usr/bin/env node
import { loadConfig } from "./config.js";
import { callTool, TOOLS } from "./mcp/tools.js";
import { ShopifyClient } from "./shopify/client.js";
import { runDailyBriefing } from "./agents/orchestrator.js";
import { supportAgent } from "./agents/support-agent.js";

/**
 * End-to-end demo (npm run demo). No Shopify store or API key needed:
 * with no credentials configured, everything runs against the built-in
 * sample store. The demo exercises the MCP tool layer exactly as an MCP
 * client would, then runs the agent suite.
 */
async function main(): Promise<void> {
  const client = new ShopifyClient(loadConfig());

  console.log("=".repeat(72));
  console.log("SHOPIFY AGENTS + MCP - DEMO");
  console.log(`Mode: ${client.demoMode ? "DEMO (sample store data, no credentials needed)" : "LIVE"}`);
  console.log("=".repeat(72));

  console.log("\n--- 1. MCP tools available ---");
  for (const t of TOOLS) console.log(`- ${t.name}: ${t.description}`);

  console.log("\n--- 2. Calling MCP tools ---");
  const shop = await callTool(client, "shopify_get_shop_info");
  console.log("\nshopify_get_shop_info ->", JSON.stringify(shop));

  const products = (await callTool(client, "shopify_list_products", { limit: 5 })) as Array<{ title: string; status: string }>;
  console.log(`\nshopify_list_products (limit 5) -> ${products.length} products:`);
  for (const p of products) console.log(`  - ${p.title} [${p.status}]`);

  const lowStock = (await callTool(client, "shopify_get_low_stock", { threshold: 5 })) as Array<{ productTitle: string; inventoryQuantity: number }>;
  console.log(`\nshopify_get_low_stock (threshold 5) -> ${lowStock.length} variant(s):`);
  for (const i of lowStock) console.log(`  - ${i.productTitle}: ${i.inventoryQuantity} left`);

  const summary = (await callTool(client, "shopify_get_sales_summary", { days: 30 })) as { orderCount: number; grossSales: number };
  console.log(`\nshopify_get_sales_summary (30 days) -> ${summary.orderCount} orders, gross ${summary.grossSales}`);

  const draft = (await callTool(client, "shopify_create_draft_product", {
    title: "Scented Reed Diffuser - Fig & Vetiver",
    description: "A flame-free reed diffuser with fig and vetiver, 100 ml, lasts up to 10 weeks.",
    vendor: "Northwind Living",
    productType: "Home Fragrance",
    tags: ["home-fragrance", "new"],
    price: "39.00",
    sku: "REED-FV-1",
  })) as { title: string; status: string; handle: string };
  console.log(`\nshopify_create_draft_product -> created "${draft.title}" [${draft.status}] handle=${draft.handle}`);

  console.log("\n--- 3. Support Agent answering a customer ---");
  const answer = await supportAgent.answer(client, "Where is my order #1042?");
  console.log(`Customer: ${answer.question}`);
  console.log(`Agent:    ${answer.answer}`);

  console.log("\n--- 4. Full agent suite: daily briefing ---");
  console.log(await runDailyBriefing(client));

  console.log("\nDemo complete. Connect a real store by setting SHOPIFY_STORE_DOMAIN");
  console.log("and SHOPIFY_ADMIN_ACCESS_TOKEN (see .env.example).");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
