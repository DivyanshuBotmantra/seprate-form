import OrbitLoader from "@/components/loader";

interface LoadingOverlayProps {
    isVisible: boolean;
    message: string;
}

export function LoadingOverlay({ isVisible, message }: LoadingOverlayProps) {
    if (!isVisible || !message) return null;

    return (
        <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-md z-50 rounded-2xl transition-all duration-500">
            <div className="flex flex-col items-center gap-6 bg-card/90 backdrop-blur-xl p-12 rounded-3xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] border border-border/50 scale-100 animate-in zoom-in-95 duration-300">
                <OrbitLoader size={16} outerColor="border-btn-primary" />
                <div className="text-center space-y-1">
                    <p className="text-base font-bold text-foreground tracking-tight">Bot Operating</p>
                    <p className="text-xs font-medium text-muted-foreground">{message}</p>
                </div>
            </div>
        </div>
    );
}
