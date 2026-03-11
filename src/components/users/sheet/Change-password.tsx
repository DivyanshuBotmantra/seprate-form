import { useState } from "react";
import { useForm } from "react-hook-form";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import OrbitLoader from "@/components/loader";
import { toast } from "sonner";
import changePassword from "@/services/Password";
import { Eye, EyeOff } from "lucide-react";

type FormType = {
    current_password: string;
    new_password: string;
    confirm_password: string;
};

export function ChangePasswordSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
    
    const [loading, setLoading] = useState(false);
    const [showOld, setShowOld] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        setError,
        reset,
        formState: { errors },
    } = useForm<FormType>({
        defaultValues: {
            current_password: "",
            new_password: "",
            confirm_password: "",
        },
    });

    const newPassword = watch("new_password");
    const confirmPassword = watch("confirm_password");

    const submitForm = async (form: FormType) => {
        if (form.new_password !== form.confirm_password) {
            setError("confirm_password", {
                message: "Passwords do not match",
            });
            return;
        }

        const payload = {
            current_password: form.current_password,
            new_password: form.new_password,
        };

        try {
            setLoading(true);
            const res = await changePassword(payload);

            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success("Password updated successfully!");
                reset();
                onClose();
            }
        } catch (err) {
            toast.error("Failed to update password");
            console.log("error while updating password: ", err)
        } finally {
            setLoading(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onClose}>
            <SheetContent className="flex flex-col p-0">
                <SheetHeader className="px-4 py-3 border-b">
                    <SheetTitle>Change Password</SheetTitle>
                    <p className="text-sm text-muted-foreground -mt-1">
                        Update your account password.
                    </p>
                </SheetHeader>

                <form
                    id="change-password-form"
                    onSubmit={handleSubmit(submitForm)}
                    className="flex-1 px-6 py-5 flex flex-col gap-5"
                >
                    {/* Current Password */}
                    <div className="space-y-2">
                        <label className="font-semibold text-sm">Current Password *</label>
                        <div className="relative">
                            <Input
                                type={showOld ? "text" : "password"}
                                placeholder="Enter current password"
                                {...register("current_password", { required: "Required" })}
                            />
                            <button
                                type="button"
                                className="absolute right-3 top-2.5 opacity-70"
                                onClick={() => setShowOld(!showOld)}
                            >
                                {showOld ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {errors.current_password && (
                            <p className="text-sm text-destructive">{errors.current_password.message}</p>
                        )}
                    </div>

                    {/* New Password */}
                    <div className="space-y-2">
                        <label className="font-semibold text-sm">New Password *</label>
                        <div className="relative">
                            <Input
                                type={showNew ? "text" : "password"}
                                placeholder="Enter new password"
                                {...register("new_password", { required: "Required" })}
                            />
                            <button
                                type="button"
                                className="absolute right-3 top-2.5 opacity-70"
                                onClick={() => setShowNew(!showNew)}
                            >
                                {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {errors.new_password && (
                            <p className="text-sm text-destructive">{errors.new_password.message}</p>
                        )}
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-2">
                        <label className="font-semibold text-sm">Confirm Password *</label>
                        <div className="relative">
                            <Input
                                type={showConfirm ? "text" : "password"}
                                placeholder="Re-enter new password"
                                {...register("confirm_password", {
                                    required: "Required",
                                    validate: () =>
                                        newPassword === confirmPassword || "Passwords do not match",
                                })}
                            />

                            <button
                                type="button"
                                className="absolute right-3 top-2.5 opacity-70"
                                onClick={() => setShowConfirm(!showConfirm)}
                            >
                                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        {/* Inline error under confirm field */}
                        {errors.confirm_password && (
                            <p className="text-sm text-destructive">
                                {errors.confirm_password.message}
                            </p>
                        )}
                    </div>
                </form>

                {/* FOOTER */}
                <div className="border-t p-4 flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={onClose}>
                        Cancel
                    </Button>

                    <Button
                        type="submit"
                        form="change-password-form"
                        className="flex-1"
                    >
                        {loading ? <OrbitLoader /> : "Update"}
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
