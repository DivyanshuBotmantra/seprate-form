import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText } from "lucide-react";
import {
  useAuditPeriodStore,
  auditPeriods,
} from "@/lib/store/audit-period-store";

export function AuditPeriodSwitcher() {
  const { selectedPeriod, setSelectedPeriod } = useAuditPeriodStore();

  return (
    <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
      <SelectTrigger className="h-8 w-auto min-w-[200px] bg-[#f0f0f0] dark:bg-muted/50 border border-border/50 rounded-xl shadow-sm hover:bg-[#e8e8e8] dark:hover:bg-muted/70 transition-colors text-sm font-normal px-3 overflow-hidden">
        <div className="flex items-center gap-1.5 min-w-0 w-full">
          <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span className="text-xs text-muted-foreground font-normal shrink-0 whitespace-nowrap">
            Audit Period:
          </span>
          <div className="flex-1 min-w-0">
            <SelectValue className="" />
          </div>
        </div>
      </SelectTrigger>
      <SelectContent className="rounded-xl">
        {auditPeriods.map((period) => (
          <SelectItem key={period.value} value={period.value}>
            {period.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
