// components/OrgMultiSelect.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { ChevronsUpDown, Check, X } from "lucide-react";
import { toast } from "sonner";

interface OrgMultiSelectProps {
  selectedOrgs: string[];
  options: { value: string; label: string }[];
  onChange: (selected: string[]) => void;
  disabled?: boolean;
}

export const OrgMultiSelect = ({
  selectedOrgs,
  options,
  onChange,
  disabled = false,
}: OrgMultiSelectProps) => {
  const [open, setOpen] = useState(false);

  // Defensive check: ensure selectedOrgs is always an array
  const safeSelectedOrgs = Array.isArray(selectedOrgs) ? selectedOrgs : [];

  const handleSelect = (value: string) => {
    if (disabled) return;

    const alreadySelected = safeSelectedOrgs.includes(value);
    const updated = alreadySelected
      ? safeSelectedOrgs.filter((v) => v !== value)
      : [...safeSelectedOrgs, value];

    if (updated.length <= 5) {
      onChange(updated);
    } else {
      toast.error("You can select up to 5 organizations only");
    }
  };

  return (
    <div>
      <Popover
        open={open}
        onOpenChange={(newOpen) => !disabled && setOpen(newOpen)}
      >
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between mb-2"
            disabled={disabled}
          >
            {safeSelectedOrgs.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {safeSelectedOrgs.map((org) => (
                  <Badge
                    key={org}
                    variant="secondary"
                    className="mr-1 bg-primary text-muted rounded-lg"
                  >
                    {org}
                    <span
                      className={`ml-1 rounded-full ${disabled
                        ? "cursor-not-allowed opacity-50"
                        : "cursor-pointer"
                        }`}
                      onMouseDown={(e) => {
                        if (disabled) {
                          e.preventDefault();
                          e.stopPropagation();
                          return;
                        }
                        e.preventDefault();
                        e.stopPropagation();
                        onChange(safeSelectedOrgs.filter((o) => o !== org));
                      }}
                    >
                      <X className="h-2 w-2" />
                    </span>
                  </Badge>
                ))}
              </div>
            ) : (
              <span className="text-muted-foreground">
                Select organizations
              </span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-full p-0 pointer-events-auto"
          align="center"
        >
          <div
            className="max-h-[min(400px,80vh)] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-400"
            onWheel={(e) => e.stopPropagation()}
          >
            <Command>
              <CommandEmpty>No organization found.</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => handleSelect(option.value)}
                  >
                    <div className="flex items-center justify-between w-full text-xs">
                      <span>{option.label}</span>
                      {safeSelectedOrgs.includes(option.value) && (
                        <Check className="h-4 w-4" />
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </div>
        </PopoverContent>
      </Popover>
      <p className="text-muted-foreground text-sm mt-2 ml-2">
        Admins can be assigned to up to 5 organizations.
      </p>
    </div>
  );
};
