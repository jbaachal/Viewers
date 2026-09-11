import React from 'react';
import { Button, Icons } from '@ohif/ui-next';

export function WorklistPagination({
  page,
  pageCount,
  total,
  pageSize,
  onPageChange,
}: {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  const first = total ? (page - 1) * pageSize + 1 : 0;
  const last = Math.min(page * pageSize, total);
  return (
    <div className="border-input/50 flex items-center justify-between border-t px-4 py-3">
      <span className="text-muted-foreground text-xs">
        Showing {first}–{last} of {total} studies
      </span>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          <Icons.ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-foreground min-w-16 text-center text-xs tabular-nums">
          {page} / {pageCount}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8"
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          <Icons.ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
