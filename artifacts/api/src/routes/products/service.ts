import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { Deal, parseProductAttributes, Product } from "@workspace/db";
import { Types } from "mongoose";
import { assertProductImage, resizeProductImage } from "../../lib/product-image";
import { getS3Bucket, getS3Client, isS3Configured } from "../../lib/s3";

export class ProductHttpError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "ProductHttpError";
    this.statusCode = statusCode;
  }
}

export interface ProductListQuery {
  search?: string;
  kind?: string;
  status?: string;
  page?: string;
  limit?: string;
}

export interface ProductWriteInput {
  name: string;
  kind: string;
  description?: string | null;
  sku?: string | null;
  unitPrice?: number | null;
  currency?: string;
  status?: string;
  attributes?: Record<string, unknown> | null;
}

export interface FormattedProduct {
  id: string;
  name: string;
  kind: string;
  description: string | null;
  sku: string | null;
  unitPrice: number | null;
  currency: string;
  status: string;
  attributes: Record<string, unknown>;
  hasImage: boolean;
  createdAt: string;
}

interface ProductDoc {
  _id: Types.ObjectId;
  name: string;
  kind: string;
  description?: string | null;
  sku?: string | null;
  unitPrice?: number | null;
  currency: string;
  status: string;
  attributes?: Record<string, unknown> | null;
  imageKey?: string | null;
  createdAt: Date;
}

function formatProduct(doc: ProductDoc): FormattedProduct {
  return {
    id: doc._id.toString(),
    name: doc.name,
    kind: doc.kind,
    description: doc.description ?? null,
    sku: doc.sku ?? null,
    unitPrice: doc.unitPrice ?? null,
    currency: doc.currency,
    status: doc.status,
    attributes: doc.attributes ?? {},
    hasImage: Boolean(doc.imageKey),
    createdAt: doc.createdAt.toISOString(),
  };
}

function normalizeSku(sku?: string | null): string | undefined {
  const trimmed = sku?.trim();
  return trimmed ? trimmed : undefined;
}

function isDuplicateSkuError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: number }).code === 11000
  );
}

function parseAttributes(kind: string, attributes?: Record<string, unknown> | null) {
  try {
    return parseProductAttributes(kind, attributes);
  } catch {
    throw new ProductHttpError("Invalid attributes for this product type", 400);
  }
}

export class ProductService {
  private static instance: ProductService | undefined;

  private constructor() {}

  static getInstance(): ProductService {
    if (!ProductService.instance) {
      ProductService.instance = new ProductService();
    }
    return ProductService.instance;
  }

  async list(workspaceId: string, query: ProductListQuery) {
    const conditions: Record<string, unknown> = {
      workspaceId: new Types.ObjectId(workspaceId),
    };

    if (query.kind) conditions.kind = query.kind;
    if (query.status) conditions.status = query.status;
    if (query.search?.trim()) {
      const searchRegex = new RegExp(query.search.trim(), "i");
      conditions.$or = [{ name: searchRegex }, { sku: searchRegex }, { description: searchRegex }];
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(500, Math.max(1, Number(query.limit) || 50));
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find(conditions).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Product.countDocuments(conditions),
    ]);

