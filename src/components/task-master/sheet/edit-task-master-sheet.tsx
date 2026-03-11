import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription
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
import { Pencil } from "lucide-react";
import taskConfig from "@/services/task-config";

type TaskMasterEditSheetProps = {
    data: any;
    refreshTable: () => void;
};

export default function TaskMasterEditSheet({
    data,
    refreshTable,
}: TaskMasterEditSheetProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const orgName =
        JSON.parse(sessionStorage.getItem("SelectedOrg") || "{}")?.org_name || "";

    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    const formattedJson =
        typeof data.task_form_json === "string"
            ? data.task_form_json
            : JSON.stringify(data.task_form_json ?? {}, null, 2);

    const formattedCredential =
        typeof data.file_credential === "string"
            ? data.file_credential
            : JSON.stringify(data.file_credential ?? {}, null, 2);

    const { register, handleSubmit, reset, control, } = useForm({
        defaultValues: {
            task_name: "",
            task_category: "",
            task_url: "",
            task_form_json: formattedJson,
            file_folder_path: "",
            file_credential: formattedCredential,
            storage_encryption: false,
            task_status: "ACTIVE",
        },
    });

    // Prefill on open
    useEffect(() => {
        if (!open) return;

        reset({
            task_name: data.task_name,
            task_category: data.task_category,
            task_url: data.task_url || "",
            task_form_json: formattedJson,
            file_folder_path: data.file_folder_path || "",
            file_credential: formattedCredential,
            storage_encryption: data.storage_encryption ?? false,
            task_status: data.task_status || "ACTIVE",
        });
    }, [open, data, reset, formattedJson, formattedCredential]);

    const onSubmit = async (form: any) => {
        try {
            setLoading(true);

            let parsedTaskJson = {};
            let parsedCredential = {};

            try {
                parsedTaskJson = form.task_form_json
                    ? JSON.parse(form.task_form_json)
                    : {};
            } catch {
                toast.error("Invalid Task Form JSON");
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
                    task_code: data.task_code, // immutable
                },
                update_fields: {
                    task_name: form.task_name,
                    task_category: form.task_category,
                    task_url: form.task_url || undefined,
                    task_form_json: parsedTaskJson,
                    file_folder_path: form.file_folder_path || undefined,
                    file_credential: parsedCredential,
                    storage_encryption: form.storage_encryption,
                    task_status: form.task_status,
                },
            };

            console.log("UPDATE TASK MASTER PAYLOAD:", payload);

            const res = await taskConfig.updateTaskmaster(payload);

            if (res?.error) {
                toast.error(res.error);
            } else {
                toast.success("Task updated successfully");
                refreshTable();
                reset();
                setOpen(false);
            }
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
            <Button
                variant="ghost"
                className="px-0"
                onClick={() => setOpen(true)}
            >
                <Pencil size={18} />
            </Button>

            <Sheet open={open} onOpenChange={setOpen}>
                <SheetContent className="flex flex-col p-0 bg-background text-foreground">
                    <SheetHeader className="sticky top-0 bg-background border-b p-5 z-10">
                        <SheetTitle>Edit Task</SheetTitle>
                        <SheetDescription>
                            Modify task details and save changes.
                        </SheetDescription>
                    </SheetHeader>

                    <form
                        id="task-master-edit"
                        onSubmit={handleSubmit(onSubmit)}
                        className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6"
                    >
                        {/* Read-only */}
                        <DisabledField label="Organization" value={orgName} />
                        <DisabledField label="Task Code" value={data.task_code} />

                        {/* Editable */}
                        <EditableField
                            label="Task Name"
                            field={register("task_name")}
                        />

                        <EditableField
                            label="Task Category"
                            field={register("task_category")}
                        />

                        <EditableField
                            label="Task URL"
                            field={register("task_url")}
                        />

                        <EditableField
                            label="File Folder Path"
                            field={register("file_folder_path")}
                        />

                        {/* Task JSON */}
                        <JsonField
                            label="Task Form JSON"
                            field={register("task_form_json")}
                            textareaRef={textareaRef}
                        />

                        {/* File Credential */}
                        <JsonField
                            label="File Credential (JSON)"
                            field={register("file_credential")}
                        />

                        {/* Storage Encryption */}
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
                                            <SelectValue placeholder="Select option" />
                                        </SelectTrigger>

                                        <SelectContent>
                                            <SelectItem value="false">Disabled</SelectItem>
                                            <SelectItem value="true">Enabled</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>


                        {/* Status */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Status</label>

                            <Controller
                                name="task_status"
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
                                            <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                                            <SelectItem value="INACTIVE">INACTIVE</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>

                    </form>

                    {/* Footer */}
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
                            form="task-master-edit"
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
                disabled
                className="bg-muted text-muted-foreground cursor-not-allowed"
            />
        </div>
    );
}

function EditableField({
    label,
    field,
}: {
    label: string;
    field: any;
}) {
    return (
        <div className="space-y-2">
            <label className="text-sm font-medium">{label}</label>
            <Input {...field} className="bg-background" />
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
    textareaRef?: React.RefObject<HTMLTextAreaElement>;
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
                className="font-mono text-sm"
                rows={5}
            />
        </div>
    );
}
