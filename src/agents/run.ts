#!/usr/bin/env node
import { loadConfig } from "../config.js";
import { ShopifyClient } from "../shopify/client.js";
import { runDailyBriefing } from "./orchestrator.js";

/**
 * Runs all agents and prints the daily store briefing.
 * Usage: npm run agents
 */
async function main(): Promise<void> {
  const client = new ShopifyClient(loadConfig());
  console.log(await runDailyBriefing(client));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
