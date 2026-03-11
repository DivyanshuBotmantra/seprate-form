import { useState } from "react";
import { Eye, EyeOff, X, Check, Plus } from "lucide-react";
import { getUserDetails } from "@/lib/auth";

interface UserCreateSheetProps {
  open: boolean;
  loading: boolean;
  onClose: () => void;
  title: string;
  orgList?: { org_name: string; org_status: string }[];
  onSubmit: (payload: any) => Promise<any>; // ✅ Changed to return Promise
}

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { toast } from "sonner";
import OrbitLoader from "@/components/loader";

export function UserCreateSheet({
  open,
  onClose,
  title,
  orgList = [],
  onSubmit,
  loading,
}: UserCreateSheetProps) {
  const [role, setRole] = useState("");
  const [selectedOrgs, setSelectedOrgs] = useState<string[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<string>("");
  const [openOrgCombobox, setOpenOrgCombobox] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [itDashboardVisibility, setItDashboardVisibility] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {}
  );

  // Get current user's role to determine available options
  const currentUser = getUserDetails();
  const currentUserRole = currentUser?.role;

  // Filter orgList based on role
  const allowedOrgs = currentUserRole === "SUPER ADMIN"
    ? orgList
    : orgList.filter(org =>
      currentUser?.org_name?.includes(org.org_name)
    );


  const handleOrgSelection = (orgName: string) => {
    setSelectedOrgs((prev) => {
      if (prev.includes(orgName)) {
        return prev.filter((o) => o !== orgName);
      }
      if (prev.length >= 5) {
        toast.error("You can select up to 5 organisations only");
        return prev;
      }
      return [...prev, orgName];
    });
  };

  const validateForm = (formData: FormData) => {
    const email = formData.get("user_id") as string;
    const password = formData.get("password") as string;
    const newErrors: typeof errors = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      newErrors.email = "Please enter a valid email address.";
    }
    if (!/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(password)) {
      newErrors.password =
        "Password must have 8+ chars, uppercase, lowercase, number, and special char.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    if (!validateForm(formData)) return;

    let org_name: string[] = [];
    if (role === "SUPER ADMIN") {
      org_name = [];
    } else if (role === "ADMIN") {
      org_name = selectedOrgs.length ? selectedOrgs : [orgList[0]?.org_name];
    } else if (role === "USER") {
      org_name = selectedOrg ? [selectedOrg] : [orgList[0]?.org_name];
    }

    const payload = {
      name: formData.get("name") as string,
      user_id: formData.get("user_id") as string,
      password: formData.get("password") as string,
      role,
      org_name,
      user_status: "Active",
      it_dashboard_visibility: (role === "ADMIN" || role === "USER") ? itDashboardVisibility : false,
    };

    // ✅ Check response before closing
    const res = await onSubmit(payload);

    // ✅ Only close if no error
    if (!res?.error) {
      onClose();
    }
  };

  const handleOpenChange = () => {
    onClose();
    setRole("");
    setSelectedOrgs([]);
    setSelectedOrg("");
    setItDashboardVisibility(false);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="flex flex-col p-0 bg-muted">
        {/* Sticky Header */}
        <SheetHeader className="sticky top-0 border-b">
          <SheetTitle>{title}</SheetTitle>
          <p className="text-sm text-muted-foreground -mt-1">
            Create a new user account.
          </p>
        </SheetHeader>

        <form
          id="user-create-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-4 flex flex-col gap-3.5 scroll-container"
        >
          {/* Email */}
          <div className="space-y-1">
            <label className="block font-medium">
              Email <span className="text-destructive">*</span>
            </label>
            <Input
              name="user_id"
              type="email"
              placeholder="eg. abc@gmail.com"
              required
            />
            {errors.email && (
              <p className="text-destructive text-xs">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="block font-medium">
              Password <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <Input
                name="password"
                className="bg-muted"
                type={showPassword ? "text" : "password"}
                placeholder="eg. Xyz@123"
                required
              />
              <button
                type="button"
                className="absolute right-3 top-2.5 text-muted-foreground"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password ? (
              <p className="text-xs px-1 text-destructive">{errors.password}</p>
            ) : (
              <p className="text-muted-foreground text-xs px-1">
                Must contain 8+ chars, uppercase, lowercase, number, and special
                char
              </p>
            )}
          </div>

          {/* Full Name */}
          <div className="space-y-1">
            <label className="block font-medium">
              Full Name <span className="text-destructive">*</span>
            </label>
            <Input name="name" placeholder="Enter full name" required />
          </div>

          {/* Role */}
          <div className="space-y-1">
            <label className="block font-medium">
              Role <span className="text-destructive">*</span>
            </label>

            <Select
              onValueChange={(val) => {
                setRole(val);

                // ADMIN → default org
                if (val === "ADMIN" && allowedOrgs.length > 0) {
                  setSelectedOrgs((prev) => prev.length ? prev : [allowedOrgs[0].org_name]);
                }

                // USER → default org
                if (val === "USER" && allowedOrgs.length > 0) {
                  setSelectedOrg((prev) => prev || allowedOrgs[0].org_name);
                }

                // clearing on role switch
                if (val !== "ADMIN") setSelectedOrgs([]);
                if (val !== "USER") setSelectedOrg("");
              }}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Role" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="USER">User</SelectItem>

                {currentUserRole === "SUPER ADMIN" && (
                  <>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="SUPER ADMIN">Super Admin</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>


          {/* Organization selection */}
          {role === "USER" && (
            <div>
              <label className="block font-medium mb-2">
                Organization <span className="text-destructive">*</span>
              </label>

              <Select
                value={selectedOrg}
                onValueChange={setSelectedOrg}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Organization" />
                </SelectTrigger>

                <SelectContent>
                  {allowedOrgs.map((org) => (
                    <SelectItem key={org.org_name} value={org.org_name}>
                      {org.org_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}


          {role === "ADMIN" && (
            <div>
              <label className="block font-medium">Organizations</label>

              <Popover open={openOrgCombobox} onOpenChange={setOpenOrgCombobox}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    role="combobox"
                    aria-expanded={openOrgCombobox}
                    className="w-full justify-between mb-2"
                  >
                    {selectedOrgs.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {selectedOrgs.map((org) => (
                          <Badge
                            key={org}
                            variant="secondary"
                            className="mr-1 bg-primary text-white rounded-lg"
                          >
                            {org}
                            <span
                              className="ml-1 cursor-pointer rounded-full"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleOrgSelection(org);
                              }}
                            >
                              <X className="h-2 w-2" />
                            </span>
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Select organizations</span>
                    )}

                    <Plus className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>

                <PopoverContent className="p-0 min-w-[150px]" align="center">
                  <div
                    className="max-h-[min(400px,80vh)] overflow-y-auto
          [&::-webkit-scrollbar]:w-1.5
          [&::-webkit-scrollbar-track]:bg-transparent
          [&::-webkit-scrollbar-thumb]:bg-gray-300
          [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-400"
                    onWheel={(e) => e.stopPropagation()}
                  >
                    <Command>
                      <CommandEmpty>No organization found.</CommandEmpty>
                      <CommandGroup>
                        {allowedOrgs.map((org) => (
                          <CommandItem
                            key={org.org_name}
                            value={org.org_name}
                            onSelect={handleOrgSelection}
                          >
                            <div className="flex items-center justify-between w-full text-xs">
                              <span>{org.org_name}</span>
                              {selectedOrgs.includes(org.org_name) && (
                                <Check className="h-4 w-4" />
                              )}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </div>
                </PopoverContent>
              </Popover>

              <p className="text-muted-foreground text-sm mt-2 ml-2">
                Admins can be assigned to up to 5 organizations.
              </p>
            </div>
          )}


          {/* IT Dashboard Visibility */}
          {(role === "ADMIN" || role === "USER") && (
            <div className="space-y-2">
              <label className="block font-medium">
                IT Dashboard Visibility
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: true, label: "True" },
                  { value: false, label: "False" },
                ].map((option) => (
                  <label
                    key={String(option.value)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all text-sm font-medium select-none ${
                      itDashboardVisibility === option.value
                        ? "border-btn-primary bg-btn-primary/10 text-btn-primary"
                        : "border-border bg-background/50 text-muted-foreground hover:border-btn-primary/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="it_dashboard_visibility"
                      checked={itDashboardVisibility === option.value}
                      onChange={() => setItDashboardVisibility(option.value)}
                      className="sr-only"
                    />
                    <span
                      className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        itDashboardVisibility === option.value
                          ? "border-btn-primary"
                          : "border-muted-foreground/40"
                      }`}
                    >
                      {itDashboardVisibility === option.value && (
                        <span className="w-1.5 h-1.5 rounded-full bg-btn-primary" />
                      )}
                    </span>
                    {option.label}
                  </label>
                ))}
              </div>
            </div>
          )}

        </form>

        {/* Sticky Footer */}
        <div className="sticky bottom-0 border-t p-4 flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button type="submit" form="user-create-form" className="flex-1">
            {loading ? <OrbitLoader /> : "Create"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
