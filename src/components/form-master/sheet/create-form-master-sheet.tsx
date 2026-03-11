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

import formMaster from "@/services/form-master";
import emailConfig from "@/services/email-config";
import botConfigApi from "@/services/botConfig";
import { updateSidebarItems } from "@/lib/sidebar-utils";
import { useLovMaster } from "@/hooks/useLovMaster";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

type FormMasterCreateSheetProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  loading: boolean;
  refreshTable: () => void;
};

export function FormMasterCreateSheet({
  open,
  onClose,
  title,
  loading,
  refreshTable,
}: FormMasterCreateSheetProps) {
  /* ---------------- Org ---------------- */
  const [orgName, setOrgName] = useState("");

  useEffect(() => {
    if (open) {
      const stored = JSON.parse(sessionStorage.getItem("SelectedOrg") || "{}");
      setOrgName(stored?.org_name || "");
    }
  }, [open]);

  /* ---------------- Credential (FILE) ---------------- */
  const FILE_CRED_TYPE = "FILE";
  const [fileCredSubType, setFileCredSubType] = useState("");

  const { lovData } = useLovMaster(open);
  const [credTypeMap, setCredTypeMap] = useState<Record<string, string[]>>({});
  const [subTypeJsonMap, setSubTypeJsonMap] = useState<Record<string, any>>({});
  const [emailConfigs, setEmailConfigs] = useState<any[]>([]);
  const [botList, setBotList] = useState<any[]>([]);

  useEffect(() => {
    const fetchEmailConfigs = async () => {
      if (!open || !orgName) return;
      try {
        const res = await emailConfig.getemailConfig({ org_name: orgName });
        if (res.data?.response_body) {
          setEmailConfigs(res.data.response_body);
        }
      } catch (error) {
        console.error("Failed to fetch email configs", error);
      }
    };

    fetchEmailConfigs();
  }, [open, orgName]);

  /* Fetch bot list for bot_code dropdown */
  useEffect(() => {
    const fetchBots = async () => {
      if (!open || !orgName) return;
      try {
        const res = await botConfigApi.getBotConfig({
          org_name: orgName,
          bot_code: "",
          bot_name: "",
          bot_category: "",
          bot_status: "ACTIVE",
        });
        if (res.data?.response_body) {
          setBotList(res.data.response_body);
        }
      } catch (error) {
        console.error("Failed to fetch bot list", error);
      }
    };

    fetchBots();
  }, [open, orgName]);

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

  /* ---------------- Form State ---------------- */
  const [formData, setFormData] = useState({
    form_code: "",
    form_name: "",
    form_category: "",
    bot_trigger: false,
    bot_code: "",
    sidebar_visibility: false,
    form_url: "",
    form_json: "",
    file_folder_path: "",
    file_credential: "",
    storage_encryption: false,
    form_status: "ACTIVE",
    email_flag: false,
    email_name: "",
    file_trigger_flag: false,
  });

  useEffect(() => {
    if (open) {
      setFormData({
        form_code: "",
        form_name: "",
        form_category: "",
        bot_trigger: false,
        bot_code: "",
        sidebar_visibility: false,
        form_url: "",
        form_json: "",
        file_folder_path: "",
        file_credential: "",
        storage_encryption: false,
        form_status: "ACTIVE",
        email_flag: false,
        email_name: "",
        file_trigger_flag: false,
      });
      setFileCredSubType("");
    }
  }, [open]);

  /* Auto paint file credential JSON */
  useEffect(() => {
    if (!fileCredSubType) return;

    const template = subTypeJsonMap[fileCredSubType];
    if (!template) return;

    const merged = {
      cred_sub_type: fileCredSubType,
      ...template,
    };

    setFormData((prev) => ({
      ...prev,
      file_credential: JSON.stringify(merged, null, 2),
    }));
  }, [fileCredSubType, subTypeJsonMap]);

  const handleChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  /* ---------------- Validation ---------------- */
  const validate = () => {
    if (!orgName) return "Organization Name is required";
    if (!formData.form_code) return "Form Code is required";
    if (!formData.form_name) return "Form Name is required";
    if (!formData.form_category) return "Form Category is required";
    return null;
  };

  /* ---------------- Submit ---------------- */
  const handleSubmit = async () => {
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }

    let parsedFormJson = {};
    let parsedCredential = {};

    try {
      parsedFormJson = formData.form_json ? JSON.parse(formData.form_json) : {};
    } catch {
      toast.error("Invalid Form JSON");
      return;
    }

    try {
      parsedCredential = formData.file_credential
        ? JSON.parse(formData.file_credential)
        : {};
    } catch {
      toast.error("Invalid File Credential JSON");
      return;
    }

    const payload: Record<string, any> = {
      org_name: orgName,
      form_code: formData.form_code,
      form_name: formData.form_name,
      form_category: formData.form_category,
      bot_trigger: formData.bot_trigger,
      ...(formData.bot_trigger && formData.bot_code
        ? { bot_code: formData.bot_code }
        : {}),
      sidebar_visibility: formData.sidebar_visibility,
      form_url: formData.form_url || undefined,
      form_json: parsedFormJson,
      file_folder_path: formData.file_folder_path || undefined,
      file_credential: parsedCredential,
      storage_encryption: formData.storage_encryption,
      form_status: "ACTIVE",
      email_flag: formData.email_flag,
      email_name: formData.email_name || undefined,
      file_trigger_flag: formData.file_trigger_flag,
    };

    try {
      const res = await formMaster.createFormMaster(payload);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("Form created successfully");
        refreshTable();
        await updateSidebarItems(orgName);
        onClose();
      }
    } catch {
      toast.error("Failed to create form");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[420px] sm:max-w-md flex flex-col">
        <SheetHeader className="pb-3 border-b">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>Create a new form definition</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-auto custom-scrollbar px-4 py-6 space-y-5">
          <Field label="Organization *">
            <Input value={orgName} disabled className="bg-muted" />
          </Field>

          <Field label="Form Code *">
            <Input
              value={formData.form_code}
              placeholder="Enter the Form code"
              onChange={(e) => handleChange("form_code", e.target.value)}
            />
          </Field>

          <Field label="Form Name *">
            <Input
              value={formData.form_name}
              placeholder="Enter the Form Name"
              onChange={(e) => handleChange("form_name", e.target.value)}
            />
          </Field>

          <Field label="Form Category *">
            <Input
              value={formData.form_category}
              placeholder="Enter the Form Category"
              onChange={(e) => handleChange("form_category", e.target.value)}
            />
          </Field>

          {/* Bot Trigger — when enabled, bot_code field appears */}
          <Field label="Bot Trigger">
            <RadioGroup
              value={formData.bot_trigger ? "yes" : "no"}
              onValueChange={(val) => {
                handleChange("bot_trigger", val === "yes");
                if (val === "no") handleChange("bot_code", "");
              }}
              className="flex items-center gap-4"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="no" id="bot_trigger_no" />
                <Label htmlFor="bot_trigger_no" className="font-normal cursor-pointer">
                  No
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="yes" id="bot_trigger_yes" />
                <Label htmlFor="bot_trigger_yes" className="font-normal cursor-pointer">
                  Yes
                </Label>
              </div>
            </RadioGroup>
          </Field>

          {formData.bot_trigger && (
            <Field label="Bot Code *">
              <Select
                value={formData.bot_code}
                onValueChange={(val) => handleChange("bot_code", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Bot Code" />
                </SelectTrigger>
                <SelectContent className="z-50">
                  {botList.map((bot: any) => (
                    <SelectItem key={bot.bot_code} value={bot.bot_code}>
                      {bot.bot_code} — {bot.bot_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}

          {/* Sidebar Visibility — controls whether this form is displayed in the sidebar */}
          <Field label="Sidebar Visibility">
            <RadioGroup
              value={formData.sidebar_visibility ? "yes" : "no"}
              onValueChange={(val) => handleChange("sidebar_visibility", val === "yes")}
              className="flex items-center gap-4"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="no" id="sidebar_visibility_no" />
                <Label htmlFor="sidebar_visibility_no" className="font-normal cursor-pointer">
                  No
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="yes" id="sidebar_visibility_yes" />
                <Label htmlFor="sidebar_visibility_yes" className="font-normal cursor-pointer">
                  Yes
                </Label>
              </div>
            </RadioGroup>
          </Field>

          <Field label="Form URL">
            <Input
              value={formData.form_url}
              placeholder="Enter the Form URL"
              onChange={(e) => handleChange("form_url", e.target.value)}
            />
          </Field>

          <Field label="Form JSON (Dynamic Form)">
            <Textarea
              rows={5}
              className="font-mono"
              placeholder="Enter the Form JSON"
              value={formData.form_json}
              onChange={(e) => handleChange("form_json", e.target.value)}
            />
          </Field>

          <Field label="File Folder Path">
            <Input
              value={formData.file_folder_path}
              placeholder="Enter the File Folder Path"
              onChange={(e) => handleChange("file_folder_path", e.target.value)}
            />
          </Field>

          <Field label="File Trigger Flag">
            <RadioGroup
              value={formData.file_trigger_flag ? "yes" : "no"}
              onValueChange={(val) => handleChange("file_trigger_flag", val === "yes")}
              className="flex items-center gap-4"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="no" id="file_trigger_flag_no" />
                <Label htmlFor="file_trigger_flag_no" className="font-normal cursor-pointer">
                  No
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="yes" id="file_trigger_flag_yes" />
                <Label htmlFor="file_trigger_flag_yes" className="font-normal cursor-pointer">
                  Yes
                </Label>
              </div>
            </RadioGroup>
          </Field>

          {formData.file_trigger_flag && (
            <>
              <Field label="File Credential Sub-Type *">
                <Select value={fileCredSubType} onValueChange={setFileCredSubType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select credential type" />
                  </SelectTrigger>
                  <SelectContent>
                    {(credTypeMap[FILE_CRED_TYPE] ?? []).map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Credential JSON">
                <Textarea
                  rows={4}
                  className="font-mono"
                  placeholder="Select the File credentials sub type"
                  value={formData.file_credential}
                  onChange={(e) => handleChange("file_credential", e.target.value)}
                />
              </Field>
            </>
          )}

          <Field label="Email Flag">
            <RadioGroup
              value={formData.email_flag ? "yes" : "no"}
              onValueChange={(val) => handleChange("email_flag", val === "yes")}
              className="flex items-center gap-4"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="no" id="email_flag_no" />
                <Label htmlFor="email_flag_no" className="font-normal cursor-pointer">
                  No
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="yes" id="email_flag_yes" />
                <Label htmlFor="email_flag_yes" className="font-normal cursor-pointer">
                  Yes
                </Label>
              </div>
            </RadioGroup>
          </Field>

          {formData.email_flag && (
            <Field label="Email Name">
              <Select
                value={formData.email_name}
                onValueChange={(val) => handleChange("email_name", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Email Name" />
                </SelectTrigger>
                <SelectContent>
                  {emailConfigs.map((config: any) => (
                    <SelectItem key={config.email_name} value={config.email_name}>
                      {config.email_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}

          {/* STORAGE ENCRYPTION (shadcn Select + placeholder) */}
          <Field label="Storage Encryption">
            <Select
              value={String(formData.storage_encryption)}
              onValueChange={(val) =>
                handleChange("storage_encryption", val === "true")
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select encryption option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="false">Disabled</SelectItem>
                <SelectItem value="true">Enabled</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field label="Status">
            <Input value="ACTIVE" disabled className="bg-muted" />
          </Field>
        </div>

        <SheetFooter className="border-t p-4">
          <Button onClick={handleSubmit} disabled={loading} className="w-full">
            {loading ? <OrbitLoader /> : "Create Form"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
