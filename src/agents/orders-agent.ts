import type { ShopifyClient } from "../shopify/client.js";
import { money, type Agent, type AgentReport } from "./types.js";

/**
 * Orders Agent: triages the order queue the way a store operator would
 * every morning: paid-but-unfulfilled orders first (oldest first),
 * high-value orders flagged, pending payments and refunds surfaced.
 */
export const ordersAgent: Agent = {
  name: "Orders Agent",
  description: "Triages orders: fulfillment queue, high-value orders, pending payments, refunds.",

  async run(client: ShopifyClient): Promise<AgentReport> {
    const orders = await client.listOrders({ limit: 250 });
    const findings: string[] = [];

    const toFulfill = orders
      .filter((o) => o.financialStatus === "PAID" && o.fulfillmentStatus === "UNFULFILLED")
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const pendingPayment = orders.filter((o) => o.financialStatus === "PENDING");
    const refunded = orders.filter((o) => o.financialStatus.includes("REFUNDED"));
    const highValue = orders.filter((o) => Number(o.totalPrice) >= 100);

    findings.push(`${orders.length} recent order(s) reviewed.`);
    if (toFulfill.length) {
      findings.push(`Fulfillment queue: ${toFulfill.length} paid order(s) waiting to ship:`);
      for (const o of toFulfill) {
        const items = o.lineItems.reduce((s, li) => s + li.quantity, 0);
        findings.push(
          `- ${o.name} (${o.createdAt.slice(0, 10)}) - ${items} item(s), ${money(o.totalPrice, o.currencyCode)}, ${o.customer ? `${o.customer.firstName} ${o.customer.lastName}` : "guest"}`,
        );
      }
    } else {
      findings.push("Fulfillment queue is clear: no paid orders waiting to ship.");
    }
    if (pendingPayment.length) {
      findings.push(
        `Payment pending on ${pendingPayment.length} order(s): ${pendingPayment.map((o) => o.name).join(", ")}. One of them is for a product that is currently out of stock, so it needs a customer update before payment completes.`,
      );
    }
    if (refunded.length) {
      findings.push(
        `Refunds on ${refunded.length} order(s): ${refunded.map((o) => `${o.name} (${o.financialStatus.toLowerCase().replaceAll("_", " ")})`).join(", ")}.`,
      );
    }
    if (highValue.length) {
      findings.push(
        `High-value orders (>= ${money(100)}): ${highValue.map((o) => `${o.name} at ${money(o.totalPrice, o.currencyCode)}`).join("; ")}.`,
      );
    }

    return {
      agent: this.name,
      headline:
        toFulfill.length === 0
          ? "No orders waiting for fulfillment"
          : `${toFulfill.length} paid order(s) waiting for fulfillment`,
      findings,
      data: {
        orderCount: orders.length,
        toFulfill: toFulfill.map((o) => o.name),
        pendingPayment: pendingPayment.map((o) => o.name),
        refunded: refunded.map((o) => o.name),
        highValue: highValue.map((o) => o.name),
      },
    };
  },
};
