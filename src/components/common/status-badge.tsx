import React from "react";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  className,
}) => {
  const isActive = status.toLowerCase() === "active";

  return (
    <div
      className={cn(
        "w-fit px-2 rounded-2xl border-2 text-darkLight",
        isActive
          ? "bg-success/70 border-success"
          : "bg-danger/70 border-danger",
        className
      )}
    >
      <p className="text-darkLight">{status}</p>
    </div>
  );
};

interface BotStatusBadgeProps {
  status: string;
  className?: string;
}

export const BotStatusBadge: React.FC<BotStatusBadgeProps> = ({
  status,
  className,
}) => {
  const statusLower = status.toLowerCase().replace(/-/g, "");

  const getStatusStyles = () => {
    if (statusLower === "succeeded") {
      return "bg-success/70 border-success";
    }
    if (statusLower === "failed") {
      return "bg-danger/70 border-danger";
    }
    if (statusLower === "rejected") {
      return "bg-danger/70 border-danger";
    }
    if (statusLower === "submitted") {
      return "bg-success/70 border-success";
    }
    if (statusLower === "initiated") {
      return "bg-[#3B82F6]/70 border-[#3B82F6]"; // Blue color matching dashboard
    }
    // SCHEDULED, IN-PROGRESS (handles "in-progress" and "inprogress")
    return "bg-amber-500/70 border-amber-500";
  };

  return (
    <div
      className={cn(
        "w-fit px-2 rounded-2xl border-2 text-darkLight",
        getStatusStyles(),
        className
      )}
    >
      <p className="text-darkLight">{status}</p>
    </div>
  );
};
