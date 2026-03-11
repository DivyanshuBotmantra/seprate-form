import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { getUserDetails } from "@/lib/auth";

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

import OrbitLoader from "@/components/loader";
import { Badge } from "@/components/ui/badge";
import {
    Popover,
    PopoverTrigger,
    PopoverContent,
} from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandItem,
} from "@/components/ui/command";

import { X, Check, Plus, Pencil } from "lucide-react";

type EditForm = {
    name: string;
    role: string;
    status: string;
};

export function EditUserSheet({
    data,
    orgList = [],
    onSubmit,
}: {
    data: any;
    orgList: { org_name: string }[];
    onSubmit: (payload: any) => Promise<boolean>;
}) {
    const [open, setOpen] = useState(false);
    const [selectedOrgs, setSelectedOrgs] = useState<string[]>([]);
    const [selectedOrg, setSelectedOrg] = useState("");
    const [openOrgCombobox, setOpenOrgCombobox] = useState(false);

    const normalizeStatus = (status: string) =>
        status?.toUpperCase() === "ACTIVE" ? "Active" : "Inactive";

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { isSubmitting },
    } = useForm<EditForm>({
        defaultValues: {
            name: data?.name || "",
            role: data?.role || "",
            status: normalizeStatus(data?.user_status),
        },
    });

    const role = watch("role");
    const status = watch("status");

    // Get current user's role to determine available options
    const currentUser = getUserDetails();
    const currentUserRole = currentUser?.role;

    // Filter orgList based on role - only for USER role
    const allowedOrgs = role === "USER" && currentUserRole !== "SUPER ADMIN"
        ? orgList.filter(org =>
            currentUser?.org_name?.includes(org.org_name)
        )
        : orgList;

    // Prefill org selection
    useEffect(() => {
        if (data?.role === "ADMIN") {
            setSelectedOrgs(data.org_name || []);
        }

        if (data?.role === "USER" && data.org_name?.length) {
            setSelectedOrg(data.org_name[0]);
        }
    }, [data]);

    const handleOrgSelection = (orgName: string) => {
        setSelectedOrgs((prev) => {
            if (prev.includes(orgName)) return prev.filter((o) => o !== orgName);
            if (prev.length >= 5) return prev;
            return [...prev, orgName];
        });
    };

    
    const submitForm = async (form: EditForm) => {
        let org_name: string[] = [];

        if (form.role === "SUPER ADMIN") org_name = [];
        else if (form.role === "ADMIN") org_name = selectedOrgs;
        else if (form.role === "USER") org_name = selectedOrg ? [selectedOrg] : [];

        const payload = {
            search_fields: {
                user_id: data.user_id,   // read-only
            },
            update_fields: {
                name: form.name,
                role: form.role,
                status: form.status,
                org_name: org_name,
            },
        };

        const success = await onSubmit(payload);

        if (success) {
            setOpen(false);
        }
    };



    return (
        <>
            {/* OPEN Button */}
            <Button
                variant="ghost"
                className="px-0 text-yellow-600"
                onClick={() => setOpen(true)}
            >
                <Pencil size={18} />
            </Button>

            <Sheet open={open} onOpenChange={setOpen}>
                <SheetContent className="flex flex-col p-0">
                    <SheetHeader className="px-4 py-3 border-b">
                        <SheetTitle>Edit User</SheetTitle>
                        <p className="text-sm text-muted-foreground -mt-1">
                            Make changes to the user profile.
                        </p>
                    </SheetHeader>

                    {/* USER CARD */}
                    <div className="flex items-center gap-3 px-4 py-4 border-b">
                        <div className="flex h-12 w-12 rounded-full bg-muted 
                items-center justify-center text-lg font-medium">
                            {data?.name?.[0] ?? "U"}
                        </div>

                        <div>
                            <p className="font-medium">{data?.name}</p>
                            <p className="text-sm text-muted-foreground">{data?.user_id}</p>
                        </div>
                    </div>

                    {/* FORM */}
                    <form
                        id="edit-user-form"
                        onSubmit={handleSubmit(submitForm)}
                        className="flex-1 px-6 py-5 flex flex-col gap-5 overflow-y-auto"
                    >
                        {/* Name */}
                        <div className="space-y-2">
                            <label className="font-semibold text-sm">Full Name *</label>
                            <Input {...register("name", { required: true })} />
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <label className="font-semibold text-sm">Email</label>
                            <Input disabled value={data.user_id} />
                        </div>

                        {/* Role */}
                        <div className="space-y-2">
                            <label className="font-semibold text-sm">Role *</label>

                            <Select
                                value={role}
                                onValueChange={(val) => {
                                    setValue("role", val);
                                    setSelectedOrg("");
                                    setSelectedOrgs([]);
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="USER">User</SelectItem>
                                    <SelectItem value="ADMIN">Admin</SelectItem>
                                    <SelectItem value="SUPER ADMIN">Super Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Status */}
                        <div className="space-y-2">
                            <label className="font-semibold text-sm">Status *</label>

                            <Select
                                value={status}
                                onValueChange={(val) => setValue("status", val)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Active">Active</SelectItem>
                                    <SelectItem value="Inactive">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* USER → Single Org */}
                        {role === "USER" && (
                            <div className="space-y-2">
                                <label className="font-semibold text-sm">Organization *</label>

                                <Select value={selectedOrg} onValueChange={setSelectedOrg}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select organization" />
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

                        {/* ADMIN → Multiple Orgs */}
                        {role === "ADMIN" && (
                            <div className="space-y-2">
                                <label className="font-semibold text-sm">Organizations</label>

                                <Popover open={openOrgCombobox} onOpenChange={setOpenOrgCombobox}>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="w-full justify-between">
                                            {selectedOrgs.length ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {selectedOrgs.map((o) => (
                                                        <Badge key={o} className="bg-primary text-white">
                                                            {o}
                                                            <X
                                                                className="h-3 w-3 ml-1 cursor-pointer"
                                                                onMouseDown={(e) => {
                                                                    e.preventDefault();
                                                                    handleOrgSelection(o);
                                                                }}
                                                            />
                                                        </Badge>
                                                    ))}
                                                </div>
                                            ) : (
                                                "Select organizations"
                                            )}

                                            <Plus className="opacity-50" />
                                        </Button>
                                    </PopoverTrigger>

                                    <PopoverContent className="w-full p-1">
                                        <Command>
                                            <CommandEmpty>No organization found</CommandEmpty>

                                            <CommandGroup>
                                                {orgList.map((org) => (
                                                    <CommandItem
                                                        key={org.org_name}
                                                        value={org.org_name}
                                                        onSelect={() => handleOrgSelection(org.org_name)}
                                                    >
                                                        <span>{org.org_name}</span>
                                                        {selectedOrgs.includes(org.org_name) && (
                                                            <Check className="h-4 w-4 ml-auto" />
                                                        )}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        )}
                    </form>

                    {/* FOOTER */}
                    <div className="border-t p-4 flex gap-3">
                        <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>

                        <Button type="submit" form="edit-user-form" className="flex-1">
                            {isSubmitting ? <OrbitLoader /> : "Update"}
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
}
