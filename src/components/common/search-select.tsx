"use client";

import React, { useState, useMemo, useRef, useCallback, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface Option {
  label: string;
  value: string;
}

interface SearchableSelectProps {
  options: Option[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  triggerClassName?: string;
  contentClassName?: string;
  disabled?: boolean;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options = [],
  value,
  onValueChange,
  placeholder = "Select an option",
  searchPlaceholder = "Search...",
  emptyMessage = "No items found",
  triggerClassName,
  contentClassName,
  disabled = false,
}) => {
  const [search, setSearch] = useState("");
  // Tracks which option is keyboard-highlighted (for Enter-to-select)
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  // FIX #1: Use a ref instead of autoFocus to control focus manually,
  // so we don't steal focus from Radix's internal focus management on mount.
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredOptions = useMemo(() => {
    if (!Array.isArray(options)) return [];
    const searchTerm = search.toLowerCase();
    return options.filter(
      (opt) =>
        // FIX #6: Also filter out options with empty string values to prevent
        // Radix SelectItem warnings and unintended uncontrolled-mode behavior.
        opt?.value !== "" &&
        (opt?.label?.toLowerCase().includes(searchTerm) ||
          opt?.value?.toLowerCase().includes(searchTerm))
    );
  }, [options, search]);

  // NEW FIX: When search narrows results to exactly 1 item, auto-highlight it
  // so the user can press Enter to select without touching the mouse.
  // When results change otherwise, reset highlight to top (index 0) if results exist.
  useEffect(() => {
    if (filteredOptions.length === 1) {
      setHighlightedIndex(0);
    } else {
      setHighlightedIndex(-1);
    }
  }, [filteredOptions]);

  const selectedLabel = useMemo(() => {
    if (!value) return "";
    // FIX #4: When the value exists but isn't found in options (e.g. async load),
    // return undefined so the caller's placeholder renders instead of empty string.
    return options.find((opt) => opt?.value === value)?.label ?? undefined;
  }, [options, value]);

  // FIX #5: Reset search whenever the dropdown opens or closes,
  // so stale searches from previous sessions don't persist on re-open.
  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        setSearch("");
        setHighlightedIndex(-1);
      } else {
        // FIX #1 (continued): Focus the input after the dropdown has opened
        // and Radix has finished its own focus setup, via a deferred call.
        setTimeout(() => inputRef.current?.focus(), 0);
      }
    },
    []
  );

  return (
    <Select
      // FIX #3: Never pass an empty string as value — Radix treats "" the same
      // as undefined and switches to uncontrolled mode, causing stale display bugs.
      value={value || undefined}
      onValueChange={(val) => {
        onValueChange(val);
        setSearch("");
      }}
      disabled={disabled}
      onOpenChange={handleOpenChange}
    >
      <SelectTrigger
        className={cn(
          "w-full h-10 font-semibold text-[13px] bg-background border-border transition-all duration-200",
          disabled && "bg-muted cursor-not-allowed opacity-80",
          triggerClassName
        )}
      >
        {/* FIX #4 (continued): Fall back to placeholder when selectedLabel is
            undefined (value not found in options), instead of rendering nothing. */}
        <SelectValue placeholder={placeholder}>
          {selectedLabel ?? placeholder}
        </SelectValue>
      </SelectTrigger>

      <SelectContent
        className={cn(
          // FIX #7: Remove hardcoded max-h-[400px] on the content wrapper and
          // use the Radix-provided CSS variable instead, which respects available
          // viewport height and avoids clipping on small screens with popper mode.
          "p-0 w-[var(--radix-select-trigger-width)] min-w-[var(--radix-select-trigger-width)] overflow-x-hidden shadow-lg border-border",
          contentClassName
        )}
        style={{
          maxHeight: "var(--radix-select-content-available-height, 400px)",
        }}
        // FIX #8: Remove e.preventDefault() from onCloseAutoFocus — suppressing
        // it entirely breaks WCAG 2.1 focus management (focus never returns to
        // the trigger after close). Let Radix handle focus restoration natively.
        position="popper"
        align="start"
        sideOffset={4}
      >
        <div className="sticky top-0 bg-popover p-2 border-b border-border z-10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground opacity-60" />
            <Input
              ref={inputRef}
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              // FIX #2: Stop keydown events from bubbling up to Radix's Select
              // listener. Without this, typing letters triggers Radix's jump-to-option.
              // NEW: Also handle ArrowDown/ArrowUp/Enter here to enable keyboard
              // navigation while focus stays in the search input.
              onKeyDown={(e) => {
                e.stopPropagation();
                if (filteredOptions.length === 0) return;

                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setHighlightedIndex((prev) =>
                    prev < filteredOptions.length - 1 ? prev + 1 : 0
                  );
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setHighlightedIndex((prev) =>
                    prev > 0 ? prev - 1 : filteredOptions.length - 1
                  );
                } else if (e.key === "Enter") {
                  e.preventDefault();
                  const target =
                    highlightedIndex >= 0
                      ? filteredOptions[highlightedIndex]
                      : filteredOptions.length === 1
                        ? filteredOptions[0]
                        : null;
                  if (target) {
                    onValueChange(target.value);
                    setSearch("");
                    setHighlightedIndex(-1);
                  }
                }
              }}
              // FIX #1: No autoFocus here — focus is handled via ref in onOpenChange.
              className="h-9 pl-9 pr-3 text-[13px] bg-background border-border focus-visible:ring-1 focus-visible:ring-primary/20 rounded-md"
            />
          </div>
        </div>

        <div className="overflow-y-auto overflow-x-hidden py-1 custom-scrollbar"
          style={{ maxHeight: "calc(var(--radix-select-content-available-height, 400px) - 57px)" }}
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt, index) => (
              <SelectItem
                key={opt.value ? `${opt.value}-${index}` : `option-${index}`}
                value={opt.value}
                // NEW: Apply highlighted background when this item is the
                // keyboard-highlighted one (single result or ArrowKey navigation).
                // This gives the user clear visual feedback even though focus
                // stays in the search input.
                className={cn(
                  "text-[13px] py-2 px-3 mx-1 my-0.5 rounded-sm cursor-pointer transition-colors focus:bg-accent outline-none data-[state=checked]:bg-accent/50",
                  index === highlightedIndex
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent"
                )}
                onMouseEnter={() => setHighlightedIndex(index)}
                onMouseLeave={() => setHighlightedIndex(-1)}
              >
                <span className="truncate">{opt.label}</span>
              </SelectItem>
            ))
          ) : (
            <div className="py-6 px-4 text-center">
              <p className="text-[12px] text-muted-foreground italic font-medium opacity-70">
                {emptyMessage}
              </p>
            </div>
          )}
        </div>
      </SelectContent>
    </Select>
  );
};

export default SearchableSelect;