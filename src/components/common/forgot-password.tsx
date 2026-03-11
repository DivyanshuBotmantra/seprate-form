import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useNavigate, Link } from "react-router-dom";
import { Mail, ArrowLeft, KeyRound, Loader2, CheckCircle2 } from "lucide-react";

import PasswordService from "@/services/Password";

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const res = await PasswordService.forgetPassword({
            user_id: email,
        });

        if (res.error) {
            toast.error(res.error);
            setIsLoading(false);
            return;
        }

        toast.success("Reset link sent to your email!");
        setIsSubmitted(true);
        setIsLoading(false);
    };

    // ------------------------------------------------
    // SUCCESS STATE (clean, no card)
    // ------------------------------------------------
    if (isSubmitted) {
        return (
            <div className="flex flex-col gap-6 p-6 sm:min-w-sm text-center">
                <div className="flex flex-col items-center gap-2">
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                    <h1 className="text-xl font-semibold">Check your email</h1>
                    <p className="text-sm text-muted-foreground">
                        We’ve sent a password reset link to
                    </p>
                    <p className="font-medium">{email}</p>
                </div>

                <p className="text-sm text-muted-foreground">
                    Didn’t receive the email? Check spam or{" "}
                    <button
                        onClick={() => setIsSubmitted(false)}
                        className="text-primary hover:underline font-medium"
                    >
                        try another email
                    </button>
                </p>

                <Button
                    variant="outline"
                    className="w-full h-11"
                    onClick={() => navigate("/")}
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to login
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
            <div className="text-center space-y-2">
                <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                    <KeyRound className="w-7 h-7 text-primary" />
                </div>
                <h1 className="text-xl font-semibold">Forgot password?</h1>
                <p className="text-sm text-muted-foreground">
                    No worries, we’ll send you reset instructions.
                </p>
            </div>

            <div className="flex flex-col gap-1">
                <Label className="text-sm text-muted-foreground">Email</Label>
                <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 h-11 bg-muted"
                        required
                    />
                </div>
            </div>

            <Button
                type="submit"
                className="w-full h-11 text-white"
                disabled={isLoading}
            >
                {isLoading ? (
                    <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                    </>
                ) : (
                    "Send reset link"
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

export default ForgotPassword;
