import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
} from "@/components/ui/sheet";

import {
    Popover,
    PopoverTrigger,
    PopoverContent,
} from "@/components/ui/popover";

import {
    Command,
    CommandInput,
    CommandGroup,
    CommandItem,
    CommandEmpty,
} from "@/components/ui/command";


import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import OrbitLoader from "@/components/loader";
import {
    X,
    Users,
    UserPlus,
    Check,
    ChevronsUpDown,
    UserRoundPlus,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

import {
    getDashboardBotUser,
    createDashboardBotUser,
    deleteDashboardBotUser,
} from "@/services/dashboard-user";

import { useUserStore } from "@/lib/store/user-store";

import ConfirmDeleteDialog from "@/components/common/confirm-dialog";

type Props = {
    data: any;
};

export function Dashboarduserconfig({ data }: Props) {
    const [open, setOpen] = useState(false);

    const orgName =
        JSON.parse(sessionStorage.getItem("SelectedOrg") || "{}")?.org_name || "";

    const dashboardName = data?.dashboard_name || "";

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [userIdsList, setUserIdsList] = useState<string[]>([]);
    const [assignedUsers, setAssignedUsers] = useState<string[]>([]);
    const [fetchingAssigned, setFetchingAssigned] = useState(false);
    const [addingUsers, setAddingUsers] = useState(false);
    const [removingUser, setRemovingUser] = useState<string | null>(null);
    const [confirmUserId, setConfirmUserId] = useState<string | null>(null);

    const [openUserDropdown, setOpenUserDropdown] = useState(false);

    const users = useUserStore((s) => s.users);
    const fetchUsers = useUserStore((s) => s.fetchUsers);

    // --------------------------------------------------
    // Fetch assigned users
    // --------------------------------------------------
    const fetchAssignedUsers = useCallback(async () => {
        if (!orgName || !dashboardName) return;

        try {
            setFetchingAssigned(true);

            const res = await getDashboardBotUser({
                org_name: orgName,
                dashboard_name: dashboardName,
                user_id: "",
            });

            const body =
                res?.response_body?.[0] ??
                res?.data?.response_body?.[0] ??
                res?.response?.response_body?.[0] ??
                null;

            const cleanList = (body?.assigned_users || []).filter(
                (u: string) => u && u.trim() !== ""
            );

            setAssignedUsers(cleanList);
        } catch {
            setAssignedUsers([]);
        } finally {
            setFetchingAssigned(false);
        }
    }, [orgName, dashboardName]);

    useEffect(() => {
        if (open && orgName && dashboardName) {
            fetchUsers(orgName);
            fetchAssignedUsers();
        }
    }, [open, orgName, dashboardName, fetchUsers, fetchAssignedUsers]);

    // --------------------------------------------------
    // Form validation
    // --------------------------------------------------
    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (userIdsList.length === 0) {
            newErrors.user_list = "At least one user must be selected.";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // --------------------------------------------------
    // Add users
    // --------------------------------------------------
    const handleAddUsers = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            setAddingUsers(true);

            // ✅ Store response to check for errors
            const res = await createDashboardBotUser({
                org_name: orgName,
                dashboard_name: dashboardName,
                user_list: userIdsList,
            });

            // ✅ Check if API returned an error
            if (res?.error) {
                toast.error(res.error);
                return;
            }

            // ✅ Only shows if API succeeded!
            toast.success("Users assigned successfully");
            setUserIdsList([]);
            await fetchAssignedUsers();
        } catch (error) {
            // ✅ Catch unexpected errors
            toast.error("Failed to assign users");
        } finally {
            setAddingUsers(false);
        }
    };

    // --------------------------------------------------
    // Remove user
    // --------------------------------------------------
    const handleRemoveUser = async (userId: string) => {
        try {
            setRemovingUser(userId);

            // ✅ Store response to check for errors
            const res = await deleteDashboardBotUser({
                org_name: orgName,
                dashboard_name: dashboardName,
                user_list: [userId],
            });

            // ✅ Check if API returned an error
            if (res?.error) {
                toast.error(res.error);
                return;
            }

            // ✅ Only shows if API succeeded!
            toast.success("User removed");
            await fetchAssignedUsers();
        } catch (error) {
            // ✅ Catch unexpected errors
            toast.error("Failed to remove user");
        } finally {
            setRemovingUser(null);
        }
    };

    // --------------------------------------------------
    // Dropdown select
    // --------------------------------------------------
    const handleSelectUser = (userId: string) => {
        if (!userIdsList.includes(userId)) {
            setUserIdsList((prev) => [...prev, userId]);
        }
        setOpenUserDropdown(false);
    };

    const handleRemoveUserId = (index: number) => {
        setUserIdsList((prev) => prev.filter((_, i) => i !== index));
    };

    // --------------------------------------------------
    // Close sheet reset
    // --------------------------------------------------
    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen);
        if (!isOpen) {
            setErrors({});
            setUserIdsList([]);
            setAssignedUsers([]);
            setOpenUserDropdown(false);
        }
    };

    return (
        <>
            {/* Trigger Button */}
            <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
                <UserRoundPlus />
            </Button>

            <Sheet open={open} onOpenChange={handleOpenChange}>
                <SheetContent className="flex flex-col sm:min-w-lg">
                    <SheetHeader className="border-b">
                        <SheetTitle>Assign Users to Dashboard</SheetTitle>
                        <SheetDescription>
                            Manage assignments for:{" "}
                            <strong>{dashboardName}</strong>
                        </SheetDescription>
                    </SheetHeader>

                    <ScrollArea className="overflow-auto px-4">
                        <div className="space-y-4 mt-6">
                            {/* ---------------- Add Users ---------------- */}
                            <div className="border-2 rounded-lg p-4 bg-muted">
                                <div className="flex items-center gap-2 mb-3">
                                    <UserPlus className="h-4 w-4 text-primary" />
                                    <h4 className="font-medium">Add Users</h4>
                                </div>

                                <form className="space-y-3" onSubmit={handleAddUsers}>
                                    <Popover
                                        open={openUserDropdown}
                                        onOpenChange={setOpenUserDropdown}
                                    >
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className="w-full justify-between"
                                            >
                                                Select user...
                                                <ChevronsUpDown className="h-4 w-4" />
                                            </Button>
                                        </PopoverTrigger>

                                        <PopoverContent
                                            align="start"
                                            className="w-[var(--radix-popover-trigger-width)] p-0"
                                        >
                                            <Command>
                                                <CommandInput placeholder="Search users..." />
                                                <CommandEmpty>No users found.</CommandEmpty>

                                                <CommandGroup className="max-h-[200px] overflow-y-auto">
                                                    {(Array.isArray(users) ? users : [])
                                                        .filter(
                                                            (user) =>
                                                                !userIdsList.includes(user.user_id) &&
                                                                !assignedUsers.includes(user.user_id) &&
                                                                user.role !== "SUPER ADMIN" &&
                                                                user.user_status?.toLowerCase() === "active"
                                                        )
                                                        .map((user) => (
                                                            <CommandItem
                                                                key={user.user_id}
                                                                onSelect={() =>
                                                                    handleSelectUser(user.user_id)
                                                                }
                                                            >
                                                                <Avatar className="h-6 w-6">
                                                                    <AvatarFallback>
                                                                        {user.user_id[0]?.toUpperCase()}
                                                                    </AvatarFallback>
                                                                </Avatar>

                                                                <div className="ml-2 flex-1">
                                                                    <div>{user.user_id}</div>
                                                                    <div className="text-xs text-muted-foreground">
                                                                        {user.name}
                                                                    </div>
                                                                </div>

                                                                <Check className="ml-auto h-4 w-4 opacity-0" />
                                                            </CommandItem>
                                                        ))}
                                                </CommandGroup>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>

                                    {userIdsList.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {userIdsList.map((id, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-md"
                                                >
                                                    {id}
                                                    <Button
                                                        type="button"
                                                        onClick={() => handleRemoveUserId(index)}
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {errors.user_list && (
                                        <p className="text-sm text-destructive">
                                            {errors.user_list}
                                        </p>
                                    )}

                                    <Button
                                        type="submit"
                                        className="w-full"
                                        disabled={addingUsers || userIdsList.length === 0}
                                    >
                                        {addingUsers ? <OrbitLoader /> : "Add Users"}
                                    </Button>
                                </form>
                            </div>

                            {/* ---------------- Assigned Users ---------------- */}
                            <div className="border-2 rounded-lg p-4 bg-muted">
                                <div className="flex items-center gap-2 mb-3">
                                    <Users className="h-4 w-4 text-primary" />
                                    <h4 className="font-medium">Currently Assigned Users</h4>
                                    {fetchingAssigned && <OrbitLoader />}
                                </div>

                                {assignedUsers.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                        No users assigned yet.
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {assignedUsers.map((uid) => {
                                            const user = users.find(
                                                (u) => u.user_id === uid
                                            );

                                            return (
                                                <div
                                                    key={uid}
                                                    className="flex items-center justify-between p-3 rounded-md border"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Avatar>
                                                            <AvatarFallback>
                                                                {uid[0]?.toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>

                                                        <div>
                                                            <p className="font-medium text-sm">
                                                                {user?.name || "User"}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {uid}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <ConfirmDeleteDialog
                                                        id={uid}
                                                        openId={confirmUserId}
                                                        setOpenId={setConfirmUserId}
                                                        loading={removingUser === uid}
                                                        title="Remove user from dashboard?"
                                                        description={
                                                            <>
                                                                This will remove <strong>{uid}</strong> from this dashboard.
                                                                They will immediately lose access.
                                                            </>
                                                        }
                                                        onConfirm={handleRemoveUser}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </ScrollArea>

                    <SheetFooter className="border-t p-6">
                        <Button
                            variant="outline"
                            onClick={() => handleOpenChange(false)}
                            className="w-full"
                        >
                            Close
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </>
    );
}
