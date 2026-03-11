import { useState } from "react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type FormMasterViewSheetProps = {
    data: {
        org_name: string;
        form_code: string;
        form_name: string;
        form_category: string;
        form_url?: string;
        form_json?: any;
        file_folder_path?: string;
        file_credential?: any;
        storage_encryption?: boolean;
        form_status: string;
        email_flag?: boolean;
        email_name?: string;
        bot_trigger?: boolean;
        bot_code?: string;
        sidebar_visibility?: boolean;
    };
};

export default function FormMasterViewSheet({
    data,
}: FormMasterViewSheetProps) {
    const [open, setOpen] = useState(false);

    const formattedFormJson =
        typeof data.form_json === "string"
            ? data.form_json
            : JSON.stringify(data.form_json ?? {}, null, 2);

    const formattedCredential =
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
                        <SheetTitle>Form Details</SheetTitle>
                        <SheetDescription>
                            All fields are read-only.
                        </SheetDescription>
                    </SheetHeader>

                    {/* CONTENT */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                        <ViewField
                            label="Organization"
                            value={data.org_name}
                        />

                        <ViewField
                            label="Form Code"
                            value={data.form_code}
                        />

                        <ViewField
                            label="Form Name"
                            value={data.form_name}
                        />

                        <ViewField
                            label="Form Category"
                            value={data.form_category}
                        />

                        <ViewField
                            label="Form URL"
                            value={data.form_url}
                            placeholder="No URL provided"
                        />

                        {/* FORM JSON */}
                        <JsonViewField
                            label="Form JSON (Dynamic Form)"
                            value={formattedFormJson}
                            placeholder="No form JSON defined"
                        />

                        <ViewField
                            label="File Folder Path"
                            value={data.file_folder_path}
                            placeholder="No folder path configured"
                        />

                        {/* FILE CREDENTIAL */}
                        <JsonViewField
                            label="File Credential (JSON)"
                            value={formattedCredential}
                            placeholder="No credentials configured"
                        />

                        <ViewField
                            label="Email Flag"
                            value={data.email_flag ? "Yes" : "No"}
                        />

                        {data.email_flag && (
                            <ViewField
                                label="Email Name"
                                value={data.email_name}
                                placeholder="No email name configured"
                            />
                        )}

                        <ViewField
                            label="Storage Encryption"
                            value={
                                data.storage_encryption
                                    ? "Enabled"
                                    : "Disabled"
                            }
                        />

                        <ViewField
                            label="Bot Trigger"
                            value={data.bot_trigger ? "Yes" : "No"}
                        />

                        {data.bot_trigger && (
                            <ViewField
                                label="Bot Code"
                                value={data.bot_code}
                                placeholder="No bot code configured"
                            />
                        )}

                        <ViewField
                            label="Sidebar Visibility"
                            value={data.sidebar_visibility ? "Yes" : "No"}
                        />

                        <ViewField
                            label="Status"
                            value={data.form_status}
                        />
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
    placeholder,
}: {
    label: string;
    value?: string;
    placeholder?: string;
}) {
    return (
        <div className="space-y-1.5">
            <label className="text-sm font-semibold">{label}</label>
            <Input
                value={value ?? ""}
                placeholder={placeholder}
                disabled
                className="bg-muted/20 cursor-not-allowed"
            />
        </div>
    );
}

function JsonViewField({
    label,
    value,
    placeholder,
}: {
    label: string;
    value: string;
    placeholder?: string;
}) {
    const isEmpty =
        !value || value === "{}" || value === "null";

    return (
        <div className="space-y-1.5">
            <label className="text-sm font-semibold">{label}</label>
            <Textarea
                value={isEmpty ? "" : value}
                placeholder={placeholder}
                readOnly
                className="
                    w-full rounded-lg border border-border
                    bg-muted/20 p-4 font-mono text-sm leading-relaxed
                    whitespace-pre-wrap break-words
                    resize-none cursor-not-allowed
                    min-h-[140px]
                "
            />
        </div>
    );
}
