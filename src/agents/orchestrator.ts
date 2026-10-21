import type { ShopifyClient } from "../shopify/client.js";
import { catalogAgent } from "./catalog-agent.js";
import { inventoryAgent } from "./inventory-agent.js";
import { ordersAgent } from "./orders-agent.js";
import { supportAgent } from "./support-agent.js";
import { money, type AgentReport } from "./types.js";

export const ALL_AGENTS = [catalogAgent, ordersAgent, inventoryAgent, supportAgent];

/**
 * Orchestrator: runs every agent against the store and compiles a single
 * daily briefing for the store owner.
 */
export async function runDailyBriefing(client: ShopifyClient): Promise<string> {
  const shop = await client.getShop();
  const summary = await client.getSalesSummary(30);

  const reports: AgentReport[] = [];
  for (const agent of ALL_AGENTS) {
    reports.push(await agent.run(client));
  }

  const lines: string[] = [];
  lines.push(`Daily store briefing - ${shop.name}`);
  lines.push(
    `Mode: ${client.demoMode ? "demo (sample data)" : "live"} | Store: ${shop.domain} | Currency: ${shop.currencyCode}`,
  );
  lines.push("");
  lines.push(
    `Sales, last ${summary.days} days: ${summary.orderCount} orders, ${money(summary.grossSales, summary.currencyCode)} gross, ${money(summary.averageOrderValue, summary.currencyCode)} average order value.`,
  );
  if (summary.topProducts.length) {
    lines.push(
      `Top products: ${summary.topProducts.map((p) => `${p.title} (${p.unitsSold} sold)`).join("; ")}.`,
    );
  }
  for (const report of reports) {
    lines.push("");
    lines.push(`== ${report.agent}: ${report.headline}`);
    for (const f of report.findings) lines.push(f);
  }
  return lines.join("\n");
}
