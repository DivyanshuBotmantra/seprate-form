import { useEffect, useRef, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import dashboardConfig from "@/services/dashboard-config";
import { Pencil } from "lucide-react";
import { updateSidebarItems } from "@/lib/sidebar-utils";

type Props = {
  data: {
    org_name: string;
    dashboard_name: string;
    dashboard_url: string;
    dashboard_config_json: Record<string, any>;
    dashboard_status: "ACTIVE" | "INACTIVE";
  };
  refreshTable: () => void;
};

export default function DashboardConfigEditSheet({
  data,
  refreshTable,
}: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const orgName =
    JSON.parse(sessionStorage.getItem("SelectedOrg") || "{}")?.org_name || "";

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  type FormValues = {
    dashboard_config_json: string;
    dashboard_url: string;
    dashboard_status: "ACTIVE" | "INACTIVE";
  };

  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      dashboard_config_json: "",
      dashboard_url: "",
      dashboard_status: "ACTIVE",
    },
  });

  const jsonValue = watch("dashboard_config_json");

  // ---------- PREFILL ----------
  useEffect(() => {
    if (!open) return;

    reset({
      dashboard_config_json: data.dashboard_config_json
        ? JSON.stringify(data.dashboard_config_json, null, 2)
        : "",
      dashboard_url: data.dashboard_url || "",
      dashboard_status: data.dashboard_status || "ACTIVE",
    });
  }, [open, data, reset]);

  // ---------- AUTO RESIZE ----------
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;

    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [jsonValue]);

  // ---------- SUBMIT ----------
  const onSubmit = async (form: FormValues) => {
    let parsedJson;

    try {
      parsedJson = JSON.parse(form.dashboard_config_json);
    } catch {
      toast.error("Invalid JSON format. Please fix before saving.");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        search_fields: {
          dashboard_name: data.dashboard_name,
          org_name: orgName,
        },
        update_fields: {
          dashboard_config_json: parsedJson,
          dashboard_url: form.dashboard_url,
          dashboard_status: form.dashboard_status,
        },
      };

      const res = await dashboardConfig.updatedashboardconfig(payload);

      if (res?.error) {
        toast.error(res.error);
        return;
      }

      toast.success("Dashboard updated successfully");

      // refresh sidebar
      await updateSidebarItems(orgName);

      refreshTable();
      setOpen(false);
      reset();
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Edit Button */}
      <Button variant="ghost" className="px-0" onClick={() => setOpen(true)}>
        <Pencil size={18} />
      </Button>

      {/* Sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="flex flex-col p-0 bg-background">
          <SheetHeader className="sticky top-0 bg-background border-b  z-10">
            <SheetTitle>Edit Dashboard Configuration</SheetTitle>
            <SheetDescription>
              Update configuration JSON and status.
            </SheetDescription>
          </SheetHeader>

          <form
            id="dashboard-edit-form"
            onSubmit={handleSubmit(onSubmit)}
            className="flex-1 overflow-y-auto px-4 space-y-6"
          >
            <DisabledField label="Organization" value={orgName} />

            <DisabledField label="Dashboard Name" value={data.dashboard_name} />

            {/* Dashboard URL */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Dashboard URL</label>
              <Input {...register("dashboard_url")} />
            </div>

            {/* Dashboard Config JSON */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Dashboard Config (JSON)
              </label>

              {(() => {
                const { ref: rhfRef, ...rest } = register(
                  "dashboard_config_json",
                  { required: "JSON is required" }
                );

                return (
                  <Textarea
                    {...rest}
                    ref={(el) => {
                      rhfRef(el);
                      textareaRef.current = el;
                    }}
                    className="w-full rounded-md border border-border bg-muted/30 p-3 font-mono text-sm resize-none"
                  />
                );
              })()}
            </div>

            {/* Status */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>

              {/* ✅ Fixed: Controller now points to correct field "dashboard_status" */}
              <Controller
                name="dashboard_status"
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
          <div className="sticky bottom-0 bg-background border-t p-5 flex gap-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              form="dashboard-edit-form"
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

function DisabledField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <Input
        value={value}
        readOnly
        className="bg-muted text-muted-foreground cursor-not-allowed"
      />
    </div>
  );
}
