import { useState } from "react";

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye } from "lucide-react";

export function ViewUserSheet({ data }) {
    const [open, setOpen] = useState(false);

    return (
        <>
            {/* Trigger Button */}
            <Button
                variant="ghost"
                className="px-0 text-blue-600"
                onClick={() => setOpen(true)}
            >
                <Eye size={18} />
            </Button>

            {/* Sheet */}
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetContent className="flex flex-col p-0">

                    {/* Header */}
                    <SheetHeader className="px-4 py-3 border-b">
                        <SheetTitle>View User</SheetTitle>
                        <p className="text-sm text-muted-foreground -mt-1">
                            User profile details.
                        </p>
                    </SheetHeader>

                    {/* User Info Card */}
                    <div className="flex items-center gap-3 px-4 py-4 border-b">
                        <div className="flex h-12 w-12 rounded-full bg-muted items-center justify-center text-lg font-medium">
                            {data?.name?.[0] ?? "U"}
                        </div>

                        <div>
                            <p className="font-medium">{data?.name}</p>
                            <p className="text-sm text-muted-foreground">{data?.user_id}</p>
                        </div>
                    </div>

                    {/* CONTENT */}
                    <div className="flex-1 px-6 py-5 flex flex-col gap-5 overflow-y-auto">

                        {/* Full Name */}
                        <div className="space-y-2">
                            <label className="font-semibold text-sm">Full Name</label>
                            <Input value={data?.name || ""} disabled className="w-full" />
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <label className="font-semibold text-sm">Email</label>
                            <Input value={data?.user_id || ""} disabled className="w-full" />
                        </div>

                        {/* Role */}
                        <div className="space-y-2">
                            <label className="font-semibold text-sm">Role</label>
                            <Input value={data?.role || ""} disabled className="w-full" />
                        </div>

                        {/* Status */}
                        <div className="space-y-2">
                            <label className="font-semibold text-sm">Status</label>
                            <Input value={data?.user_status || ""} disabled className="w-full" />
                        </div>

                        {/* Organizations */}
                        <div className="space-y-2">
                            <label className="font-semibold text-sm">Organizations</label>

                            <div className="flex flex-wrap gap-2">
                                {data?.org_name?.length > 0 ? (
                                    data.org_name.map((org) => (
                                        <span
                                            key={org}
                                            className="px-2 py-1 bg-primary text-white text-xs rounded-md"
                                        >
                                            {org}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-muted-foreground text-sm">No organizations assigned</span>
                                )}
                            </div>
                        </div>

                    </div>

                    {/* FOOTER */}
                    <div className="border-t p-4 flex gap-3">
                        <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>
                            Close
                        </Button>
                    </div>

                </SheetContent>
            </Sheet>
        </>
    );
}
