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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Pencil } from "lucide-react";

import formMaster from "@/services/form-master";
import emailConfig from "@/services/email-config";
import botConfigApi from "@/services/botConfig";
import { updateSidebarItems } from "@/lib/sidebar-utils";

import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

type FormMasterEditSheetProps = {
    data: any;
    refreshTable: () => void;
};

export default function FormMasterEditSheet({
    data,
    refreshTable,
}: FormMasterEditSheetProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const orgName =
        JSON.parse(sessionStorage.getItem("SelectedOrg") || "{}")?.org_name || "";

    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

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

    const formattedFormJson =
        typeof data.form_json === "string"
            ? data.form_json
            : JSON.stringify(data.form_json ?? {}, null, 2);

    const formattedCredential =
        typeof data.file_credential === "string"
            ? data.file_credential
            : JSON.stringify(data.file_credential ?? {}, null, 2);

    const { register, handleSubmit, reset, control, watch, setValue } = useForm({
        defaultValues: {
            form_name: "",
            form_category: "",
            bot_trigger: false,
            bot_code: "",
            sidebar_visibility: false,
            form_url: "",
            form_json: formattedFormJson,
            file_folder_path: "",
            file_credential: formattedCredential,
            storage_encryption: false,
            form_status: "ACTIVE",
            email_flag: false,
            email_name: "",
            file_trigger_flag: false,
        },
    });

    /* ---------------- Prefill on open ---------------- */
    useEffect(() => {
        if (!open) return;

        reset({
            form_name: data.form_name,
            form_category: data.form_category,
            bot_trigger: data.bot_trigger ?? false,
            bot_code: data.bot_code || "",
            sidebar_visibility: data.sidebar_visibility ?? false,
            form_url: data.form_url || "",
            form_json: formattedFormJson,
            file_folder_path: data.file_folder_path || "",
            file_credential: formattedCredential,
            storage_encryption: data.storage_encryption ?? false,
            form_status: data.form_status || "ACTIVE",
            email_flag: data.email_flag ?? false,
            email_name: data.email_name || "",
            file_trigger_flag: data.file_trigger_flag ?? false,
        });
    }, [open, data, reset, formattedFormJson, formattedCredential]);

    /* ---------------- Submit ---------------- */
    const onSubmit = async (form: any) => {
        try {
            setLoading(true);

            let parsedFormJson = {};
            let parsedCredential = {};

            try {
                parsedFormJson = form.form_json
                    ? JSON.parse(form.form_json)
                    : {};
            } catch {
                toast.error("Invalid Form JSON");
                return;
            }

            try {
                parsedCredential = form.file_credential
                    ? JSON.parse(form.file_credential)
                    : {};
            } catch {
                toast.error("Invalid File Credential JSON");
                return;
            }

            const payload = {
                search_fields: {
                    org_name: orgName,
                    form_code: data.form_code,
                },
                update_fields: {
                    form_name: form.form_name,
                    form_category: form.form_category,
                    bot_trigger: form.bot_trigger,
                    ...(form.bot_trigger && form.bot_code
                        ? { bot_code: form.bot_code }
                        : {}),
                    sidebar_visibility: form.sidebar_visibility,
                    form_url: form.form_url || undefined,
                    form_json: parsedFormJson,
                    file_folder_path: form.file_folder_path || undefined,
                    file_credential: parsedCredential,
                    storage_encryption: form.storage_encryption,
                    form_status: form.form_status,
                    email_flag: form.email_flag,
                    email_name: form.email_name || undefined,
                    file_trigger_flag: form.file_trigger_flag,
                },
            };

            const res = await formMaster.updateFormMaster(payload);

            if (res?.error) {
                toast.error(res.error);
            } else {
                toast.success("Form updated successfully");
                refreshTable();
                await updateSidebarItems(orgName);
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
            {/* Edit Button */}
            <Button variant="ghost" className="px-0" onClick={() => setOpen(true)}>
                <Pencil size={18} />
            </Button>

            <Sheet open={open} onOpenChange={setOpen}>
                <SheetContent className="flex flex-col p-0 bg-background text-foreground">
                    <SheetHeader className="sticky top-0 bg-background border-b p-5 z-10">
                        <SheetTitle>Edit Form Master</SheetTitle>
                        <SheetDescription>
                            Modify form details and save changes.
                        </SheetDescription>
                    </SheetHeader>

                    <form
                        id="form-master-edit"
                        onSubmit={handleSubmit(onSubmit)}
                        className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6"
                    >
                        <DisabledField label="Organization" value={orgName} />
                        <DisabledField label="Form Code" value={data.form_code} />

                        <EditableField
                            label="Form Name"
                            field={register("form_name")}
                            placeholder="Enter form name"
                        />

                        <EditableField
                            label="Form Category"
                            field={register("form_category")}
                            placeholder="Enter form category"
                        />

                        {/* Bot Trigger — when enabled, bot_code field appears */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Bot Trigger</label>
                            <Controller
                                name="bot_trigger"
                                control={control}
                                render={({ field }) => (
                                    <RadioGroup
                                        value={field.value ? "yes" : "no"}
                                        onValueChange={(val) => {
                                            field.onChange(val === "yes");
                                            if (val === "no") setValue("bot_code", "");
                                        }}
                                        className="flex items-center gap-4"
                                    >
                                        <div className="flex items-center gap-2">
                                            <RadioGroupItem value="no" id="edit_bot_trigger_no" />
                                            <Label htmlFor="edit_bot_trigger_no" className="font-normal cursor-pointer">
                                                No
                                            </Label>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <RadioGroupItem value="yes" id="edit_bot_trigger_yes" />
                                            <Label htmlFor="edit_bot_trigger_yes" className="font-normal cursor-pointer">
                                                Yes
                                            </Label>
                                        </div>
                                    </RadioGroup>
                                )}
                            />
                        </div>

                        {watch("bot_trigger") && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Bot Code *</label>
                                <Controller
                                    name="bot_code"
                                    control={control}
                                    render={({ field }) => (
                                        <Select
                                            value={field.value}
                                            onValueChange={field.onChange}
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
                                    )}
                                />
                            </div>
                        )}

                        {/* Sidebar Visibility — controls whether this form is displayed in the sidebar */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Sidebar Visibility</label>
                            <Controller
                                name="sidebar_visibility"
                                control={control}
                                render={({ field }) => (
                                    <RadioGroup
                                        value={field.value ? "yes" : "no"}
                                        onValueChange={(val) => field.onChange(val === "yes")}
                                        className="flex items-center gap-4"
                                    >
                                        <div className="flex items-center gap-2">
                                            <RadioGroupItem value="no" id="edit_sidebar_visibility_no" />
                                            <Label htmlFor="edit_sidebar_visibility_no" className="font-normal cursor-pointer">
                                                No
                                            </Label>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <RadioGroupItem value="yes" id="edit_sidebar_visibility_yes" />
                                            <Label htmlFor="edit_sidebar_visibility_yes" className="font-normal cursor-pointer">
                                                Yes
                                            </Label>
                                        </div>
                                    </RadioGroup>
                                )}
                            />
                        </div>

                        <EditableField
                            label="Form URL"
                            field={register("form_url")}
                            placeholder="https://example.com/form"
                        />

                        <EditableField
                            label="File Folder Path"
                            field={register("file_folder_path")}
                            placeholder="/uploads/forms"
                        />

                        <JsonField
                            label="Form JSON (Dynamic Form)"
                            field={register("form_json")}
                            textareaRef={textareaRef}
                        />

                        {/* FILE TRIGGER FLAG */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">File Trigger Flag</label>
                            <Controller
                                name="file_trigger_flag"
                                control={control}
                                render={({ field }) => (
                                    <RadioGroup
                                        value={field.value ? "yes" : "no"}
                                        onValueChange={(val) => field.onChange(val === "yes")}
                                        className="flex items-center gap-4"
                                    >
                                        <div className="flex items-center gap-2">
                                            <RadioGroupItem value="no" id="edit_file_trigger_flag_no" />
                                            <Label htmlFor="edit_file_trigger_flag_no" className="font-normal cursor-pointer">
                                                No
                                            </Label>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <RadioGroupItem value="yes" id="edit_file_trigger_flag_yes" />
                                            <Label htmlFor="edit_file_trigger_flag_yes" className="font-normal cursor-pointer">
                                                Yes
                                            </Label>
                                        </div>
                                    </RadioGroup>
                                )}
                            />
                        </div>

                        {watch("file_trigger_flag") && (
                            <JsonField
                                label="File Credential (JSON)"
                                field={register("file_credential")}
                            />
                        )}

                        {/* EMAIL FLAG */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Email Flag</label>
                            <Controller
                                name="email_flag"
                                control={control}
                                render={({ field }) => (
                                    <RadioGroup
                                        value={field.value ? "yes" : "no"}
                                        onValueChange={(val) => field.onChange(val === "yes")}
                                        className="flex items-center gap-4"
                                    >
                                        <div className="flex items-center gap-2">
                                            <RadioGroupItem value="no" id="edit_email_flag_no" />
                                            <Label htmlFor="edit_email_flag_no" className="font-normal cursor-pointer">
                                                No
                                            </Label>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <RadioGroupItem value="yes" id="edit_email_flag_yes" />
                                            <Label htmlFor="edit_email_flag_yes" className="font-normal cursor-pointer">
                                                Yes
                                            </Label>
                                        </div>
                                    </RadioGroup>
                                )}
                            />
                        </div>

                        {/* EMAIL NAME */}
                        {watch("email_flag") && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Email Name</label>
                                <Controller
                                    name="email_name"
                                    control={control}
                                    render={({ field }) => (
                                        <Select
                                            value={field.value}
                                            onValueChange={field.onChange}
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
                                    )}
                                />
                            </div>
                        )}

                        {/* STORAGE ENCRYPTION */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Storage Encryption
                            </label>

                            <Controller
                                name="storage_encryption"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        value={String(field.value)}
                                        onValueChange={(val) =>
                                            field.onChange(val === "true")
                                        }
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select encryption option" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="false">
                                                Disabled
                                            </SelectItem>
                                            <SelectItem value="true">
                                                Enabled
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>

                        {/* STATUS */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Status</label>

                            <Controller
                                name="form_status"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        value={field.value}
                                        onValueChange={field.onChange}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ACTIVE">
                                                ACTIVE
                                            </SelectItem>
                                            <SelectItem value="INACTIVE">
                                                INACTIVE
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>
                    </form>

                    <div className="sticky bottom-0 bg-background border-t p-5 flex gap-4 z-10">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => setOpen(false)}
                        >
                            Cancel
                        </Button>

                        <Button
                            type="submit"
                            form="form-master-edit"
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
        <div className="space-y-2">
            <label className="text-sm font-medium">{label}</label>
            <Input value={value} disabled className="bg-muted" />
        </div>
    );
}

function EditableField({
    label,
    field,
    placeholder,
}: {
    label: string;
    field: any;
    placeholder?: string;
}) {
    return (
        <div className="space-y-2">
            <label className="text-sm font-medium">{label}</label>
            <Input {...field} placeholder={placeholder} />
        </div>
    );
}

function JsonField({
    label,
    field,
    textareaRef,
}: {
    label: string;
    field: any;
    textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
}) {
    const { ref, ...rest } = field;

    return (
        <div className="space-y-2">
            <label className="text-sm font-medium">{label}</label>
            <Textarea
                {...rest}
                ref={(el) => {
                    ref(el);
                    if (textareaRef) textareaRef.current = el;
                }}
                rows={5}
                className="font-mono text-sm"
                placeholder="Enter valid JSON"
            />
        </div>
    );
}
