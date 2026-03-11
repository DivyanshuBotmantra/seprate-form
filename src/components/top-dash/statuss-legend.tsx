import { CheckCircle2, XCircle, Clock, Circle } from "lucide-react";

export const StatusLegend = () => {
  const statuses = [
    {
      label: "SUCCESS",
      color: "green",
      icon: CheckCircle2,
      textColor: "text-emerald-600 dark:text-emerald-400",
      dotColor: "bg-emerald-500",
    },
    {
      label: "FAILED",
      color: "red",
      icon: XCircle,
      textColor: "text-red-600 dark:text-red-400",
      dotColor: "bg-red-500",
    },
    {
      label: "IN PROGRESS",
      color: "amber",
      icon: Clock,
      textColor: "text-amber-600 dark:text-amber-400",
      dotColor: "bg-amber-500",
    },
    {
      label: "NOT STARTED",
      color: "grey",
      icon: Circle,
      textColor: "text-gray-600 dark:text-gray-400",
      dotColor: "bg-gray-500",
    },
  ];

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold text-foreground ">Colour Status</h3>

      {/* Color Scale Bar */}
      <div className="w-full h-3 rounded-lg overflow-hidden border border-gray-300/50 shadow-inner mb-3">
        <div className="flex h-full">
          {statuses.map((status, index) => (
            <div
              key={status.label}
              className={`flex-1 ${status.dotColor} ${
                index < statuses.length - 1 ? "border-r border-gray-300/30" : ""
              }`}
            />
          ))}
        </div>
      </div>

      {/* Status Labels */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {statuses.map((status) => {
          const Icon = status.icon;
          return (
            <div
              key={status.label}
              className="flex items-center gap-2 p-2 rounded-md bg-white/50 hover:bg-white/70 transition-colors"
            >
              <div
                className={`w-3 h-3 rounded-full ${status.dotColor} shrink-0`}
              />
              <Icon className={`w-4 h-4 ${status.textColor} shrink-0`} />
              <span
                className={`text-xs font-semibold ${status.textColor} tracking-wide`}
              >
                {status.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
