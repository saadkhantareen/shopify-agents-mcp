import type { ShopifyClient } from "../shopify/client.js";
import type { Agent, AgentReport } from "./types.js";

/**
 * Inventory Agent: finds low and out-of-stock variants and turns recent
 * sales velocity into a concrete reorder suggestion, instead of a vague
 * "stock is low" alert.
 */
export const inventoryAgent: Agent = {
  name: "Inventory Agent",
  description: "Reports low/out-of-stock variants with reorder quantities based on recent sales.",

  async run(client: ShopifyClient, threshold = 5): Promise<AgentReport> {
    const lowStock = await client.getLowStock(threshold);
    const summary = await client.getSalesSummary(30);
    const findings: string[] = [];

    const outOfStock = lowStock.filter((i) => i.inventoryQuantity === 0);
    const low = lowStock.filter((i) => i.inventoryQuantity > 0);

    if (outOfStock.length) {
      findings.push(`Out of stock (${outOfStock.length}):`);
      for (const i of outOfStock) {
        findings.push(`- ${i.productTitle} (${i.sku || "no SKU"}) - 0 left, product is still ACTIVE and visible`);
      }
    }
    if (low.length) {
      findings.push(`Low stock, at or below ${threshold} units (${low.length}):`);
      for (const i of low) {
        findings.push(`- ${i.productTitle} (${i.sku || "no SKU"}) - ${i.inventoryQuantity} left`);
      }
    }
    if (!lowStock.length) findings.push(`No variants at or below ${threshold} units. Stock looks healthy.`);

    // Reorder suggestion: units sold in the last 30 days per top product,
    // rounded up to cover roughly the next 30 days plus a safety buffer.
    const suggestions = summary.topProducts
      .map((p) => {
        const hit = lowStock.find((i) => p.title.startsWith(i.productTitle.split(" - ")[0]) || p.title.includes(i.productTitle));
        if (!hit) return null;
        const suggested = Math.max(10, Math.ceil(p.unitsSold * 1.5));
        return `- Reorder suggestion: ${hit.productTitle}: order ~${suggested} units (sold ${p.unitsSold} in the last ${summary.days} days).`;
      })
      .filter((s): s is string => s !== null);
    findings.push(...suggestions);

    return {
      agent: this.name,
      headline:
        lowStock.length === 0
          ? "Inventory healthy"
          : `${outOfStock.length} out of stock, ${low.length} low stock`,
      findings,
      data: { lowStock, outOfStockCount: outOfStock.length, suggestions },
    };
  },
};
