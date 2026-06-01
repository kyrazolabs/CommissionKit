import { useState, useRef, useEffect, forwardRef } from "react";
import { cn } from "@/lib/utils";

function cleanNumber(value: string): string {
  let cleaned = value.replace(/[^0-9.\-]/g, "");
  const hasMinus = cleaned.startsWith("-");
  cleaned = cleaned.replace(/-/g, "");
  const dotIndex = cleaned.indexOf(".");
  if (dotIndex !== -1) {
    cleaned = cleaned.substring(0, dotIndex + 1) + cleaned.substring(dotIndex + 1).replace(/\./g, "");
  }
  return hasMinus ? "-" + cleaned : cleaned;
}

function formatLive(value: string, decimals: number): string {
  if (!value) return "";
  const cleaned = cleanNumber(value);
  if (!cleaned || cleaned === "-") return cleaned;

  const negative = cleaned.startsWith("-");
  const abs = negative ? cleaned.substring(1) : cleaned;

  const dotIdx = abs.indexOf(".");
  let intPart = abs;
  let decPart = "";

  if (dotIdx !== -1) {
    intPart = abs.substring(0, dotIdx);
    decPart = abs.substring(dotIdx + 1).replace(/\./g, "").substring(0, decimals);
  }

  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const prefix = negative ? "-" : "";

  if (dotIdx !== -1) {
    return `${prefix}${formattedInt}.${decPart}`;
  }
  return `${prefix}${formattedInt}`;
}

function getCursorAfterFormat(rawBeforeCursorLen: number, formatted: string): number {
  let pos = formatted.startsWith("-") ? 1 : 0;
  let rawIdx = 0;
  while (rawIdx < rawBeforeCursorLen && pos < formatted.length) {
    if (formatted[pos] === ",") {
      pos++;
      continue;
    }
    pos++;
    rawIdx++;
  }
  return pos;
}

function createEvent(e: React.ChangeEvent<HTMLInputElement>, raw: string): React.ChangeEvent<HTMLInputElement> {
  return {
    ...e,
    target: { ...e.target, value: raw },
    currentTarget: { ...e.currentTarget, value: raw },
  } as React.ChangeEvent<HTMLInputElement>;
}

export interface NumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange"> {
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  decimals?: number;
}

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  ({ value = "", onChange, onFocus, onBlur, decimals = 2, className, ...props }, ref) => {
    const innerRef = useRef<HTMLInputElement>(null);
    const resolvedRef = (ref || innerRef) as React.RefObject<HTMLInputElement>;
    const pendingCursorRef = useRef(-1);
    const focusTimeoutRef = useRef<number>(0);
    const [editing, setEditing] = useState<string | null>(null);

    const propRaw = cleanNumber(String(value ?? ""));
    const activeRaw = editing !== null ? editing : propRaw;
    const displayValue = formatLive(activeRaw, decimals);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setEditing(propRaw);
      window.clearTimeout(focusTimeoutRef.current);
      focusTimeoutRef.current = window.setTimeout(() => {
        e.target.select();
      }, 0);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setEditing(null);
      window.clearTimeout(focusTimeoutRef.current);
      onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const selStart = e.target.selectionStart ?? e.target.value.length;
      const rawBeforeCursor = cleanNumber(e.target.value.substring(0, selStart));
      pendingCursorRef.current = rawBeforeCursor.length;

      const raw = cleanNumber(e.target.value);
      setEditing(raw);
      onChange?.(createEvent(e, raw));
    };

    useEffect(() => {
      const el = resolvedRef.current;
      const pending = pendingCursorRef.current;
      if (!el || pending === -1 || document.activeElement !== el) return;
      pendingCursorRef.current = -1;
      const cursor = getCursorAfterFormat(pending, displayValue);
      try {
        el.setSelectionRange(cursor, cursor);
      } catch { /* ignore for invalid positions */ }
    });

    useEffect(() => {
      return () => window.clearTimeout(focusTimeoutRef.current);
    }, []);

    return (
      <input
        ref={resolvedRef}
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        {...props}
      />
    );
  }
);

NumberInput.displayName = "NumberInput";
