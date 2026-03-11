import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Org {
  org_name: string;
  org_status: string;
}

interface Props {
  data: Org;
}

const OrgViewSheet = ({ data }: Props) => {
  const [open, setOpen] = useState(false);

  const isActive = data.org_status.toLowerCase() === "active";

  return (
    <>
      {/* VIEW BUTTON */}
      <Button variant="ghost" className="px-0" onClick={() => setOpen(true)}>
        <Eye size={18} />
      </Button>

      {/* SHEET */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="flex flex-col w-[420px] p-0"
        >
          {/* ---------- HEADER (fixed) ---------- */}
          <SheetHeader className="shrink-0 border-b p-6">
            <SheetTitle>Organisation Details</SheetTitle>
            <SheetDescription>
              Basic information about this organisation.
            </SheetDescription>
          </SheetHeader>

          {/* ---------- BODY (scrollable) ---------- */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
              {/* Organisation Name */}
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Organisation Name
                </p>
                <p className="text-base font-semibold">
                  {data.org_name}
                </p>
              </div>

              {/* Status */}
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Status
                </p>

                <span
                  className={`inline-flex items-center px-3 py-1 text-sm rounded-full font-medium ${isActive
                      ? "bg-green-100 text-success"
                      : "bg-red-100 text-destructive"
                    }`}
                >
                  {data.org_status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* ---------- FOOTER (fixed) ---------- */}
          <div className="shrink-0 border-t p-4 bg-background">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setOpen(false)}
            >
              Close
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default OrgViewSheet;
