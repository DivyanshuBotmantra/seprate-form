import { useState } from "react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type TaskMasterViewSheetProps = {
    data: {
        org_name: string;
        task_code: string;
        task_name: string;
        task_category: string;
        task_url?: string;
        task_form_json?: any;
        file_folder_path?: string;
        storage_encryption?: boolean;
        file_credential?: any;
        task_status: string;
    };
};

export default function TaskMasterViewSheet({ data }: TaskMasterViewSheetProps) {
    const [open, setOpen] = useState(false);

    const formattedTaskJson =
        typeof data.task_form_json === "string"
            ? data.task_form_json
            : JSON.stringify(data.task_form_json ?? {}, null, 2);

    const formattedFileCredential =
        typeof data.file_credential === "string"
            ? data.file_credential
            : JSON.stringify(data.file_credential ?? {}, null, 2);

    return (
        <>
            <Button
                variant="ghost"
                className="px-0"
                onClick={() => setOpen(true)}
            >
                <Eye size={18} />
            </Button>

            <Sheet open={open} onOpenChange={setOpen}>
                <SheetContent className="flex flex-col p-0 bg-background text-foreground">
                    {/* HEADER */}
                    <SheetHeader className="sticky top-0 bg-background border-b p-5 z-10">
                        <SheetTitle>Task Details</SheetTitle>
                        <SheetDescription>
                            All fields are read-only.
                        </SheetDescription>
                    </SheetHeader>

                    {/* CONTENT */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                        <ViewField label="Organization" value={data.org_name} />
                        <ViewField label="Task Code" value={data.task_code} />
                        <ViewField label="Task Name" value={data.task_name} />
                        <ViewField label="Task Category" value={data.task_category} />
                        <ViewField label="Task URL" value={data.task_url} />
                        <ViewField
                            label="File Folder Path"
                            value={data.file_folder_path}
                        />
                        <ViewField
                            label="Storage Encryption"
                            value={
                                data.storage_encryption === true
                                    ? "Enabled"
                                    : data.storage_encryption === false
                                        ? "Disabled"
                                        : ""
                            }
                        />
                        <ViewField label="Status" value={data.task_status} />

                        {/* TASK FORM JSON */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold">
                                Task Form JSON
                            </label>
                            <Textarea
                                value={formattedTaskJson}
                                readOnly
                                className="
                                    w-full rounded-lg border border-border
                                    bg-muted/20 p-4 font-mono text-sm leading-relaxed
                                    whitespace-pre-wrap break-words
                                    resize-none cursor-not-allowed
                                    min-h-[160px]
                                "
                            />
                        </div>

                        {/* FILE CREDENTIAL JSON */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold">
                                File Credential JSON
                            </label>
                            <Textarea
                                value={formattedFileCredential}
                                readOnly
                                className="
                                    w-full rounded-lg border border-border
                                    bg-muted/20 p-4 font-mono text-sm leading-relaxed
                                    whitespace-pre-wrap wrap-break-words
                                    resize-none cursor-not-allowed
                                    min-h-40
                                "
                            />
                        </div>
                    </div>

                    {/* FOOTER */}
                    <div className="sticky bottom-0 bg-background border-t p-5 z-10">
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => setOpen(false)}
                        >
                            Close
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
}

function ViewField({
    label,
    value,
}: {
    label: string;
    value?: string;
}) {
    return (
        <div className="space-y-1.5">
            <label className="text-sm font-semibold">{label}</label>
            <Input
                value={value ?? ""}
                disabled
                className="bg-muted/20 cursor-not-allowed"
            />
        </div>
    );
}
