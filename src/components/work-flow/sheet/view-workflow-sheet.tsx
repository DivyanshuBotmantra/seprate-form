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

export default function ViewWorkFlow({ data }) {
  const [open, setOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const formattedJson =
    typeof data.wf_json === "string"
      ? data.wf_json
      : JSON.stringify(data.wf_json ?? {}, null, 2);

  return (
    <>
      <Button variant="ghost" className="px-0" onClick={() => setOpen(true)}>
        <Eye size={18} />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="flex flex-col p-0 bg-background text-foreground">
          {/* HEADER */}
          <SheetHeader className="sticky top-0 bg-background border-b p-5 z-10">
            <SheetTitle>Workflow Details</SheetTitle>
            <SheetDescription>All fields are read-only.</SheetDescription>
          </SheetHeader>

          {/* CONTENT */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
            <ViewField label="Organization" value={data.org_name} />
            <ViewField label="Workflow Code" value={data.wf_code} />
            <ViewField label="Workflow Name" value={data.wf_name} />
            <ViewField label="Workflow Category" value={data.wf_category} />
            <ViewField label="Workflow Status" value={data.wf_status} />

            {/* JSON FIELD */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">Workflow JSON</label>

              <Textarea
                ref={textareaRef}
                value={formattedJson}
                readOnly
                className="
                                    w-full rounded-lg border border-border
                                    bg-muted/20 p-4 font-mono text-sm leading-relaxed
                                    whitespace-pre-wrap break-words
                                    overflow-hidden resize-none cursor-not-allowed
                                    min-h-[160px]
                                "
              />
            </div>
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

function ViewField({ label, value }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-semibold">{label}</label>
      <Input
        value={value ?? ""}
        disabled
        className="bg-muted/20 cursor-not-allowed"
      />
    </div>
  );
}
