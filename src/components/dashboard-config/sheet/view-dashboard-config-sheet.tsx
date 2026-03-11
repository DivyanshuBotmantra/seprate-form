import { useState, useEffect, useRef } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  data: {
    org_name: string;
    dashboard_name: string;
    dashboard_url: string;
    dashboard_config_json: Record<string, any>;
    dashboard_status: "ACTIVE" | "INACTIVE";
  };
};


export default function ViewDashBoardConfig({ data }: Props) {
  const [open, setOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const formattedJson = data.dashboard_config_json
    ? JSON.stringify(data.dashboard_config_json, null, 2)
    : "";

  useEffect(() => {
    if (!open) return;

    setTimeout(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }, 20);
  }, [open, formattedJson]);

  return (
    <>
      <Button variant="ghost" className="px-0" onClick={() => setOpen(true)}>
        <Eye size={18} />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="flex flex-col p-0 bg-background text-foreground">
          {/* HEADER */}
          <SheetHeader className="sticky top-0 bg-background border-b z-10">
            <SheetTitle>View Dashboard Details</SheetTitle>
            <SheetDescription>All fields are read-only.</SheetDescription>
          </SheetHeader>

          {/* CONTENT */}
          <div className="flex-1 overflow-y-auto px-4 space-y-6">
            <ViewField label="Organization" value={data.org_name} />

            <ViewField label="Dashboard Name" value={data.dashboard_name} />

            <ViewField label="Dashboard URL" value={data.dashboard_url} />

            {/* Dashboard Config JSON */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">
                Dashboard Config (JSON)
              </label>

              <Textarea
                ref={textareaRef}
                value={formattedJson}
                disabled
                className="
                  w-full rounded-lg border border-border
                  bg-muted/20 p-4 font-mono text-sm leading-relaxed
                  whitespace-pre-wrap break-words
                  overflow-hidden resize-none cursor-not-allowed
                  min-h-[160px]
                "
              />
            </div>

            <ViewField label="Status" value={data.dashboard_status} />
          </div>

          {/* FOOTER */}
          <div className="sticky bottom-0 bg-background border-t p-5 z-10">
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
}


function ViewField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-semibold">{label}</label>
      <Input
        value={value ?? ""}
        readOnly
        className="bg-muted/20 cursor-not-allowed"
      />
    </div>
  );
}
