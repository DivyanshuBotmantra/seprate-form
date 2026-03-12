import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Edit, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";


// Helper function to convert vendor type short code back to full description for display
const getVendorTypeFullDescription = (shortCode: string): string => {
    switch (shortCode) {
        case "Employee":
            return "Employee";
        case "XK01":
            return "Vendor Purchase Org";
        case "FK01":
            return "Direct FI Vendor";
        default:
            return shortCode; // Return as-is if no mapping found
    }
};

// Vendor data type matching the thin API structure
export interface VendorData {
    trans_id: string;
    org_name: string;
    form_name: string;
    form_data: {
        type_of_vendor?: string;
        vendor_details?: {
            vendor_account_group?: string;
            name1?: string;
        };
        key_details?: {
            gstin?: string;
            pan_number?: string; 
        };
    };
    form_status: string;
    created_by: string;
    created_on: string;
    updated_by: string | null;
    updated_on: string | null;
}

// Function to generate vendor-specific columns
const generateVendorColumns = (): ColumnDef<VendorData, unknown>[] => {
    return [
        {
            accessorKey: "trans_id",
            header: () => null,
            cell: () => null,
            enableHiding: true,
            size: 0,
            enableSorting: false,
        },
        {
            accessorKey: "form_data.type_of_vendor",
            header: ({ column }) => (
                <div
                    onClick={column.getToggleSortingHandler()}
                    className="flex items-center gap-2 w-fit cursor-pointer py-2 hover:text-primary transition-colors"
                >
                    Type of Vendor
                    <ArrowUpDown className="h-3 w-3 opacity-50" />
                </div>
            ),
            cell: ({ row }) => {
                const shortCode = row.original.form_data?.type_of_vendor;
                return (
                    <div className="text-foreground/90 text-[13px] font-medium truncate">
                        {shortCode ? getVendorTypeFullDescription(shortCode) : "-"}
                    </div>
                );
            },
            size: 180,
        },
        {
            accessorKey: "form_data.vendor_details.vendor_account_group",
            header: ({ column }) => (
                <div
                    onClick={column.getToggleSortingHandler()}
                    className="flex items-center gap-2 cursor-pointer py-2 hover:text-primary transition-colors"
                >
                    Vendor Group
                    <ArrowUpDown className="h-3 w-3 opacity-50" />
                </div>
            ),
            cell: ({ row }) => (
                <div className="text-foreground/80 text-[13px] truncate">
                    {row.original.form_data?.vendor_details?.vendor_account_group || "-"}
                </div>
            ),
            size: 150,
        },
        {
            accessorKey: "form_data.vendor_details.name1",
            header: ({ column }) => (
                <div
                    onClick={column.getToggleSortingHandler()}
                    className="flex items-center gap-2 cursor-pointer py-2 hover:text-primary transition-colors"
                >
                    Vendor Name
                    <ArrowUpDown className="h-3 w-3 opacity-50" />
                </div>
            ),
            cell: ({ row }) => (
                <div className="text-foreground text-[13px] font-semibold truncate px-1">
                    {row.original.form_data?.vendor_details?.name1 || "-"}
                </div>
            ),
        },
        {
            accessorKey: "form_data.key_details.gstin",
            header: ({ column }) => (
                <div
                    onClick={column.getToggleSortingHandler()}
                    className="flex items-center gap-2 cursor-pointer py-2 hover:text-primary transition-colors"
                >
                    GSTIN
                    <ArrowUpDown className="h-3 w-3 opacity-50" />
                </div>
            ),
            cell: ({ row }) => (
                <div className="text-foreground/80 text-[13px] font-mono truncate">
                    {row.original.form_data?.key_details?.gstin || "-"}
                </div>
            ),
        },
        {
            accessorKey: "form_data.key_details.pan_number",
            header: ({ column }) => (
                <div
                    onClick={column.getToggleSortingHandler()}
                    className="flex items-center gap-2 cursor-pointer py-2 hover:text-primary transition-colors"
                >
                    PAN
                    <ArrowUpDown className="h-3 w-3 opacity-50" />
                </div>
            ),
            cell: ({ row }) => (
                <div className="text-foreground/80 text-[13px] font-mono tracking-wider">
                    {row.original.form_data?.key_details?.pan_number || "-"}
                </div>
            ),
        },
        {
            accessorKey: "form_status",
            header: ({ column }) => (
                <div
                    onClick={column.getToggleSortingHandler()}
                    className="flex items-center gap-2 cursor-pointer py-2 hover:text-primary transition-colors font-medium "
                >
                    Status
                    <ArrowUpDown className="h-3 w-3 opacity-50" />
                </div>
            ),
            cell: ({ row }) => {
                const status = row.original.form_status;
                const getStatusBadge = (status: string) => {
                    switch (status) {
                        case "Draft":
                            return (
                                <Badge
                                    variant="secondary"
                                    className="bg-status-in-progress-bg/15 text-status-in-progress border-status-in-progress/20 rounded-full px-2.5 py-0.5 font-semibold text-[10px] uppercase tracking-wider"
                                >
                                    Draft
                                </Badge>
                            );
                        case "Submitted":
                            return (
                                <Badge
                                    variant="default"
                                    className="bg-status-succeeded-bg/15 text-status-succeeded border-status-succeeded/20 rounded-full px-2.5 py-0.5 font-semibold text-[10px] uppercase tracking-wider"
                                >
                                    Submitted
                                </Badge>
                            );
                        case "Approved":
                            return (
                                <Badge
                                    variant="default"
                                    className="bg-status-succeeded text-white border-transparent rounded-full px-2.5 py-0.5 font-semibold text-[10px] uppercase tracking-wider shadow-sm shadow-status-succeeded/20"
                                >
                                    Approved
                                </Badge>
                            );
                        case "Rejected":
                            return (
                                <Badge
                                    variant="destructive"
                                    className="bg-status-failed-bg/15 text-status-failed border-status-failed/20 rounded-full px-2.5 py-0.5 font-semibold text-[10px] uppercase tracking-wider"
                                >
                                    Rejected
                                </Badge>
                            );
                        default:
                            return (
                                <Badge
                                    variant="outline"
                                    className="rounded-full px-2.5 py-0.5 font-semibold text-[10px] uppercase tracking-wider"
                                >
                                    {status}
                                </Badge>
                            );
                    }
                };
                return (
                    <div className="flex justify-start items-center h-full">
                        {getStatusBadge(status)}
                    </div>
                );
            },
        },
    ];
};

