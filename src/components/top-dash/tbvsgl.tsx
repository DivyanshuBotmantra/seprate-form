import { Bot } from "lucide-react";

export const TbVsGlCard = () => {
    return (
        <div className="flex flex-col bg-white rounded-lg overflow-hidden">
            {/* Container Heading */}
            <div className="px-4 py-3 bg-gradient-to-r from-primary/10 via-primary/20 to-transparent border-b border-primary/20 flex-shrink-0">
                <h3 className="text-lg font-semibold text-foreground tracking-tight leading-tight">
                    TB VS GL
                </h3>
            </div>

            {/* Boxes Container */}
            <div className="flex p-">
                {/* TB VS GL Box */}
                <div className="relative overflow-hidden rounded- bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border- border-blue-500/40 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] group cursor-pointer flex-1">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-bl-full" />
                    <div className="relative p-4">
                        <div className="flex items-center justify-center mb-2">
                            <div className="p-2 rounded-xl bg-blue-500/20 shadow-inner">
                                <Bot className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-center text-foreground mb-1">
                            TB VS GL Reconciliation
                        </h3>
                    </div>
                </div>

                {/* Audited GL Entry Box */}
                <div className="relative overflow-hidden rounded- bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent bor border-emerald-500/40 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] group cursor-pointer flex-1">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-bl-full" />
                    <div className="relative p-4">
                        <div className="flex items-center justify-center mb-2">
                            <div className="p-2 rounded-xl bg-emerald-500/20 shadow-inner">
                                <Bot className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-center text-foreground mb-1">
                            Audited GL Entry
                        </h3>
                    </div>
                </div>
            </div>
        </div>
    );
};
