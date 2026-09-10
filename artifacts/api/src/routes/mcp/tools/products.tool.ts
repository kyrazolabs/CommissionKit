import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod/v4";
import { ProductService } from "../../products/service";
import type { WorkspaceContext } from "../context";
import { requirePermission } from "../guard";

class ProductTools {
  private static instance: ProductTools;

  private constructor() {}

  static getInstance(): ProductTools {
    if (!ProductTools.instance) {
      ProductTools.instance = new ProductTools();
    }
    return ProductTools.instance;
  }

  register(server: McpServer, ctx: WorkspaceContext): void {
    const service = ProductService.getInstance();

    server.tool(
      "list_products",
      "List products in your workspace",
      {
        search: z.string().optional().describe("Search by name, SKU, or description"),
        kind: z
          .enum([
            "service",
            "property",
            "vehicle",
            "job",
            "insurance",
            "physical_good",
            "subscription",
            "other",
          ])
          .optional(),
        page: z.number().int().min(1).optional().default(1),
        limit: z.number().int().min(1).max(100).optional().default(50),
      },
      async ({ search, kind, page, limit }) => {
        requirePermission(ctx, "read:products", "list_products");
        const result = await service.list(ctx.workspaceId, {
          search,
          kind,
          page: String(page),
          limit: String(limit),
        });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      },
    );

    server.tool(
      "get_product",
      "Get a product by ID",
      { id: z.string() },
      async ({ id }) => {
        requirePermission(ctx, "read:products", "get_product");
        const product = await service.get(ctx.workspaceId, id);
        return { content: [{ type: "text", text: JSON.stringify(product, null, 2) }] };
      },
    );

    server.tool(
      "create_product",
      "Create a product in your workspace",
      {
        name: z.string().min(1),
        kind: z.enum([
          "service",
          "property",
          "vehicle",
          "job",
          "insurance",
          "physical_good",
          "subscription",
          "other",
        ]),
        description: z.string().optional(),
        sku: z.string().optional(),
        unitPrice: z.number().optional(),
        currency: z.string().optional(),
      },
      async (input) => {
        requirePermission(ctx, "write:products", "create_product");
        const product = await service.create(ctx.workspaceId, input);
        return { content: [{ type: "text", text: JSON.stringify(product, null, 2) }] };
      },
    );

    server.tool(
      "update_product",
      "Update a product in your workspace",
      {
        id: z.string(),
        name: z.string().min(1),
        kind: z.enum([
          "service",
          "property",
          "vehicle",
          "job",
          "insurance",
          "physical_good",
          "subscription",
          "other",
        ]),
        description: z.string().optional(),
        sku: z.string().optional(),
        unitPrice: z.number().optional(),
        currency: z.string().optional(),
      },
      async ({ id, ...data }) => {
        requirePermission(ctx, "write:products", "update_product");
        const product = await service.update(ctx.workspaceId, id, data);
        return { content: [{ type: "text", text: JSON.stringify(product, null, 2) }] };
      },
    );
  }
}

export const productTools = ProductTools.getInstance();