export const vendorColumns = (
    onView?: (vendor: VendorData) => void,
    onEdit?: (vendor: VendorData) => void,
    onDelete?: (vendor: VendorData) => void
): ColumnDef<VendorData, unknown>[] => {
    const vendorSpecificColumns = generateVendorColumns();

    const actionsColumn: ColumnDef<VendorData, unknown> = {
        id: "actions",
        header: () => <div className="px-1 font-semibold text-[13px]">Actions</div>,
        cell: ({ row }) => {
            return (
                <div className="flex items-center justify-start gap-2">
                    {row.original.form_status === "Draft" ? (
                        <>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onEdit?.(row.original)}
                                className="text-primary hover:bg-primary/5 p-2 h-7 w-7 rounded-md transition-all active:scale-95"
                                title="Edit Vendor"
                            >
                                <Edit className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onDelete?.(row.original)}
                                className="text-status-failed hover:bg-status-failed/10 p-2 h-7 w-7 rounded-md transition-all active:scale-95"
                                title="Delete Vendor"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                        </>
                    ) : (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onView?.(row.original)}
                            className="text-status-succeeded hover:bg-status-succeeded/10 p-2 h-7 w-7 rounded-md transition-all active:scale-95"
                            title="View Details"
                        >
                            <Eye className="w-3.5 h-3.5" />
                        </Button>
                    )}
                </div>
            );
        },
    };

    return [...vendorSpecificColumns, actionsColumn];
};
