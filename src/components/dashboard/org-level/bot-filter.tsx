import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Filter, ChevronDown, Search, X } from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

interface BotFilterProps {
    availableBots: string[];
    selectedBots: string[];
    onApplyFilter: (selectedBots: string[]) => void;
    label?: string;
    searchPlaceholder?: string;
}

export default function BotFilter({
    availableBots,
    selectedBots,
    onApplyFilter,
    label = "Bot Filter",
    searchPlaceholder = "Filter bots"
}: BotFilterProps) {
    const [tempSelectedBots, setTempSelectedBots] = useState<string[]>([]);
    const [botDropdownOpen, setBotDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // Filter items based on search query
    const filteredItems = useMemo(() => {
        if (!searchQuery.trim()) return availableBots;
        return availableBots.filter(item =>
            item.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [availableBots, searchQuery]);

    const handleItemSelection = (item: string) => {
        setTempSelectedBots(prev =>
            prev.includes(item)
                ? prev.filter(code => code !== item)
                : [...prev, item]
        );
    };

    const handleClearAll = () => {
        setTempSelectedBots([]);
        onApplyFilter([]);
        setBotDropdownOpen(false);
        setSearchQuery("");
    };

    const handleShowResults = () => {
        onApplyFilter([...tempSelectedBots]);
        setBotDropdownOpen(false);
        setSearchQuery(""); // Reset search on close
    };

    const handleOpenChange = (open: boolean) => {
        if (open) {
            setTempSelectedBots([...selectedBots]); // Initialize temp with current selections
            setSearchQuery(""); // Reset search when opening
        }
        setBotDropdownOpen(open);
    };

    return (
        <Popover open={botDropdownOpen} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-3 text-xs font-medium transition-all duration-300 gap-1.5 relative group"
                >
                    <Filter className="w-3.5 h-3.5" />
                    {label}
                    {selectedBots.length > 0 && (
                        <>
                            <span className="absolute -top-1.5 -right-1.5 bg-btn-primary text-darkLight text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center border-2 border-background shadow-sm">
                                {selectedBots.length}
                            </span>
                            <div 
                                className="ml-0.5 p-0.5 hover:bg-muted rounded-full transition-colors z-10"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onApplyFilter([]);
                                }}
                                title="Clear filter"
                            >
                                <X className="w-3 h-3 text-muted-foreground hover:text-danger" />
                            </div>
                        </>
                    )}
                    <ChevronDown className="w-3.5 h-3.5 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-96 p-0 shadow-lg">
                {/* Search Input */}
                <div className="p-3 border-b">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder={searchPlaceholder}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-9 text-sm bg-muted/30 border-border/50 focus:bg-background"
                        />
                    </div>
                </div>

                {/* Select All Section */}
                <div className="px-4 py-2.5 border-b bg-muted/5">
                    <div className="flex items-center justify-between">
                        <div
                            className="flex items-center gap-3 cursor-pointer"
                            onClick={() => {
                                if (filteredItems.length > 0 && filteredItems.every(item => tempSelectedBots.includes(item))) {
                                    // Deselect all filtered items
                                    setTempSelectedBots(prev => prev.filter(item => !filteredItems.includes(item)));
                                } else {
                                    // Select all filtered items
                                    const newSelected = [...new Set([...tempSelectedBots, ...filteredItems])];
                                    setTempSelectedBots(newSelected);
                                }
                            }}
                        >
                            <Checkbox
                                checked={filteredItems.length > 0 && filteredItems.every(item => tempSelectedBots.includes(item))}
                                className="w-5 h-5 data-[state=checked]:bg-btn-primary data-[state=checked]:border-btn-primary"
                            />
                            <span className="text-sm font-medium text-foreground">
                                Select All
                            </span>
                        </div>
                        <span className="text-xs text-muted-foreground font-medium">
                            {tempSelectedBots.length} / {availableBots.length} selected
                        </span>
                    </div>
                </div>

                {/* Items List */}
                <div className="max-h-60 overflow-x-auto custom-scrollbar">
                    {filteredItems.length === 0 ? (
                        <div className="px-4 py-12 text-center">
                            <p className="text-sm text-muted-foreground">
                                {searchQuery ? "No items found" : "No data available"}
                            </p>
                        </div>
                    ) : (
                        <div className="py-2">
                            {filteredItems.map((itemName) => (
                                <div
                                    key={itemName}
                                    onClick={() => handleItemSelection(itemName)}
                                    className="cursor-pointer flex items-center gap-3 py-2.5 px-4 hover:bg-accent/50 transition-colors"
                                >
                                    <Checkbox
                                        checked={tempSelectedBots.includes(itemName)}
                                        onCheckedChange={() => handleItemSelection(itemName)}
                                        className="w-5 h-5 data-[state=checked]:bg-btn-primary data-[state=checked]:border-btn-primary"
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                    <span className="text-sm text-foreground flex-1">
                                        {itemName}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer with Clear all and Show results */}
                <div className="flex items-center justify-between p-4 border-t bg-background">
                    <button
                        onClick={handleClearAll}
                        disabled={tempSelectedBots.length === 0}
                        className="text-sm font-medium text-btn-primary hover:text-btn-primary/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        Clear all
                    </button>
                    <Button
                        onClick={handleShowResults}
                        className="bg-btn-primary hover:bg-btn-primary/90 text-white px-6 h-9 text-sm font-semibold rounded-full shadow-md hover:shadow-lg transition-all"
                    >
                        Show results
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}

