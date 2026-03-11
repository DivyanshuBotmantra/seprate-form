import type { FilterFn } from "@tanstack/react-table";

export const exactArrayFilter: FilterFn<any> = (row, columnId, filterValue) => {
  if (!filterValue || filterValue.length === 0) return true;

  const cellValue = String(row.getValue(columnId)).toLowerCase().trim();

  return filterValue.some(
    (val: string) => val.toLowerCase().trim() === cellValue
  );
};
