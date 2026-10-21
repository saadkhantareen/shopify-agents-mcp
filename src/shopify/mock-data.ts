import type { Customer, Order, Product, ShopInfo } from "./types.js";

/**
 * Built-in sample store used in demo mode. The data is deliberately realistic:
 * a small home-goods store with a couple of draft products, low-stock variants,
 * unfulfilled paid orders and repeat customers, so every agent has something
 * meaningful to report.
 */

export const DEMO_SHOP: ShopInfo = {
  name: "Northwind Living",
  email: "hello@northwindliving.example.com",
  domain: "northwind-living.myshopify.com",
  currencyCode: "USD",
  timezone: "America/New_York",
};

export const DEMO_PRODUCTS: Product[] = [
  {
    id: "gid://shopify/Product/1001",
    title: "Hand-Poured Soy Candle - Cedar & Sage",
    handle: "hand-poured-soy-candle-cedar-sage",
    status: "ACTIVE",
    vendor: "Northwind Living",
    productType: "Candles",
    description:
      "A 45-hour burn soy candle with cedarwood and sage. Hand-poured in small batches, cotton wick, reusable amber glass jar.",
    tags: ["candles", "home-fragrance", "bestseller"],
    totalInventory: 42,
    variants: [
      {
        id: "gid://shopify/ProductVariant/5001",
        title: "8 oz",
        sku: "CANDLE-CS-8",
        price: "24.00",
        compareAtPrice: "30.00",
        inventoryQuantity: 30,
      },
      {
        id: "gid://shopify/ProductVariant/5002",
        title: "12 oz",
        sku: "CANDLE-CS-12",
        price: "34.00",
        compareAtPrice: null,
        inventoryQuantity: 12,
      },
    ],
    createdAt: "2026-08-14T10:15:00Z",
    updatedAt: "2026-10-18T09:20:00Z",
  },
  {
    id: "gid://shopify/Product/1002",
    title: "Stoneware Vase - Matte Sand",
    handle: "stoneware-vase-matte-sand",
    status: "ACTIVE",
    vendor: "Kiln & Co",
    productType: "Decor",
    description:
      "Wheel-thrown stoneware vase with a matte sand glaze. Watertight, food-safe glaze. Each piece is slightly unique.",
    tags: ["decor", "vases", "ceramics"],
    totalInventory: 4,
    variants: [
      {
        id: "gid://shopify/ProductVariant/5010",
        title: "Medium",
        sku: "VASE-SAND-M",
        price: "58.00",
        compareAtPrice: null,
        inventoryQuantity: 4,
      },
    ],
    createdAt: "2026-07-02T12:00:00Z",
    updatedAt: "2026-10-19T14:05:00Z",
  },
  {
    id: "gid://shopify/Product/1003",
    title: "Belgian Linen Throw - Oatmeal",
    handle: "belgian-linen-throw-oatmeal",
    status: "ACTIVE",
    vendor: "Northwind Living",
    productType: "Textiles",
    description:
      "Stonewashed Belgian flax linen throw, 130 x 180 cm. Gets softer with every wash. Machine washable cold.",
    tags: ["textiles", "throws", "linen"],
    totalInventory: 18,
    variants: [
      {
        id: "gid://shopify/ProductVariant/5020",
        title: "Default Title",
        sku: "THROW-OAT-1",
        price: "79.00",
        compareAtPrice: "95.00",
        inventoryQuantity: 18,
      },
    ],
    createdAt: "2026-06-20T08:30:00Z",
    updatedAt: "2026-10-10T11:11:00Z",
  },
  {
    id: "gid://shopify/Product/1004",
    title: "Brass Table Lamp - Dome",
    handle: "brass-table-lamp-dome",
    status: "ACTIVE",
    vendor: "Lumen Works",
    productType: "Lighting",
    description: "",
    tags: [],
    totalInventory: 9,
    variants: [
      {
        id: "gid://shopify/ProductVariant/5030",
        title: "Default Title",
        sku: "LAMP-DOME-1",
        price: "129.00",
        compareAtPrice: null,
        inventoryQuantity: 9,
      },
    ],
    createdAt: "2026-09-28T16:45:00Z",
    updatedAt: "2026-09-28T16:45:00Z",
  },
  {
    id: "gid://shopify/Product/1005",
    title: "Ceramic Dinnerware Set - 12 Piece",
    handle: "ceramic-dinnerware-set-12-piece",
    status: "DRAFT",
    vendor: "Kiln & Co",
    productType: "Kitchen",
    description: "Twelve-piece stoneware dinnerware set: 4 dinner plates, 4 side plates, 4 bowls. Dishwasher and microwave safe.",
    tags: ["kitchen", "dinnerware"],
    totalInventory: 25,
    variants: [
      {
        id: "gid://shopify/ProductVariant/5040",
        title: "Speckled White",
        sku: "DINE-SW-12",
        price: "148.00",
        compareAtPrice: null,
        inventoryQuantity: 25,
      },
    ],
    createdAt: "2026-10-15T13:00:00Z",
    updatedAt: "2026-10-15T13:00:00Z",
  },
  {
    id: "gid://shopify/Product/1006",
    title: "Walnut Serving Board",
    handle: "walnut-serving-board",
    status: "ACTIVE",
    vendor: "Northwind Living",
    productType: "Kitchen",
    description:
      "Solid American walnut serving board with a food-safe oil finish. 45 x 20 cm with a leather hanging strap.",
    tags: ["kitchen", "wood", "gifting"],
    totalInventory: 0,
    variants: [
      {
        id: "gid://shopify/ProductVariant/5050",
        title: "Default Title",
        sku: "BOARD-WAL-1",
        price: "64.00",
        compareAtPrice: null,
        inventoryQuantity: 0,
      },
    ],
    createdAt: "2026-05-11T09:00:00Z",
    updatedAt: "2026-10-20T08:00:00Z",
  },
  {
    id: "gid://shopify/Product/1007",
    title: "Essential Oil Diffuser - Stone Grey",
    handle: "essential-oil-diffuser-stone-grey",
    status: "ACTIVE",
    vendor: "Lumen Works",
    productType: "Home Fragrance",
    description:
      "Ultrasonic diffuser in a matte stone finish. 120 ml tank, 7-hour runtime, auto shut-off, whisper quiet.",
    tags: ["home-fragrance", "wellness"],
    totalInventory: 57,
    variants: [
      {
        id: "gid://shopify/ProductVariant/5060",
        title: "Default Title",
        sku: "DIFF-SG-1",
        price: "49.00",
        compareAtPrice: "59.00",
        inventoryQuantity: 57,
      },
    ],
    createdAt: "2026-08-30T10:40:00Z",
    updatedAt: "2026-10-17T15:30:00Z",
  },
  {
    id: "gid://shopify/Product/1008",
    title: "Gift Card",
    handle: "gift-card",
    status: "ACTIVE",
    vendor: "Northwind Living",
    productType: "Gift Cards",
    description: "A digital gift card, delivered by email. Never expires.",
    tags: ["gifting"],
    totalInventory: 999,
    variants: [
      {
        id: "gid://shopify/ProductVariant/5070",
        title: "$50",
        sku: "GIFT-50",
        price: "50.00",
        compareAtPrice: null,
        inventoryQuantity: 999,
      },
    ],
    createdAt: "2026-01-05T09:00:00Z",
    updatedAt: "2026-01-05T09:00:00Z",
  },
];

