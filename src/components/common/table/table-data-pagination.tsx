// import type { Table } from "@tanstack/react-table";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface DataTablePaginationProps extends React.ComponentProps<"div"> {
  table?: any;
  pageSizeOptions?: number[];
  // Server-side pagination props
  offset?: number;
  limit?: number;
  totalCount?: number;
  onOffsetChange?: (offset: number) => void;
  onLimitChange?: (limit: number) => void;
}

export function DataTablePagination({
  table,
  pageSizeOptions = [10, 20, 30, 40, 50],
  className,
  offset,
  limit,
  totalCount,
  onOffsetChange,
  onLimitChange,
  ...props
}: DataTablePaginationProps) {
  // Determine if we're using server-side pagination
  const isServerSidePagination =
    offset !== undefined &&
    limit !== undefined &&
    totalCount !== undefined &&
    onOffsetChange !== undefined &&
    onLimitChange !== undefined;

  // Calculate values for server-side pagination
  const currentPage = isServerSidePagination
    ? Math.floor(offset / limit)
    : table?.getState().pagination.pageIndex ?? 0;
  const pageCount = isServerSidePagination
    ? Math.ceil(totalCount / limit)
    : table?.getPageCount() ?? 1;
  const currentPageSize = isServerSidePagination
    ? limit
    : table?.getState().pagination.pageSize ?? 10;
  const totalRows = isServerSidePagination
    ? totalCount
    : table?.getFilteredRowModel().rows.length ?? 0;
  const selectedRows = table?.getFilteredSelectedRowModel().rows.length ?? 0;

  const handlePageSizeChange = (value: string) => {
    const newLimit = Number(value);
    if (isServerSidePagination) {
      onLimitChange(newLimit);
      // Reset to first page when changing page size
      onOffsetChange(0);
    } else {
      table?.setPageSize(newLimit);
    }
  };

  const handleFirstPage = () => {
    if (isServerSidePagination) {
      onOffsetChange(0);
    } else {
      table?.setPageIndex(0);
    }
  };

  const handlePreviousPage = () => {
    if (isServerSidePagination) {
      onOffsetChange(Math.max(0, offset - limit));
    } else {
      table?.previousPage();
    }
  };

  const handleNextPage = () => {
    if (isServerSidePagination) {
      const newOffset = offset + limit;
      if (newOffset < totalCount) {
        onOffsetChange(newOffset);
      }
    } else {
      table?.nextPage();
    }
  };

  const handleLastPage = () => {
    if (isServerSidePagination) {
      const lastPageOffset = Math.floor((totalCount - 1) / limit) * limit;
      onOffsetChange(lastPageOffset);
    } else {
      table?.setPageIndex(pageCount - 1);
    }
  };

  const canPreviousPage = isServerSidePagination
    ? offset > 0
    : table?.getCanPreviousPage() ?? false;
  const canNextPage = isServerSidePagination
    ? offset + limit < totalCount
    : table?.getCanNextPage() ?? false;

  return (
    <div
      className={cn(
        "flex w-full flex-col-reverse items-center justify-between gap-4 overflow-auto p-1 sm:flex-row sm:gap-8",
        className
      )}
      {...props}
    >
      <div className="text-muted-foreground flex-1 text-sm whitespace-nowrap">
        {selectedRows > 0 ? (
          <>
            {selectedRows} of {totalRows} row(s) selected.
          </>
        ) : (
          <>{totalRows} row(s) total.</>
        )}
      </div>
      <div className="flex flex-col-reverse items-center gap-4 sm:flex-row sm:gap-6 lg:gap-8">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium whitespace-nowrap">Rows per page</p>
          <Select
            value={`${currentPageSize}`}
            onValueChange={handlePageSizeChange}
          >
            <SelectTrigger className="h-8 w-[4.5rem] [&[data-size]]:h-8">
              <SelectValue placeholder={currentPageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {pageSizeOptions.map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-center text-sm font-medium">
          Page {currentPage + 1} of {pageCount}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            aria-label="Go to first page"
            variant="outline"
            size="icon"
            className="hidden size-8 lg:flex"
            onClick={handleFirstPage}
            disabled={!canPreviousPage}
          >
            <ChevronsLeft />
          </Button>
          <Button
            aria-label="Go to previous page"
            variant="outline"
            size="icon"
            className="size-8"
            onClick={handlePreviousPage}
            disabled={!canPreviousPage}
          >
            <ChevronLeftIcon />
          </Button>
          <Button
            aria-label="Go to next page"
            variant="outline"
            size="icon"
            className="size-8"
            onClick={handleNextPage}
            disabled={!canNextPage}
          >
            <ChevronRightIcon />
          </Button>
          <Button
            aria-label="Go to last page"
            variant="outline"
            size="icon"
            className="hidden size-8 lg:flex"
            onClick={handleLastPage}
            disabled={!canNextPage}
          >
            <ChevronsRight />
          </Button>
        </div>
      </div>
    </div>
  );
}
