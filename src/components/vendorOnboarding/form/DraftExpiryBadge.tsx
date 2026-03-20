import React from "react";
import { format, addDays, differenceInCalendarDays, isAfter, startOfToday } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock } from "lucide-react";

interface DraftExpiryBadgeProps {
  createdOn: string;
}

const DraftExpiryBadge: React.FC<DraftExpiryBadgeProps> = ({ createdOn }) => {
  const createdDate = new Date(createdOn);
  const expiryDate = addDays(createdDate, 30);
  const today = startOfToday();
  const diffDays = differenceInCalendarDays(expiryDate, today);
  const isExpired = isAfter(today, expiryDate);

  const formattedExpiryDate = format(expiryDate, "dd MMM yyyy");

  if (isExpired || diffDays < 0) {
    return (
      <Badge variant="destructive" className="flex items-center gap-1.5 px-3 py-1 font-bold">
        <AlertTriangle className="h-3.5 w-3.5" />
        Expired
      </Badge>
    );
  }

  if (diffDays === 0) {
    return (
      <div className="flex flex-col items-end gap-0.5">
        <Badge variant="destructive" className="flex items-center gap-1.5 px-3 py-1 font-bold animate-pulse">
          <Clock className="h-3.5 w-3.5" />
          Expires Today
        </Badge>
        <span className="text-[10px] text-muted-foreground font-medium opacity-70 italic mr-1">
          Expires on {formattedExpiryDate}
        </span>
      </div>
    );
  }

  if (diffDays <= 5) {
    return (
      <div className="flex flex-col items-end gap-0.5">
        <Badge variant="destructive" className="flex items-center gap-1.5 px-3 py-1 font-bold">
          <AlertTriangle className="h-3.5 w-3.5" />
          Expires in {diffDays} {diffDays === 1 ? 'day' : 'days'}
        </Badge>
        <span className="text-[10px] text-muted-foreground font-medium opacity-70 italic mr-1">
          Expires on {formattedExpiryDate}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-0.5">
      <Badge variant="secondary" className="flex items-center gap-1.5 px-3 py-1 font-bold bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100">
        <Clock className="h-3.5 w-3.5" />
        Expires in {diffDays} days
      </Badge>
      <span className="text-[10px] text-muted-foreground font-medium opacity-70 italic mr-1">
        Expires on {formattedExpiryDate}
      </span>
    </div>
  );
};

export default DraftExpiryBadge;
