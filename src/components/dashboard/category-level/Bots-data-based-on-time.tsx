import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, LabelList, Label } from "recharts";
import { format, eachDayOfInterval, isSameDay, startOfDay } from "date-fns";
import { CHART_UI } from "@/components/dashboard/colors";
import EmptyState from "@/components/common/EmptyState";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Eye } from "lucide-react";

interface BotRunTimeData {
    bot_name: string;
    runTimeMin: number;
}

interface BotsDataBasedOnTimeProps {
    data?: Record<string, BotRunTimeData[]>;
    dateRange?: {
        from: string;
        to: string;
    };
}

const BOT_COLORS = [
    '#F87171', // Light red/pink
    '#60A5FA', // Light blue
    '#34D399', // Light green/emerald
    '#FBBF24', // Light amber
    '#A78BFA', // Light purple
    '#FB923C', // Light orange
];



export default function BotsDataBasedOnTime({ data, dateRange }: BotsDataBasedOnTimeProps) {
    const safeData = data || {};
    const [hoveredBot, setHoveredBot] = useState<string | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    const botNames = new Set<string>();

    // First pass to collect all bot names
    Object.values(safeData).forEach((bots) => {
        bots.forEach((bot) => botNames.add(bot.bot_name));
    });

    const botList = Array.from(botNames);
    let chartData: any[] = [];

    if (dateRange && dateRange.from && dateRange.to) {
        try {
            const start = startOfDay(new Date(dateRange.from.replace(' ', 'T')));
            const end = startOfDay(new Date(dateRange.to.replace(' ', 'T')));

            const allDays = eachDayOfInterval({ start, end });

            chartData = allDays.map(day => {
                const dateKey = format(day, "yyyy-MM-dd");
                const item: any = {
                    date: dateKey,
                    displayDate: format(day, "MMM dd"),
                };

                // Initialize all bots with 0
                botList.forEach(bot => {
                    item[bot] = 0;
                });

                // Find data for this day (keys in safeData might match exactly or need parsing)
                // We use isSameDay for robustness
                const matchingKey = Object.keys(safeData).find(key =>
                    isSameDay(new Date(key.replace(' ', 'T')), day)
                );

                if (matchingKey) {
                    safeData[matchingKey].forEach((bot) => {
                        item[bot.bot_name] = bot.runTimeMin;
                    });
                }

                return item;
            });
        } catch (error) {
            console.error("Error generating date range for BotsDataBasedOnTime:", error);
        }
    }

    // Fallback if chartData empty (either no range or error)
    if (chartData.length === 0) {
        Object.entries(safeData).forEach(([dateKey, bots]) => {
            const item: any = {
                date: dateKey,
                displayDate: format(new Date(dateKey), "MMM dd"),
            };

            bots.forEach((bot) => {
                item[bot.bot_name] = bot.runTimeMin;
            });
            chartData.push(item);
        });
        chartData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }

    // ✅ Check if there's no data to display
    const hasData = chartData.length > 0 && botList.length > 0;

    // Limit to 7 days for the main view
    const mainViewData = useMemo(() => {
        return chartData.slice(0, 7);
    }, [chartData]);

    const hasMoreData = hasData && chartData.length > 7;

    // Custom Tooltip
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="rounded-lg shadow-lg p-3" style={{ backgroundColor: CHART_UI.tooltipBg, color: CHART_UI.tooltipText }}>
                    <p className="text-xs font-semibold mb-2">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={index} className="text-xs flex items-center gap-2" style={{ color: entry.color }}>
                            <span className="capitalize">{entry.name}:</span>
                            <span className="font-bold">{Number(entry.value).toFixed(2)} min</span>
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-card rounded-xl p-6 border-2 border-border shadow-lg hover:shadow-xl transition-all duration-300 hover:border-btn-primary/30 h-full flex flex-col">
            <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                    <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                        <span className="w-1 h-6 bg-btn-primary rounded-full"></span>
                        Bot Run Time Trend
                    </h3>
                </div>

                <div className="flex items-center gap-4">
                    {/* Legend - Only show when there's data */}
                    {hasData && (
                        <div className="flex flex-wrap items-center justify-end gap-x-5 gap-y-2">
                            {botList.map((bot, index) => (
                                <div
                                    key={bot}
                                    className="flex items-center gap-2 group cursor-pointer"
                                    onMouseEnter={() => setHoveredBot(bot)}
                                    onMouseLeave={() => setHoveredBot(null)}
                                >
                                    <div
                                        className="w-3 h-3 rounded-sm shadow-sm transition-all duration-300 group-hover:scale-125"
                                        style={{
                                            backgroundColor: BOT_COLORS[index % BOT_COLORS.length],
                                            opacity: hoveredBot ? (hoveredBot === bot ? 1 : 0.3) : 1
                                        }}
                                    ></div>
                                    <span
                                        className="text-[10px] font-bold transition-all duration-300 whitespace-nowrap"
                                        style={{
                                            color: hoveredBot ? (hoveredBot === bot ? 'inherit' : 'gray') : 'inherit',
                                            opacity: hoveredBot ? (hoveredBot === bot ? 1 : 0.5) : 1
                                        }}
                                    >
                                        {bot}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {hasMoreData && (
                        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                            <DialogTrigger asChild>
                                <button className="h-8 w-8 flex items-center justify-center rounded-full bg-sidebar/50 hover:bg-btn-primary/10 text-muted-foreground hover:text-btn-primary transition-all duration-300 border border-border shadow-sm group shrink-0">
                                    <Eye className="h-4 w-4 transition-transform group-hover:scale-110" />
                                </button>
                            </DialogTrigger>
                            <DialogContent className="min-w-6xl w-full h-[85vh] flex flex-col">
                                <DialogHeader className="pb-4 border-b border-border">
                                    <DialogTitle className="flex items-center gap-2 text-xl">
                                        <span className="w-1.5 h-8 bg-btn-primary rounded-full"></span>
                                        Complete Bot Run Time History ({chartData.length} Days)
                                    </DialogTitle>
                                </DialogHeader>
                                <div className="flex-1 min-h-0 pt-6">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData} margin={{ top: 12, right: 12, left: 10, bottom: 24 }} barSize={50}>
                                            <CartesianGrid strokeDasharray="3 3" stroke={CHART_UI.grid} vertical={false} />
                                            <XAxis dataKey="displayDate" tick={{ fontSize: 12 }} stroke={CHART_UI.axis} />
                                            <YAxis tick={{ fontSize: 12 }} stroke={CHART_UI.axis} />
                                            <Tooltip content={<CustomTooltip />} cursor={false} />
                                            {botList.map((bot, index) => (
                                                <Bar key={bot} dataKey={bot} name={bot} stackId="a" fill={BOT_COLORS[index % BOT_COLORS.length]} />
                                            ))}
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>
            </div>

            <div className="flex-1 min-h-0 mt-2">
                {!hasData ? (
                    <EmptyState />
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={mainViewData} margin={{ top: 12, right: 12, left: 10, bottom: 24 }} barSize={50}>
                            <CartesianGrid strokeDasharray="3 3" stroke={CHART_UI.grid} vertical={false} />
                            <XAxis
                                dataKey="displayDate"
                                tick={{ fontSize: 12 }}
                                stroke={CHART_UI.axis}
                                axisLine={false}
                                tickLine={false}
                            >
                                <Label
                                    value="Date"
                                    position="insideBottom"
                                    offset={-10}
                                    style={{ fontSize: 12, fill: CHART_UI.axis }}
                                />
                            </XAxis>
                            <YAxis
                                tick={{ fontSize: 12 }}
                                stroke={CHART_UI.axis}
                                axisLine={false}
                                tickLine={false}
                                domain={[0, 'auto']}
                                tickFormatter={(value) => `${value}`}
                            >
                                <Label
                                    value="Time (min)"
                                    angle={-90}
                                    position="insideLeft"
                                    style={{ textAnchor: 'middle', fontSize: 12, fill: CHART_UI.axis }}
                                />
                            </YAxis>
                            <Tooltip content={<CustomTooltip />} cursor={false} wrapperStyle={{ outline: 'none' }} />

                            {botList.map((bot, index) => (
                                <Bar
                                    key={bot}
                                    dataKey={bot}
                                    name={bot}
                                    stackId="a"
                                    fill={BOT_COLORS[index % BOT_COLORS.length]}
                                    fillOpacity={hoveredBot ? (hoveredBot === bot ? 1 : 0.2) : 0.9}
                                    radius={index === botList.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                                    onMouseEnter={() => setHoveredBot(bot)}
                                    onMouseLeave={() => setHoveredBot(null)}
                                    className="transition-all duration-300"
                                >
                                    <LabelList
                                        dataKey={bot}
                                        position="center"
                                        content={(props: any) => {
                                            const { x, y, width, height, value } = props;
                                            if (height < 20) return null; // Only show if segment is large enough
                                            return (
                                                <text
                                                    x={x + width / 2}
                                                    y={y + height / 2}
                                                    fill="#fff"
                                                    textAnchor="middle"
                                                    dominantBaseline="middle"
                                                    className="text-[9px] font-bold"
                                                >
                                                    {Number(value).toFixed(1)}
                                                </text>
                                            );
                                        }}
                                    />
                                </Bar>
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}
