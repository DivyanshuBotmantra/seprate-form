import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
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

type Props = {
  data: {
    org_name: string;
    bot_code: string;
    bot_name: string;
    bot_category: string;
    bot_status: "ACTIVE" | "INACTIVE";
  };
};

type ViewValues = {
  org_name: string;
  bot_code: string;
  bot_name: string;
  bot_category: string;
  bot_status: string;
};

export default function BotconfigViewSheet({ data }: Props) {
  const [open, setOpen] = useState(false);

  const { reset, watch } = useForm<ViewValues>({
    defaultValues: {
      org_name: "",
      bot_code: "",
      bot_name: "",
      bot_category: "",
      bot_status: "",
    },
  });

  const values = watch();

  // -----------------------------------
  // Pre-fill values when opening
  // -----------------------------------
  useEffect(() => {
    if (!open || !data) return;

    reset({
      org_name: data.org_name ?? "",
      bot_code: data.bot_code ?? "",
      bot_name: data.bot_name ?? "",
      bot_category: data.bot_category ?? "",
      bot_status: data.bot_status ?? "",
    });
  }, [open, data, reset]);

  return (
    <>
      {/* View button */}
      <Button variant="ghost" className="px-0" onClick={() => setOpen(true)}>
        <Eye size={18} />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="flex flex-col p-0 bg-background text-foreground">
          {/* Header */}
          <SheetHeader className="sticky top-0 bg-background border-b p-4 z-10">
            <SheetTitle>View Bot</SheetTitle>
            <SheetDescription>
              Bot identity details (read-only).
            </SheetDescription>
          </SheetHeader>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <ReadOnlyField label="Organization" value={values.org_name} />
            <ReadOnlyField label="Bot Code" value={values.bot_code} />
            <ReadOnlyField label="Bot Name" value={values.bot_name} />
            <ReadOnlyField label="Bot Category" value={values.bot_category} />
            <ReadOnlyField label="Status" value={values.bot_status} />
          </div>

          {/* Footer */}
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

/* ---------------- Helpers ---------------- */

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      <Input
        value={value || "-"}
        readOnly
        className="bg-muted/30 text-muted-foreground cursor-not-allowed"
      />
    </div>
  );
}
