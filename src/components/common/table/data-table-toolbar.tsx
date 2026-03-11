import type { Column, Table } from "@tanstack/react-table";
import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, Plus, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { DataTableSliderFilter } from "./data-table-slider-filter";
import { DataTableDateFilter } from "./data-table-date-filter";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import { useDebounce } from "@/hooks/use-debounce";

interface CreateButtonConfig {
  label: string;
  onClick: () => void;
  visible?: boolean;
}
interface DataTableToolbarProps<TData> extends React.ComponentProps<"div"> {
  table: Table<TData>;
  searchColumn?: string;
  searchPlaceholder?: string;
  showResetFilters?: boolean;
  excludeColumns?: string[];
  children?: React.ReactNode;
  createButton?: CreateButtonConfig;
  /**
   * Optional custom actions area rendered on the right side of the toolbar.
   * Use this to pass fully custom buttons/components.
   */
  actions?: React.ReactNode | ((table: Table<TData>) => React.ReactNode);
  showReloadButton?: boolean;
}

export function DataTableToolbar<TData>({
  table,
  searchColumn,
  searchPlaceholder = "Search...",
  showResetFilters = true,
  excludeColumns = [],
  children,
  className,
  createButton,
  actions,
  showReloadButton = true,
  ...props
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;
  const [searchText, setSearchText] = React.useState(
    table.getState().globalFilter ?? ""
  );

  // 🔹 Debounce search input
  const debouncedSearch = useDebounce(searchText, 300);

  // 🔹 Update table global filter when debounced value changes
  React.useEffect(() => {
    table.setGlobalFilter(debouncedSearch);
  }, [debouncedSearch, table]);

  const columns = React.useMemo(
    () =>
      table
        .getAllColumns()
        .filter(
          (column) =>
            column.getCanFilter() && !excludeColumns.includes(column.id)
        ),
    [table, excludeColumns]
  );

  const searchCol = React.useMemo(() => {
    if (searchColumn) return table.getColumn(searchColumn);
    return columns.find((col) => col.columnDef.meta?.variant === "text");
  }, [searchColumn, table, columns]);

  const onReset = React.useCallback(() => {
    table.resetColumnFilters();
    setSearchText(""); // clear search text as well
  }, [table]);

  return (
    <div
      role="toolbar"
      aria-orientation="horizontal"
      className={cn(
        "flex w-full items-start justify-between gap-2 p-1",
        className
      )}
      {...props}
    >
      <div className="flex flex-1 flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-3 w-3 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            className="pl-8 h-8 w-[200px] lg:w-[250px] bg-background"
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck="false"
            data-form-type="other"
            data-lpignore="true"
          />
        </div>

        {/* Filters */}
        {columns
          .filter((column) => column.id !== searchCol?.id)
          .map((column) => (
            <DataTableToolbarFilter key={column.id} column={column} />
          ))}

        {/* Reset Filters */}
        {isFiltered && showResetFilters && (
          <Button
            aria-label="Reset filters"
            variant="outline"
            size="sm"
            className="border-dashed bg-muted"
            onClick={onReset}
          >
            <X />
            Reset
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2">
        {typeof actions === "function" ? actions(table) : actions}
        {showReloadButton && (
          <Button
            aria-label="Reload page"
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
          >
            <RotateCw className="h-4 w-4" />
            Refresh
          </Button>
        )}
        {createButton?.visible !== false && createButton && (
          <Button
            className="bg-btn-primary text-primary-foreground hover:cursor-pointer"
            size="sm"
            onClick={createButton.onClick}
          >
            <Plus />
            {createButton.label}
          </Button>
        )}
        {children}
      </div>
    </div>
  );
}

interface DataTableToolbarFilterProps<TData> {
  column: Column<TData>;
}

function DataTableToolbarFilter<TData>({
  column,
}: DataTableToolbarFilterProps<TData>) {
  const columnMeta = column.columnDef.meta;

  const onFilterRender = React.useCallback(() => {
    if (!columnMeta?.variant) return null;

    switch (columnMeta.variant) {
      case "text":
        return (
          <Input
            placeholder={columnMeta.placeholder ?? columnMeta.label}
            value={(column.getFilterValue() as string) ?? ""}
            onChange={(event) => column.setFilterValue(event.target.value)}
            className="h-8 w-40 lg:w-56"
          />
        );

      case "number":
        return (
          <div className="relative">
            <Input
              type="number"
              inputMode="numeric"
              placeholder={columnMeta.placeholder ?? columnMeta.label}
              value={(column.getFilterValue() as string) ?? ""}
              onChange={(event) => column.setFilterValue(event.target.value)}
              className={cn("h-8 w-[120px]", columnMeta.unit && "pr-8")}
            />
            {columnMeta.unit && (
              <span className="bg-accent text-muted-foreground absolute top-0 right-0 bottom-0 flex items-center rounded-r-md px-2 text-sm">
                {columnMeta.unit}
              </span>
            )}
          </div>
        );

      case "range":
        return (
          <DataTableSliderFilter
            column={column}
            title={columnMeta.label ?? column.id}
          />
        );

      case "date":
      case "dateRange":
        return (
          <DataTableDateFilter
            column={column}
            title={columnMeta.label ?? column.id}
            multiple={columnMeta.variant === "dateRange"}
          />
        );

      case "select":
      case "multiSelect":
        return (
          <DataTableFacetedFilter
            column={column}
            title={columnMeta.label ?? column.id}
            options={columnMeta.options ?? []}
            multiple={columnMeta.variant === "multiSelect"}
          />
        );

      default:
        return null;
    }
  }, [column, columnMeta]);

  return onFilterRender();
}