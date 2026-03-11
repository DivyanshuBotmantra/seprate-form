import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Controller } from "react-hook-form";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import botConfigApi from "@/services/botConfig";
import { Pencil } from "lucide-react";

type Props = {
  data: {
    org_name: string;
    bot_code: string;
    bot_name: string;
    bot_category: string;
    bot_status: "ACTIVE" | "INACTIVE";
  };
  refreshTable: () => void;
};

type FormValues = {
  bot_name: string;
  bot_category: string;
  bot_status: "ACTIVE" | "INACTIVE";
};

export default function BotconfigEditsheet({ data, refreshTable }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const orgName =
    JSON.parse(sessionStorage.getItem("SelectedOrg") || "{}")?.org_name || "";

  const { register, handleSubmit, reset, control } = useForm<FormValues>({
    defaultValues: {
      bot_name: "",
      bot_category: "",
      bot_status: "ACTIVE",
    },
  });

  // -----------------------------------
  // Pre-fill form when sheet opens
  // -----------------------------------
  useEffect(() => {
    if (!open) return;

    reset({
      bot_name: data.bot_name ?? "",
      bot_category: data.bot_category ?? "",
      bot_status: data.bot_status ?? "ACTIVE",
    });
  }, [open, data, reset]);

  // -----------------------------------
  // Submit handler (identity only)
  // -----------------------------------
  const onSubmit = async (form: FormValues) => {
    try {
      setLoading(true);

      const payload = {
        search_fields: {
          org_name: orgName,
          bot_code: data.bot_code,
        },
        update_fields: {
          bot_name: form.bot_name,
          bot_category: form.bot_category,
          bot_status: form.bot_status,
        },
      };

      const res = await botConfigApi.updateBotConfig(payload);

      if (res?.error) {
        toast.error(res.error);
        return;
      }

      toast.success("Bot updated successfully");
      refreshTable();
      setOpen(false);
      reset();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update bot");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Edit button */}
      <Button variant="ghost" className="px-0" onClick={() => setOpen(true)}>
        <Pencil size={18} />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="flex flex-col h-full p-0 bg-background">
          {/* Header */}
          <SheetHeader className="border-b p-4">
            <SheetTitle>Edit Bot</SheetTitle>
            <SheetDescription>Update bot identity details.</SheetDescription>
          </SheetHeader>

          {/* Form */}
          <form
            id="bot-edit-form"
            onSubmit={handleSubmit(onSubmit)}
            className="flex-1 overflow-y-auto p-6 space-y-6"
          >
            {/* Read-only */}
            <DisabledField label="Organization" value={orgName} />
            <DisabledField label="Bot Code" value={data.bot_code} />

            {/* Editable */}
            <Field
              label="Bot Name"
              reg={register("bot_name", { required: true })}
            />
            <Field
              label="Bot Category"
              reg={register("bot_category", { required: true })}
            />

            {/* Status */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>

              {/* ✅ Fixed: Controller now points to correct field "bot_status" */}
              <Controller
                name="bot_status"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                      <SelectItem value="INACTIVE">INACTIVE</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </form>

          {/* Footer */}
          <div className="border-t p-5 flex gap-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              form="bot-edit-form"
              className="flex-1"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

/* ---------------- Helpers ---------------- */

function DisabledField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      <Input
        value={value}
        disabled
        className="bg-muted text-muted-foreground cursor-not-allowed"
      />
    </div>
  );
}

function Field({ label, reg }: { label: string; reg: any }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      <Input {...reg} />
    </div>
  );
}
