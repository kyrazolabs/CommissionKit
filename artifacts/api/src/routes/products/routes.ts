import express, { Router } from "express";
import { requirePermission } from "../../middleware/auth";
import { ProductController } from "./controller";

const router = Router();
const controller = ProductController.getInstance();

router.get("/products", ...requirePermission("products", "read"), controller.list);
router.post("/products", ...requirePermission("products", "create"), controller.create);
router.get("/products/:id", ...requirePermission("products", "read"), controller.get);
router.put("/products/:id", ...requirePermission("products", "edit"), controller.update);
router.delete("/products/:id", ...requirePermission("products", "delete"), controller.delete);
router.get("/products/:id/image", ...requirePermission("products", "read"), controller.getImage);
router.post(
  "/products/:id/image",
  ...requirePermission("products", "edit"),
  express.raw({
    type: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    limit: "2mb",
  }),
  controller.uploadImage,
);

export default router;
