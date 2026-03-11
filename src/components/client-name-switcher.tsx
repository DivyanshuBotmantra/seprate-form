import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Building2 } from "lucide-react";
import { useClientNameStore, clientNames } from "@/lib/store/client-name-store";

export function ClientNameSwitcher() {
  const { selectedClient, setSelectedClient } = useClientNameStore();

  return (
    <Select value={selectedClient} onValueChange={setSelectedClient}>
      <SelectTrigger className="h-8 w-auto min-w-[180px] bg-[#f0f0f0] dark:bg-muted/50 border border-border/50 rounded-xl shadow-sm hover:bg-[#e8e8e8] dark:hover:bg-muted/70 transition-colors text-sm font-normal px-3 overflow-hidden">
        <div className="flex items-center gap-1.5 min-w-0 w-full">
          <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <div className="flex-1 min-w-0">
            <SelectValue className="" />
          </div>
        </div>
      </SelectTrigger>
      <SelectContent className="rounded-xl">
        {clientNames.map((client) => (
          <SelectItem key={client.value} value={client.value}>
            {client.label}
          </SelectItem>
        ))}
        <SelectSeparator />
        <div className="p-1">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // TODO: Add manage clients functionality
            }}
          >
            Manage Clients
          </Button>
        </div>
      </SelectContent>
    </Select>
  );
}
