export interface ShopInfo {
  name: string;
  email: string;
  domain: string;
  currencyCode: string;
  timezone: string;
}

export interface ProductVariant {
  id: string;
  title: string;
  sku: string;
  price: string;
  compareAtPrice: string | null;
  inventoryQuantity: number;
}

export interface Product {
  id: string;
  title: string;
  handle: string;
  status: "ACTIVE" | "DRAFT" | "ARCHIVED";
  vendor: string;
  productType: string;
  description: string;
  tags: string[];
  totalInventory: number;
  variants: ProductVariant[];
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  ordersCount: number;
  totalSpent: string;
  createdAt: string;
}

export interface OrderLineItem {
  title: string;
  quantity: number;
  sku: string;
  price: string;
}

export interface Order {
  id: string;
  name: string;
  createdAt: string;
  financialStatus: string;
  fulfillmentStatus: string;
  totalPrice: string;
  currencyCode: string;
  customer: Pick<Customer, "id" | "firstName" | "lastName" | "email"> | null;
  lineItems: OrderLineItem[];
}

export interface LowStockItem {
  productId: string;
  productTitle: string;
  variantId: string;
  variantTitle: string;
  sku: string;
  inventoryQuantity: number;
}

export interface SalesSummary {
  days: number;
  orderCount: number;
  grossSales: number;
  averageOrderValue: number;
  currencyCode: string;
  topProducts: Array<{ title: string; unitsSold: number; revenue: number }>;
}

export interface CreateDraftProductInput {
  title: string;
  description?: string;
  vendor?: string;
  productType?: string;
  tags?: string[];
  price?: string;
  sku?: string;
}