    return {
      data: products.map(formatProduct),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async get(workspaceId: string, id: string): Promise<FormattedProduct> {
    const product = await Product.findOne({
      _id: new Types.ObjectId(id),
      workspaceId: new Types.ObjectId(workspaceId),
    });
    if (!product) {
      throw new ProductHttpError("Product not found", 404);
    }
    return formatProduct(product);
  }

  async create(workspaceId: string, body: ProductWriteInput): Promise<FormattedProduct> {
    const attributes = parseAttributes(body.kind, body.attributes);
    try {
      const product = await Product.create({
        workspaceId: new Types.ObjectId(workspaceId),
        name: body.name,
        kind: body.kind,
        description: body.description ?? undefined,
        sku: normalizeSku(body.sku),
        unitPrice: body.unitPrice ?? undefined,
        currency: body.currency ?? "USD",
        status: body.status ?? "active",
        attributes,
      });
      return formatProduct(product);
    } catch (err) {
      if (isDuplicateSkuError(err)) {
        throw new ProductHttpError("A product with this SKU already exists in this workspace", 409);
      }
      throw err;
    }
  }

  async update(workspaceId: string, id: string, body: ProductWriteInput): Promise<FormattedProduct> {
    const sku = normalizeSku(body.sku);
    const attributes = parseAttributes(body.kind, body.attributes);
    const $set: Record<string, unknown> = {
      name: body.name,
      kind: body.kind,
      description: body.description ?? undefined,
      unitPrice: body.unitPrice ?? undefined,
      currency: body.currency ?? "USD",
      status: body.status ?? "active",
      attributes,
    };
    if (sku) $set.sku = sku;

    const update: Record<string, unknown> = { $set };
    if (!sku) update.$unset = { sku: 1 };

    try {
      const product = await Product.findOneAndUpdate(
        { _id: new Types.ObjectId(id), workspaceId: new Types.ObjectId(workspaceId) },
        update,
        { new: true },
      );

      if (!product) {
        throw new ProductHttpError("Product not found", 404);
      }
      return formatProduct(product);
    } catch (err) {
      if (err instanceof ProductHttpError) throw err;
      if (isDuplicateSkuError(err)) {
        throw new ProductHttpError("A product with this SKU already exists in this workspace", 409);
      }
      throw err;
    }
  }

  async delete(workspaceId: string, id: string): Promise<void> {
    const existing = await Product.findOne({
      _id: new Types.ObjectId(id),
      workspaceId: new Types.ObjectId(workspaceId),
    });
    if (!existing) {
      throw new ProductHttpError("Product not found", 404);
    }

    const referenced = await Deal.exists({
      workspaceId: new Types.ObjectId(workspaceId),
      "lineItems.productId": existing._id,
    });
    if (referenced) {
      throw new ProductHttpError("Product is used on one or more deals and cannot be deleted", 409);
    }

    await Product.deleteOne({ _id: existing._id });
  }

  async uploadImage(
    workspaceId: string,
    id: string,
    buffer: Uint8Array,
    contentType: string | undefined,
  ): Promise<FormattedProduct> {
    try {
      assertProductImage(contentType, buffer.byteLength);
    } catch (err) {
      throw new ProductHttpError(err instanceof Error ? err.message : "Invalid image", 400);
    }

    if (!isS3Configured()) {
      throw new ProductHttpError("Image storage is not configured", 503);
    }

    const product = await Product.findOne({
      _id: new Types.ObjectId(id),
      workspaceId: new Types.ObjectId(workspaceId),
    });
    if (!product) {
      throw new ProductHttpError("Product not found", 404);
    }

    let resized: Uint8Array;
    try {
      resized = await resizeProductImage(buffer);
    } catch {
      throw new ProductHttpError("Could not process image", 400);
    }

    const key = `products/${workspaceId}/${id}/image.webp`;
    const bucket = getS3Bucket()!;
    await getS3Client().send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: resized,
        ContentType: "image/webp",
      }),
    );

    product.imageKey = key;
    await product.save();
    return formatProduct(product);
  }

  async getImage(
    workspaceId: string,
    id: string,
  ): Promise<{ body: Uint8Array; contentType: string }> {
    const product = await Product.findOne({
      _id: new Types.ObjectId(id),
      workspaceId: new Types.ObjectId(workspaceId),
    });
    if (!product?.imageKey) {
      throw new ProductHttpError("Product image not found", 404);
    }
    if (!isS3Configured()) {
      throw new ProductHttpError("Image storage is not configured", 503);
    }

    const result = await getS3Client().send(
      new GetObjectCommand({
        Bucket: getS3Bucket()!,
        Key: product.imageKey,
      }),
    );
    const bytes = result.Body ? new Uint8Array(await result.Body.transformToByteArray()) : new Uint8Array();
    return { body: bytes, contentType: result.ContentType || "image/webp" };
  }
}

export const productService = ProductService.getInstance();
