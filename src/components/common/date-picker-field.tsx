import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import { format, parse } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// Convert regex pattern to date-fns format string
const regexPatternToDateFormat = (pattern: string): string => {
  // Remove anchors (^ and $) if present
  const cleanPattern = pattern.replace(/^\^/, "").replace(/\$$/, "");

  // Common pattern mappings - check these first
  const commonPatterns: Array<{ regex: RegExp; format: string }> = [
    // DD-MMM-YY patterns
    { regex: /^\\d\{2\}-\[A-Za-z\]\{3\}-\\d\{2\}$/, format: "dd-MMM-yy" },
    { regex: /^\\d\{1,2\}-\[A-Za-z\]\{3\}-\\d\{2\}$/, format: "d-MMM-yy" },
    // DD-MMM-YYYY patterns
    { regex: /^\\d\{2\}-\[A-Za-z\]\{3\}-\\d\{4\}$/, format: "dd-MMM-yyyy" },
    { regex: /^\\d\{1,2\}-\[A-Za-z\]\{3\}-\\d\{4\}$/, format: "d-MMM-yyyy" },
    // DD-MM-YY patterns
    { regex: /^\\d\{2\}-\\d\{2\}-\\d\{2\}$/, format: "dd-MM-yy" },
    { regex: /^\\d\{1,2\}-\\d\{1,2\}-\\d\{2\}$/, format: "d-M-yy" },
    // DD-MM-YYYY patterns
    { regex: /^\\d\{2\}-\\d\{2\}-\\d\{4\}$/, format: "dd-MM-yyyy" },
    { regex: /^\\d\{1,2\}-\\d\{1,2\}-\\d\{4\}$/, format: "d-M-yyyy" },
    // DD/MM/YY patterns
    { regex: /^\\d\{2\}\/\\d\{2\}\/\\d\{2\}$/, format: "dd/MM/yy" },
    { regex: /^\\d\{1,2\}\/\\d\{1,2\}\/\\d\{2\}$/, format: "d/M/yy" },
    // DD/MM/YYYY patterns
    { regex: /^\\d\{2\}\/\\d\{2\}\/\\d\{4\}$/, format: "dd/MM/yyyy" },
    { regex: /^\\d\{1,2\}\/\\d\{1,2\}\/\\d\{4\}$/, format: "d/M/yyyy" },
  ];

  // Try to match common patterns first
  for (const { regex, format } of commonPatterns) {
    if (regex.test(cleanPattern)) {
      return format;
    }
  }

  // Dynamic conversion for other patterns
  // Extract separator
  let separator = "-";
  if (cleanPattern.includes("/")) separator = "/";
  else if (cleanPattern.includes(".")) separator = ".";
  else if (cleanPattern.includes(" ")) separator = " ";

  // Split pattern by separator (simple approach)
  const parts: string[] = [];
  let currentPart = "";
  let inCharClass = false;

  for (let i = 0; i < cleanPattern.length; i++) {
    const char = cleanPattern[i];
    const nextChar = cleanPattern[i + 1];

    if (char === "[" && nextChar !== "\\") {
      inCharClass = true;
      currentPart += char;
    } else if (char === "]" && !inCharClass) {
      inCharClass = false;
      currentPart += char;
    } else if (
      (char === "-" || char === "/" || char === "." || char === " ") &&
      !inCharClass &&
      currentPart
    ) {
      parts.push(currentPart);
      currentPart = "";
    } else {
      currentPart += char;
    }
  }
  if (currentPart) {
    parts.push(currentPart);
  }

  // Convert parts to date-fns format
  const formatParts: string[] = [];
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const isLast = i === parts.length - 1;

    if (part === "\\d{4}") {
      formatParts.push("yyyy");
    } else if (part === "\\d{2}" && isLast) {
      formatParts.push("yy");
    } else if (part === "\\d{2}") {
      formatParts.push(i === 0 ? "dd" : "MM");
    } else if (part === "\\d{1,2}") {
      formatParts.push(i === 0 ? "d" : "M");
    } else if (part === "[A-Za-z]{3}") {
      formatParts.push("MMM");
    } else if (part === "[A-Za-z]+") {
      formatParts.push("MMMM");
    } else {
      formatParts.push("dd");
    }

    if (!isLast) {
      formatParts.push(separator);
    }
  }

  const result = formatParts.join("");

  // Final fallback
  if (!result || result.includes("\\d") || result.includes("[")) {
    if (cleanPattern.includes("[A-Za-z]{3}")) {
      return cleanPattern.includes("\\d{4}") ? "dd-MMM-yyyy" : "dd-MMM-yy";
    }
    return cleanPattern.includes("\\d{4}") ? "dd-MM-yyyy" : "dd-MM-yy";
  }

  return result;
};

// Helper function to format date according to pattern
const formatDateByPattern = (date: Date, pattern: string): string => {
  try {
    const dateFormat = regexPatternToDateFormat(pattern);
    return format(date, dateFormat);
  } catch {
    return "";
  }
};

// Helper function to parse date from pattern
const parseDateFromPattern = (
  dateString: string,
  pattern: string
): Date | undefined => {
  if (!dateString) return undefined;

  try {
    const dateFormat = regexPatternToDateFormat(pattern);
    return parse(dateString, dateFormat, new Date());
  } catch {
    return undefined;
  }
};

interface DatePickerFieldProps {
  value: string;
  onChange: (value: string) => void;
  pattern?: string;
  description?: string;
  readOnly?: boolean;
  disabled?: boolean;
  errors?: any;
}

export const DatePickerField = ({
  value,
  onChange,
  pattern,
  description,
  readOnly,
  disabled,
  errors,
}: DatePickerFieldProps) => {
  const [open, setOpen] = useState(false);
  const dateValue = value
    ? parseDateFromPattern(value, pattern || "")
    : undefined;

  const handleDateSelect = (date: Date | undefined) => {
    if (date && pattern) {
      const formatted = formatDateByPattern(date, pattern);
      onChange(formatted);
      setOpen(false);
    }
  };

  if (readOnly || disabled) {
    return (
      <div className="space-y-1">
        <Input
          type="text"
          readOnly
          disabled
          value={value}
          className="cursor-not-allowed"
        />
        {errors && <p className="text-sm text-red-500">{errors?.message}</p>}
        {description && <p className="text-xs text-gray-500">{description}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground"
            )}
            type="button"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? value : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={dateValue}
            onSelect={handleDateSelect}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      {errors && <p className="text-sm text-red-500">{errors?.message}</p>}
      {description && <p className="text-xs text-gray-500">{description}</p>}
    </div>
  );
};

