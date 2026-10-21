import { z } from "zod";
import type { ShopifyClient } from "../shopify/client.js";

/**
 * The single source of truth for every Shopify capability.
 *
 * The MCP server exposes these as MCP tools; the agents call the same
 * handlers in-process. One implementation, two surfaces.
 */
export interface ToolDef {
  name: string;
  title: string;
  description: string;
  schema: z.ZodRawShape;
  handler: (client: ShopifyClient, args: Record<string, unknown>) => Promise<unknown>;
}

export const TOOLS: ToolDef[] = [
  {
    name: "shopify_get_shop_info",
    title: "Get shop info",
    description: "Returns basic information about the Shopify store: name, domain, contact email, currency and timezone.",
    schema: {},
    handler: async (client) => ({
      mode: client.demoMode ? "demo" : "live",
      shop: await client.getShop(),
    }),
  },
  {
    name: "shopify_list_products",
    title: "List products",
    description: "Lists products in the store, optionally filtered by a search term (title, vendor, type or tag) and status (ACTIVE, DRAFT, ARCHIVED).",
    schema: {
      limit: z.number().int().min(1).max(250).optional().describe("Max products to return (default 25)"),
      search: z.string().optional().describe("Search term matched against title, vendor, product type and tags"),
      status: z.enum(["ACTIVE", "DRAFT", "ARCHIVED"]).optional().describe("Only return products with this status"),
    },
    handler: async (client, args) =>
      client.listProducts({
        limit: args.limit as number | undefined,
        search: args.search as string | undefined,
        status: args.status as string | undefined,
      }),
  },
  {
    name: "shopify_get_product",
    title: "Get one product",
    description: "Returns full details for one product by its Shopify product ID (gid) or handle, including variants, prices and inventory.",
    schema: {
      id: z.string().describe("Product ID (gid://shopify/Product/...) or handle"),
    },
    handler: async (client, args) => {
      const product = await client.getProduct(args.id as string);
      if (!product) throw new Error(`No product found for "${args.id as string}".`);
      return product;
    },
  },
  {
    name: "shopify_create_draft_product",
    title: "Create a draft product",
    description: "Creates a new product in DRAFT status so it can be reviewed in Shopify admin before publishing. Never publishes directly.",
    schema: {
      title: z.string().min(1).describe("Product title"),
      description: z.string().optional().describe("Plain-text product description"),
      vendor: z.string().optional(),
      productType: z.string().optional(),
      tags: z.array(z.string()).optional(),
      price: z.string().optional().describe("Price for the default variant, e.g. \"49.00\""),
      sku: z.string().optional(),
    },
    handler: async (client, args) =>
      client.createDraftProduct({
        title: args.title as string,
        description: args.description as string | undefined,
        vendor: args.vendor as string | undefined,
        productType: args.productType as string | undefined,
        tags: args.tags as string[] | undefined,
        price: args.price as string | undefined,
        sku: args.sku as string | undefined,
      }),
  },
  {
    name: "shopify_list_orders",
    title: "List orders",
    description: "Lists recent orders, optionally filtered by fulfillment status (UNFULFILLED, FULFILLED) or financial status (PAID, PENDING, PARTIALLY_REFUNDED, REFUNDED).",
    schema: {
      limit: z.number().int().min(1).max(250).optional().describe("Max orders to return (default 25)"),
      fulfillmentStatus: z.string().optional(),
      financialStatus: z.string().optional(),
    },
    handler: async (client, args) =>
      client.listOrders({
        limit: args.limit as number | undefined,
        fulfillmentStatus: args.fulfillmentStatus as string | undefined,
        financialStatus: args.financialStatus as string | undefined,
      }),
  },
  {
    name: "shopify_get_order",
    title: "Get one order",
    description: "Returns full details for one order by its Shopify order ID (gid) or order name such as \"#1042\", including line items and customer.",
    schema: {
      id: z.string().describe("Order ID (gid://shopify/Order/...) or order name like #1042"),
    },
    handler: async (client, args) => {
      const order = await client.getOrder(args.id as string);
      if (!order) throw new Error(`No order found for "${args.id as string}".`);
      return order;
    },
  },
  {
    name: "shopify_list_customers",
    title: "List customers",
    description: "Lists customers, optionally filtered by a search term (name or email). Includes order counts and total spent.",
    schema: {
      limit: z.number().int().min(1).max(250).optional().describe("Max customers to return (default 25)"),
      search: z.string().optional(),
    },
    handler: async (client, args) =>
      client.listCustomers({
        limit: args.limit as number | undefined,
        search: args.search as string | undefined,
      }),
  },
  {
    name: "shopify_get_low_stock",
    title: "Get low-stock variants",
    description: "Returns active product variants whose inventory is at or below the threshold, sorted lowest first. Use it for restock alerts.",
    schema: {
      threshold: z.number().int().min(0).max(1000).optional().describe("Inventory threshold (default 5)"),
    },
    handler: async (client, args) => client.getLowStock((args.threshold as number | undefined) ?? 5),
  },
  {
    name: "shopify_get_sales_summary",
    title: "Get sales summary",
    description: "Summarises sales for the last N days: order count, gross sales, average order value and top products by revenue.",
    schema: {
      days: z.number().int().min(1).max(365).optional().describe("Look-back window in days (default 30)"),
    },
    handler: async (client, args) => client.getSalesSummary((args.days as number | undefined) ?? 30),
  },
  {
    name: "shopify_search",
    title: "Search the store",
    description: "Searches across products, orders and customers with a single query and returns grouped matches.",
    schema: {
      query: z.string().min(1).describe("Search term, e.g. a product name, order number or customer email"),
    },
    handler: async (client, args) => client.search(args.query as string),
  },
];

export async function callTool(
  client: ShopifyClient,
  name: string,
  args: Record<string, unknown> = {},
): Promise<unknown> {
  const tool = TOOLS.find((t) => t.name === name);
  if (!tool) throw new Error(`Unknown tool: ${name}`);
  const parsed = z.object(tool.schema).parse(args);
  return tool.handler(client, parsed as Record<string, unknown>);
}
