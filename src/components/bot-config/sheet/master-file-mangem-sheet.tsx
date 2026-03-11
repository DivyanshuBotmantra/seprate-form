import { useEffect, useRef, useState, useCallback } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import botConfigApi from "@/services/botConfig";
import getLovMaster from "@/services/lov-master";
import { FileCog } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

/* ---------------- Types ---------------- */

type LovItem = {
  lov_type: string;
  lov_json: any;
  lov_status: string;
};

type Props = {
  data: {
    bot_code: string;
    master_files?: Record<string, any> | null;
    master_file_folder_path?: string | null;
    master_file_credential?: Record<string, any> | null;
    storage_encryption?: boolean;
  };
  refreshTable: () => void;
};

type FormValues = {
  master_files: string;
  master_file_folder_path: string;
  master_file_credential: string;
  storage_encryption: boolean;
};

/* ---------------- Component ---------------- */

export default function BotConfigMasterFilesSheet({
  data,
  refreshTable,
}: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lovData, setLovData] = useState<LovItem[]>([]);

  const FILE_CRED_TYPE = "FILE";
  const [fileCredSubType, setFileCredSubType] = useState("");
  const [storageEncryption, setStorageEncryption] = useState(false);
  const [credTypeMap, setCredTypeMap] = useState<Record<string, string[]>>({});
  const [subTypeJsonMap, setSubTypeJsonMap] = useState<Record<string, any>>({});

  const orgName =
    JSON.parse(sessionStorage.getItem("SelectedOrg") || "{}")?.org_name || "";

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const { register, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: {
      master_files: "{}",
      master_file_folder_path: "",
      master_file_credential: "{}",
      storage_encryption: false,
    },
  });
  console.log(data, "data from sheet master file management")
  /* ---------------------------------------
   * Fetch LOV ONLY when sheet opens
   * --------------------------------------- */
  const fetchLov = useCallback(async () => {
    try {
      const payload = {
        lov_type: "",
        lov_json: "",
        lov_status: "",
      };

      const res = await getLovMaster(payload);
      setLovData(res?.data?.response_body || []);
    } catch (err) {
      toast.error("Failed to fetch LOV master data");
      setLovData([]);
      console.error("getLovMaster error:", err);
    }
  }, []);

  useEffect(() => {
    if (!open) return;

    if (lovData.length === 0) {
      fetchLov();
    }
  }, [open, lovData.length, fetchLov]);

  /* ---------------------------------------
   * Process LOV data to extract cred types and templates
   * --------------------------------------- */
  useEffect(() => {
    if (!lovData.length) return;

    const typeMap: Record<string, string[]> = {};
    const jsonMap: Record<string, any> = {};

    lovData.forEach((item) => {
      // Store the JSON template for each lov_type
      jsonMap[item.lov_type] = item.lov_json;

      // If this is a CRED-TYPE entry, extract sub-types
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

  /* ---------------------------------------
   * Auto-select if only one subtype available
   * --------------------------------------- */
  useEffect(() => {
    const subTypes = credTypeMap[FILE_CRED_TYPE] ?? [];
    if (subTypes.length === 1 && fileCredSubType !== subTypes[0]) {
      setFileCredSubType(subTypes[0]);
    }
  }, [credTypeMap, fileCredSubType]);

  /* ---------------------------------------
   * Generate file credential JSON template based on subtype
   * Only update if we don't have existing credential data
   * --------------------------------------- */
  useEffect(() => {
    if (!fileCredSubType) return;
    if (!open) return; // Don't run when sheet is closed

    // Don't overwrite if we already have credential data
    const hasExistingCreds = data?.master_file_credential &&
      Object.keys(data.master_file_credential).length > 0;
    if (hasExistingCreds) return;

    const template = subTypeJsonMap[fileCredSubType];
    if (!template) return;

    const mergedJson = {
      cred_sub_type: fileCredSubType,
      ...template,
    };

    // Update the form value for master_file_credential
    reset((formValues) => ({
      ...formValues,
      master_file_credential: JSON.stringify(mergedJson, null, 2),
    }));
  }, [fileCredSubType, subTypeJsonMap, reset, open, data]);

  /* ---------------------------------------
   * Extract MASTER-FILES template
   * --------------------------------------- */
  const getMasterFilesLov = useCallback(() => {
    const match = lovData.find(
      (item) => item.lov_type === "MASTER-FILES" && item.lov_status === "ACTIVE"
    );

    if (!match?.lov_json) return "{}";

    try {
      return JSON.stringify(match.lov_json, null, 2);
    } catch {
      return "{}";
    }
  }, [lovData]);

  /* ---------------------------------------
   * Pre-fill when sheet opens
   * --------------------------------------- */
  useEffect(() => {
    if (!open) return;

    // Reset file cred subtype when sheet opens
    setFileCredSubType("");

    // Check if master_files has data (handle both array and object)
    const hasMasterFiles = data?.master_files && (
      Array.isArray(data.master_files)
        ? data.master_files.length > 0
        : Object.keys(data.master_files).length > 0
    );

    // Determine master_files value
    const masterFilesValue = hasMasterFiles
      ? JSON.stringify(data.master_files, null, 2)
      : getMasterFilesLov();

    // Determine master_file_credential value
    const hasCreds = data?.master_file_credential &&
      Object.keys(data.master_file_credential).length > 0;
    const credValue = hasCreds
      ? JSON.stringify(data.master_file_credential, null, 2)
      : "{}";

    // Reset form with all values
    reset({
      master_files: masterFilesValue,
      master_file_folder_path: data?.master_file_folder_path ?? "",
      master_file_credential: credValue,
      storage_encryption: data?.storage_encryption ?? false,
    }, {
      keepDefaultValues: false,
    });

    // Extract cred_sub_type from existing data if present
    const credSubType = data?.master_file_credential?.cred_sub_type;
    if (credSubType) {
      // Use setTimeout to ensure this runs after reset
      setTimeout(() => {
        setFileCredSubType(credSubType);
      }, 0);
    }
  }, [open, data, reset, getMasterFilesLov]);

  /* ---------------------------------------
   * Submit handler
   * --------------------------------------- */
  const onSubmit = async (form: FormValues) => {
    try {
      setLoading(true);

      let parsedMasterFiles = {};
      let parsedCredentials = {};

      try {
        parsedMasterFiles = JSON.parse(form.master_files || "{}");
      } catch {
        toast.error("Invalid JSON in Master Files");
        return;
      }

      try {
        parsedCredentials = JSON.parse(form.master_file_credential || "{}");
      } catch {
        toast.error("Invalid JSON in Master File Credentials");
        return;
      }

      const payload = {
        search_fields: {
          org_name: orgName,
          bot_code: data.bot_code,
        },
        update_fields: {
          master_files: parsedMasterFiles,
          master_file_folder_path: form.master_file_folder_path,
          master_file_credential: parsedCredentials,
          storage_encryption: form.storage_encryption,
        },
      };

      const res = await botConfigApi.updateBotConfig(payload);

      if (res?.error) {
        toast.error(res.error);
        return;
      }

      toast.success("Master files updated successfully");
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

  /* --------------------------------------- */

  return (
    <>
      <Button variant="ghost" className="px-0" onClick={() => setOpen(true)}>
        <FileCog size={18} />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="flex flex-col h-full p-0 bg-background">
          <SheetHeader className="border-b p-4">
            <SheetTitle>Master File Configuration</SheetTitle>
            <SheetDescription>
              Operational configuration for this bot.
            </SheetDescription>
          </SheetHeader>

          <form
            id="master-files-form"
            onSubmit={handleSubmit(onSubmit)}
            className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6"
          >
            <DisabledField label="Organization" value={orgName} />
            <DisabledField label="Bot Code" value={data.bot_code} />

            <Field label="Master File Folder Path">
              <Input
                {...register("master_file_folder_path")}
                placeholder="/data/bots/my-bot"
              />
            </Field>

            <Field label="File Credential Sub-Type">
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
            </Field>

            <Field label="Master File Credentials (JSON)">
              <Textarea
                {...register("master_file_credential")}
                className="min-h font-mono text-sm"
              />
            </Field>

            <Field label="Storage Encryption">
              <Select
                value={String(storageEncryption)}
                onValueChange={(val) => {
                  const boolValue = val === "true";
                  setStorageEncryption(boolValue);
                  reset((formValues) => ({
                    ...formValues,
                    storage_encryption: boolValue,
                  }));
                }}
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

            <Field label="Master Files (JSON)">
              <Textarea
                {...register("master_files")}
                ref={(el) => {
                  register("master_files").ref(el);
                  textareaRef.current = el;
                }}
                className="min-h-[300px] font-mono text-sm"
              />
            </Field>
          </form>

          <div className="border-t p-5 flex gap-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="master-files-form"
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

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}
