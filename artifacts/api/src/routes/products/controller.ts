import {
  CreateProductBody,
  DeleteProductParams,
  GetProductParams,
  ListProductsQueryParams,
  UpdateProductBody,
  UpdateProductParams,
} from "@workspace/api-zod";
import type { Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth";
import { ProductHttpError, ProductService } from "./service";

export class ProductController {
  private static instance: ProductController | undefined;

  private constructor(private readonly service: ProductService = ProductService.getInstance()) {}

  static getInstance(): ProductController {
    if (!ProductController.instance) {
      ProductController.instance = new ProductController();
    }
    return ProductController.instance;
  }

  private respondError(res: Response, err: unknown): boolean {
    if (err instanceof ProductHttpError) {
      res.status(err.statusCode).json({ error: err.message });
      return true;
    }
    return false;
  }

  list = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const query = ListProductsQueryParams.parse(req.query);
    const result = await this.service.list(req.workspaceId!, query);
    res.json(result);
  };

  create = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const body = CreateProductBody.parse(req.body);
    try {
      const product = await this.service.create(req.workspaceId!, body);
      res.status(201).json(product);
    } catch (err) {
      if (!this.respondError(res, err)) throw err;
    }
  };

  get = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = GetProductParams.parse(req.params);
    try {
      const product = await this.service.get(req.workspaceId!, id);
      res.json(product);
    } catch (err) {
      if (!this.respondError(res, err)) throw err;
    }
  };

  update = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = UpdateProductParams.parse(req.params);
    const body = UpdateProductBody.parse(req.body);
    try {
      const product = await this.service.update(req.workspaceId!, id, body);
      res.json(product);
    } catch (err) {
      if (!this.respondError(res, err)) throw err;
    }
  };

  delete = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = DeleteProductParams.parse(req.params);
    try {
      await this.service.delete(req.workspaceId!, id);
      res.status(204).send();
    } catch (err) {
      if (!this.respondError(res, err)) throw err;
    }
  };

  uploadImage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = GetProductParams.parse(req.params);
    const buffer = req.body instanceof Buffer ? new Uint8Array(req.body) : new Uint8Array();
    try {
      const product = await this.service.uploadImage(
        req.workspaceId!,
        id,
        buffer,
        req.headers["content-type"],
      );
      res.json(product);
    } catch (err) {
      if (!this.respondError(res, err)) throw err;
    }
  };

  getImage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = GetProductParams.parse(req.params);
    try {
      const image = await this.service.getImage(req.workspaceId!, id);
      res.setHeader("Content-Type", image.contentType);
      res.setHeader("Cache-Control", "private, max-age=3600");
      res.send(Buffer.from(image.body));
    } catch (err) {
      if (!this.respondError(res, err)) throw err;
    }
  };
}

export const productController = ProductController.getInstance();