export const DEMO_CUSTOMERS: Customer[] = [
  {
    id: "gid://shopify/Customer/2001",
    firstName: "Emily",
    lastName: "Carter",
    email: "emily.carter@example.com",
    phone: "+1-555-0101",
    ordersCount: 6,
    totalSpent: "512.00",
    createdAt: "2025-11-19T10:00:00Z",
  },
  {
    id: "gid://shopify/Customer/2002",
    firstName: "Marcus",
    lastName: "Reed",
    email: "marcus.reed@example.com",
    phone: "+1-555-0102",
    ordersCount: 3,
    totalSpent: "271.00",
    createdAt: "2026-02-08T10:00:00Z",
  },
  {
    id: "gid://shopify/Customer/2003",
    firstName: "Priya",
    lastName: "Nair",
    email: "priya.nair@example.com",
    phone: null,
    ordersCount: 2,
    totalSpent: "137.00",
    createdAt: "2026-04-21T10:00:00Z",
  },
  {
    id: "gid://shopify/Customer/2004",
    firstName: "Jonas",
    lastName: "Weber",
    email: "jonas.weber@example.com",
    phone: "+49-555-0104",
    ordersCount: 1,
    totalSpent: "129.00",
    createdAt: "2026-09-30T10:00:00Z",
  },
  {
    id: "gid://shopify/Customer/2005",
    firstName: "Amelia",
    lastName: "Hart",
    email: "amelia.hart@example.com",
    phone: "+1-555-0105",
    ordersCount: 4,
    totalSpent: "388.00",
    createdAt: "2025-12-02T10:00:00Z",
  },
];

