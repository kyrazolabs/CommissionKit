import { useQueryClient } from "@tanstack/react-query";
import {
  type Product,
  type ProductKind,
  useCreateProduct,
  useDeleteProduct,
  useListProducts,
  useUpdateProduct,
} from "@workspace/api-client-react";
import { AnimatePresence, motion } from "framer-motion";
import { Edit, ImagePlus, Package, Plus, Trash, X } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { CurrencyCombobox } from "@/components/currency-combobox";
import { NumberInput } from "@/components/number-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataPagination } from "@/components/ui/data-pagination";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { usePageMeta } from "@/hooks/use-page-meta";
import { useRole } from "@/hooks/use-role";
import { useSyncStore } from "@/hooks/use-sync-store";
import { useToast } from "@/hooks/use-toast";
import { useWorkspace } from "@/hooks/use-workspace";
import { rawFetch } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

const PRODUCT_KINDS: ProductKind[] = [
  "service",
  "property",
  "vehicle",
  "job",
  "insurance",
  "physical_good",
  "subscription",
  "other",
];

const PAGE_LIMIT = 12;

export function ProductsPage() {
  const { t } = useTranslation();
  usePageMeta({
    title: t("products.title"),
    description: t("products.description"),
    robots: "noindex, nofollow",
  });
  const { hasPermission, isLoading: roleLoading } = useRole();
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState<string>("all");
  const [page, setPage] = useState(1);

  const params = {
    search: search.trim() || undefined,
    kind: kind === "all" ? undefined : (kind as ProductKind),
    page: String(page),
    limit: String(PAGE_LIMIT),
  };
  const { data: result, isLoading } = useListProducts(params);
  const products = result?.data ?? [];
  const pagination = result?.pagination;

  useEffect(() => {
    setPage(1);
  }, [search, kind]);

  if (roleLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!hasPermission("products", "read")) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
        <Package className="size-10 text-muted-foreground" />
        <h2 className="text-lg font-semibold">{t("products.accessDenied")}</h2>
        <p className="text-sm text-muted-foreground">{t("products.noPermission")}</p>
      </div>
    );
  }

  const openCreate = () => {
    setEditingProduct(undefined);
    setFormOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setFormOpen(true);
  };

  return (
    <div className="relative h-full min-h-0">
      <div className="h-full overflow-y-auto custom-scrollbar px-6 py-6 lg:px-10 lg:py-8">
      <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <p className="text-[12px] font-semibold text-primary mb-1">{t("products.operations")}</p>
          <h1 className="text-3xl font-semibold tracking-tight">{t("products.title")}</h1>
          <p className="text-muted-foreground">{t("products.description")}</p>
        </div>
        {hasPermission("products", "create") && (
          <Button onClick={openCreate}>
            <Plus className="mr-2 size-4" />
            {t("products.createProduct")}
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("products.searchPlaceholder")}
          className="sm:max-w-xs"
        />
        <Select value={kind} onValueChange={setKind}>
          <SelectTrigger className="sm:w-48">
            <SelectValue placeholder={t("products.allKinds")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("products.allKinds")}</SelectItem>
            {PRODUCT_KINDS.map((k) => (
              <SelectItem key={k} value={k}>
                {t(`products.kinds.${k}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <Skeleton className="aspect-[16/10] w-full rounded-t-xl" />
              <CardHeader>
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 bg-muted/30 rounded-xl border border-dashed">
          <div className="bg-muted size-12 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="size-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">{t("products.emptyTitle")}</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-6 max-w-sm mx-auto">
            {t("products.emptyDescription")}
          </p>
          {hasPermission("products", "create") && (
            <Button onClick={openCreate}>
              <Plus className="mr-2 size-4" />
              {t("products.createProduct")}
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} onEdit={openEdit} />
            ))}
          </div>
          {pagination && (
            <DataPagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              limit={pagination.limit}
              onPageChange={setPage}
            />
          )}
        </>
      )}
      </div>
      </div>

      <AnimatePresence>
        {formOpen && (
          <>
            <motion.button
              type="button"
              aria-label={t("products.cancel")}
              className="absolute inset-0 z-10 bg-foreground/10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setFormOpen(false)}
            />
            <motion.aside
              className="absolute inset-y-0 right-0 z-20 flex w-full max-w-[420px] flex-col border-l border-card-border bg-card shadow-lg"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
            >
              <ProductFormPanel
                open={formOpen}
                onOpenChange={setFormOpen}
                initialData={editingProduct}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function ProductPlaceholder({ src }: { src?: string | null }) {
  return (
    <div className="aspect-[16/10] bg-muted flex items-center justify-center border-b border-card-border overflow-hidden">
      {src ? (
        <img src={src} alt="" className="size-full object-cover" />
      ) : (
        <img src="/brand/logo-symbol.svg" alt="" className="size-10 opacity-70" />
      )}
    </div>
  );
}

function useProductImageSrc(product?: Product) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    if (!product?.hasImage) {
      setSrc(null);
      return;
    }
    let objectUrl: string | undefined;
    let cancelled = false;
    rawFetch(`/api/products/${product.id}/image`)
      .then(async (res) => {
        if (!res.ok || cancelled) return;
        const blob = await res.blob();
        objectUrl = URL.createObjectURL(blob);
        if (!cancelled) setSrc(objectUrl);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [product?.id, product?.hasImage]);
  return src;
}

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function ProductImageDropzone({
  previewSrc,
  onFile,
}: {
  previewSrc: string | null;
  onFile: (file: File) => void;
}) {
  const { t } = useTranslation();
  const fileInput = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const takeFile = (file?: File) => {
    if (!file || !IMAGE_TYPES.includes(file.type)) return;
    onFile(file);
  };

  return (
    <div className="space-y-2">
      <Label>{t("products.image")}</Label>
      <button
        type="button"
        onClick={() => fileInput.current?.click()}
        onDragEnter={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          takeFile(e.dataTransfer.files?.[0]);
        }}
        className={cn(
          "relative flex aspect-[16/10] w-full items-center justify-center overflow-hidden rounded-xl border border-dashed transition-colors",
          dragging
            ? "border-primary bg-primary/5"
            : "border-card-border bg-muted/40 hover:bg-muted/70",
        )}
      >
        {previewSrc ? (
          <>
            <img src={previewSrc} alt="" className="size-full object-cover" />
            <span className="absolute inset-x-0 bottom-0 bg-background/80 px-3 py-2 text-xs text-muted-foreground">
              {t("products.imageReplace")}
            </span>
          </>
        ) : (
          <span className="flex flex-col items-center gap-2 px-4 text-center">
            <span className="flex size-10 items-center justify-center rounded-full bg-muted">
              <ImagePlus className="size-5 text-muted-foreground" />
            </span>
            <span className="text-sm font-medium">{t("products.imageDrop")}</span>
            <span className="text-xs text-muted-foreground">{t("products.imageHint")}</span>
          </span>
        )}
      </button>
      <input
        ref={fileInput}
        type="file"
        accept={IMAGE_TYPES.join(",")}
        className="hidden"
        onChange={(e) => {
          takeFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}

function ProductCard({ product, onEdit }: { product: Product; onEdit: (product: Product) => void }) {
  const { t } = useTranslation();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { hasPermission } = useRole();
  const imageSrc = useProductImageSrc(product);
  const deleteMutation = useDeleteProduct({
    mutation: {
      onError: () => {
        useSyncStore.getState().setSyncError(true);
        toast({
          title: t("products.deleteFailed"),
          variant: "destructive",
        });
      },
      onSuccess: () => {
        useSyncStore.getState().setSyncError(false);
        toast({ title: t("products.deleted") });
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      },
    },
  });

  return (
    <Card className="flex flex-col overflow-hidden">
      <ProductPlaceholder src={imageSrc} />
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="text-lg truncate">{product.name}</CardTitle>
            <CardDescription className="mt-1 flex items-center gap-2 flex-wrap">
              <Badge variant="outline">{t(`products.kinds.${product.kind}`)}</Badge>
              {product.status === "archived" && (
                <Badge variant="secondary">{t("products.statusArchived")}</Badge>
              )}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-2">
        {product.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
        )}
        {product.sku && (
          <p className="text-xs text-muted-foreground font-mono">{product.sku}</p>
        )}
        {product.unitPrice != null && (
          <p className="text-lg font-semibold tabular-nums">
            {formatCurrency(product.unitPrice, product.currency)}
          </p>
        )}
      </CardContent>
      {(hasPermission("products", "edit") || hasPermission("products", "delete")) && (
        <CardFooter className="border-t bg-muted/20 pt-4 flex justify-between">
          {hasPermission("products", "edit") ? (
            <Button variant="outline" size="sm" onClick={() => onEdit(product)}>
              <Edit className="size-4 mr-2" /> {t("common.edit")}
            </Button>
          ) : (
            <div />
          )}
          {hasPermission("products", "delete") && (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive aspect-square p-1"
              onClick={() => setIsDeleteOpen(true)}
            >
              <Trash className="size-4" />
            </Button>
          )}
        </CardFooter>
      )}

      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title={t("products.deleteTitle")}
        description={t("products.deleteDescription", { name: product.name })}
        confirmLabel={t("products.delete")}
        cancelLabel={t("products.cancel")}
        onConfirm={() => deleteMutation.mutate({ id: product.id })}
        loading={deleteMutation.isPending}
      />
    </Card>
  );
}

function ProductFormPanel({
  open,
  onOpenChange,
  initialData,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Product;
}) {
  const { t } = useTranslation();
  const isEditing = !!initialData;
  const { activeWorkspace } = useWorkspace();
  const [name, setName] = useState(initialData?.name || "");
  const [kind, setKind] = useState<ProductKind>(initialData?.kind || "service");
  const [description, setDescription] = useState(initialData?.description || "");
  const [sku, setSku] = useState(initialData?.sku || "");
  const [unitPrice, setUnitPrice] = useState(
    initialData?.unitPrice != null ? String(initialData.unitPrice) : "",
  );
  const [currency, setCurrency] = useState(
    initialData?.currency || activeWorkspace?.currency || "USD",
  );
  const [status, setStatus] = useState<"active" | "archived">(initialData?.status || "active");
  const [attributes, setAttributes] = useState<Record<string, string>>(
    stringifyAttrs(initialData?.attributes),
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const existingImageSrc = useProductImageSrc(initialData);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createMutation = useCreateProduct({
    mutation: {
      onError: () => {
        useSyncStore.getState().setSyncError(true);
        toast({ title: t("products.createFailed"), variant: "destructive" });
        onOpenChange(true);
      },
      onSuccess: () => {
        useSyncStore.getState().setSyncError(false);
        toast({ title: t("products.created") });
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      },
    },
  });

  const updateMutation = useUpdateProduct({
    mutation: {
      onError: () => {
        useSyncStore.getState().setSyncError(true);
        toast({ title: t("products.updateFailed"), variant: "destructive" });
        onOpenChange(true);
      },
      onSuccess: () => {
        useSyncStore.getState().setSyncError(false);
        toast({ title: t("products.updated") });
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      },
    },
  });

  useEffect(() => {
    if (!open) return;
    setName(initialData?.name || "");
    setKind(initialData?.kind || "service");
    setDescription(initialData?.description || "");
    setSku(initialData?.sku || "");
    setUnitPrice(initialData?.unitPrice != null ? String(initialData.unitPrice) : "");
    setCurrency(initialData?.currency || activeWorkspace?.currency || "USD");
    setStatus(initialData?.status || "active");
    setAttributes(stringifyAttrs(initialData?.attributes));
    setImageFile(null);
    setImagePreview(null);
  }, [open, initialData, activeWorkspace?.currency]);

  useEffect(() => {
    if (!imageFile) {
      setImagePreview(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const parsedPrice = unitPrice.trim() === "" ? null : Number(unitPrice);
    const payload = {
      name: name.trim(),
      kind,
      description: description.trim() || null,
      sku: sku.trim() || null,
      unitPrice: parsedPrice != null && !Number.isNaN(parsedPrice) ? parsedPrice : null,
      currency,
      status,
      attributes: parseAttrs(kind, attributes),
    };
    try {
      let productId = initialData?.id;
      if (isEditing && initialData) {
        await updateMutation.mutateAsync({ id: initialData.id, data: payload });
      } else {
        const created = await createMutation.mutateAsync({ data: payload });
        productId = created.id;
      }
      if (imageFile && productId) {
        const res = await rawFetch(`/api/products/${productId}/image`, {
          method: "POST",
          headers: { "Content-Type": imageFile.type },
          body: imageFile,
        });
        if (!res.ok) {
          throw new Error(t("products.imageFailed"));
        }
        queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      }
      onOpenChange(false);
    } catch {
      onOpenChange(true);
    }
  };

  const pending = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="flex h-full min-h-0 flex-col">
      <div className="flex items-start justify-between gap-3 border-b border-card-border px-5 py-4">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold tracking-tight">
            {isEditing ? t("products.editProduct") : t("products.createProduct")}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">{t("products.formDescription")}</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="aspect-square p-1 shrink-0"
          onClick={() => onOpenChange(false)}
        >
          <X className="size-4" />
        </Button>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar px-5 py-4">
            <ProductImageDropzone
              previewSrc={imagePreview || existingImageSrc}
              onFile={setImageFile}
            />
            <div className="space-y-2">
              <Label htmlFor="product-name">{t("products.name")}</Label>
              <Input
                id="product-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("products.namePlaceholder")}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>{t("products.kind")}</Label>
              <Select
                value={kind}
                onValueChange={(value) => {
                  setKind(value as ProductKind);
                  setAttributes({});
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("products.selectKind")} />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_KINDS.map((k) => (
                    <SelectItem key={k} value={k}>
                      {t(`products.kinds.${k}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-description">{t("products.descriptionLabel")}</Label>
              <Textarea
                id="product-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("products.descriptionPlaceholder")}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product-sku">{t("products.sku")}</Label>
                <Input
                  id="product-sku"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder={t("products.skuPlaceholder")}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("products.status")}</Label>
                <Select
                  value={status}
                  onValueChange={(value) => setStatus(value as "active" | "archived")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{t("products.statusActive")}</SelectItem>
                    <SelectItem value="archived">{t("products.statusArchived")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product-price">{t("products.unitPrice")}</Label>
                <NumberInput
                  id="product-price"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("products.currency")}</Label>
                <CurrencyCombobox value={currency} onChange={setCurrency} />
              </div>
            </div>
            <KindAttributeFields kind={kind} values={attributes} onChange={setAttributes} />
      </div>
      <div className="flex justify-end gap-2 border-t border-card-border px-5 py-4">
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          {t("products.cancel")}
        </Button>
        <Button type="submit" disabled={pending || !name.trim()}>
          {isEditing ? t("products.save") : t("products.create")}
        </Button>
      </div>
    </form>
  );
}

function stringifyAttrs(attrs?: Record<string, unknown> | null): Record<string, string> {
  if (!attrs) return {};
  const next: Record<string, string> = {};
  for (const [key, value] of Object.entries(attrs)) {
    if (value == null) continue;
    next[key] = String(value);
  }
  return next;
}

function parseAttrs(kind: ProductKind, values: Record<string, string>): Record<string, unknown> {
  const numeric = new Set([
    "durationHours",
    "bedrooms",
    "bathrooms",
    "year",
    "coverageAmount",
    "weightKg",
    "seats",
  ]);
  const result: Record<string, unknown> = {};
  for (const field of KIND_FIELDS[kind] ?? []) {
    const raw = values[field]?.trim();
    if (!raw) continue;
    result[field] = numeric.has(field) ? Number(raw) : raw;
  }
  return result;
}

const KIND_FIELDS: Record<ProductKind, string[]> = {
  service: ["durationHours", "billingCycle"],
  property: ["address", "bedrooms", "bathrooms", "listingType"],
  vehicle: ["make", "model", "year", "vin"],
  job: ["roleTitle", "employmentType"],
  insurance: ["policyType", "coverageAmount"],
  physical_good: ["manufacturer", "weightKg"],
  subscription: ["interval", "seats"],
  other: [],
};

const KIND_SELECTS: Record<string, string[]> = {
  billingCycle: ["one_time", "monthly", "quarterly", "yearly"],
  listingType: ["sale", "rent"],
  employmentType: ["full_time", "part_time", "contract"],
  interval: ["monthly", "quarterly", "yearly"],
};

function KindAttributeFields({
  kind,
  values,
  onChange,
}: {
  kind: ProductKind;
  values: Record<string, string>;
  onChange: (values: Record<string, string>) => void;
}) {
  const { t } = useTranslation();
  const fields = KIND_FIELDS[kind] ?? [];
  if (fields.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {fields.map((field) => {
        const options = KIND_SELECTS[field];
        return (
          <div key={field} className="space-y-2">
            <Label htmlFor={`attr-${field}`}>{t(`products.attrs.${field}`)}</Label>
            {options ? (
              <Select
                value={values[field] || undefined}
                onValueChange={(value) => onChange({ ...values, [field]: value })}
              >
                <SelectTrigger id={`attr-${field}`}>
                  <SelectValue placeholder={t("products.selectKind")} />
                </SelectTrigger>
                <SelectContent>
                  {options.map((option) => (
                    <SelectItem key={option} value={option}>
                      {t(`products.attrValues.${option}`, option)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id={`attr-${field}`}
                value={values[field] || ""}
                onChange={(e) => onChange({ ...values, [field]: e.target.value })}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
