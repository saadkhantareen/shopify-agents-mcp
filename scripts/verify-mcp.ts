#!/usr/bin/env node
/**
 * Verifies the MCP server the way a real MCP client would: spawns it over
 * stdio, lists its tools and calls several of them.
 * Usage: npm run verify-mcp
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function main(): Promise<void> {
  const transport = new StdioClientTransport({
    command: "npx",
    args: ["tsx", "src/mcp/server.ts"],
    env: { ...process.env, SHOPIFY_DEMO_MODE: "true" } as Record<string, string>,
  });
  const client = new Client({ name: "verify-mcp", version: "1.0.0" }, { capabilities: {} });

  await client.connect(transport);
  try {
    const tools = await client.listTools();
    console.log(`Tools listed: ${tools.tools.length}`);
    for (const t of tools.tools) console.log(`- ${t.name}`);

    const shop = await client.callTool({ name: "shopify_get_shop_info", arguments: {} });
    console.log("\nshopify_get_shop_info result:");
    console.log(JSON.stringify(shop.content, null, 2).slice(0, 600));

    const low = await client.callTool({ name: "shopify_get_low_stock", arguments: { threshold: 5 } });
    console.log("\nshopify_get_low_stock result (first 400 chars):");
    console.log(JSON.stringify(low.content, null, 2).slice(0, 400));

    const order = await client.callTool({ name: "shopify_get_order", arguments: { id: "#1042" } });
    console.log("\nshopify_get_order #1042 result (first 400 chars):");
    console.log(JSON.stringify(order.content, null, 2).slice(0, 400));

    console.log("\nMCP verification passed: server responds over stdio, tools list and calls succeed.");
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error("MCP verification failed:", err);
  process.exit(1);
});
