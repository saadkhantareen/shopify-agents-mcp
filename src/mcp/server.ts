#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig } from "../config.js";
import { ShopifyClient } from "../shopify/client.js";
import { TOOLS } from "./tools.js";

/**
 * Shopify MCP server (stdio transport).
 *
 * Configure in any MCP client, for example:
 * {
 *   "mcpServers": {
 *     "shopify": {
 *       "command": "node",
 *       "args": ["dist/mcp/server.js"],
 *       "env": {
 *         "SHOPIFY_STORE_DOMAIN": "my-store.myshopify.com",
 *         "SHOPIFY_ADMIN_ACCESS_TOKEN": "shpat_..."
 *       }
 *     }
 *   }
 * }
 *
 * With no env vars set, the server runs against the built-in demo store.
 */
async function main(): Promise<void> {
  const config = loadConfig();
  const client = new ShopifyClient(config);

  const server = new McpServer({
    name: "shopify-agents-mcp",
    version: "1.0.0",
  });

  for (const tool of TOOLS) {
    server.tool(tool.name, tool.description, tool.schema, async (args) => {
      try {
        const result = await tool.handler(client, args as Record<string, unknown>);
        return {
          content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
        };
      } catch (err) {
        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text: err instanceof Error ? err.message : String(err),
            },
          ],
        };
      }
    });
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(
    `shopify-agents-mcp running on stdio (${config.demoMode ? "demo mode: sample store data" : `live store: ${config.storeDomain}`})`,
  );
}

main().catch((err) => {
  console.error("Fatal error starting MCP server:", err);
  process.exit(1);
});
