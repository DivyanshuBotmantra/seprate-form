import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Pencil } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { updateOrganisation } from "@/services/organisation";
import { Button } from "@/components/ui/button";

interface Org {
  org_name: string;
  org_status: string;
}

interface Props {
  data: Org;
  refresh: () => void;
}

const OrgEditSheet = ({ data, refresh }: Props) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const { setValue, watch, handleSubmit, reset } = useForm({
    defaultValues: {
      org_status: data.org_status,
    },
  });

  const status = watch("org_status");

  /* ---------------- Reset on open ---------------- */
  useEffect(() => {
    if (open) {
      reset({ org_status: data.org_status });
    }
  }, [open, data.org_status, reset]);

  /* ---------------- Submit ---------------- */
  const onSubmit = async (formData: { org_status: string }) => {
    setLoading(true);

    try {
      const res = await updateOrganisation({
        search_fields: {
          org_name: data.org_name,
        },
        update_fields: {
          org_status: formData.org_status,
        },
      });

      if (res?.error) {
        toast.error(res.error);
        return;
      }

      toast.success("Organisation updated successfully");
      setOpen(false);
      refresh();
    } catch {
      toast.error("Failed to update organisation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Trigger */}
      <Button variant="ghost" className="px-0" onClick={() => setOpen(true)}>
        <Pencil size={18} />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="flex flex-col w-[420px] p-0"
        >
          {/* ---------- HEADER ---------- */}
          <SheetHeader className="shrink-0 border-b p-6">
            <SheetTitle>Edit Organisation</SheetTitle>
            <SheetDescription>
              Modify organisation details and save changes.
            </SheetDescription>
          </SheetHeader>

          {/* ---------- BODY (FORM) ---------- */}
          <form
            id="org-edit-form"
            onSubmit={handleSubmit(onSubmit)}
            className="flex-1 overflow-y-auto p-6 space-y-6"
          >
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                Organisation
              </Label>
              <p className="font-semibold">{data.org_name}</p>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(value) =>
                  setValue("org_status", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                  <SelectItem value="INACTIVE">INACTIVE</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </form>

          {/* ---------- FOOTER ---------- */}
          <div className="shrink-0 border-t p-4 flex gap-3 bg-background">
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
              form="org-edit-form" 
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
};

export default OrgEditSheet;
