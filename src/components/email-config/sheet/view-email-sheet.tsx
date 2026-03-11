import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
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

type Props = {
    data: {
        org_name: string;
        email_name: string;
        email_credentials: Record<string, any> | string;
        email_subject: string;
        email_body: string;
    };
};

type ViewValues = {
    org_name: string;
    email_name: string;
    email_credentials: string;
    email_subject: string;
    email_body: string;
};

export default function EmailConfigViewSheet({ data }: Props) {
    const [open, setOpen] = useState(false);

    const { reset, watch } = useForm<ViewValues>({
        defaultValues: {
            org_name: "",
            email_name: "",
            email_credentials: "",
            email_subject: "",
            email_body: "",
        },
    });

    const values = watch();

    // -----------------------------------
    // Pre-fill values when opening
    // -----------------------------------
    useEffect(() => {
        if (!open || !data) return;

        const emailCredentialsStr =
            typeof data.email_credentials === "object"
                ? JSON.stringify(data.email_credentials, null, 2)
                : data.email_credentials || "{}";

        reset({
            org_name: data.org_name ?? "",
            email_name: data.email_name ?? "",
            email_credentials: emailCredentialsStr,
            email_subject: data.email_subject ?? "",
            email_body: data.email_body ?? "",
        });
    }, [open, data, reset]);

    return (
        <>
            {/* View button */}
            <Button variant="ghost" className="px-0" onClick={() => setOpen(true)}>
                <Eye size={18} />
            </Button>

            <Sheet open={open} onOpenChange={setOpen}>
                <SheetContent className="flex flex-col p-0 bg-background text-foreground">
                    {/* Header */}
                    <SheetHeader className="sticky top-0 bg-background border-b p-4 z-10">
                        <SheetTitle>View Email Configuration</SheetTitle>
                        <SheetDescription>
                            Email configuration details (read-only).
                        </SheetDescription>
                    </SheetHeader>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                        <ReadOnlyField label="Organization" value={values.org_name} />
                        <ReadOnlyField label="Email Name" value={values.email_name} />
                        <ReadOnlyTextarea label="Email Credentials (JSON)" value={values.email_credentials} />
                        <ReadOnlyField label="Email Subject" value={values.email_subject} />
                        <ReadOnlyTextarea label="Email Body" value={values.email_body} />
                    </div>

                    {/* Footer */}
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

/* ---------------- Helpers ---------------- */

function ReadOnlyField({ label, value }: { label: string; value: string }) {
    return (
        <div className="space-y-1.5">
            <label className="text-sm font-medium">{label}</label>
            <Input
                value={value || "-"}
                readOnly
                className="bg-muted/30 text-muted-foreground cursor-not-allowed"
            />
        </div>
    );
}

function ReadOnlyTextarea({ label, value }: { label: string; value: string }) {
    return (
        <div className="space-y-1.5">
            <label className="text-sm font-medium">{label}</label>
            <Textarea
                value={value || "-"}
                readOnly
                className="bg-muted/30 text-muted-foreground cursor-not-allowed font-mono text-sm min-h-[120px]"
            />
        </div>
    );
}
