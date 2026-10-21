import type { ShopifyClient } from "../shopify/client.js";

export interface AgentReport {
  agent: string;
  headline: string;
  findings: string[];
  data: unknown;
}

export interface Agent {
  name: string;
  description: string;
  run(client: ShopifyClient): Promise<AgentReport>;
}

export function money(amount: number | string, currency = "USD"): string {
  const n = typeof amount === "string" ? Number(amount) : amount;
  return `${currency} ${n.toFixed(2)}`;
}
