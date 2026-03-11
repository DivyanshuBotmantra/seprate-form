import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, FileSpreadsheet } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRef, useEffect } from "react";

interface Template {
    id: number;
    name: string;
    filename: string;
    description: string;
    link: string;
}

interface TriggerHeaderProps {
    formName: string;
    onBack: () => void;
    templates: Template[];
    selectedTemplates: number[];
    showTemplateDropdown: boolean;
    setShowTemplateDropdown: (show: boolean) => void;
    handleTemplateToggle: (id: number) => void;
    handleSelectAllTemplates: () => void;
    handleDownloadSelected: () => void;
    setSelectedTemplates: (ids: number[]) => void;
}

export function TriggerHeader({
    formName,
    onBack,
    templates,
    selectedTemplates,
    showTemplateDropdown,
    setShowTemplateDropdown,
    handleTemplateToggle,
    handleSelectAllTemplates,
    handleDownloadSelected,
    setSelectedTemplates,
}: TriggerHeaderProps) {
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowTemplateDropdown(false);
            }
        };

        if (showTemplateDropdown) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showTemplateDropdown, setShowTemplateDropdown]);

    return (
        <div className="relative z-30 bg-card/50 backdrop-blur-md border border-border/50 rounded-xl p-3 shadow-sm">
            <div className="flex items-center justify-between gap-3">
                {/* Left: Back Button + Title */}
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onBack}
                        className="h-7 w-7 hover:bg-muted"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h1 className="text-base font-semibold text-foreground flex items-center gap-2">
                        <span className="w-1 h-4 bg-btn-primary rounded-full"></span>
                        {formName}
                    </h1>
                </div>

                {/* Right: Template Dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowTemplateDropdown(!showTemplateDropdown)}
                        className="h-8 px-4 text-xs font-semibold bg-background/50 hover:bg-muted border-border/50 transition-all rounded-lg"
                    >
                        <Download className="h-3.5 w-3.5 mr-1.5" />
                        {selectedTemplates.length > 0
                            ? `${selectedTemplates.length} Template${selectedTemplates.length > 1 ? 's' : ''}`
                            : "Templates"}
                        <svg
                            className={cn(
                                "ml-1.5 h-3 w-3 transition-transform",
                                showTemplateDropdown && "rotate-180"
                            )}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </Button>

                    {/* Dropdown Menu */}
                    {showTemplateDropdown && (
                        <div className="absolute right-0 top-full mt-2 w-72 bg-card border border-border/50 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] z-100 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="p-2 space-y-1">
                                {/* Select All Option */}
                                <div
                                    onClick={handleSelectAllTemplates}
                                    className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-all group"
                                >
                                    <div
                                        className={cn(
                                            "h-4 w-4 border-2 rounded flex items-center justify-center transition-all",
                                            selectedTemplates.length === templates.length
                                                ? "bg-btn-primary border-btn-primary"
                                                : "border-muted-foreground/40 group-hover:border-btn-primary/50"
                                        )}
                                    >
                                        {selectedTemplates.length === templates.length && (
                                            <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </div>
                                    <span className="text-xs font-semibold text-foreground">Select All Templates</span>
                                </div>

                                <div className="border-t border-border/10 my-1"></div>

                                {/* Individual Templates */}
                                {templates.map((template) => (
                                    <div
                                        key={template.id}
                                        onClick={() => handleTemplateToggle(template.id)}
                                        className="flex items-start gap-2 p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-all group"
                                    >
                                        <div
                                            className={cn(
                                                "h-4 w-4 mt-0.5 border-2 rounded flex items-center justify-center shrink-0 transition-all",
                                                selectedTemplates.includes(template.id)
                                                    ? "bg-btn-primary border-btn-primary"
                                                    : "border-muted-foreground/40 group-hover:border-btn-primary/50"
                                            )}
                                        >
                                            {selectedTemplates.includes(template.id) && (
                                                <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <FileSpreadsheet className="h-3.5 w-3.5 text-btn-primary shrink-0" />
                                                <p className="text-xs font-semibold text-foreground truncate">
                                                    {template.name}
                                                </p>
                                            </div>
                                            <p className="text-[10px] text-muted-foreground mt-0.5">
                                                {template.description}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Action Buttons */}
                            <div className="border-t border-border/10 p-2.5 flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setSelectedTemplates([]);
                                        setShowTemplateDropdown(false);
                                    }}
                                    className="h-8 flex-1 text-xs font-semibold rounded-lg hover:bg-muted transition-all"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={handleDownloadSelected}
                                    disabled={selectedTemplates.length === 0}
                                    className="h-8 flex-1 bg-btn-primary hover:bg-btn-primary/90 text-white text-xs font-bold rounded-lg shadow-lg shadow-btn-primary/25 transition-all active:scale-95"
                                >
                                    <Download className="h-3.5 w-3.5 mr-1.5" />
                                    Download ({selectedTemplates.length})
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
