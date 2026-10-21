import type { ShopifyConfig } from "../config.js";
import { DEMO_CUSTOMERS, DEMO_ORDERS, DEMO_PRODUCTS, DEMO_SHOP } from "./mock-data.js";
import type {
  CreateDraftProductInput,
  Customer,
  LowStockItem,
  Order,
  Product,
  SalesSummary,
  ShopInfo,
} from "./types.js";

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

/**
 * Thin client over the Shopify Admin GraphQL API.
 *
 * In demo mode (no credentials configured) every method is served from the
 * built-in sample store in mock-data.ts, so the MCP server, the agents and
 * the demo run end to end with zero setup.
 */
export class ShopifyClient {
  constructor(private readonly config: ShopifyConfig) {}

  get demoMode(): boolean {
    return this.config.demoMode;
  }

  get storeDomain(): string {
    return this.config.demoMode ? DEMO_SHOP.domain : this.config.storeDomain;
  }

  private async graphql<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
    const url = `https://${this.config.storeDomain}/admin/api/${this.config.apiVersion}/graphql.json`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": this.config.accessToken,
      },
      body: JSON.stringify({ query, variables }),
    });
    if (!res.ok) {
      throw new Error(`Shopify API request failed: ${res.status} ${res.statusText}`);
    }
    const body = (await res.json()) as GraphQLResponse<T>;
    if (body.errors?.length) {
      throw new Error(`Shopify API errors: ${body.errors.map((e) => e.message).join("; ")}`);
    }
    if (!body.data) throw new Error("Shopify API returned no data.");
    return body.data;
  }

  async getShop(): Promise<ShopInfo> {
    if (this.config.demoMode) return { ...DEMO_SHOP };
    const data = await this.graphql<{
      shop: { name: string; email: string; currencyCode: string; ianaTimezone: string; primaryDomain: { host: string } };
    }>(`{ shop { name email currencyCode ianaTimezone primaryDomain { host } } }`);
    return {
      name: data.shop.name,
      email: data.shop.email,
      domain: data.shop.primaryDomain.host,
      currencyCode: data.shop.currencyCode,
      timezone: data.shop.ianaTimezone,
    };
  }

  async listProducts(opts: { limit?: number; search?: string; status?: string } = {}): Promise<Product[]> {
    const limit = clampLimit(opts.limit);
    if (this.config.demoMode) {
      let items = [...DEMO_PRODUCTS];
      if (opts.status) items = items.filter((p) => p.status === opts.status!.toUpperCase());
      if (opts.search) items = items.filter((p) => matchesSearch(p, opts.search!));
      return items.slice(0, limit);
    }
    const queryParts: string[] = [];
    if (opts.status) queryParts.push(`status:${opts.status.toLowerCase()}`);
    if (opts.search) queryParts.push(opts.search);
    const data = await this.graphql<{ products: { edges: Array<{ node: RawProduct }> } }>(
      `query Products($first: Int!, $query: String) {
        products(first: $first, query: $query, sortKey: UPDATED_AT, reverse: true) {
          edges { node {
            id title handle status vendor productType description tags totalInventory createdAt updatedAt
            variants(first: 25) { edges { node { id title sku price compareAtPrice inventoryQuantity } } }
          } }
        }
      }`,
      { first: limit, query: queryParts.length ? queryParts.join(" ") : null },
    );
    return data.products.edges.map((e) => mapProduct(e.node));
  }

  async getProduct(idOrHandle: string): Promise<Product | null> {
    if (this.config.demoMode) {
      return (
        DEMO_PRODUCTS.find((p) => p.id === idOrHandle || p.handle === idOrHandle) ?? null
      );
    }
    const byId = await this.graphql<{ product: RawProduct | null }>(
      `query Product($id: ID!) {
        product(id: $id) {
          id title handle status vendor productType description tags totalInventory createdAt updatedAt
          variants(first: 25) { edges { node { id title sku price compareAtPrice inventoryQuantity } } }
        }
      }`,
      { id: idOrHandle },
    );
    return byId.product ? mapProduct(byId.product) : null;
  }

  async createDraftProduct(input: CreateDraftProductInput): Promise<Product> {
    if (this.config.demoMode) {
      const now = new Date().toISOString();
      const product: Product = {
        id: `gid://shopify/Product/${9000 + DEMO_PRODUCTS.length + 1}`,
        title: input.title,
        handle: slugify(input.title),
        status: "DRAFT",
        vendor: input.vendor ?? "",
        productType: input.productType ?? "",
        description: input.description ?? "",
        tags: input.tags ?? [],
        totalInventory: 0,
        variants: [
          {
            id: `gid://shopify/ProductVariant/${9900 + DEMO_PRODUCTS.length + 1}`,
            title: "Default Title",
            sku: input.sku ?? "",
            price: input.price ?? "0.00",
            compareAtPrice: null,
            inventoryQuantity: 0,
          },
        ],
        createdAt: now,
        updatedAt: now,
      };
      DEMO_PRODUCTS.push(product);
      return product;
    }
    const data = await this.graphql<{
      productCreate: { product: RawProduct | null; userErrors: Array<{ message: string }> };
    }>(
      `mutation CreateProduct($input: ProductInput!) {
        productCreate(input: $input) {
          product {
            id title handle status vendor productType description tags totalInventory createdAt updatedAt
            variants(first: 25) { edges { node { id title sku price compareAtPrice inventoryQuantity } } }
          }
          userErrors { field message }
        }
      }`,
      {
        input: {
          title: input.title,
          descriptionHtml: input.description ? `<p>${escapeHtml(input.description)}</p>` : undefined,
          vendor: input.vendor,
          productType: input.productType,
          tags: input.tags,
          status: "DRAFT",
        },
      },
    );
    if (data.productCreate.userErrors.length) {
      throw new Error(data.productCreate.userErrors.map((e) => e.message).join("; "));
    }
    if (!data.productCreate.product) throw new Error("Product creation returned no product.");
    return mapProduct(data.productCreate.product);
  }

  async listOrders(opts: { limit?: number; fulfillmentStatus?: string; financialStatus?: string } = {}): Promise<Order[]> {
    const limit = clampLimit(opts.limit);
    if (this.config.demoMode) {
      let items = [...DEMO_ORDERS];
      if (opts.fulfillmentStatus)
        items = items.filter((o) => o.fulfillmentStatus === opts.fulfillmentStatus!.toUpperCase());
      if (opts.financialStatus)
        items = items.filter((o) => o.financialStatus === opts.financialStatus!.toUpperCase());
      return items.slice(0, limit);
    }
    const queryParts: string[] = [];
    if (opts.fulfillmentStatus) queryParts.push(`fulfillment_status:${opts.fulfillmentStatus.toLowerCase()}`);
    if (opts.financialStatus) queryParts.push(`financial_status:${opts.financialStatus.toLowerCase()}`);
    const data = await this.graphql<{ orders: { edges: Array<{ node: RawOrder }> } }>(
      `query Orders($first: Int!, $query: String) {
        orders(first: $first, query: $query, sortKey: CREATED_AT, reverse: true) {
          edges { node {
            id name createdAt displayFinancialStatus displayFulfillmentStatus
            totalPriceSet { shopMoney { amount currencyCode } }
            customer { id firstName lastName email }
            lineItems(first: 50) { edges { node { title quantity sku originalUnitPriceSet { shopMoney { amount } } } } }
          } }
        }
      }`,
      { first: limit, query: queryParts.length ? queryParts.join(" ") : null },
    );
    return data.orders.edges.map((e) => mapOrder(e.node));
  }

  async getOrder(idOrName: string): Promise<Order | null> {
    if (this.config.demoMode) {
      return DEMO_ORDERS.find((o) => o.id === idOrName || o.name === idOrName) ?? null;
    }
    const data = await this.graphql<{ order: RawOrder | null }>(
      `query Order($id: ID!) {
        order(id: $id) {
          id name createdAt displayFinancialStatus displayFulfillmentStatus
          totalPriceSet { shopMoney { amount currencyCode } }
          customer { id firstName lastName email }
          lineItems(first: 50) { edges { node { title quantity sku originalUnitPriceSet { shopMoney { amount } } } } }
        }
      }`,
      { id: idOrName },
    );
    return data.order ? mapOrder(data.order) : null;
  }

  async listCustomers(opts: { limit?: number; search?: string } = {}): Promise<Customer[]> {
    const limit = clampLimit(opts.limit);
    if (this.config.demoMode) {
      let items = [...DEMO_CUSTOMERS];
      if (opts.search) {
        const q = opts.search.toLowerCase();
        items = items.filter(
          (c) =>
            `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
            c.email.toLowerCase().includes(q),
        );
      }
      return items.slice(0, limit);
    }
    const data = await this.graphql<{ customers: { edges: Array<{ node: RawCustomer }> } }>(
      `query Customers($first: Int!, $query: String) {
        customers(first: $first, query: $query, sortKey: UPDATED_AT, reverse: true) {
          edges { node { id firstName lastName email phone numberOfOrders amountSpent { amount } createdAt } }
        }
      }`,
      { first: limit, query: opts.search ?? null },
    );
    return data.customers.edges.map((e) => ({
      id: e.node.id,
      firstName: e.node.firstName ?? "",
      lastName: e.node.lastName ?? "",
      email: e.node.email ?? "",
      phone: e.node.phone,
      ordersCount: e.node.numberOfOrders,
      totalSpent: e.node.amountSpent.amount,
      createdAt: e.node.createdAt,
    }));
  }

  async getLowStock(threshold = 5): Promise<LowStockItem[]> {
    const products = await this.listProducts({ limit: 250 });
    const items: LowStockItem[] = [];
    for (const p of products) {
      if (p.status !== "ACTIVE") continue;
      for (const v of p.variants) {
        // Gift cards and other non-tracked items report very high stock; only
        // genuinely low or zero quantities are surfaced.
        if (v.inventoryQuantity <= threshold) {
          items.push({
            productId: p.id,
            productTitle: p.title,
            variantId: v.id,
            variantTitle: v.title,
            sku: v.sku,
            inventoryQuantity: v.inventoryQuantity,
          });
        }
      }
    }
    return items.sort((a, b) => a.inventoryQuantity - b.inventoryQuantity);
  }

  async getSalesSummary(days = 30): Promise<SalesSummary> {
    const orders = await this.listOrders({ limit: 250 });
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const recent = orders.filter(
      (o) => new Date(o.createdAt).getTime() >= cutoff && o.financialStatus !== "PENDING",
    );
    const gross = recent.reduce((sum, o) => sum + Number(o.totalPrice), 0);
    const byProduct = new Map<string, { units: number; revenue: number }>();
    for (const order of recent) {
      for (const item of order.lineItems) {
        const key = item.title;
        const entry = byProduct.get(key) ?? { units: 0, revenue: 0 };
        entry.units += item.quantity;
        entry.revenue += Number(item.price) * item.quantity;
        byProduct.set(key, entry);
      }
    }
    return {
      days,
      orderCount: recent.length,
      grossSales: round2(gross),
      averageOrderValue: recent.length ? round2(gross / recent.length) : 0,
      currencyCode: recent[0]?.currencyCode ?? DEMO_SHOP.currencyCode,
      topProducts: [...byProduct.entries()]
        .map(([title, v]) => ({ title, unitsSold: v.units, revenue: round2(v.revenue) }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5),
    };
  }

  async search(query: string): Promise<{ products: Product[]; orders: Order[]; customers: Customer[] }> {
    const q = query.toLowerCase();
    const [products, orders, customers] = await Promise.all([
      this.listProducts({ limit: 25, search: query }),
      this.listOrders({ limit: 250 }),
      this.listCustomers({ limit: 25, search: query }),
    ]);
    return {
      products,
      orders: orders.filter(
        (o) =>
          o.name.toLowerCase().includes(q) ||
          o.lineItems.some((li) => li.title.toLowerCase().includes(q)) ||
          (o.customer?.email.toLowerCase().includes(q) ?? false),
      ),
      customers,
    };
  }
}

/* ---------- raw API shapes + mapping ---------- */

interface RawVariant {
  id: string;
  title: string;
  sku: string | null;
  price: string;
  compareAtPrice: string | null;
  inventoryQuantity: number;
}

interface RawProduct {
  id: string;
  title: string;
  handle: string;
  status: string;
  vendor: string;
  productType: string;
  description: string | null;
  tags: string[];
  totalInventory: number;
  createdAt: string;
  updatedAt: string;
  variants: { edges: Array<{ node: RawVariant }> };
}

interface RawOrder {
  id: string;
  name: string;
  createdAt: string;
  displayFinancialStatus: string;
  displayFulfillmentStatus: string;
  totalPriceSet: { shopMoney: { amount: string; currencyCode: string } };
  customer: { id: string; firstName: string | null; lastName: string | null; email: string | null } | null;
  lineItems: {
    edges: Array<{
      node: { title: string; quantity: number; sku: string | null; originalUnitPriceSet: { shopMoney: { amount: string } } };
    }>;
  };
}

interface RawCustomer {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  numberOfOrders: number;
  amountSpent: { amount: string };
  createdAt: string;
}

function mapProduct(raw: RawProduct): Product {
  return {
    id: raw.id,
    title: raw.title,
    handle: raw.handle,
    status: (raw.status?.toUpperCase() as Product["status"]) ?? "ACTIVE",
    vendor: raw.vendor ?? "",
    productType: raw.productType ?? "",
    description: raw.description ?? "",
    tags: raw.tags ?? [],
    totalInventory: raw.totalInventory ?? 0,
    variants: raw.variants.edges.map((e) => ({
      id: e.node.id,
      title: e.node.title,
      sku: e.node.sku ?? "",
      price: e.node.price,
      compareAtPrice: e.node.compareAtPrice,
      inventoryQuantity: e.node.inventoryQuantity ?? 0,
    })),
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

function mapOrder(raw: RawOrder): Order {
  return {
    id: raw.id,
    name: raw.name,
    createdAt: raw.createdAt,
    financialStatus: raw.displayFinancialStatus ?? "",
    fulfillmentStatus: raw.displayFulfillmentStatus ?? "",
    totalPrice: raw.totalPriceSet.shopMoney.amount,
    currencyCode: raw.totalPriceSet.shopMoney.currencyCode,
    customer: raw.customer
      ? {
          id: raw.customer.id,
          firstName: raw.customer.firstName ?? "",
          lastName: raw.customer.lastName ?? "",
          email: raw.customer.email ?? "",
        }
      : null,
    lineItems: raw.lineItems.edges.map((e) => ({
      title: e.node.title,
      quantity: e.node.quantity,
      sku: e.node.sku ?? "",
      price: e.node.originalUnitPriceSet.shopMoney.amount,
    })),
  };
}

/* ---------- helpers ---------- */

function clampLimit(limit?: number): number {
  if (!limit || Number.isNaN(limit)) return 25;
  return Math.min(Math.max(Math.trunc(limit), 1), 250);
}

function matchesSearch(p: Product, search: string): boolean {
  const q = search.toLowerCase();
  return (
    p.title.toLowerCase().includes(q) ||
    p.vendor.toLowerCase().includes(q) ||
    p.productType.toLowerCase().includes(q) ||
    p.tags.some((t) => t.toLowerCase().includes(q))
  );
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
