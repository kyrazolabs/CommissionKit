import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./button";

interface DataPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}

export function DataPagination({ page, totalPages, total, limit, onPageChange }: DataPaginationProps) {
  if (totalPages <= 1) return null;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  return (
    <div className="flex items-center justify-between">
      <p className="text-[13px] text-muted-foreground tabular-nums">
        Showing {from}–{to} of {total} items
      </p>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)} className="size-8 p-0">
          <ChevronLeft className="size-4" />
        </Button>
        <span className="text-[13px] tabular-nums px-2">Page {page} of {totalPages}</span>
        <Button variant="ghost" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} className="size-8 p-0">
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
