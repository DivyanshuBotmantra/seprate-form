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

import taskConfig from "@/services/task-config";
import { updateSidebarItems } from "@/lib/sidebar-utils";
import { useLovMaster } from "../../../hooks/useLovMaster";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

type TaskMasterCreateSheetProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  loading: boolean;
  refreshTable: () => void;
};

export function TaskMasterCreateSheet({
  open,
  onClose,
  title,
  loading,
  refreshTable,
}: TaskMasterCreateSheetProps) {
  // ---------- Org Name ----------
  const [orgName, setOrgName] = useState("");

  const FILE_CRED_TYPE = "FILE";

  const [fileCredSubType, setFileCredSubType] = useState("");

  const { lovData } = useLovMaster(open);

  const [credTypeMap, setCredTypeMap] = useState<Record<string, string[]>>({});
  const [subTypeJsonMap, setSubTypeJsonMap] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!lovData.length) return;

    const typeMap: Record<string, string[]> = {};
    const jsonMap: Record<string, any> = {};

    lovData.forEach((item) => {
      jsonMap[item.lov_type] = item.lov_json;

      if (item.lov_type === "CRED-TYPE") {
        item.lov_json.forEach((entry: any) => {
          typeMap[entry.cred_type] = Array.isArray(entry.cred_sub_type)
            ? entry.cred_sub_type
            : [entry.cred_sub_type];
        });
      }
    });

    setCredTypeMap(typeMap);
    setSubTypeJsonMap(jsonMap);
  }, [lovData]);

  useEffect(() => {
    const subTypes = credTypeMap[FILE_CRED_TYPE] ?? [];
    if (subTypes.length === 1 && fileCredSubType !== subTypes[0]) {
      setFileCredSubType(subTypes[0]);
    }
  }, [credTypeMap, fileCredSubType]);

  useEffect(() => {
    if (!fileCredSubType) return;

    const template = subTypeJsonMap[fileCredSubType];
    if (!template) return;

    const mergedJson = {
      cred_sub_type: fileCredSubType,
      ...template,
    };

    handleChange("file_credential", JSON.stringify(mergedJson, null, 2));
  }, [fileCredSubType, subTypeJsonMap]);

  useEffect(() => {
    if (open) {
      const stored = JSON.parse(sessionStorage.getItem("SelectedOrg") || "{}");
      setOrgName(stored?.org_name || "");
    }
  }, [open]);

  // ---------- Form State ----------
  const [formData, setFormData] = useState({
    task_code: "",
    task_name: "",
    task_category: "",
    task_url: "",
    task_form_json: "",
    file_folder_path: "",
    file_credential: "",
    storage_encryption: false,
    task_status: "ACTIVE",
  });

  // Reset on open
  useEffect(() => {
    if (open) {
      setFormData({
        task_code: "",
        task_name: "",
        task_category: "",
        task_url: "",
        task_form_json: "",
        file_folder_path: "",
        file_credential: "",
        storage_encryption: false,
        task_status: "ACTIVE",
      });
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      setFileCredSubType("");
      handleChange("file_credential", "");
    }
  }, [open]);

  const handleChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const validate = () => {
    if (!orgName) return "Organization name is required";
    if (!formData.task_code) return "Task code is required";
    if (!formData.task_name) return "Task name is required";
    if (!formData.task_category) return "Task category is required";
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
        task_code: formData.task_code,
        task_name: formData.task_name,
        task_category: formData.task_category,
        task_url: formData.task_url || undefined,
        task_form_json: formData.task_form_json
          ? JSON.parse(formData.task_form_json)
          : undefined,
        file_folder_path: formData.file_folder_path || undefined,

        file_credential: formData.file_credential
          ? JSON.parse(formData.file_credential)
          : undefined,

        storage_encryption: formData.storage_encryption,
        task_status: formData.task_status || "ACTIVE",
      };

      console.log("CREATE TASK MASTER PAYLOAD:", payload);

      const res = await taskConfig.createTaskmaster(payload);

      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("Task created successfully");
        // Update sidebar items after successful task creation
        await updateSidebarItems(orgName);
        refreshTable();
        onClose();
      }
    } catch (err) {
      toast.error("Invalid JSON in Task JSON / File Credential field");
      console.error(err);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:max-w-md flex flex-col">
        {/* HEADER */}
        <SheetHeader className="pb-3 border-b">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>Create a new task definition</SheetDescription>
        </SheetHeader>

        {/* FORM */}
        <div className="flex-1 overflow-auto custom-scrollbar px-4 py-6 space-y-5">
          {/* ORG NAME */}
          <div className="space-y-1.5">
            <Label>Organization *</Label>
            <Input
              value={orgName}
              disabled
              className="bg-muted text-muted-foreground"
            />
          </div>

          {/* TASK CODE */}
          <div className="space-y-1.5">
            <Label>Task Code *</Label>
            <Input
              value={formData.task_code}
              onChange={(e) => handleChange("task_code", e.target.value)}
              placeholder="Enter task code"
            />
          </div>

          {/* TASK NAME */}
          <div className="space-y-1.5">
            <Label>Task Name *</Label>
            <Input
              value={formData.task_name}
              onChange={(e) => handleChange("task_name", e.target.value)}
              placeholder="Enter task name"
            />
          </div>

          {/* TASK CATEGORY */}
          <div className="space-y-1.5">
            <Label>Task Category *</Label>
            <Input
              value={formData.task_category}
              onChange={(e) => handleChange("task_category", e.target.value)}
              placeholder="Enter task category"
            />
          </div>

          {/* TASK URL */}
          <div className="space-y-1.5">
            <Label>Task URL</Label>
            <Input
              value={formData.task_url}
              onChange={(e) => handleChange("task_url", e.target.value)}
              placeholder="https://example.com"
            />
          </div>

          {/* TASK FORM JSON */}
          <div className="space-y-1.5">
            <Label>Task Form JSON</Label>
            <Textarea
              rows={5}
              value={formData.task_form_json}
              onChange={(e) => handleChange("task_form_json", e.target.value)}
              className="font-mono"
              placeholder="{}"
            />
          </div>

          {/* FILE FOLDER PATH */}
          <div className="space-y-1.5">
            <Label>File Folder Path</Label>
            <Input
              value={formData.file_folder_path}
              onChange={(e) => handleChange("file_folder_path", e.target.value)}
              placeholder="/uploads/tasks"
            />
          </div>

          {/* file cred json */}
          {/* FILE CREDENTIAL SUB-TYPE */}
          <div className="space-y-1.5">
            <Label>File Credential Sub-Type *</Label>
            <Select
              value={fileCredSubType}
              onValueChange={(val) => setFileCredSubType(val)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select file credential" />
              </SelectTrigger>
              <SelectContent>
                {(credTypeMap[FILE_CRED_TYPE] ?? []).map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>File Credential JSON</Label>
            <Textarea
              rows={4}
              value={formData.file_credential}
              onChange={(e) => handleChange("file_credential", e.target.value)}
              className="font-mono"
              placeholder="{}"
            />
          </div>

          {/* STATUS */}
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Input
              value="ACTIVE"
              disabled
              className="bg-muted text-muted-foreground"
            />
          </div>
        </div>

        {/* FOOTER */}
        <SheetFooter className="border-t p-4">
          <Button onClick={handleSubmit} disabled={loading} className="w-full">
            {loading ? <OrbitLoader /> : "Create Task"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
