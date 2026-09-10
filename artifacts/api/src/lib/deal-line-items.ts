import { Product } from "@workspace/db";
import { Types } from "mongoose";
import { ProductHttpError } from "../routes/products/service";

export interface IncomingLineItem {
  productId: string;
  quantity: number;
}

export interface SnapshotLineItem {
  productId: Types.ObjectId;
  name: string;
  sku?: string;
  kind?: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export async function snapshotLineItems(
  workspaceId: string,
  items: IncomingLineItem[],
): Promise<SnapshotLineItem[]> {
  if (items.length === 0) return [];

  const ids = items.map((item) => new Types.ObjectId(item.productId));
  const products = await Product.find({
    _id: { $in: ids },
    workspaceId: new Types.ObjectId(workspaceId),
  });
  const byId = new Map(products.map((product) => [product._id.toString(), product]));

  return items.map((item) => {
    const product = byId.get(item.productId);
    if (!product) {
      throw new ProductHttpError("One or more products were not found in this workspace", 400);
    }
    const quantity = Number(item.quantity);
    if (!(quantity > 0)) {
      throw new ProductHttpError("Line item quantity must be greater than 0", 400);
    }
    const unitPrice = product.unitPrice ?? 0;
    return {
      productId: product._id,
      name: product.name,
      sku: product.sku ?? undefined,
      kind: product.kind,
      quantity,
      unitPrice,
      amount: quantity * unitPrice,
    };
  });
}

export function sumLineItems(items: SnapshotLineItem[]): number {
  return items.reduce((total, item) => total + item.amount, 0);
}

export function formatLineItems(items: unknown): Array<{
  productId: string;
  name: string;
  sku: string | null;
  kind: string | null;
  quantity: number;
  unitPrice: number;
  amount: number;
}> {
  if (!Array.isArray(items)) return [];
  return items.map((item) => {
    const row = item as SnapshotLineItem;
    return {
      productId: row.productId?.toString() ?? "",
      name: row.name,
      sku: row.sku ?? null,
      kind: row.kind ?? null,
      quantity: row.quantity,
      unitPrice: row.unitPrice,
      amount: row.amount,
    };
  });
}
