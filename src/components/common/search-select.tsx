"use client";

import React, { useState, useMemo } from "react";
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

  const filteredOptions = useMemo(() => {
    if (!Array.isArray(options)) return [];
    const searchTerm = search.toLowerCase();
    return options.filter((opt) =>
      opt?.label?.toLowerCase().includes(searchTerm) ||
      opt?.value?.toLowerCase().includes(searchTerm)
    );
  }, [options, search]);

  const selectedLabel = useMemo(() => {
    return options.find((opt) => opt?.value === value)?.label || "";
  }, [options, value]);

  return (
    <Select 
      value={value} 
      onValueChange={(val) => {
        onValueChange(val);
        setSearch(""); // Reset search on selection
      }} 
      disabled={disabled}
    >
      <SelectTrigger
        className={cn(
          "w-full h-10 font-semibold text-[13px] bg-background border-border transition-all duration-200",
          disabled && "bg-muted cursor-not-allowed opacity-80",
          triggerClassName
        )}
      >
        <SelectValue placeholder={placeholder}>
          {selectedLabel || placeholder}
        </SelectValue>
      </SelectTrigger>
      <SelectContent
        className={cn(
          "p-0 w-[var(--radix-select-trigger-width)] min-w-[var(--radix-select-trigger-width)] max-h-[400px] overflow-x-hidden shadow-lg border-border",
          contentClassName
        )}
        onCloseAutoFocus={(e) => e.preventDefault()}
        position="popper"
        align="start"
        sideOffset={4}
      >
        <div className="sticky top-0 bg-popover p-2 border-b border-border z-10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground opacity-60" />
            <Input
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 pl-9 pr-3 text-[13px] bg-background border-border focus-visible:ring-1 focus-visible:ring-primary/20 rounded-md"
              autoFocus
            />
          </div>
        </div>

        <div className="max-h-[300px] overflow-y-auto overflow-x-hidden py-1 custom-scrollbar">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt, index) => (
              <SelectItem
                key={opt.value ? `${opt.value}-${index}` : `option-${index}`}
                value={opt.value}
                className="text-[13px] py-2 px-3 mx-1 my-0.5 rounded-sm cursor-pointer hover:bg-accent transition-colors focus:bg-accent outline-none data-[state=checked]:bg-accent/50"
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
