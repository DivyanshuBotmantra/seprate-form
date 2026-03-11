import { type Table as TanstackTable, flexRender } from "@tanstack/react-table";
import type * as React from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { DataTablePagination } from "./table-data-pagination";
import { getCommonPinningStyles } from "@/lib/data.table";
import { cn } from "@/lib/utils";

interface DataTableProps<TData> extends React.ComponentProps<"div"> {
  table: TanstackTable<TData>;
  actionBar?: React.ReactNode;
  pageSizeOptions?: number[];
  // Server-side pagination props
  offset?: number;
  limit?: number;
  totalCount?: number;
  onOffsetChange?: (offset: number) => void;
  onLimitChange?: (limit: number) => void;
}

export function DataTable<TData>({
  table,
  actionBar,
  children,
  className,
  pageSizeOptions,
  offset,
  limit,
  totalCount,
  onOffsetChange,
  onLimitChange,
  ...props
}: DataTableProps<TData>) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col rounded-lg h-full bg-sidebar p-2",
        className
      )}
      {...props}
    >
      {children}
      <div className="relative flex flex-1 bg-background rounded-lg mt-2">
        <div className="absolute inset-0 flex overflow-hidden rounded-lg border bg-background">
          <ScrollArea className="h-full w-full relative bg">
            <Table className="">
              <TableHeader className="bg-primary table-header sticky top-0 z-10 text-muted">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        colSpan={header.colSpan}
                        className="text-text-table"
                        style={{
                          ...getCommonPinningStyles({ column: header.column }),
                          position: "sticky",
                          top: 0,
                          zIndex: 10,
                          backgroundColor: "hsl(var(--primary))",
                        }}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody className="text-table">
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          style={{
                            ...getCommonPinningStyles({ column: cell.column }),
                          }}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={table.getAllColumns().length}
                      className="h-24 text-center"
                    >
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </div>
      <div className="flex flex-col gap-2.5">
        <DataTablePagination
          table={table}
          pageSizeOptions={pageSizeOptions}
          offset={offset}
          limit={limit}
          totalCount={totalCount}
          onOffsetChange={onOffsetChange}
          onLimitChange={onLimitChange}
        />
        {actionBar &&
          table.getFilteredSelectedRowModel().rows.length > 0 &&
          actionBar}
      </div>
    </div>
  );
}
