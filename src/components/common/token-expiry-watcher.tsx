import { AlertDialog } from "@radix-ui/react-alert-dialog";
import { useEffect, useState, useRef } from "react";
import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { renewToken } from "@/services/auth/auth";

const TokenExpiryWatcher = () => {
  const [open, setOpen] = useState(false);
  const [renewing, setRenewing] = useState(false);
  const renewingRef = useRef(false);

  const location = useLocation();
  const navigate = useNavigate();
  const locationRef = useRef(location.pathname);

  const PUBLIC_PATHS = ["/login", "/forgot-password", "/reset-password",'/tally'];
  const isPublicRoute = PUBLIC_PATHS.includes(location.pathname);
  const notificationTime = Number(
    import.meta.env.VITE_TOKEN_EXPIRY_NOTIFICATION || 5
  ); // minutes

  // Update location ref when it changes (without triggering effect)
  useEffect(() => {
    locationRef.current = location.pathname;
  }, [location.pathname]);

  useEffect(() => {
    if (isPublicRoute) return;

    const token = sessionStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const checkTokenExpiry = () => {
      if (renewingRef.current) return; // 🚫 skip checks while renewing

      // Check if we're still on a private route
      if (PUBLIC_PATHS.includes(locationRef.current)) {
        return;
      }

      const expiryTimeStr = sessionStorage.getItem("token_expiry");
      if (!expiryTimeStr) return;

      const expiryTime = parseInt(expiryTimeStr, 10);
      const now = Date.now();
      const timeLeft = expiryTime - now;
      if (timeLeft < 0) {
        setOpen(true);
        sessionStorage.clear();
        navigate("/login");
      } else if (timeLeft > 0 && timeLeft <= notificationTime * 60 * 1000) {
        setOpen(true);
      }
    };

    const interval = setInterval(checkTokenExpiry, 1000);
    return () => {
      clearInterval(interval);
    };
  }, [navigate, notificationTime, isPublicRoute]);

  const handleLogout = () => {
    setOpen(false);
    sessionStorage.clear();
    navigate("/login");
  };

  const handleContinue = async () => {
    setRenewing(true);
    renewingRef.current = true;

    const result = await renewToken();
    setRenewing(false);
    renewingRef.current = false;

    if (!result.success) {
      toast.error(result.error || "Token renewal failed", { duration: 3000 });
    } else {
      setOpen(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Token Expiring</AlertDialogTitle>
          <AlertDialogDescription>
            Your session is about to expire. Do you want to renew it?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleLogout}>Logout</AlertDialogCancel>
          <AlertDialogAction onClick={handleContinue} disabled={renewing}>
            {renewing ? "Renewing..." : "Continue"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default TokenExpiryWatcher;
