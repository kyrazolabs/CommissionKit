import { useState, useCallback } from "react";

export type SortDirection = "asc" | "desc" | null;

export interface TableSortState<TColumnKey extends string> {
  column: TColumnKey | null;
  direction: SortDirection;
}

export interface UseTableSortReturn<TColumnKey extends string> {
  sort: TableSortState<TColumnKey>;
  getSortHandler: (column: TColumnKey) => () => void;
  sortedData: <T>(data: T[], getSortValue: (row: T, column: TColumnKey) => string | number) => T[];
}

// ── Pure sort helpers (no React) ─────────────────────────────────────────────

export function computeNextSort(
  current: TableSortState<string>,
  column: string
): TableSortState<string> {
  if (current.column !== column) {
    return { column, direction: "desc" };
  }
  if (current.direction === "desc") {
    return { column, direction: "asc" };
  }
  return { column: null, direction: null };
}

export function applySort<T>(
  data: T[],
  sort: TableSortState<string>,
  getSortValue: (row: T, column: string) => string | number
): T[] {
  if (!sort.column || !sort.direction) return data;

  return [...data].sort((a, b) => {
    const aVal = getSortValue(a, sort.column!);
    const bVal = getSortValue(b, sort.column!);

    if (typeof aVal === "number" && typeof bVal === "number") {
      return sort.direction === "asc" ? aVal - bVal : bVal - aVal;
    }

    const aStr = String(aVal);
    const bStr = String(bVal);
    const cmp = aStr.localeCompare(bStr);
    return sort.direction === "asc" ? cmp : -cmp;
  });
}

// ── React hook ─────────────────────────────────────────────────────────────────

export function useTableSort<TColumnKey extends string>(
  initialColumn?: TColumnKey,
  initialDirection?: SortDirection
): UseTableSortReturn<TColumnKey> {
  const [sort, setSort] = useState<TableSortState<TColumnKey>>({
    column: initialColumn ?? null,
    direction: initialDirection ?? null,
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const getSortHandler = (column: TColumnKey) => () => {
    setSort((prev) => computeNextSort(prev as TableSortState<string>, column) as TableSortState<TColumnKey>);
  };

  const sortedData = useCallback(
    <T,>(data: T[], getSortValue: (row: T, column: TColumnKey) => string | number): T[] => {
      return applySort(data, sort as TableSortState<string>, getSortValue as (row: T, column: string) => string | number);
    },
    [sort]
  );

  return { sort, getSortHandler, sortedData };
}
