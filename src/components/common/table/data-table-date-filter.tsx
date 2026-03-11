import type { Column } from "@tanstack/react-table";
import { CalendarIcon, XCircle, Clock } from "lucide-react";
import * as React from "react";
import type { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/format";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

type DateSelection = Date[] | DateRange;

function getIsDateRange(value: DateSelection): value is DateRange {
  return value && typeof value === "object" && !Array.isArray(value);
}

function parseAsDate(dateString: string | undefined): Date | undefined {
  if (!dateString) return undefined;
  try {
    // Parse "YYYY-MM-DD HH:mm:ss" format
    const date = new Date(dateString.replace(" ", "T"));
    return !Number.isNaN(date.getTime()) ? date : undefined;
  } catch {
    return undefined;
  }
}

function parseColumnFilterValue(value: unknown): { from?: string; to?: string } | null {
  if (value === null || value === undefined) {
    return null;
  }

  // Handle new format: { from: "YYYY-MM-DD HH:mm:ss", to: "YYYY-MM-DD HH:mm:ss" }
  if (typeof value === "object" && !Array.isArray(value) && "from" in value) {
    const dateRange = value as { from?: unknown; to?: unknown };
    return {
      from: typeof dateRange.from === "string" ? dateRange.from : undefined,
      to: typeof dateRange.to === "string" ? dateRange.to : undefined,
    };
  }

  // Handle legacy format: [timestamp, timestamp] for backward compatibility
  if (Array.isArray(value)) {
    const from = value[0];
    const to = value[1];
    if (from && to) {
      const fromDate = typeof from === "number" ? new Date(from) : new Date(from);
      const toDate = typeof to === "number" ? new Date(to) : new Date(to);
      if (!Number.isNaN(fromDate.getTime()) && !Number.isNaN(toDate.getTime())) {
        return {
          from: format(fromDate, "yyyy-MM-dd HH:mm:ss"),
          to: format(toDate, "yyyy-MM-dd HH:mm:ss"),
        };
      }
    }
  }

  return null;
}

interface DataTableDateFilterProps<TData> {
  column: Column<TData, unknown>;
  title?: string;
  multiple?: boolean;
}

export function DataTableDateFilter<TData>({
  column,
  title,
  multiple,
}: DataTableDateFilterProps<TData>) {
  const columnFilterValue = column.getFilterValue();

  const selectedDates = React.useMemo<DateSelection>(() => {
    if (!columnFilterValue) {
      return multiple ? { from: undefined, to: undefined } : [];
    }

    if (multiple) {
      const dateRange = parseColumnFilterValue(columnFilterValue);
      if (!dateRange) {
        return { from: undefined, to: undefined };
      }
      return {
        from: parseAsDate(dateRange.from),
        to: parseAsDate(dateRange.to),
      };
    }

    // Single date mode - keep legacy support
    if (Array.isArray(columnFilterValue) && columnFilterValue[0]) {
      const date = typeof columnFilterValue[0] === "number" 
        ? new Date(columnFilterValue[0])
        : parseAsDate(columnFilterValue[0] as string);
      return date ? [date] : [];
    }

    return [];
  }, [columnFilterValue, multiple]);

  // Local state for selected date range (for calendar display, separate from filter value)
  const [localDateRange, setLocalDateRange] = React.useState<DateRange>({
    from: undefined,
    to: undefined,
  });

  // Time state for range picker
  const [fromTime, setFromTime] = React.useState<{ hour: string; minute: string }>({
    hour: "",
    minute: "",
  });
  const [toTime, setToTime] = React.useState<{ hour: string; minute: string }>({
    hour: "",
    minute: "",
  });

  // Ref to track if we're handling a user selection (to prevent effect from overriding)
  const isUserSelectionRef = React.useRef(false);
  
  // Ref to track current time values to avoid stale closures
  const fromTimeRef = React.useRef(fromTime);
  const toTimeRef = React.useRef(toTime);
  
  // Keep refs in sync with state
  React.useEffect(() => {
    fromTimeRef.current = fromTime;
  }, [fromTime]);
  
  React.useEffect(() => {
    toTimeRef.current = toTime;
  }, [toTime]);

  // Sync local date range with selectedDates from filter value
  React.useEffect(() => {
    if (multiple && getIsDateRange(selectedDates)) {
      setLocalDateRange({
        from: selectedDates.from,
        to: selectedDates.to,
      });
    }
  }, [selectedDates, multiple]);

  // Initialize time from selected dates (only when filter value changes from external source)
  React.useEffect(() => {
    // Skip if this is a user selection (handled in onSelect)
    if (isUserSelectionRef.current) {
      isUserSelectionRef.current = false;
      return;
    }

    if (multiple && getIsDateRange(selectedDates)) {
      if (selectedDates.from) {
        setFromTime({
          hour: selectedDates.from.getHours().toString().padStart(2, "0"),
          minute: selectedDates.from.getMinutes().toString().padStart(2, "0"),
        });
      } else {
        setFromTime({ hour: "", minute: "" });
      }
      if (selectedDates.to) {
        setToTime({
          hour: selectedDates.to.getHours().toString().padStart(2, "0"),
          minute: selectedDates.to.getMinutes().toString().padStart(2, "0"),
        });
      } else {
        setToTime({ hour: "", minute: "" });
      }
    }
  }, [selectedDates, multiple]);

  // Helper to format date with time as "YYYY-MM-DD HH:mm:ss"
  const formatDateTimeString = React.useCallback(
    (date: Date | undefined, time: { hour: string; minute: string }): string | undefined => {
      if (!date) return undefined;
      const newDate = new Date(date);
      // Only set time if both hour and minute are provided
      if (time.hour !== "" && time.minute !== "") {
        const hour = parseInt(time.hour, 10);
        const minute = parseInt(time.minute, 10);
        // Validate hour and minute ranges
        const validHour = !isNaN(hour) && hour >= 0 && hour <= 23 ? hour : 0;
        const validMinute = !isNaN(minute) && minute >= 0 && minute <= 59 ? minute : 0;
        newDate.setHours(validHour, validMinute, 0, 0);
      } else {
        // If time is not provided, return undefined (don't set filter value)
        return undefined;
      }
      return format(newDate, "yyyy-MM-dd HH:mm:ss");
    },
    []
  );

  const onSelect = React.useCallback(
    (date: Date | DateRange | undefined) => {
      if (!date) {
        isUserSelectionRef.current = true;
        column.setFilterValue(undefined);
        setLocalDateRange({ from: undefined, to: undefined });
        setFromTime({ hour: "", minute: "" });
        setToTime({ hour: "", minute: "" });
        return;
      }

      if (multiple && !("getTime" in date)) {
        isUserSelectionRef.current = true;
        let newFrom = date.from;
        let newTo = date.to;
        
        // If both from and to are set and they're the same date, treat it as only "from" selected
        // if (newFrom && newTo && newFrom.getTime() === newTo.getTime()) {
        //   newTo = undefined;
        // }
        
        // Update local date range for calendar display
        setLocalDateRange({
          from: newFrom,
          to: newTo,
        });

        // When "from" date is selected (but "to" is not), set default time to 00:00
        if (newFrom && !newTo) {
          setFromTime({ hour: "00", minute: "00" });
          setToTime({ hour: "", minute: "" });
          // Don't set filter value yet - wait for "to" date
          column.setFilterValue(undefined);
        }
        // When "to" date is selected, set default time to 23:59
        else if (newFrom && newTo) {
          // Keep existing fromTime if already set, otherwise default to 00:00
          // Use ref to get the latest value (avoids stale closure)
          const currentFromTime = fromTimeRef.current.hour !== "" && fromTimeRef.current.minute !== "" 
            ? fromTimeRef.current 
            : { hour: "00", minute: "00" };
          setFromTime(currentFromTime);
          setToTime({ hour: "23", minute: "59" });
          
          // Set filter value immediately with both dates and default times
          const fromString = formatDateTimeString(newFrom, currentFromTime);
          const toString = formatDateTimeString(newTo, { hour: "23", minute: "59" });
          
          if (fromString && toString && fromString !== toString) {
            column.setFilterValue({ from: fromString, to: toString });
          } else {
            column.setFilterValue(undefined);
          }
        }
        return;
      } else if (!multiple && "getTime" in date) {
        column.setFilterValue(date.getTime());
      }
    },
    [column, multiple, fromTime, formatDateTimeString]
  );

  // Handle time changes
  const handleTimeChange = React.useCallback(
    (
      type: "from" | "to",
      field: "hour" | "minute",
      value: string
    ) => {
      if (type === "from") {
        setFromTime((prev) => ({ ...prev, [field]: value }));
      } else {
        setToTime((prev) => ({ ...prev, [field]: value }));
      }

      // Update filter value immediately when time changes
      if (multiple) {
        const updatedFromTime = type === "from" 
          ? { ...fromTime, [field]: value }
          : fromTime;
        const updatedToTime = type === "to"
          ? { ...toTime, [field]: value }
          : toTime;

        // Use localDateRange for the date part
        // Only set filter value if both date and time are selected
        const fromString = formatDateTimeString(localDateRange.from, updatedFromTime);
        const toString = formatDateTimeString(localDateRange.to, updatedToTime);

        // Require both from date+time and to date+time to be selected
        if (fromString && toString) {
          // If to is the same as from, treat it as not selected (set to undefined)
          if (fromString === toString) {
            column.setFilterValue(undefined);
          } else {
            column.setFilterValue({ from: fromString, to: toString });
          }
        } else if (fromString && !toString && localDateRange.to) {
          // If only from time is set but to date exists, wait for to time
          column.setFilterValue(undefined);
        } else if (!fromString && toString && localDateRange.from) {
          // If only to time is set but from date exists, wait for from time
          column.setFilterValue(undefined);
        } else {
          // If time is not complete, set to undefined
          column.setFilterValue(undefined);
        }
      }
    },
    [multiple, localDateRange, fromTime, toTime, formatDateTimeString, column]
  );

  const onReset = React.useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      column.setFilterValue(undefined);
    },
    [column]
  );

  const hasValue = React.useMemo(() => {
    if (multiple) {
      if (!getIsDateRange(selectedDates)) return false;
      return selectedDates.from || selectedDates.to;
    }
    if (!Array.isArray(selectedDates)) return false;
    return selectedDates.length > 0;
  }, [multiple, selectedDates]);

  const formatDateRange = React.useCallback((range: DateRange) => {
    if (!range.from && !range.to) return "";
    
    const formatDateTime = (date: Date) => {
      const dateStr = formatDate(date);
      const timeStr = `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
      return `${dateStr} ${timeStr}`;
    };

    if (range.from && range.to) {
      return `${formatDateTime(range.from)} - ${formatDateTime(range.to)}`;
    }
    return formatDateTime(range.from ?? range.to!);
  }, []);

  const label = React.useMemo(() => {
    if (multiple) {
      if (!getIsDateRange(selectedDates)) return null;

      const hasSelectedDates = selectedDates.from || selectedDates.to;
      const dateText = hasSelectedDates
        ? formatDateRange(selectedDates)
        : "Select date range";

      return (
        <span className="flex items-center gap-2">
          <span>{title}</span>
          {hasSelectedDates && (
            <>
              <Separator
                orientation="vertical"
                className="mx-0.5 data-[orientation=vertical]:h-4"
              />
              <span>{dateText}</span>
            </>
          )}
        </span>
      );
    }

    if (getIsDateRange(selectedDates)) return null;

    const hasSelectedDate = selectedDates.length > 0;
    const dateText = hasSelectedDate
      ? formatDate(selectedDates[0])
      : "Select date";

    return (
      <span className="flex items-center gap-2">
        <span>{title}</span>
        {hasSelectedDate && (
          <>
            <Separator
              orientation="vertical"
              className="mx-0.5 data-[orientation=vertical]:h-4"
            />
            <span>{dateText}</span>
          </>
        )}
      </span>
    );
  }, [selectedDates, multiple, formatDateRange, title]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="border-dashed">
          {hasValue ? (
            <div
              role="button"
              aria-label={`Clear ${title} filter`}
              tabIndex={0}
              onClick={onReset}
              className="focus-visible:ring-ring rounded-sm opacity-70 transition-opacity hover:opacity-100 focus-visible:ring-1 focus-visible:outline-none"
            >
              <XCircle />
            </div>
          ) : (
            <CalendarIcon />
          )}
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        {multiple ? (
          <div className="flex flex-col">
            <Calendar
              initialFocus
              mode="range"
              selected={
                localDateRange.from || localDateRange.to
                  ? {
                      from: localDateRange.from,
                      // If to is the same as from, set it to undefined
                      to:
                        localDateRange.to &&
                        localDateRange.from &&
                        localDateRange.to.getTime() === localDateRange.from.getTime()
                          ? undefined
                          : localDateRange.to,
                    }
                  : { from: undefined, to: undefined }
              }
              onSelect={onSelect}
            />
            <div className="border-t bg-muted/30">
              <div className="p-2 space-y-2">
                {/* Header */}
                <div className="flex items-center gap-2 pb-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <h4 className="text-sm font-semibold text-foreground">Time Selection</h4>
                </div>

                {/* From Time Section */}
                <div className="space-y-2.5">
                  <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                    From Time
                  </label>
                  <div className="flex items-center gap-2.5 bg-background rounded-md border border-input p-2.5 shadow-sm">
                    <div className="flex items-center gap-1.5 flex-1">
                      <Input
                        type="number"
                        min="0"
                        max="23"
                        placeholder="00"
                        value={fromTime.hour}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === "" || (parseInt(value, 10) >= 0 && parseInt(value, 10) <= 23)) {
                            handleTimeChange("from", "hour", value);
                          }
                        }}
                        className="h-9 w-14 text-center font-medium text-sm border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0 focus-visible:bg-accent/50 transition-colors"
                        inputMode="numeric"
                      />
                      <span className="text-lg font-semibold text-muted-foreground select-none">:</span>
                      <Input
                        type="number"
                        min="0"
                        max="59"
                        placeholder="00"
                        value={fromTime.minute}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === "" || (parseInt(value, 10) >= 0 && parseInt(value, 10) <= 59)) {
                            handleTimeChange("from", "minute", value);
                          }
                        }}
                        className="h-9 w-14 text-center font-medium text-sm border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0 focus-visible:bg-accent/50 transition-colors"
                        inputMode="numeric"
                      />
                    </div>
                    <span className="text-xs text-muted-foreground font-medium">24h</span>
                  </div>
                </div>

                {/* To Time Section */}
                <div className="space-y-2.5">
                  <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                    To Time
                  </label>
                  <div className={cn(
                    "flex items-center gap-2.5 bg-background rounded-md border border-input p-2.5 shadow-sm",
                    !localDateRange.to && "opacity-50"
                  )}>
                    <div className="flex items-center gap-1.5 flex-1">
                      <Input
                        type="number"
                        min="0"
                        max="23"
                        placeholder="00"
                        value={toTime.hour}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === "" || (parseInt(value, 10) >= 0 && parseInt(value, 10) <= 23)) {
                            handleTimeChange("to", "hour", value);
                          }
                        }}
                        disabled={!localDateRange.to}
                        className="h-9 w-14 text-center font-medium text-sm border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0 focus-visible:bg-accent/50 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                        inputMode="numeric"
                      />
                      <span className="text-lg font-semibold text-muted-foreground select-none">:</span>
                      <Input
                        type="number"
                        min="0"
                        max="59"
                        placeholder="00"
                        value={toTime.minute}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === "" || (parseInt(value, 10) >= 0 && parseInt(value, 10) <= 59)) {
                            handleTimeChange("to", "minute", value);
                          }
                        }}
                        disabled={!localDateRange.to}
                        className="h-9 w-14 text-center font-medium text-sm border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0 focus-visible:bg-accent/50 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                        inputMode="numeric"
                      />
                    </div>
                    <span className="text-xs text-muted-foreground font-medium">24h</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <Calendar
            initialFocus
            mode="single"
            selected={
              !getIsDateRange(selectedDates) ? selectedDates[0] : undefined
            }
            onSelect={onSelect}
          />
        )}
      </PopoverContent>
    </Popover>
  );
}
