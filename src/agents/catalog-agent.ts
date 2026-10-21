import type { ShopifyClient } from "../shopify/client.js";
import type { Agent, AgentReport } from "./types.js";

/**
 * Catalog Agent: audits the product catalog for issues a store owner
 * actually loses sales to: missing descriptions, missing tags, products
 * stuck in draft, out-of-stock actives and variants with no SKU.
 */
export const catalogAgent: Agent = {
  name: "Catalog Agent",
  description: "Audits product listings for completeness and publish-readiness.",

  async run(client: ShopifyClient): Promise<AgentReport> {
    const products = await client.listProducts({ limit: 250 });
    const findings: string[] = [];
    const issues: Array<{ product: string; issue: string }> = [];

    for (const p of products) {
      if (p.status === "ACTIVE" && !p.description.trim()) {
        issues.push({ product: p.title, issue: "Active product has no description" });
      }
      if (p.status === "ACTIVE" && p.tags.length === 0) {
        issues.push({ product: p.title, issue: "Active product has no tags (hurts search and collections)" });
      }
      if (p.status === "DRAFT") {
        issues.push({ product: p.title, issue: "Product is still in DRAFT and not visible to customers" });
      }
      if (p.status === "ACTIVE" && p.totalInventory === 0) {
        issues.push({ product: p.title, issue: "Active product is out of stock" });
      }
      for (const v of p.variants) {
        if (!v.sku) issues.push({ product: p.title, issue: `Variant "${v.title}" has no SKU` });
      }
    }

    const active = products.filter((p) => p.status === "ACTIVE").length;
    const drafts = products.filter((p) => p.status === "DRAFT").length;
    findings.push(`Catalog size: ${products.length} products (${active} active, ${drafts} draft).`);
    if (issues.length === 0) {
      findings.push("No catalog issues found. Every listing is complete and publish-ready.");
    } else {
      findings.push(`${issues.length} issue(s) found:`);
      for (const i of issues) findings.push(`- ${i.product}: ${i.issue}`);
    }

    return {
      agent: this.name,
      headline:
        issues.length === 0
          ? "Catalog is healthy"
          : `Catalog audit: ${issues.length} issue(s) across ${products.length} products`,
      findings,
      data: { productCount: products.length, active, drafts, issues },
    };
  },
};

/**
 * Drafts an SEO-friendly product description from structured product facts.
 * Deterministic and dependency-free; swap this function for an LLM call if
 * you want fully generative copy.
 */
export function draftProductDescription(product: {
  title: string;
  vendor: string;
  productType: string;
  tags: string[];
}): string {
  const bits = [
    `Meet the ${product.title}${product.vendor ? ` by ${product.vendor}` : ""}.`,
    product.productType
      ? `Part of our ${product.productType.toLowerCase()} collection, it is made for everyday use and built to last.`
      : "Made for everyday use and built to last.",
    product.tags.length
      ? `Perfect for ${product.tags.slice(0, 3).join(", ")} and easy to pair with the rest of your home.`
      : "Easy to pair with the rest of your home.",
    "Order today for fast, tracked shipping and a 30-day returns window.",
  ];
  return bits.join(" ");
}
