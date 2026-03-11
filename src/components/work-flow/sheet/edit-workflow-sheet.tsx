import { useEffect, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
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
import workflow from "@/services/workflow";
import { Pencil } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

export default function WorkFlowEditSheet({ data, refreshTable }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const orgName =
    JSON.parse(sessionStorage.getItem("SelectedOrg") || "{}")?.org_name || "";

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const formattedJson =
    typeof data.wf_json === "string"
      ? data.wf_json
      : JSON.stringify(data.wf_json ?? {}, null, 2);

  const { register, handleSubmit, reset, control } = useForm({
    defaultValues: {
      wf_name: "",
      wf_category: "",
      wf_json: formattedJson,
      wf_status: data.wf_status || "ACTIVE",
    },
  });

  useEffect(() => {
    if (!open) return;

    reset({
      wf_name: data.wf_name,
      wf_category: data.wf_category,
      wf_json: formattedJson,
      wf_status: data.wf_status,
    });

    setTimeout(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }, 20);
  }, [open, data, reset, formattedJson]);

  const onSubmit = async (form: any) => {
    try {
      setLoading(true);

      let parsedJSON = {};
      try {
        parsedJSON = form.wf_json ? JSON.parse(form.wf_json) : {};
      } catch {
        toast.error("Invalid JSON format");
        return;
      }

      const payload = {
        search_fields: {
          org_name: orgName,
          wf_code: data.wf_code,
        },
        update_fields: {
          wf_name: form.wf_name,
          wf_category: form.wf_category,
          wf_json: parsedJSON,
          wf_status: form.wf_status,
        },
      };

      const res = await workflow.updateWorkFlow(payload);

      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("Workflow updated successfully");
        refreshTable();
        reset();
        setOpen(false);
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button variant="ghost" className="px-0" onClick={() => setOpen(true)}>
        <Pencil size={18} />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="flex flex-col p-0 bg-background">
          <SheetHeader className="sticky top-0 bg-background border-b p-3 z-10">
            <SheetTitle>Edit Workflow</SheetTitle>
            <SheetDescription>
              Modify details and save changes.
            </SheetDescription>
          </SheetHeader>

          <form
            id="workflow-edit-form"
            onSubmit={handleSubmit(onSubmit)}
            className="flex-1 overflow-y-auto p-4 space-y-6"
          >
            <DisabledField label="Organization" value={orgName} />
            <DisabledField label="Workflow Code" value={data.wf_code} />

            <EditableField
              label="Workflow Name"
              field={register("wf_name")}
              placeholder="Enter workflow name"
            />

            <EditableField
              label="Workflow Category"
              field={register("wf_category")}
              placeholder="Enter workflow category"
            />

            {/* JSON */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Workflow JSON</label>
              {(() => {
                const { ref: rhfRef, ...rest } = register("wf_json");
                return (
                  <Textarea
                    {...rest}
                    ref={(el) => {
                      rhfRef(el);
                      textareaRef.current = el;
                    }}
                    className="font-mono resize-none"
                  />
                );
              })()}
            </div>

            {/* STATUS (shadcn) */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Workflow Status</label>

              <Controller
                name="wf_status"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select workflow status" />
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
              form="workflow-edit-form"
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

function DisabledField({ label, value }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <Input value={value} disabled className="bg-muted" />
    </div>
  );
}

function EditableField({ label, field, placeholder }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <Input {...field} placeholder={placeholder} />
    </div>
  );
}