const customerRef = (id: string) => {
  const c = DEMO_CUSTOMERS.find((x) => x.id === id);
  return c
    ? { id: c.id, firstName: c.firstName, lastName: c.lastName, email: c.email }
    : null;
};

export const DEMO_ORDERS: Order[] = [
  {
    id: "gid://shopify/Order/3006",
    name: "#1042",
    createdAt: "2026-10-20T15:24:00Z",
    financialStatus: "PAID",
    fulfillmentStatus: "UNFULFILLED",
    totalPrice: "82.00",
    currencyCode: "USD",
    customer: customerRef("gid://shopify/Customer/2001"),
    lineItems: [
      { title: "Stoneware Vase - Matte Sand", quantity: 1, sku: "VASE-SAND-M", price: "58.00" },
      { title: "Hand-Poured Soy Candle - Cedar & Sage (8 oz)", quantity: 1, sku: "CANDLE-CS-8", price: "24.00" },
    ],
  },
  {
    id: "gid://shopify/Order/3005",
    name: "#1041",
    createdAt: "2026-10-20T09:12:00Z",
    financialStatus: "PAID",
    fulfillmentStatus: "UNFULFILLED",
    totalPrice: "129.00",
    currencyCode: "USD",
    customer: customerRef("gid://shopify/Customer/2004"),
    lineItems: [
      { title: "Brass Table Lamp - Dome", quantity: 1, sku: "LAMP-DOME-1", price: "129.00" },
    ],
  },
  {
    id: "gid://shopify/Order/3004",
    name: "#1040",
    createdAt: "2026-10-19T18:40:00Z",
    financialStatus: "PAID",
    fulfillmentStatus: "FULFILLED",
    totalPrice: "98.00",
    currencyCode: "USD",
    customer: customerRef("gid://shopify/Customer/2005"),
    lineItems: [
      { title: "Essential Oil Diffuser - Stone Grey", quantity: 2, sku: "DIFF-SG-1", price: "49.00" },
    ],
  },
  {
    id: "gid://shopify/Order/3003",
    name: "#1039",
    createdAt: "2026-10-18T11:05:00Z",
    financialStatus: "PARTIALLY_REFUNDED",
    fulfillmentStatus: "FULFILLED",
    totalPrice: "79.00",
    currencyCode: "USD",
    customer: customerRef("gid://shopify/Customer/2003"),
    lineItems: [
      { title: "Belgian Linen Throw - Oatmeal", quantity: 1, sku: "THROW-OAT-1", price: "79.00" },
    ],
  },
  {
    id: "gid://shopify/Order/3002",
    name: "#1038",
    createdAt: "2026-10-16T20:31:00Z",
    financialStatus: "PENDING",
    fulfillmentStatus: "UNFULFILLED",
    totalPrice: "64.00",
    currencyCode: "USD",
    customer: customerRef("gid://shopify/Customer/2002"),
    lineItems: [
      { title: "Walnut Serving Board", quantity: 1, sku: "BOARD-WAL-1", price: "64.00" },
    ],
  },
  {
    id: "gid://shopify/Order/3001",
    name: "#1037",
    createdAt: "2026-10-12T08:15:00Z",
    financialStatus: "PAID",
    fulfillmentStatus: "FULFILLED",
    totalPrice: "183.00",
    currencyCode: "USD",
    customer: customerRef("gid://shopify/Customer/2001"),
    lineItems: [
      { title: "Belgian Linen Throw - Oatmeal", quantity: 1, sku: "THROW-OAT-1", price: "79.00" },
      { title: "Essential Oil Diffuser - Stone Grey", quantity: 1, sku: "DIFF-SG-1", price: "49.00" },
      { title: "Hand-Poured Soy Candle - Cedar & Sage (12 oz)", quantity: 1, sku: "CANDLE-CS-12", price: "34.00" },
      { title: "Hand-Poured Soy Candle - Cedar & Sage (8 oz)", quantity: 1, sku: "CANDLE-CS-8", price: "21.00" },
    ],
  },
];
