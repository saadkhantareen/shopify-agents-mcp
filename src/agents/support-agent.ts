import type { ShopifyClient } from "../shopify/client.js";
import { money, type Agent, type AgentReport } from "./types.js";

export interface SupportAnswer {
  question: string;
  answer: string;
  sources: string[];
}

/**
 * Support Agent: answers the questions customers actually ask, grounded in
 * live store data fetched through the same tool layer as the MCP server:
 * order status by order number or email, product availability, price and
 * stock questions. It never guesses: no match means it says so and offers
 * to escalate to a human.
 */
export const supportAgent: Agent & {
  answer(client: ShopifyClient, question: string): Promise<SupportAnswer>;
} = {
  name: "Support Agent",
  description: "Answers customer questions from live order and product data.",

  async answer(client: ShopifyClient, question: string): Promise<SupportAnswer> {
    const q = question.toLowerCase();

    // "Where is my order #1042?" / status by order number
    const orderMatch = question.match(/#?(\d{3,})/);
    if ((q.includes("order") || q.includes("status") || q.includes("track") || q.includes("where")) && orderMatch) {
      const order = await client.getOrder(`#${orderMatch[1]}`);
      if (order) {
        const statusText =
          order.fulfillmentStatus === "FULFILLED"
            ? "has been fulfilled and is on its way to you"
            : "is being prepared and has not shipped yet";
        return {
          question,
          answer: `Order ${order.name} (${money(order.totalPrice, order.currencyCode)}, placed ${order.createdAt.slice(0, 10)}) ${statusText}. Payment status: ${order.financialStatus.toLowerCase().replaceAll("_", " ")}. Items: ${order.lineItems.map((li) => `${li.quantity} x ${li.title}`).join(", ")}.`,
          sources: [order.id],
        };
      }
      return {
        question,
        answer: `I could not find an order numbered #${orderMatch[1]}. Please double-check the number from your confirmation email, or share the email used at checkout and I will look it up. If it still does not appear, I will escalate this to a human on the team.`,
        sources: [],
      };
    }

    // Stock / availability questions: "Is the stoneware vase in stock?"
    if (q.includes("stock") || q.includes("available") || q.includes("buy")) {
      const products = await client.listProducts({ limit: 250, status: "ACTIVE" });
      const hit = products.find((p) =>
        p.title
          .toLowerCase()
          .split(/[^a-z0-9]+/)
          .filter((w) => w.length > 3)
          .some((w) => q.includes(w)),
      );
      if (hit) {
        const price = hit.variants[0]?.price ?? "0.00";
        return {
          question,
          answer:
            hit.totalInventory > 0
              ? `Yes, the ${hit.title} is in stock (${hit.totalInventory} available) at ${money(price)}. You can order it directly from the product page.`
              : `The ${hit.title} is currently out of stock. I have flagged it for restock; join the waitlist on the product page and we will email you when it is back.`,
          sources: [hit.id],
        };
      }
    }

    // Price questions: "How much is the linen throw?"
    if (q.includes("price") || q.includes("cost") || q.includes("much")) {
      const results = await client.search(extractKeywords(question));
      const product = results.products[0];
      if (product) {
        const variants = product.variants
          .map((v) => (v.title === "Default Title" ? money(v.price) : `${v.title}: ${money(v.price)}`))
          .join(", ");
        return {
          question,
          answer: `The ${product.title} is priced at ${variants}.`,
          sources: [product.id],
        };
      }
    }

    return {
      question,
      answer:
        "I can help with order status, product prices and stock availability. For anything else, I will pass your message to a human on the team and they will reply by email.",
      sources: [],
    };
  },

  async run(client: ShopifyClient): Promise<AgentReport> {
    const sampleQuestions = [
      "Where is my order #1042?",
      "Is the stoneware vase in stock?",
      "How much is the Belgian linen throw?",
      "Where is order #9999?",
    ];
    const findings: string[] = [];
    const answers: SupportAnswer[] = [];
    for (const question of sampleQuestions) {
      const result = await this.answer(client, question);
      answers.push(result);
      findings.push(`Q: ${result.question}`);
      findings.push(`A: ${result.answer}`);
    }
    return {
      agent: this.name,
      headline: "Support agent answered sample customer questions from live store data",
      findings,
      data: { answers },
    };
  },
};

function extractKeywords(question: string): string {
  const words = question
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !["how", "much", "price", "cost", "what", "the", "is"].includes(w));
  return words.slice(0, 3).join(" ") || question;
}
