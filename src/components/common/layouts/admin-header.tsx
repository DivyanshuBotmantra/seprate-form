import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Lock, LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { useNavigate } from "react-router-dom";
import { getUserDetails } from "@/lib/auth";

import { OrganizationSwitcher } from "@/components/sidebar/org-switcher";
import { useState } from "react";
import { ChangePasswordSheet } from "../../users/sheet/Change-password";
import { useOrgStore } from "@/lib/store/org-store";

export function AdminHeader() {
  const userDetails = getUserDetails();
  const navigate = useNavigate();
  const clearOrg = useOrgStore((state) => state.clearOrg);

  const [passwordSheetOpen, setPasswordSheetOpen] = useState(false);

  const handleLogout = () => {
    clearOrg();
    sessionStorage.clear();
    navigate("/login");
  };

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <header className="bg-sidebar top-0 flex h-14 shrink-0 items-center border-b px-4 z-10 relative rounded-lg mb-2">
        <OrganizationSwitcher />

        <div className="absolute left-1/2 transform -translate-x-1/2">
          <p className="text-2xl font-bold text-center">
            <span className="text-[#f79524]">Bot</span> console
          </p>
        </div>

        <div className="flex items-center space-x-3 ml-auto">
          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="h-10 w-10 rounded-full hover:cursor-pointer ">
                <AvatarFallback className="rounded-lg">
                  {userDetails?.name ? getUserInitials(userDetails.name) : "U"}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              className="min-w-56 rounded-lg"
              align="end"
              sideOffset={4}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarFallback className="rounded-lg">
                      {userDetails?.name
                        ? getUserInitials(userDetails.name)
                        : "U"}
                    </AvatarFallback>
                  </Avatar>

                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">
                      {userDetails?.name || "Unknown User"}
                    </span>
                    <span className="truncate text-xs">
                      {userDetails?.user_id || "No email"}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => setPasswordSheetOpen(true)}>
                  <Lock className="mr-2 size-4" />
                  Change Password
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 size-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* 🔥 ADD THE SHEET HERE */}
      <ChangePasswordSheet
        open={passwordSheetOpen}
        onClose={() => setPasswordSheetOpen(false)}
      />
    </>
  );
}
