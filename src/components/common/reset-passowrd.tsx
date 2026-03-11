import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import {
    Lock,
    ArrowLeft,
    Eye,
    EyeOff,
    Loader2,
    ShieldCheck,
    CircleX,
    CheckCircle2,
} from "lucide-react";

import PasswordService from "@/services/Password";

const ResetPassword = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const passwordRequirements = [
        password.length >= 8,
        /[A-Z]/.test(password),
        /[a-z]/.test(password),
        /\d/.test(password),
    ];

    const allRequirementsMet = passwordRequirements.every(Boolean);
    const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!allRequirementsMet) {
            toast.error("Please meet all password requirements");
            return;
        }

        if (!passwordsMatch) {
            toast.error("Passwords do not match");
            return;
        }

        setIsLoading(true);

        const res = await PasswordService.resetPassword({
            token,
            new_password: password,
        });

        if (res.error) {
            toast.error(res.error);
            setIsLoading(false);
            return;
        }

        toast.success("Password reset successfully!");
        setIsSuccess(true);
        setIsLoading(false);
    };

    // ------------------------------------------------
    // INVALID TOKEN
    // ------------------------------------------------
    if (!token) {
        return (
            <div className="flex flex-col gap-4 p-6 sm:min-w-sm">
                <div className="flex flex-col items-center gap-2 text-center">
                    <CircleX className="w-8 h-8 text-destructive" />
                    <p className="text-sm text-muted-foreground">
                        Invalid or expired reset link.
                    </p>
                </div>

                <Button className="w-full h-11" onClick={() => navigate("/")}>
                    Back to login
                </Button>
            </div>
        );
    }

    // ------------------------------------------------
    // SUCCESS STATE
    // ------------------------------------------------
    if (isSuccess) {
        return (
            <div className="flex flex-col gap-6 p-6 sm:min-w-sm text-center">
                <div className="flex flex-col items-center gap-2">
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                    <h1 className="text-xl font-semibold">Password reset</h1>
                    <p className="text-sm text-muted-foreground">
                        You can now sign in with your new password.
                    </p>
                </div>

                <Button className="w-full h-11" onClick={() => navigate("/")}>
                    Continue to login
                </Button>
            </div>
        );
    }

    // ------------------------------------------------
    // DEFAULT FORM
    // ------------------------------------------------
    return (
        <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-5 p-6 sm:min-w-sm"
        >
            <div>
                <h1 className="text-xl font-semibold">Set new password</h1>
                <p className="text-sm text-muted-foreground">
                    Choose a strong password for your account
                </p>
            </div>

            {/* New password */}
            <div className="flex flex-col gap-1">
                <Label className="text-sm text-muted-foreground">New password</Label>
                <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="pl-10 pr-10 bg-muted"
                        required
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword((p) => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                </div>
            </div>

            {/* Confirm password */}
            <div className="flex flex-col gap-1">
                <Label className="text-sm text-muted-foreground">Confirm password</Label>
                <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        className={`pl-10 pr-10 bg-muted ${confirmPassword.length > 0 &&
                            !passwordsMatch &&
                            "border-destructive"
                            }`}
                        required
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirmPassword((p) => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                </div>
            </div>

            <Button
                type="submit"
                className="w-full h-11 text-white"
                disabled={isLoading || !allRequirementsMet || !passwordsMatch}
            >
                {isLoading ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Resetting...
                    </>
                ) : (
                    "Reset password"
                )}
            </Button>

            <div className="pt-4 border-t text-center">
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to login
                </Link>
            </div>
        </form>
    );
};

export default ResetPassword;
