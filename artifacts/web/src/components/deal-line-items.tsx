import type { Product } from "@workspace/api-client-react";
import { Trash } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ProductCombobox } from "@/components/product-combobox";
import { NumberInput } from "@/components/number-input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/format";

export interface DealLineDraft {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

interface DealLineItemsEditorProps {
  lines: DealLineDraft[];
  onChange: (lines: DealLineDraft[]) => void;
  currency: string;
}

export function DealLineItemsEditor({ lines, onChange, currency }: DealLineItemsEditorProps) {
  const { t } = useTranslation();
  const total = lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);

  const updateLine = (index: number, patch: Partial<DealLineDraft>) => {
    onChange(lines.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  };

  const addProduct = (product: Product | null) => {
    if (!product) return;
    if (lines.some((line) => line.productId === product.id)) return;
    onChange([
      ...lines,
      {
        productId: product.id,
        name: product.name,
        quantity: 1,
        unitPrice: product.unitPrice ?? 0,
      },
    ]);
  };

  return (
    <div className="space-y-3">
      <Label>{t("deals.lineItems")}</Label>
      <ProductCombobox value="" onChange={addProduct} />
      {lines.length > 0 && (
        <div className="space-y-2">
          {lines.map((line, index) => (
            <div key={line.productId} className="flex items-center gap-2">
              <p className="flex-1 text-sm truncate">{line.name}</p>
              <NumberInput
                className="w-20"
                value={line.quantity}
                onChange={(e) =>
                  updateLine(index, { quantity: Math.max(1, Number(e.target.value) || 1) })
                }
              />
              <p className="w-24 text-right text-sm tabular-nums">
                {formatCurrency(line.quantity * line.unitPrice, currency)}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive aspect-square p-1"
                onClick={() => onChange(lines.filter((_, i) => i !== index))}
              >
                <Trash className="size-4" />
              </Button>
            </div>
          ))}
          <p className="text-sm font-semibold tabular-nums text-right">
            {t("deals.lineItemsTotal")}: {formatCurrency(total, currency)}
          </p>
        </div>
      )}
      {lines.length === 0 && (
        <p className="text-xs text-muted-foreground">{t("deals.lineItemsHint")}</p>
      )}
    </div>
  );
}

export function lineItemsPayload(lines: DealLineDraft[]) {
  return lines.map((line) => ({ productId: line.productId, quantity: line.quantity }));
}

export function lineItemsTotal(lines: DealLineDraft[]) {
  return lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
}
