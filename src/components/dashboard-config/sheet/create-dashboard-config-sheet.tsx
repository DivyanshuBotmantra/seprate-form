import { useEffect, useRef } from "react";
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
import dashboardConfig from "@/services/dashboard-config";
import { Textarea } from "@/components/ui/textarea";
import { updateSidebarItems } from "@/lib/sidebar-utils";

interface DashboardConfigCreateSheetProps {
  open: boolean;
  loading: boolean;
  onClose: () => void;
  title: string;
  refreshTable: () => void;
}

type FormValues = {
  dashboard_name: string;
  dashboard_url: string;
  dashboard_config_json: string;
};


export function DashboardConfigCreateSheet({
  open,
  onClose,
  title,
  loading,
  refreshTable,
}: DashboardConfigCreateSheetProps) {
  const orgName =
    JSON.parse(sessionStorage.getItem("SelectedOrg") || "{}")?.org_name || "";

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      dashboard_name: "",
      dashboard_url: "",
      dashboard_config_json: "",
    },
  });


  const jsonValue = watch("dashboard_config_json");

  // ---------- RESET ON OPEN ----------
  useEffect(() => {
    if (!open) return;

    reset({
      dashboard_name: "",
      dashboard_url: "",
      dashboard_config_json: "",
    });
  }, [open, reset]);


  // ---------- SUBMIT ----------
  const onSubmit = async (form: FormValues) => {
    let parsedJson;

    try {
      parsedJson = JSON.parse(form.dashboard_config_json);
    } catch {
      toast.error("Invalid JSON format. Please fix it before saving.");
      return;
    }

    const payload = {
      dashboard_name: form.dashboard_name,
      org_name: orgName,
      dashboard_url: form.dashboard_url,
      dashboard_config_json: parsedJson,
    };

    const res = await dashboardConfig.createdashboardconfig(payload);

    if (res?.error) {
      toast.error(res.error);
      return;
    }

    toast.success("Dashboard created successfully");

    // refresh sidebar
    await updateSidebarItems(orgName);

    reset();
    refreshTable();
    onClose();
  };


  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="flex flex-col p-0 bg-background text-foreground">
        {/* HEADER */}
        <SheetHeader className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
          <SheetTitle className="text-lg font-semibold">{title}</SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground">
            Create a new dashboard configuration.
          </SheetDescription>
        </SheetHeader>

        {/* FORM */}
        <form
          id="dashboard-create-form"
          onSubmit={handleSubmit(onSubmit)}
          className="flex-1 overflow-y-auto px-4 space-y-6"
        >
          {/* ORG NAME */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Organization</label>
            <Input
              value={orgName}
              disabled
              className="bg-muted text-muted-foreground cursor-not-allowed"
            />
          </div>

          {/* DASHBOARD NAME */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Dashboard Name <span className="text-destructive">*</span>
            </label>
            <Input
              {...register("dashboard_name", {
                required: "Dashboard name is required",
              })}
              placeholder="Enter dashboard name"
            />
            {errors.dashboard_name && (
              <p className="text-sm text-destructive">
                {errors.dashboard_name.message}
              </p>
            )}
          </div>

          {/* DASHBOARD URL */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Dashboard URL <span className="text-destructive">*</span>
            </label>
            <Input
              {...register("dashboard_url", {
                required: "Dashboard URL is required",
                minLength: {
                  value: 3,
                  message: "Dashboard URL is too short",
                },
              })}
              placeholder="/dashboard/sales-overview"
            />
            {errors.dashboard_url && (
              <p className="text-sm text-destructive">
                {errors.dashboard_url.message}
              </p>
            )}
          </div>


          {/* DASHBOARD CONFIG JSON */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Dashboard Config (JSON){" "}
              <span className="text-destructive">*</span>
            </label>

            {(() => {
              const { ref: rhfRef, ...rest } = register(
                "dashboard_config_json",
                { required: "JSON config is required" }
              );

              return (
                <Textarea
                  {...rest}
                  ref={(el) => {
                    rhfRef(el);
                    textareaRef.current = el;
                  }}
                  placeholder={`{\n  "example": true\n}`}
                  className="
                                        w-full rounded-md border border-border
                                        bg-muted/30 p-3 font-mono text-sm
                                        leading-relaxed overflow-hidden resize-none
                                        focus-visible:ring-1 focus-visible:ring-primary/40
                                    "
                />
              );
            })()}

            {errors.dashboard_config_json && (
              <p className="text-sm text-destructive">
                {errors.dashboard_config_json.message}
              </p>
            )}
          </div>
        </form>

        {/* FOOTER */}
        <div className="sticky bottom-0 z-10 flex gap-4 border-t bg-background/95 backdrop-blur p-5">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="dashboard-create-form"
            className="flex-1"
            disabled={loading}
          >
            {loading ? "Saving..." : "Create"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
