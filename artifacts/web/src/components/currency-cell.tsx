import { format } from "date-fns";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatCurrency } from "@/lib/format";

interface CurrencyCellProps {
  /** The primary value to display (in dealCurrency) */
  amount: number;
  /** The currency of the primary value */
  currency: string;
  /** Workspace currency (target for conversion display) */
  wsCurrency?: string | null;
  /** Amount converted to wsCurrency (from snapshot) */
  convertedAmount?: number | null;
  /** 1 <currency> = exchangeRateSnapshot <wsCurrency> */
  exchangeRateSnapshot?: number | null;
  /** ISO date string of when the rate was captured */
  rateSnapshotDate?: string | null;
  className?: string;
}

/**
 * Displays a currency amount with an optional dashed underline + tooltip that shows
 * the converted value in the workspace currency and the rate that was used at calc time.
 *
 * The tooltip is only shown when:
 *  - The deal currency differs from the workspace currency, AND
 *  - Snapshot data is available (i.e. deal was calculated after multi-currency update)
 */
export function CurrencyCell({
  amount,
  currency,
  wsCurrency,
  convertedAmount,
  exchangeRateSnapshot,
  rateSnapshotDate,
  className,
}: CurrencyCellProps) {
  const hasConversion =
    wsCurrency &&
    wsCurrency !== currency &&
    convertedAmount != null &&
    exchangeRateSnapshot != null;

  const primaryDisplay = formatCurrency(amount, currency);

  if (!hasConversion) {
    return <span className={className}>{primaryDisplay}</span>;
  }

  const captureLabel = rateSnapshotDate
    ? format(new Date(rateSnapshotDate), "MMM d, yyyy 'at' HH:mm 'UTC'")
    : "unknown date";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={className}
          style={{
            borderBottom: "1.5px dashed currentColor",
            textDecorationThickness: "1px",
            cursor: "help",
            paddingBottom: "1px",
          }}
        >
          {primaryDisplay}
        </span>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="max-w-xs text-xs space-y-1 p-3"
        sideOffset={6}
      >
        <p className="font-semibold">
          ≈ {formatCurrency(convertedAmount, wsCurrency)}
        </p>
        <p className="text-background/80 dark:text-popover-foreground/80">
          1 {currency} = {exchangeRateSnapshot.toFixed(6)} {wsCurrency}
        </p>
        <p className="text-background/70 dark:text-popover-foreground/70 text-[10px]">
          Rate captured {captureLabel}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
