import { describe, expect, it } from "vitest";
import { loadConfig } from "../src/config.js";
import { callTool, TOOLS } from "../src/mcp/tools.js";
import { ShopifyClient } from "../src/shopify/client.js";
import { catalogAgent } from "../src/agents/catalog-agent.js";
import { inventoryAgent } from "../src/agents/inventory-agent.js";
import { ordersAgent } from "../src/agents/orders-agent.js";
import { supportAgent } from "../src/agents/support-agent.js";

const client = new ShopifyClient(loadConfig({ SHOPIFY_DEMO_MODE: "true" } as NodeJS.ProcessEnv));

describe("demo-mode Shopify client", () => {
  it("returns the demo shop", async () => {
    const shop = await client.getShop();
    expect(shop.name).toBe("Northwind Living");
    expect(client.demoMode).toBe(true);
  });

  it("lists products and filters drafts", async () => {
    const all = await client.listProducts({ limit: 250 });
    expect(all.length).toBeGreaterThanOrEqual(8);
    const drafts = await client.listProducts({ status: "DRAFT" });
    expect(drafts.every((p) => p.status === "DRAFT")).toBe(true);
    expect(drafts.length).toBeGreaterThanOrEqual(1);
  });

  it("finds the out-of-stock product via low stock", async () => {
    const low = await client.getLowStock(5);
    expect(low.some((i) => i.inventoryQuantity === 0)).toBe(true);
    expect(low.every((i) => i.inventoryQuantity <= 5)).toBe(true);
  });

  it("looks up an order by name", async () => {
    const order = await client.getOrder("#1042");
    expect(order?.financialStatus).toBe("PAID");
    expect(order?.fulfillmentStatus).toBe("UNFULFILLED");
  });

  it("creates a draft product in demo mode", async () => {
    const created = await client.createDraftProduct({ title: "Test Mug", price: "15.00" });
    expect(created.status).toBe("DRAFT");
    expect(created.handle).toBe("test-mug");
  });

  it("computes a sales summary", async () => {
    const summary = await client.getSalesSummary(365);
    expect(summary.orderCount).toBeGreaterThan(0);
    expect(summary.grossSales).toBeGreaterThan(0);
    expect(summary.topProducts.length).toBeGreaterThan(0);
  });
});

describe("MCP tool layer", () => {
  it("exposes 10 tools", () => {
    expect(TOOLS).toHaveLength(10);
    expect(TOOLS.map((t) => t.name)).toContain("shopify_get_shop_info");
  });

  it("calls tools by name", async () => {
    const result = (await callTool(client, "shopify_list_orders", { fulfillmentStatus: "UNFULFILLED" })) as Array<{ fulfillmentStatus: string }>;
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((o) => o.fulfillmentStatus === "UNFULFILLED")).toBe(true);
  });

  it("rejects unknown tools", async () => {
    await expect(callTool(client, "not_a_tool")).rejects.toThrow("Unknown tool");
  });
});

describe("agents", () => {
  it("catalog agent flags the known catalog issues", async () => {
    const report = await catalogAgent.run(client);
    const text = report.findings.join("\n");
    expect(text).toContain("no description");
    expect(text).toContain("DRAFT");
  });

  it("orders agent builds a fulfillment queue", async () => {
    const report = await ordersAgent.run(client);
    const data = report.data as { toFulfill: string[] };
    expect(data.toFulfill).toContain("#1042");
    expect(data.toFulfill).toContain("#1041");
  });

  it("inventory agent reports out of stock", async () => {
    const report = await inventoryAgent.run(client);
    expect(report.findings.join("\n")).toContain("Out of stock");
  });

  it("support agent answers an order status question from data", async () => {
    const ans = await supportAgent.answer(client, "Where is my order #1042?");
    expect(ans.answer).toContain("#1042");
    expect(ans.sources.length).toBe(1);
  });

  it("support agent is honest about an unknown order", async () => {
    const ans = await supportAgent.answer(client, "Where is order #9999?");
    expect(ans.answer).toContain("could not find");
  });
});
