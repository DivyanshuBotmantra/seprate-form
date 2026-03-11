import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
} from "@/components/ui/sheet";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
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

import { useUserStore } from "@/lib/store/user-store";
import {
    getFormMasterUser,
    createFormMasterUser,
    deleteFormMasterUser,
} from "@/services/form-master-user";

import ConfirmDeleteDialog from "@/components/common/confirm-dialog";

type Props = {
    data: {
        org_name: string;
        form_code: string;
    };
};

export function FormMasterUserSheet({ data }: Props) {
    const [open, setOpen] = useState(false);

    const orgName = data.org_name;
    const formCode = data.form_code;

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

    // ---------------- Fetch assigned users ----------------
    const fetchAssignedUsers = useCallback(async () => {
        if (!orgName || !formCode) return;

        try {
            setFetchingAssigned(true);

            const res = await getFormMasterUser({
                org_name: orgName,
                form_code: formCode,
                user_id: [""],
            });

            const rows =
                res?.data?.response_body ??
                res?.response_body ??
                [];

            const cleanList = (Array.isArray(rows) ? rows : [])
                .map((r: any) => r.user_id)
                .filter((u: string) => u && u.trim() !== "");

            setAssignedUsers(cleanList);
        } catch (err) {
            console.error("Failed to fetch assigned users:", err);
            setAssignedUsers([]);
        } finally {
            setFetchingAssigned(false);
        }
    }, [orgName, formCode]);


    useEffect(() => {
        if (open && orgName && formCode) {
            fetchUsers(orgName);
            fetchAssignedUsers();
        }
    }, [open, orgName, formCode, fetchUsers, fetchAssignedUsers]);

    // ---------------- Validation ----------------
    const validateForm = () => {
        if (userIdsList.length === 0) {
            setErrors({ user_list: "At least one user must be selected." });
            return false;
        }
        setErrors({});
        return true;
    };

    // ---------------- Add users ----------------
    const handleAddUsers = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            setAddingUsers(true);

            // ✅ Store response to check for errors
            const res = await createFormMasterUser({
                org_name: orgName,
                form_code: formCode,
                user_id: userIdsList,
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

    // ---------------- Remove user ----------------
    const handleRemoveUser = async (userId: string) => {
        try {
            setRemovingUser(userId);

            // ✅ Store response to check for errors
            const res = await deleteFormMasterUser({
                org_name: orgName,
                form_code: formCode,
                user_id: [userId],
            });

            // ✅ Check if API returned an error
            if (res?.error) {
                toast.error(res.error);
                return;
            }

            // ✅ Only shows if API succeeded!
            toast.success("User removed");
            await fetchAssignedUsers();
            setConfirmUserId(null);
        } catch (error) {
            // ✅ Catch unexpected errors
            toast.error("Failed to remove user");
        } finally {
            setRemovingUser(null);
        }
    };

    // ---------------- Close reset ----------------
    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen);
        if (!isOpen) {
            setErrors({});
            setUserIdsList([]);
            setAssignedUsers([]);
            setOpenUserDropdown(false);
            setConfirmUserId(null);
            setRemovingUser(null);
        }
    };

    return (
        <>
            <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
                <UserRoundPlus />
            </Button>

            <Sheet open={open} onOpenChange={handleOpenChange}>
                <SheetContent className="flex flex-col sm:min-w-lg">
                    <SheetHeader className="border-b">
                        <SheetTitle>Assign Users to Form</SheetTitle>
                        <SheetDescription>
                            Manage assignments for: <strong>{formCode}</strong>
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
                                                Select users
                                                <ChevronsUpDown className="h-4 w-4" />
                                            </Button>
                                        </PopoverTrigger>

                                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                            <Command>
                                                <CommandInput placeholder="Search users..." />
                                                <CommandEmpty>No users found.</CommandEmpty>

                                                <CommandGroup className="max-h-[200px] overflow-y-auto">
                                                    {users
                                                        .filter(
                                                            (u) =>
                                                                !userIdsList.includes(u.user_id) &&
                                                                !assignedUsers.includes(u.user_id) &&
                                                                u.role !== "SUPER ADMIN" &&
                                                                u.user_status?.toLowerCase() === "active"
                                                        )
                                                        .map((u) => (
                                                            <CommandItem
                                                                key={u.user_id}
                                                                onSelect={() => {
                                                                    setUserIdsList((prev) => [
                                                                        ...prev,
                                                                        u.user_id,
                                                                    ]);
                                                                    setOpenUserDropdown(false);
                                                                }}
                                                            >
                                                                {u.user_id}
                                                                <Check className="ml-auto h-4 w-4 opacity-0" />
                                                            </CommandItem>
                                                        ))}
                                                </CommandGroup>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>

                                    {/* Selected users chips */}
                                    {userIdsList.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {userIdsList.map((id) => (
                                                <div
                                                    key={id}
                                                    className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-md"
                                                >
                                                    {id}
                                                    <Button
                                                        type="button"
                                                        onClick={() =>
                                                            setUserIdsList((prev) =>
                                                                prev.filter((u) => u !== id)
                                                            )
                                                        }
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
                                                        title="Remove user from form?"
                                                        description={
                                                            <>
                                                                This will remove <strong>{uid}</strong> from this
                                                                form.
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
                            className="w-full"
                            onClick={() => handleOpenChange(false)}
                        >
                            Close
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet >
        </>
    );
}
