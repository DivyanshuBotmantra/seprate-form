import { useState } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import EmptyState from "@/components/common/EmptyState";

interface BotMetric {
    botname: string;
    frequency: number;
    percentage: number;
}

interface StatusComponent3Props {
    top_5_bot_failures?: BotMetric[];
    top_5_bot_successes?: BotMetric[];
    selectedBots?: string[];
}

export default function StatusComponent3({ top_5_bot_failures = [], top_5_bot_successes = [], selectedBots = [] }: StatusComponent3Props) {
    const [activeView, setActiveView] = useState<"failures" | "successes">("failures");

    const currentData = activeView === "failures" ? top_5_bot_failures : top_5_bot_successes;
    const isDataEmpty = !currentData || currentData.length === 0;

    // Dynamic heading logic
    const heading =
        selectedBots.length === 1
            ? `${selectedBots[0]} Performance`
            : selectedBots.length > 1
                ? "BOT Performance"
                : "Top 5 Bot Performance";

    const subtitle =
        selectedBots.length === 1
            ? "Failures and successes for selected bot"
            : selectedBots.length > 1
                ? `Failures and successes across ${selectedBots.length} selected bots`
                : "Highest failures and successes";

    return (
        <div className="bg-card rounded-xl p-6 border-2 border-border shadow-lg hover:shadow-xl transition-all duration-300 hover:border-btn-primary/30 h-[100%] flex flex-col min-h-0">
            {/* Header with inline toggle */}
            <div className="flex items-center justify-between mb-4 shrink-0">
                <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                        <span className="w-1 h-6 bg-btn-primary rounded-full"></span>
                        {heading}
                    </h3>
                    <p className="text-[11px] text-muted-foreground mt-1 ml-3 font-medium">{subtitle}</p>
                </div>

                {/* Enhanced Pill-Shaped Toggle */}
                {(top_5_bot_failures.length > 0 || top_5_bot_successes.length > 0) && (
                    <div
                        className={`relative flex items-center rounded-full p-1 ml-2 border-2 bg-background transition-all duration-300 shadow-sm ${activeView === "failures"
                            ? "border-destructive/50"
                            : "border-success/50"
                            }`}
                    >
                        {/* Elevated Pill Indicator */}
                        <div
                            className={`absolute top-1 bottom-1 rounded-full bg-card shadow-lg border transition-all duration-300 ease-out ${activeView === "failures"
                                ? "left-1 w-[calc(50%-6px)] border-destructive/30"
                                : "left-[calc(50%+2px)] w-[calc(50%-6px)] border-success/30"
                                }`}
                        />

                        {/* Failures Button */}
                        <button
                            onClick={() => setActiveView("failures")}
                            className={`relative z-10 flex items-center justify-center gap-1 px-4 py-2 text-[11px] font-black transition-all duration-200 whitespace-nowrap rounded-full ${activeView === "failures"
                                ? "text-destructive"
                                : "text-foreground/60 hover:text-foreground/80"
                                }`}
                        >
                            <TrendingDown className="w-3.5 h-3.5" />
                            FAILURES
                        </button>

                        {/* Successes Button */}
                        <button
                            onClick={() => setActiveView("successes")}
                            className={`relative z-10 flex items-center justify-center gap-1 px-4 py-2 text-[11px] font-black transition-all duration-200 whitespace-nowrap rounded-full ${activeView === "successes"
                                ? "text-success"
                                : "text-foreground/60 hover:text-foreground/80"
                                }`}
                        >
                            <TrendingUp className="w-3.5 h-3.5" />
                            SUCCESSES
                        </button>
                    </div>
                )}
            </div>

            {/* Ultra-Compact Data Display */}
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar pr-1">
                {isDataEmpty ? (
                    <EmptyState />
                ) : (
                    <div className="space-y-2">
                        {currentData.map((bot, index) => (
                            <div
                                key={bot.botname}
                                className="group relative bg-sidebar/20 border border-border/50 rounded-lg transition-all duration-300 hover:shadow-md hover:border-btn-primary/20 cursor-pointer overflow-hidden"
                            >
                                {/* Ultra-Compact Content */}
                                <div className="flex items-center gap-3 p-3">
                                    {/* Minimal Rank Badge */}
                                    <div className="flex-shrink-0">
                                        <div
                                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shadow-sm ${activeView === "failures"
                                                ? "bg-destructive/10 text-destructive border border-destructive/20"
                                                : "bg-success/10 text-success border border-success/20"
                                                }`}
                                        >
                                            {index + 1}
                                        </div>
                                    </div>

                                    {/* Bot Information - Compact */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[11px] font-black text-foreground uppercase tracking-tight truncate leading-tight">
                                            {bot.botname}
                                        </p>
                                        <p className="text-[9px] text-muted-foreground font-medium leading-tight mt-0.5 opacity-70">
                                            {bot.percentage.toFixed(1)}% OF TOTAL EXECUTIONS
                                        </p>
                                    </div>

                                    {/* Frequency Count - Compact */}
                                    <div className="flex-shrink-0 text-right">
                                        <div
                                            className={`text-lg font-black tabular-nums leading-tight ${activeView === "failures" ? "text-destructive" : "text-success"
                                                }`}
                                        >
                                            {bot.frequency}
                                        </div>
                                        <div className="text-[8px] text-muted-foreground font-black uppercase leading-tight">
                                            runs
                                        </div>
                                    </div>
                                </div>

                                {/* Minimal Bottom Indicator */}
                                <div className="h-1 w-full bg-muted/30">
                                    <div
                                        className={`h-full transition-all duration-1000 ease-out ${activeView === "failures"
                                            ? "bg-destructive/30"
                                            : "bg-success/30"
                                            }`}
                                        style={{ width: `${bot.percentage}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}