import { DataTable } from "@/components/common/table/data-table";
import { DataTableToolbar } from "@/components/common/table/data-table-toolbar";
import PageHeader from "@/components/common/header";
import EmailConfigColumns from "@/components/email-config/email-config-columns";
import {
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
    type SortingState,
} from "@tanstack/react-table";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import Emailconfig from "@/services/email-config";
import { useOrgData } from "@/hooks/useOrgData";
import { EmailConfigCreateSheet } from "@/components/email-config/sheet/create-email-sheet";

/* ---------------- Types ---------------- */

type EmailConfigItem = {
    org_name: string;
    email_name: string;
    email_credentials: Record<string, any> | string;
    email_subject: string;
    email_body: string;
};

/* ---------------- Component ---------------- */

const EmailConfig = () => {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState("");
    const [sheetOpen, setSheetOpen] = useState(false);

    const [emailConfigData, setEmailConfigData] = useState<EmailConfigItem[]>([]);

    /* ---------------- Fetch Email Config ---------------- */

    const fetchEmailConfig = useCallback(async (orgName: string) => {
        if (!orgName) return;

        try {
            const payload = {
                org_name: orgName,
                email_name: "", // Empty to fetch all email configs for the org
            };

            const res = await Emailconfig.getemailConfig(payload);
            setEmailConfigData(res?.data?.response_body || []);
        } catch (err) {
            toast.error("Failed to fetch email configuration");
            setEmailConfigData([]);
            console.error(err);
        }
    }, []);

    // Auto-fetch when org changes
    useOrgData(fetchEmailConfig);

    /* ---------------- Refresh Table ---------------- */

    const refreshTable = () => {
        const orgName = JSON.parse(
            sessionStorage.getItem("SelectedOrg") || "{}"
        )?.org_name;

        fetchEmailConfig(orgName);
    };

    /* ---------------- Table Setup ---------------- */

    const table = useReactTable({
        data: emailConfigData,
        columns: EmailConfigColumns(refreshTable),
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        state: {
            sorting,
            globalFilter,
        },
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        enableRowPinning: true,
    });

    return (
        <>
            <DataTable table={table}>
                <PageHeader title="Email Configuration" />
                <DataTableToolbar
                    table={table}
                    excludeColumns={["actions"]}
                    createButton={{
                        label: "Create Email Config",
                        onClick: () => setSheetOpen(true),
                        visible: true,
                    }}
                />
            </DataTable>
            <EmailConfigCreateSheet
                open={sheetOpen}
                onClose={() => setSheetOpen(false)}
                title="Create Email Config"
                refreshTable={refreshTable}
            />
        </>
    );
};

export default EmailConfig;
