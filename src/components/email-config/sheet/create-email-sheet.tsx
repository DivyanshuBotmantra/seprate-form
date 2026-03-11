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
import { useLovMaster } from "@/hooks/useLovMaster";

interface EmailConfigCreateSheetProps {
    open: boolean;
    onClose: () => void;
    title: string;
    refreshTable: () => void;
}

type FormValues = {
    email_name: string;
    email_credentials: string;
    email_subject: string;
    email_body: string;
};

export function EmailConfigCreateSheet({
    open,
    onClose,
    title,
    refreshTable,
}: EmailConfigCreateSheetProps) {
    const [loading, setLoading] = useState(false);
    const orgName =
        JSON.parse(sessionStorage.getItem("SelectedOrg") || "{}")?.org_name || "";

    /* ---------------- LOV Master ---------------- */
    const { lovData } = useLovMaster(open);
    const [emailTemplate, setEmailTemplate] = useState<any>(null);

    // Extract EMAIL type template from LOV data
    useEffect(() => {
        if (!lovData.length) return;

        const emailLov = lovData.find((item) => item.lov_type === "EMAIL");
        if (emailLov?.lov_json) {
            setEmailTemplate(emailLov.lov_json);
        }
    }, [lovData]);

    const { register, handleSubmit, reset } = useForm<FormValues>({
        defaultValues: {
            email_name: "",
            email_credentials: "{}",
            email_subject: "",
            email_body: "",
        },
    });

    // Auto-populate email_credentials when template is available
    useEffect(() => {
        if (!open) return;

        const credentialsJson = emailTemplate
            ? JSON.stringify(emailTemplate, null, 2)
            : "{}";

        reset({
            email_name: "",
            email_credentials: credentialsJson,
            email_subject: "",
            email_body: "",
        });
    }, [open, emailTemplate, reset]);

    const onSubmit = async (form: FormValues) => {
        // Validate JSON
        let emailCredentialsJson;
        try {
            emailCredentialsJson = JSON.parse(form.email_credentials);
        } catch (err) {
            toast.error("Invalid JSON format in Email Credentials");
            return;
        }

        const payload = {
            org_name: orgName,
            email_name: form.email_name,
            email_credentials: emailCredentialsJson,
            email_subject: form.email_subject,
            email_body: form.email_body,
        };

        try {
            setLoading(true);
            const res = await Emailconfig.createEmailConfig(payload);

            if (res?.error) {
                toast.error(res.error);
                return;
            }

            toast.success("Email configuration created successfully");
            reset();
            refreshTable();
            onClose();
        } catch (err) {
            toast.error("Failed to create email configuration");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
            <SheetContent className="flex flex-col p-0 bg-background text-foreground">
                {/* Header */}
                <SheetHeader className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur p-5">
                    <SheetTitle className="text-lg font-semibold">{title}</SheetTitle>
                    <SheetDescription className="text-sm text-muted-foreground">
                        Create a new email configuration.
                    </SheetDescription>
                </SheetHeader>

                {/* Form */}
                <form
                    id="email-create-form"
                    onSubmit={handleSubmit(onSubmit)}
                    className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6"
                >
                    {/* Organization */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">Organization</label>
                        <Input
                            value={orgName}
                            disabled
                            className="bg-muted text-muted-foreground cursor-not-allowed"
                        />
                    </div>

                    {/* Email Name */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">
                            Email Name <span className="text-destructive">*</span>
                        </label>
                        <Input
                            {...register("email_name", {
                                required: "Email name is required",
                            })}
                            placeholder="Enter Email Name"
                        />
                    </div>

                    {/* Email Credentials (JSON) */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">
                            Email Credentials (JSON) <span className="text-destructive">*</span>
                        </label>
                        <Textarea
                            {...register("email_credentials", {
                                required: "Email credentials are required",
                            })}
                            placeholder='{"SMTP_SERVER": ["smtp.example.com"], "SMTP_PORT": 587, "SMTP_USERNAME": "user@example.com"}'
                            className="font-mono text-sm min-h-[120px]"
                        />
                        <p className="text-xs text-muted-foreground">
                            Enter valid JSON format for email credentials
                        </p>
                    </div>

                    {/* Email Subject */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">
                            Email Subject <span className="text-destructive">*</span>
                        </label>
                        <Input
                            {...register("email_subject", {
                                required: "Email subject is required",
                            })}
                            placeholder="Enter Email Subject"
                        />
                    </div>

                    {/* Email Body */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">
                            Email Body <span className="text-destructive">*</span>
                        </label>
                        <Textarea
                            {...register("email_body", {
                                required: "Email body is required",
                            })}
                            placeholder="Enter Email Body"
                            className="min-h-[150px]"
                        />
                        <p className="text-xs text-muted-foreground">
                            You can use variables and HTML formatting
                        </p>
                    </div>
                </form>

                {/* Footer */}
                <div className="sticky bottom-0 z-10 flex gap-4 border-t bg-background/95 backdrop-blur p-5">
                    <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" form="email-create-form" className="flex-1">
                        {loading ? "Saving..." : "Create"}
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
