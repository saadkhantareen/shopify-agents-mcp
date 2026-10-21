export interface ShopifyConfig {
  storeDomain: string;
  accessToken: string;
  apiVersion: string;
  /** When true, all reads/writes are served from built-in sample data. */
  demoMode: boolean;
}

/**
 * Loads Shopify configuration from environment variables.
 * Demo mode is enabled automatically when no store credentials are present,
 * so the MCP server and the agents can be explored without a real store.
 */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): ShopifyConfig {
  const storeDomain = (env.SHOPIFY_STORE_DOMAIN ?? "").trim();
  const accessToken = (env.SHOPIFY_ADMIN_ACCESS_TOKEN ?? "").trim();
  const apiVersion = (env.SHOPIFY_API_VERSION ?? "2025-01").trim() || "2025-01";
  const forcedDemo = (env.SHOPIFY_DEMO_MODE ?? "").toLowerCase() === "true";

  return {
    storeDomain,
    accessToken,
    apiVersion,
    demoMode: forcedDemo || storeDomain.length === 0 || accessToken.length === 0,
  };
}
