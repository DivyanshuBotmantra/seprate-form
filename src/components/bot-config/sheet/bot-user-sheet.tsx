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

import { ScrollArea } from "@radix-ui/react-scroll-area";
import OrbitLoader from "@/components/loader";
import {
  Check,
  ChevronsUpDown,
  UserRoundPlus,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";

import { toast } from "sonner";

import {
  getBotUser,
  createBotUser,
  deleteBotUser,
} from "@/services/bot-user";
import { useUserStore } from "@/lib/store/user-store";
import ConfirmDeleteDialog from "@/components/common/confirm-dialog";

type Props = {
  data: {
    bot_code: string;
    bot_name?: string; // optional, for display only
  };
};

export function BotUserSheet({ data }: Props) {
  const [open, setOpen] = useState(false);

  const orgName =
    JSON.parse(sessionStorage.getItem("SelectedOrg") || "{}")?.org_name || "";

  const botCode = data?.bot_code || "";
  const botDisplayName = data?.bot_name || botCode;

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [userIdsList, setUserIdsList] = useState<string[]>([]);
  const [assignedUsers, setAssignedUsers] = useState<string[]>([]);
  const [fetchingAssigned, setFetchingAssigned] = useState(false);
  const [addingUsers, setAddingUsers] = useState(false);

  const [openUserDropdown, setOpenUserDropdown] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");

  const [removingUser, setRemovingUser] = useState<string | null>(null);
  const [confirmUserId, setConfirmUserId] = useState<string | null>(null);

  const users = useUserStore((s) => s.users);
  const fetchUsers = useUserStore((s) => s.fetchUsers);

  /* --------------------------------------------------
   * Fetch assigned users (by BOT CODE)
   * -------------------------------------------------- */
  const fetchAssignedUsers = useCallback(async () => {
    if (!orgName || !botCode) return;

    try {
      setFetchingAssigned(true);

      const res = await getBotUser({
        org_name: orgName,
        bot_code: botCode,
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
  }, [orgName, botCode]);

  useEffect(() => {
    if (open && orgName && botCode) {
      fetchUsers(orgName);
      fetchAssignedUsers();
    }
  }, [open, orgName, botCode, fetchUsers, fetchAssignedUsers]);

  /* --------------------------------------------------
   * Validation
   * -------------------------------------------------- */
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (userIdsList.length === 0) {
      newErrors.user_id_list = "At least one user must be selected.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* --------------------------------------------------
   * Add users (by BOT CODE)
   * -------------------------------------------------- */
  const handleAddUsers = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setAddingUsers(true);

      // ✅ Store response to check for errors
      const res = await createBotUser({
        org_name: orgName,
        bot_code: botCode,
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

  /* --------------------------------------------------
   * Remove user (by BOT CODE)
   * -------------------------------------------------- */
  const handleRemoveUser = async (userId: string) => {
    try {
      setRemovingUser(userId);

      // ✅ Store response to check for errors
      const res = await deleteBotUser({
        org_name: orgName,
        bot_code: botCode,
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
      setConfirmUserId(null);
    } catch (error) {
      // ✅ Catch unexpected errors
      toast.error("Failed to remove user");
    } finally {
      setRemovingUser(null);
    }
  };

  /* --------------------------------------------------
   * Dropdown select
   * -------------------------------------------------- */
  const handleSelectUser = (userId: string) => {
    if (!userIdsList.includes(userId)) {
      setUserIdsList((prev) => [...prev, userId]);
    }
    setSelectedUserId("");
    setOpenUserDropdown(false);
  };

  /* --------------------------------------------------
   * Close sheet cleanup
   * -------------------------------------------------- */
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setErrors({});
      setUserIdsList([]);
      setAssignedUsers([]);
      setSelectedUserId("");
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
            <SheetTitle>Assign Users to Bot</SheetTitle>
            <SheetDescription>
              Manage assignments for: <strong>{botDisplayName}</strong>
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="overflow-auto px-4">
            <div className="space-y-4 mt-6">
              {/* Add users */}
              <div className="border-2 rounded-lg p-4 bg-muted">
                <form className="space-y-3" onSubmit={handleAddUsers}>
                  <Popover
                    open={openUserDropdown}
                    onOpenChange={setOpenUserDropdown}
                  >
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        Select users
                        <ChevronsUpDown className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>

                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                      <Command>
                        <CommandInput placeholder="Search users..." />
                        <CommandEmpty>No available users to assign</CommandEmpty>

                        <CommandGroup>
                          {users
                            .filter(
                              (u) =>
                                !assignedUsers.includes(u.user_id) &&
                                u.role !== "SUPER ADMIN" &&
                                u.user_status?.toLowerCase() === "active"
                            )
                            .map((u) => (
                              <CommandItem
                                key={u.user_id}
                                onSelect={() => handleSelectUser(u.user_id)}
                              >
                                {u.user_id}
                                <Check
                                  className={`ml-auto h-4 w-4 ${userIdsList.includes(u.user_id)
                                    ? "opacity-100"
                                    : "opacity-0"
                                    }`}
                                />
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>

                  {userIdsList.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {userIdsList.map((id) => (
                        <div
                          key={id}
                          className="flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-sm text-primary"
                        >
                          {id}
                          <button
                            type="button"
                            onClick={() =>
                              setUserIdsList((prev) =>
                                prev.filter((u) => u !== id)
                              )
                            }
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
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

              {/* Assigned users */}
              <div className="border-2 rounded-lg p-4 bg-muted">
                <h4 className="font-medium mb-3">Currently Assigned Users</h4>

                {assignedUsers.map((uid) => (
                  <div
                    key={uid}
                    className="flex items-center justify-between p-3 border rounded-md"
                  >
                    <span>{uid}</span>

                    <ConfirmDeleteDialog
                      id={uid}
                      openId={confirmUserId}
                      setOpenId={setConfirmUserId}
                      loading={removingUser === uid}
                      title="Remove user from bot?"
                      description={
                        <>
                          This will remove <strong>{uid}</strong> from this bot.
                        </>
                      }
                      onConfirm={handleRemoveUser}
                    />
                  </div>
                ))}
              </div>
            </div>
          </ScrollArea>

          <SheetFooter className="border-t p-6">
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Close
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
