import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    type SortingState,
    type Row,
} from "@tanstack/react-table";
import { DataTable } from "@/components/common/table/data-table";
import { DataTableToolbar } from "@/components/common/table/data-table-toolbar";
import { DeleteConfirmationModal } from "@/components/vendorOnboarding/common/delete-confirmation-modal";
import {
    getFormData,
    deleteFormData,
} from "@/services/vendor-onboarding/form-data";
import { vendorColumns, type VendorData } from "@/components/vendorOnboarding/table/form-column";

const VendorOnboarding = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [vendorData, setVendorData] = useState<VendorData[]>([]);
    const [loading, setLoading] = useState(true);
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState("");

    // Add ref to prevent duplicate API calls in StrictMode
    const hasFetchedRef = useRef(false);

    // Delete modal state
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [vendorToDelete, setVendorToDelete] = useState<VendorData | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Get form name from URL parameters
    const formName = searchParams.get("formName") || "Vendor Onboarding";

    // Fetch vendor data from API
    const fetchVendorData = useCallback(async () => {
        // Prevent duplicate calls in React StrictMode
        if (hasFetchedRef.current) {
            return;
        }
        hasFetchedRef.current = true;

        try {
            setLoading(true);

            // Hardcoded payload as requested
            const payload = {
                "org_name": "Rustomjee",
                "form_name": "Vendor Onboarding",
                "search_params": {
                    "trans_id": "",
                    "form_status": "",
                    "created_by": "divyanshu.srivastava@botmantra.com",
                    "updated_by": "",
                    "created_on": "",
                    "updated_on": ""
                },
                "return_form_fields": [],
                "return_form_data_fields": [
                    "type_of_vendor",
                    "vendor_details",
                    "key_details"
                ]
            };

            const { data, error } = await getFormData(payload);

            if (error) {
                console.error("Error fetching vendor data:", error);
                setVendorData([]);
            } else if (data && data.response_body) {
                if (data.response_body.length === 0) {
                    setVendorData([]);
                } else {
                    // Map API response to VendorData[] structure
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const mappedVendorData = data.response_body.map((item: any) => ({
                        trans_id: item.trans_id as string,
                        org_name: item.org_name as string,
                        form_name: item.form_name as string,
                        form_data: item.form_data || {},
                        form_status: item.form_status as string,
                        form_status_trans: (item.form_status_trans || []) as Array<{
                            status: string;
                            updated_by: string;
                            updated_on: string;
                        }>,
                        created_by: item.created_by as string,
                        created_on: item.created_on as string,
                        updated_by: item.updated_by as string,
                        updated_on: item.updated_on as string,
                    }));
                    setVendorData(mappedVendorData);
                }
            } else {
                setVendorData([]);
            }
        } catch (error) {
            console.error("Failed to fetch vendor data:", error);
            toast.error("Failed to fetch vendor data");
            setVendorData([]);
        } finally {
            setLoading(false);
        }
    }, [formName]);

    // Check access and fetch data on mount
    useEffect(() => {
        fetchVendorData();
    }, [fetchVendorData]);

    const handleCreateNewVendor = () => {
        // Navigate to Step 1 form with parameters
        const params = new URLSearchParams({
            formName: formName,
            orgName: "Rustomjee",
        });
        navigate(`/vendor-form-step1?${params.toString()}`);
    };

    // Handle view vendor - navigate to view mode component
    const handleViewVendor = (vendor: VendorData) => {
        const params = new URLSearchParams({
            formName: formName,
            orgName: "Rustomjee",
            transId: vendor.trans_id,
            mode: "view",
        });
        navigate(`/vendor-view?${params.toString()}`);
    };

    // Handle edit vendor - navigate to edit mode
    const handleEditVendor = (vendor: VendorData) => {
        const params = new URLSearchParams({
            formName: formName,
            orgName: "Rustomjee",
            transId: vendor.trans_id,
            editMode: "true",
        });
        navigate(`/vendor-form?${params.toString()}`);
    };

    // Handle delete vendor - show confirmation modal
    const handleDeleteVendor = (vendor: VendorData) => {
        setVendorToDelete(vendor);
        setDeleteModalOpen(true);
    };

    // Confirm delete vendor
    const confirmDeleteVendor = async () => {
        if (!vendorToDelete) return;

        setIsDeleting(true);
        try {
            const deletePayload = {
                org_name: "Rustomjee",
                form_name: formName,
                transaction_id: vendorToDelete.trans_id,
            };

            const { error } = await deleteFormData(deletePayload);

            if (error) {
                console.error("Error deleting vendor:", error);
                toast.error(`Failed to delete vendor: ${error}`);
            } else {
                toast.success("Vendor deleted successfully!");
                // Remove the deleted vendor from the local state
                setVendorData((prev) =>
                    prev.filter((vendor) => vendor.trans_id !== vendorToDelete.trans_id)
                );
                // Close modal and reset state
                setDeleteModalOpen(false);
                setVendorToDelete(null);
            }
        } catch (error) {
            console.error("Failed to delete vendor:", error);
            toast.error("Failed to delete vendor. Please try again.");
        } finally {
            setIsDeleting(false);
        }
    };

    // Cancel delete
    const cancelDelete = () => {
        setDeleteModalOpen(false);
        setVendorToDelete(null);
    };

    // Global filter function for search
    const globalFilterFn = (
        row: Row<VendorData>,
        _columnId: string,
        filterValue: string
    ): boolean => {
        const search = String(filterValue).toLowerCase();
        if (!search) return true;

        // Helper function to recursively search through nested objects
        const searchInObject = (obj: any): boolean => {
            if (obj === null || obj === undefined) return false;

            if (typeof obj === "string") {
                return obj.toLowerCase().includes(search);
            }

            if (typeof obj === "number") {
                return String(obj).toLowerCase().includes(search);
            }

            if (Array.isArray(obj)) {
                return obj.some((item) => searchInObject(item));
            }

            if (typeof obj === "object") {
                return Object.values(obj).some((value) => searchInObject(value));
            }

            return false;
        };

        // Search in all relevant fields
        const searchableFields = [
            row.original.trans_id,
            row.original.form_status,
            row.original.created_by,
            row.original.updated_by,
            row.original.form_data,
        ];

        return searchableFields.some((field) => searchInObject(field));
    };

    // React Table configuration
    const table = useReactTable({
        data: vendorData,
        columns: vendorColumns(
            handleViewVendor, // View handler - navigate to full-page view
            handleEditVendor, // Edit handler - navigate to edit mode
            handleDeleteVendor // Delete handler - show confirmation modal
        ),
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        onSortingChange: setSorting,
        enableRowPinning: true,
        initialState: {
            pagination: {
                pageSize: 30,
            },
        },
        state: {
            sorting,
            globalFilter,
        },
        onGlobalFilterChange: setGlobalFilter,
        globalFilterFn,
    });

    // Show loading state
    if (loading) {
        return (
            <div className="h-screen bg-sidebar rounded-lg border border-border overflow-hidden shadow-sm flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                </div>
            </div>
        );
    }

    return (
        <>
            <DataTable table={table} pageSizeOptions={[30, 40, 50]}>
                <div className="px-3 pt-2">
                    <h1 className="font-semibold text-xl">{formName} Form</h1>
                </div>
                <div className="space-y-4">
                    <DataTableToolbar
                        table={table}
                        excludeColumns={["actions", "trans_id"]}
                        createButton={{
                            label: "Create New Vendor",
                            onClick: handleCreateNewVendor,
                            visible: true,
                        }}
                    />
                </div>
            </DataTable>

            {/* Delete Confirmation Modal */}
            <DeleteConfirmationModal
                open={deleteModalOpen}
                onClose={cancelDelete}
                onConfirm={confirmDeleteVendor}
                title="Delete Vendor"
                description="Are you sure you want to delete this vendor? This action cannot be undone."
                itemName={
                    vendorToDelete ? `Vendor ID: ${vendorToDelete.trans_id}` : undefined
                }
                loading={isDeleting}
            />
        </>
    );
};

export default VendorOnboarding;

