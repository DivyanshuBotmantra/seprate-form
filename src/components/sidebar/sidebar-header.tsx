import { useState } from "react"; // ← missing import (required)

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Lock, LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { useNavigate } from "react-router-dom";
import { getUserDetails } from "@/lib/auth";
import { AuditPeriodSwitcher } from "../audit-period-toggle";
import { SidebarTrigger } from "../ui/sidebar";

import { ChangePasswordSheet } from "../users/sheet/Change-password";
import { OrganizationSwitcher } from "./org-switcher";

export function AdminHeader() {
  const [passwordSheetOpen, setPasswordSheetOpen] = useState(false); // ← added useState

  const navigate = useNavigate();
  const userDetails = getUserDetails() || {
    name: "Unknown User",
    user_id: "No email",
  };

  const handleLogout = () => {
    sessionStorage.clear();
    navigate("/login");
  };

  // You don’t need handleChangePassword anymore — removed.

  const getUserInitials = (name: string) =>
    name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  return (
    <>
      <header className="bg-sidebar flex items-center h-14 border-b px-4 z-10 relative mb-2">
        {/* LEFT */}
        <div className="flex items-center gap-3 flex-none">
          <SidebarTrigger />
          <OrganizationSwitcher />
        </div>

        {/* CENTER */}
        <div className="flex-1 flex justify-center pointer-events-none">
          <span className="text-sm font-medium text-foreground/90 select-none">
            Bot Console
          </span>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-3 flex-none">
          <AuditPeriodSwitcher />
          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="h-9 w-9 rounded-lg hover:ring-2 hover:ring-primary/20 dark:hover:ring-primary/30 transition-all">
                <AvatarFallback className="rounded-lg bg-primary/10 dark:bg-primary/20 text-primary font-semibold">
                  {getUserInitials(userDetails.name)}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              className="min-w-56 rounded-lg"
              align="end"
              sideOffset={4}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-3 py-2 text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarFallback className="rounded-lg bg-primary/10 text-primary">
                      {getUserInitials(userDetails.name)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex flex-col leading-tight">
                    <span className="font-medium">{userDetails.name}</span>
                    <span className="text-xs opacity-70">
                      {userDetails.user_id}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={() => setPasswordSheetOpen(true)}>
                <Lock className="mr-2 h-4 w-4" />
                Change Password
              </DropdownMenuItem>

              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* CHANGE PASSWORD SHEET — must be rendered outside header */}
      <ChangePasswordSheet
        open={passwordSheetOpen}
        onClose={() => setPasswordSheetOpen(false)}
        onSubmit={async (payload) => {
          console.log("password payload:", payload);
          // Call API here
          return { success: true };
        }}
      />
    </>
  );
}
