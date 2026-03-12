import {
  AlertDialog,

  AlertDialogContent,
  AlertDialogDescription,

  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useRef, useState } from "react";
import { useIdleTimer } from "react-idle-timer";
import { useLocation } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import ClockCountdown from "@/components/common/clock-loader";
import { Button } from "@/components/ui/button";
import { performLogout } from "@/lib/logout-utils";

const IdleLogoutPrompt = () => {
  const [isPromptVisible, setIsPromptVisible] = useState(false);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const location = useLocation();
  const publicPaths = ["/login", "/forgot-password", "/reset-password"];
  const currentPath = location.pathname;
  const isPublicPath = publicPaths.includes(currentPath);
  const idleTimer = import.meta.env.VITE_IDLE_TIMER;
  const idleCountdown = import.meta.env.VITE_IDLE_TIMER_COUNTDOWN;
  const [countdown, setCountdown] = useState(idleCountdown);

  const clearCountdown = () => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
      setCountdown(idleCountdown);
    }
  };

  const handleLogout = () => {
    clearCountdown();
    setIsPromptVisible(false);
    performLogout(undefined, true); // Use window.location.href
  };

  const startCountdown = () => {
    clearCountdown();
    countdownRef.current = setInterval(() => {
      setCountdown((prev: any) => {
        if (prev <= 1) {
          clearCountdown();
          handleLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const onIdle = () => {
    if (!isPublicPath) {
      setIsPromptVisible(true);
      startCountdown();
    }
  };

  const onActive = () => {
    if (!isPublicPath && isPromptVisible) {
      setIsPromptVisible(false);
      clearCountdown();
    }
  };

  useIdleTimer({
    timeout: 1000 * 60 * idleTimer,
    onIdle,
    onActive,
    debounce: 500,
    disabled: isPublicPath,
  });

  if (isPublicPath) return null;

  return (
    <>
      <style>
        {`
      @keyframes fadeIn {
        0% { opacity: 0; transform: translateY(10px) scale(0.95); }
        100% { opacity: 1; transform: translateY(0) scale(1); }
      }
      @keyframes pulseWarning {
        0%, 100% { box-shadow: 0 0 0 0 hsl(38 92% 50% / 0.4); }
        50% { box-shadow: 0 0 0 8px hsl(38 92% 50% / 0); }
      }
    `}
      </style>
      <AlertDialog open={isPromptVisible} onOpenChange={setIsPromptVisible}>
        <AlertDialogContent
          className="shadow-elegant border-2 border-warning/20 bg-white  max-w-md"
          style={{
            animation: "fadeIn 0.3s ease-out",
          }}
        >
          <AlertDialogHeader className="text-center space-y-4">
            <div
              className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center"
              style={{
                animation: "pulseWarning 2s infinite",
                boxShadow: "0 0 0 0 hsl(38 92% 50% / 0.4)",
              }}
            >
              <AlertTriangle className="w-8 h-8 text-warning" />
            </div>

            <AlertDialogTitle className="text-2xl font-bold text-foreground">
              Session Timeout Warning
            </AlertDialogTitle>

            <AlertDialogDescription className="text-base text-muted-foreground leading-relaxed">
              You've been inactive for a while. Your session will automatically
              end unless you take action.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="flex items-center justify-center space-x-2 py-4">
            <ClockCountdown duration={countdown} />
            <span className="text-2xl font-mono font-bold text-warning"></span>
          </div>

          <div className="flex justify-center gap-6">
            <Button variant="outline" onClick={handleLogout} className="flex-1">
              End Session
            </Button>
            <Button
              onClick={() => {
                setIsPromptVisible(false);
                clearCountdown();
              }}
              className="flex-1"
            >
              Continue Session
            </Button>
          </div>s
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default IdleLogoutPrompt;
