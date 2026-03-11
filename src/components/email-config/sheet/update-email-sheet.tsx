import { useEffect, useState } from "react";
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
import Emailconfig from "@/services/email-config";
import { Pencil } from "lucide-react";

type Props = {
    data: {
        org_name: string;
        email_name: string;
        email_credentials: Record<string, any> | string;
        email_subject: string;
        email_body: string;
    };
    refreshTable: () => void;
};

type FormValues = {
    email_credentials: string;
    email_subject: string;
    email_body: string;
};

export default function EmailConfigUpdateSheet({ data, refreshTable }: Props) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const { register, handleSubmit, reset } = useForm<FormValues>({
        defaultValues: {
            email_credentials: "{}",
            email_subject: "",
            email_body: "",
        },
    });

    // -----------------------------------
    // Pre-fill form when sheet opens
    // -----------------------------------
    useEffect(() => {
        if (!open) return;

        const emailCredentialsStr =
            typeof data.email_credentials === "object"
                ? JSON.stringify(data.email_credentials, null, 2)
                : data.email_credentials || "{}";

        reset({
            email_credentials: emailCredentialsStr,
            email_subject: data.email_subject ?? "",
            email_body: data.email_body ?? "",
        });
    }, [open, data, reset]);

    // -----------------------------------
    // Submit handler
    // -----------------------------------
    const onSubmit = async (form: FormValues) => {
        // Validate JSON
        let emailCredentialsJson;
        try {
            emailCredentialsJson = JSON.parse(form.email_credentials);
        } catch (err) {
            toast.error("Invalid JSON format in Email Credentials");
            return;
        }

        try {
            setLoading(true);

            const payload = {
                search_fields: {
                    org_name: data.org_name,
                    email_name: data.email_name,
                },
                update_fields: {
                    email_credentials: emailCredentialsJson,
                    email_subject: form.email_subject,
                    email_body: form.email_body,
                },
            };

            const res = await Emailconfig.updateEmailConfig(payload);

            if (res?.error) {
                toast.error(res.error);
                return;
            }

            toast.success("Email configuration updated successfully");
            refreshTable();
            setOpen(false);
            reset();
        } catch (err) {
            console.error(err);
            toast.error("Failed to update email configuration");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Edit button */}
            <Button variant="ghost" className="px-0" onClick={() => setOpen(true)}>
                <Pencil size={18} />
            </Button>

            <Sheet open={open} onOpenChange={setOpen}>
                <SheetContent className="flex flex-col h-full p-0 bg-background">
                    {/* Header */}
                    <SheetHeader className="border-b p-4">
                        <SheetTitle>Edit Email Configuration</SheetTitle>
                        <SheetDescription>Update email configuration details.</SheetDescription>
                    </SheetHeader>

                    {/* Form */}
                    <form
                        id="email-edit-form"
                        onSubmit={handleSubmit(onSubmit)}
                        className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6"
                    >
                        {/* Read-only */}
                        <DisabledField label="Organization" value={data.org_name} />
                        <DisabledField label="Email Name" value={data.email_name} />

                        {/* Editable - Email Credentials (JSON) */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">
                                Email Credentials (JSON) <span className="text-destructive">*</span>
                            </label>
                            <Textarea
                                {...register("email_credentials", { required: true })}
                                className="font-mono text-sm min-h-[120px]"
                                placeholder='{"SMTP_SERVER": ["smtp.example.com"], "SMTP_PORT": 587, "SMTP_USERNAME": "user@example.com"}'
                            />
                            <p className="text-xs text-muted-foreground">
                                Enter valid JSON format for email credentials
                            </p>
                        </div>

                        {/* Editable - Email Subject */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">
                                Email Subject <span className="text-destructive">*</span>
                            </label>
                            <Input {...register("email_subject", { required: true })} />
                        </div>

                        {/* Editable - Email Body */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">
                                Email Body <span className="text-destructive">*</span>
                            </label>
                            <Textarea
                                {...register("email_body", { required: true })}
                                className="min-h-[150px]"
                            />
                            <p className="text-xs text-muted-foreground">
                                You can use variables and HTML formatting
                            </p>
                        </div>
                    </form>

                    {/* Footer */}
                    <div className="border-t p-5 flex gap-4">
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
                            form="email-edit-form"
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
