import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import {
    format,
    subDays,
    startOfToday,
    endOfToday,
    startOfYesterday,
    endOfYesterday,
    startOfWeek,
    endOfWeek,
    subWeeks,
    startOfMonth,
    differenceInDays,
} from "date-fns";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";

interface DateFilterProps {
    onApplyFilter: (dateRange: { from: string; to: string }) => void;
}

const formatApiDateTime = (date: Date, endOfDay: boolean = false) => {
    const day = format(date, "yyyy-MM-dd");
    return endOfDay ? `${day} 23:59:59` : `${day} 00:00:00`;
};

export default function DateFilter({ onApplyFilter }: DateFilterProps) {
    const today = useMemo(() => new Date(), []);

    const [range, setRange] = useState<DateRange | undefined>({
        from: subDays(today, 7),
        to: today,
    });

    const [isOpen, setIsOpen] = useState(false);
    const [month, setMonth] = useState<Date | undefined>(range?.from);

    const presets = [
        { label: "Today", getRange: () => ({ from: startOfToday(), to: endOfToday() }) },
        { label: "Yesterday", getRange: () => ({ from: startOfYesterday(), to: endOfYesterday() }) },
        { label: "This week", getRange: () => ({ from: startOfWeek(today, { weekStartsOn: 1 }), to: today }) },
        {
            label: "Last week", getRange: () => {
                const lastWeek = subWeeks(today, 1);
                return { from: startOfWeek(lastWeek, { weekStartsOn: 1 }), to: endOfWeek(lastWeek, { weekStartsOn: 1 }) };
            }
        },
        { label: "This month", getRange: () => ({ from: startOfMonth(today), to: today }) },
    ];

    const isPresetActive = (getRange: () => DateRange) => {
        if (!range?.from || !range?.to) return false;
        const p = getRange();
        if (!p.from || !p.to) return false;
        return format(range.from, "yyyy-MM-dd") === format(p.from, "yyyy-MM-dd") &&
            format(range.to, "yyyy-MM-dd") === format(p.to, "yyyy-MM-dd");
    };

    // Calculate days difference between two dates
    const getDaysDifference = (from: Date, to: Date) => {
        return differenceInDays(to, from);
    };

    // Check if current range is valid (not more than 30 days)
    const isRangeValid = () => {
        if (!range?.from || !range?.to) return true;
        return getDaysDifference(range.from, range.to) <= 30;
    };

    const handleApply = () => {
        if (!range?.from || !range?.to) return;

        const payloadRange = {
            from: formatApiDateTime(range.from, false),
            to: formatApiDateTime(range.to, true),
        };

        onApplyFilter(payloadRange);
        setIsOpen(false);
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        "w-64 justify-start text-left font-semibold text-xs h-8 shadow-sm hover:bg-accent transition-all",
                        !range && "text-muted-foreground"
                    )}
                >
                    <CalendarIcon className="mr-2 h-3.5 w-3.5 text-btn-primary" />
                    {range?.from ? (
                        range.to ? (
                            <span className="truncate">
                                {format(range.from, "MMM d, yyyy")} – {format(range.to, "MMM d, yyyy")}
                            </span>
                        ) : (
                            format(range.from, "MMM d, yyyy")
                        )
                    ) : (
                        <span>Pick a date range</span>
                    )}
                </Button>
            </PopoverTrigger>

            <PopoverContent className="w-auto p-0 flex flex-col md:flex-row shadow-2xl border-border rounded-xl overflow-hidden bg-background" align="end">
                {/* Left: Presets */}
                <div className="flex flex-col border-r border-border bg-muted/10 min-w-[140px] py-3">
                    {presets.map((preset) => (
                        <button
                            key={preset.label}
                            onClick={() => {
                                const newRange = preset.getRange();
                                setRange(newRange);
                                if (newRange.from) {
                                    setMonth(newRange.from);
                                }
                            }}
                            className={cn(
                                "px-4 py-2 text-xs text-left transition-all font-medium",
                                isPresetActive(preset.getRange)
                                    ? "bg-btn-primary/10 text-btn-primary border-r-2 border-btn-primary"
                                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                            )}
                        >
                            {preset.label}
                        </button>
                    ))}
                </div>

                {/* Right: Calendars and Bottom Bar */}
                <div className="flex flex-col">
                    <div className="flex flex-col md:flex-row divide-x divide-border">
                        <Calendar
                            initialFocus
                            mode="range"
                            month={month}
                            onMonthChange={setMonth}
                            selected={range}
                            onSelect={setRange}
                            numberOfMonths={2}
                            className="p-3"
                            disabled={(date) => {
                                // Disable future dates
                                if (date > today) return true;

                                // If a from date is selected, disable dates more than 30 days away
                                if (range?.from && !range?.to) {
                                    const daysDiff = Math.abs(differenceInDays(date, range.from));
                                    return daysDiff > 30;
                                }

                                return false;
                            }}
                        />
                    </div>

                    {/* Bottom Bar: Inputs & Actions */}
                    <div className="flex flex-col gap-3 p-4 border-t border-border bg-muted/5">
                        <div className="flex items-end justify-between gap-6">
                            <div className="flex items-center gap-3">
                                <div className="flex flex-col gap-1.5">
                                    <span className="text-[10px] uppercase text-muted-foreground/70 font-bold px-1 tracking-wider">Start Date</span>
                                    <div className="border border-input rounded-md px-3 py-1.5 text-xs font-semibold bg-background min-w-[140px] shadow-sm">
                                        {range?.from ? format(range.from, "MMM d, yyyy") : "-"}
                                    </div>
                                </div>
                                <span className="mb-2 text-muted-foreground/40 text-lg">–</span>
                                <div className="flex flex-col gap-1.5">
                                    <span className="text-[10px] uppercase text-muted-foreground/70 font-bold px-1 tracking-wider">End Date</span>
                                    <div className="border border-input rounded-md px-3 py-1.5 text-xs font-semibold bg-background min-w-[140px] shadow-sm">
                                        {range?.to ? format(range.to, "MMM d, yyyy") : "-"}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsOpen(false)}
                                    className="text-xs h-9 px-4 font-medium border-border"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={handleApply}
                                    disabled={!range?.from || !range?.to || !isRangeValid()}
                                    className="bg-btn-primary hover:bg-btn-primary/90 text-darkLight text-xs h-9 px-6 font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Apply
                                </Button>
                            </div>
                        </div>
                        {!isRangeValid() && (
                            <p className="text-xs text-destructive font-medium px-1">
                                ⚠ Date range cannot exceed 30 days
                            </p>
                        )}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
