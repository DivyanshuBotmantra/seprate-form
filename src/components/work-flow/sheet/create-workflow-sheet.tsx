import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import OrbitLoader from "@/components/loader";

import workflow from "@/services/workflow";

type WorkflowCreateSheetProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  loading: boolean;
  refreshTable: () => void;
};

export function WorkflowCreateSheet({
  open,
  onClose,
  title,
  loading,
  refreshTable,
}: WorkflowCreateSheetProps) {
  // ---------- Load org_name ----------
  const [orgName, setOrgName] = useState("");

  useEffect(() => {
    if (open) {
      const stored = JSON.parse(sessionStorage.getItem("SelectedOrg") || "{}");
      setOrgName(stored?.org_name || "");
    }
  }, [open]);

  // ---------- Form State ----------
  const [formData, setFormData] = useState({
    wf_code: "",
    wf_name: "",
    wf_category: "",
    wf_json: "",
    wf_status: "ACTIVE", // default + disabled
  });

  // Reset on open
  useEffect(() => {
    if (open) {
      setFormData({
        wf_code: "",
        wf_name: "",
        wf_category: "",
        wf_json: "",
        wf_status: "ACTIVE",
      });
    }
  }, [open]);

  const handleChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const validate = () => {
    if (!orgName) return "Organization Name is required";
    if (!formData.wf_code) return "Workflow Code is required";
    if (!formData.wf_name) return "Workflow Name is required";
    if (!formData.wf_category) return "Workflow Category is required";
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }

    try {
      const payload = {
        org_name: orgName,
        wf_code: formData.wf_code,
        wf_name: formData.wf_name,
        wf_category: formData.wf_category,
        wf_json: formData.wf_json ? JSON.parse(formData.wf_json) : {},
        wf_status: "ACTIVE", // always ACTIVE
      };

      console.log("CREATE WORKFLOW PAYLOAD:", payload);

      const res = await workflow.createWorkFlow(payload);

      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Workflow created successfully");
        refreshTable();
        onClose();
      }
    } catch (err) {
      toast.error("Invalid JSON in Workflow JSON field");
      console.error(err);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:max-w-md flex flex-col">
        {/* HEADER */}
        <SheetHeader className="pb-3 border-b">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>Create a new workflow definition</SheetDescription>
        </SheetHeader>

        {/* FORM AREA */}
        <div className="flex-1 overflow-auto px-4 py-6 space-y-5">
          {/* ORG NAME */}
          <div className="space-y-1.5">
            <Label>Organization Name *</Label>
            <Input
              value={orgName}
              disabled
              className="bg-muted text-muted-foreground cursor-not-allowed"
            />
          </div>

          {/* WORKFLOW CODE */}
          <div className="space-y-1.5">
            <Label>Workflow Code *</Label>
            <Input
              value={formData.wf_code}
              onChange={(e) => handleChange("wf_code", e.target.value)}
              placeholder="Enter workflow code"
            />
          </div>

          {/* WORKFLOW NAME */}
          <div className="space-y-1.5">
            <Label>Workflow Name *</Label>
            <Input
              value={formData.wf_name}
              onChange={(e) => handleChange("wf_name", e.target.value)}
              placeholder="Enter workflow name"
            />
          </div>

          {/* WORKFLOW CATEGORY */}
          <div className="space-y-1.5">
            <Label>Workflow Category *</Label>
            <Input
              value={formData.wf_category}
              onChange={(e) => handleChange("wf_category", e.target.value)}
              placeholder="Enter workflow category"
            />
          </div>

          {/* WORKFLOW JSON */}
          <div className="space-y-1.5">
            <Label>Workflow JSON </Label>
            <Textarea
              rows={6}
              value={formData.wf_json}
              onChange={(e) => handleChange("wf_json", e.target.value)}
              placeholder="Enter workflow JSON"
              className="font-mono"
            />
          </div>

          {/* WORKFLOW STATUS - FIXED ACTIVE */}
          <div className="space-y-1.5">
            <Label>Workflow Status *</Label>
            <Input
              value="ACTIVE"
              disabled
              className="bg-muted text-muted-foreground cursor-not-allowed"
            />
          </div>
        </div>

        {/* FOOTER */}
        <SheetFooter className="border-t p-4">
          <Button onClick={handleSubmit} disabled={loading} className="w-full">
            {loading ? <OrbitLoader /> : "Create Workflow"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
