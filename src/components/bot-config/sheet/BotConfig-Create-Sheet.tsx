import { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import botConfigApi from "@/services/botConfig";
import { updateSidebarItems } from "@/lib/sidebar-utils";

interface BotConfigCreateSheetProps {
  open: boolean;
  loading: boolean;
  onClose: () => void;
  title: string;
  refreshTable: () => void;
}

type FormValues = {
  bot_code: string;
  bot_name: string;
  bot_category: string;
  bot_status: "ACTIVE";
};

export function BotConfigCreateSheet({
  open,
  onClose,
  title,
  loading,
  refreshTable,
}: BotConfigCreateSheetProps) {
  const orgName =
    JSON.parse(sessionStorage.getItem("SelectedOrg") || "{}")?.org_name || "";

  const { register, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: {
      bot_code: "",
      bot_name: "",
      bot_category: "",
      bot_status: "ACTIVE",
    },
  });

  useEffect(() => {
    if (!open) return;

    reset({
      bot_code: "",
      bot_name: "",
      bot_category: "",
      bot_status: "ACTIVE",
    });
  }, [open, reset]);

  const onSubmit = async (form: FormValues) => {
    const payload = {
      org_name: orgName,
      bot_code: form.bot_code,
      bot_name: form.bot_name,
      bot_category: form.bot_category,
      bot_status: "ACTIVE",
    };

    try {
      const res = await botConfigApi.createBotConfig(payload);

      if (res?.error) {
        toast.error(res.error);
        return;
      }

      toast.success("Bot created successfully");
      // Update sidebar items after successful bot creation
      await updateSidebarItems(orgName);
      reset();
      refreshTable();
      onClose();
    } catch (err) {
      toast.error("Failed to create bot");
      console.error(err);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="flex flex-col p-0 bg-background text-foreground">
        {/* Header */}
        <SheetHeader className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur p-5">
          <SheetTitle className="text-lg font-semibold">{title}</SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground">
            Create a new bot (identity only).
          </SheetDescription>
        </SheetHeader>

        {/* Form */}
        <form
          id="bot-create-form"
          onSubmit={handleSubmit(onSubmit)}
          className="flex-1 overflow-y-auto p-6 space-y-6"
        >
          {/* Organization */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Organization</label>
            <Input
              value={orgName}
              disabled
              className="bg-muted text-muted-foreground cursor-not-allowed"
            />
          </div>

          {/* Bot Code */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Bot Code <span className="text-destructive">*</span>
            </label>
            <Input
              {...register("bot_code", {
                required: "Bot code is required",
              })}
              placeholder="Enter Bot Code"
            />
          </div>

          {/* Bot Name */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Bot Name <span className="text-destructive">*</span>
            </label>
            <Input
              {...register("bot_name", {
                required: "Bot name is required",
              })}
              placeholder="Enter Bot Name"
            />
          </div>

          {/* Bot Category */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Bot Category <span className="text-destructive">*</span>
            </label>
            <Input
              {...register("bot_category", {
                required: "Bot category is required",
              })}
              placeholder="Enter Bot Category"
            />
          </div>

          {/* Status (forced ACTIVE) */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Status <span className="text-destructive">*</span></label>
            <Input
              value="ACTIVE"
              disabled
              {...register("bot_status")}
              className="bg-muted text-muted-foreground cursor-not-allowed"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="sticky bottom-0 z-10 flex gap-4 border-t bg-background/95 backdrop-blur p-5">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button type="submit" form="bot-create-form" className="flex-1">
            {loading ? "Saving..." : "Create"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
