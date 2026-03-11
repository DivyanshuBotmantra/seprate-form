import {
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    type SortingState,
    type Row,
} from "@tanstack/react-table";
import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { DataTableToolbar } from "@/components/common/table/data-table-toolbar";
import { DataTable } from "@/components/common/table/data-table";
import { toast } from "sonner";
import { formDataColumns } from "@/components/form-data/column";
import type { FormData } from "@/components/form-data/column";
import {
    getFormData,
    type FormDataItem,
    type GetFormDataPayload,
} from "@/services/form-data";
import { getFormDetails } from "@/services/form-master";

const FormDataPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [formDataList, setFormDataList] = useState<FormData[]>([]);
    const [, setFetchLoading] = useState(false);
    const [currentFormName, setCurrentFormName] = useState<string>("");
    const [formTemplate, setFormTemplate] = useState<Record<
        string,
        unknown
    > | null>(null);
    const [, setCurrentUserRole] = useState<string>("");

    // Get form context from URL parameters
    const urlFormName = searchParams.get("formName") || "";
    const urlOrgName = searchParams.get("orgName") || "";

    const fetchFormTemplate = async (orgName: string, formName: string) => {
        try {
            const payload = {
                org_name: orgName,
                form_name: formName,
                form_template: "",
                storage_type: "",
                credentials: "",
                mail_server: "",
                mail_credentials: "",
                form_status: "",
                form_description: "",
            };

            const { data, error } = await getFormDetails(payload);

            if (error) {
                console.error("Error fetching form template:", error);
                return null;
            } else if (data && data.length > 0) {
                return data[0].form_template;
            }
            return null;
        } catch (error) {
            console.error("Error fetching form template:", error);
            return null;
        }
    };

    const fetchFormData = useCallback(async () => {
        try {
            setFetchLoading(true);

            // Get form context from SelectedForm session storage
            const getFormContextFromSession = () => {
                try {
                    const selectedForm = JSON.parse(
                        sessionStorage.getItem("SelectedForm") || "{}"
                    );
                    return {
                        org_name: selectedForm?.org_name || "",
                        form_name: selectedForm?.form_name || "",
                    };
                } catch (error) {
                    console.error("Error getting form context from session:", error);
                    return { org_name: "", form_name: "" };
                }
            };

            // Get user details and organization from session storage with role-based logic
            const getUserContextFromSession = () => {
                try {
                    const userDetails = JSON.parse(
                        sessionStorage.getItem("userDetail") || "{}"
                    );
                    const selectedOrg = JSON.parse(
                        sessionStorage.getItem("SelectedOrg") || "{}"
                    );

                    // Get user role and user_id
                    const userRole = userDetails?.role || "";
                    const userId = userDetails?.user_id || "";
                    let orgName = "";

                    if (userRole === "USER") {
                        // For USER role: get org_name from userDetails
                        if (userDetails?.org_name) {
                            // Handle both array and string formats for org_name
                            orgName = Array.isArray(userDetails.org_name)
                                ? userDetails.org_name[0]
                                : userDetails.org_name;
                        }
                    } else if (userRole === "ADMIN" || userRole === "SUPER ADMIN") {
                        // For ADMIN/SUPER ADMIN: get org_name from SelectedOrg with fallback to orgselect
                        if (selectedOrg?.org_name) {
                            orgName = selectedOrg.org_name;
                        } else {
                            // Fallback to orgselect from session storage
                            const orgselect = sessionStorage.getItem("orgselect");
                            if (orgselect) {
                                orgName = orgselect;
                            }
                        }
                    }

                    return {
                        userRole,
                        userId,
                        orgName,
                    };
                } catch (error) {
                    console.error("Error getting user context from session:", error);
                    return { userRole: "", userId: "", orgName: "" };
                }
            };

            // Get form context from URL parameters first, then SelectedForm, then org context
            const formContext = getFormContextFromSession();
            const userContext = getUserContextFromSession();

            // Prioritize URL parameters for organization and form name
            const orgName = urlOrgName || formContext.org_name || userContext.orgName;
            const formName = urlFormName || formContext.form_name;

            // Set current form name and user role for display
            setCurrentFormName(formName);
            setCurrentUserRole(userContext.userRole);

            if (!orgName) {
                toast.error("Organization not found. Please select an organization.");
                setFormDataList([]);
                return;
            }

            // Prepare payload for getFormData API based on user role
            const payload = {
                org_name: orgName,
                form_name: formName,
                "search_params": {
                    "trans_id": "",
                    "form_status": "",
                    "created_by": "",
                    "updated_by": "",
                    "created_on": "",
                    "updated on": ""
                },

                "return_form_fields": [],
                "return_form_data_fields": ["all"]


            };

            // Role-based filtering: Add created_by filter for ADMIN and USER roles
            if (userContext.userRole === "ADMIN" || userContext.userRole === "USER") {
                if (userContext.userId) {
                    payload.created_by = userContext.userId;
                    console.log(
                        `🔍 Role-based filtering: ${userContext.userRole} - filtering by created_by: ${userContext.userId}`
                    );
                } else {
                    console.warn(
                        `⚠️ Role-based filtering: ${userContext.userRole} - no user_id found, showing all data for organization`
                    );
                }
            } else if (userContext.userRole === "SUPER ADMIN") {
                // SUPER ADMIN sees all data (no created_by filter)
                console.log("🔍 Role-based filtering: SUPER ADMIN - showing all data");
            } else {
                console.warn(
                    `⚠️ Unknown user role: ${userContext.userRole} - using default filtering`
                );
            }

            const { data, error } = await getFormData(payload);

            if (error) {
                console.error("API Error:", error);
                // toast.error(error);
                setFormDataList([]);
            } else if (data && data.response_body) {
                console.log("📊 Form data response:", data.response_body);
                console.log(`📊 Response length: ${data.response_body.length} records`);
                console.log(
                    `👤 User Role: ${userContext.userRole}, User ID: ${userContext.userId || "N/A"
                    }`
                );

                // Fetch form template to filter columns
                if (formName) {
                    const template = await fetchFormTemplate(orgName, formName);
                    setFormTemplate(template);
                }

                // Check if response is empty or contains only empty objects
                if (data.response_body.length === 0) {
                    console.log("📭 No form data found - setting empty array");
                    setFormDataList([]);
                } else {
                    // Map API response to FormData[] structure
                    const mappedFormData = data.response_body.map(
                        (item: FormDataItem) => ({
                            trans_id: item.trans_id,
                            org_name: item.org_name,
                            form_name: item.form_name,
                            form_data: item.form_data || {},
                            form_status: item.form_status,
                            form_status_trans: item.form_status_trans || [],
                            created_by: item.created_by,
                            created_on: item.created_on,
                            updated_by: item.updated_by || "",
                            updated_on: item.updated_on || "",
                        })
                    );
                    // console.log("Mapped form data:", mappedFormData);
                    setFormDataList(mappedFormData);
                }
            } else {
                setFormDataList([]);
            }
        } catch (error) {
            console.error("Error fetching form data:", error);
            toast.error("Failed to fetch form data");
            setFormDataList([]);
        } finally {
            setFetchLoading(false);
        }
    }, [urlFormName, urlOrgName]);

    const handleCreateFormData = () => {
        // Get form context from SelectedForm session storage
        const getFormContextFromSession = () => {
            try {
                const selectedForm = JSON.parse(
                    sessionStorage.getItem("SelectedForm") || "{}"
                );
                return {
                    org_name: selectedForm?.org_name || "",
                    form_name: selectedForm?.form_name || "",
                };
            } catch (error) {
                console.error("Error getting form context from session:", error);
                return { org_name: "", form_name: "" };
            }
        };

        // Get user context from session storage (same logic as fetchFormData)
        const getUserContextFromSession = () => {
            try {
                const userDetails = JSON.parse(
                    sessionStorage.getItem("userDetail") || "{}"
                );
                const selectedOrg = JSON.parse(
                    sessionStorage.getItem("SelectedOrg") || "{}"
                );

                // Get user role and user_id
                const userRole = userDetails?.role || "";
                const userId = userDetails?.user_id || "";
                let orgName = "";

                if (userRole === "USER") {
                    // For USER role: get org_name from userDetails
                    if (userDetails?.org_name) {
                        // Handle both array and string formats for org_name
                        orgName = Array.isArray(userDetails.org_name)
                            ? userDetails.org_name[0]
                            : userDetails.org_name;
                    }
                } else if (userRole === "ADMIN" || userRole === "SUPER ADMIN") {
                    // For ADMIN/SUPER ADMIN: get org_name from SelectedOrg with fallback to orgselect
                    if (selectedOrg?.org_name) {
                        orgName = selectedOrg.org_name;
                    } else {
                        // Fallback to orgselect from session storage
                        const orgselect = sessionStorage.getItem("orgselect");
                        if (orgselect) {
                            orgName = orgselect;
                        }
                    }
                }

                return {
                    userRole,
                    userId,
                    orgName,
                };
            } catch (error) {
                console.error("Error getting user context from session:", error);
                return { userRole: "", userId: "", orgName: "" };
            }
        };

        // Get form context from URL parameters first, then SelectedForm, then user context and current form name
        const formContext = getFormContextFromSession();
        const userContext = getUserContextFromSession();

        const orgName = urlOrgName || formContext.org_name || userContext.orgName;
        // Use form name from URL, SelectedForm, or fallback to current form name from state
        const formName = urlFormName || formContext.form_name || currentFormName;

        console.log("🔍 Create Form Data - Context Check:", {
            formContext,
            userContext,
            currentFormName,
            orgName,
            formName,
        });

        if (!orgName) {
            toast.error(
                "Organization not found. Please select an organization first."
            );
            return;
        }

        if (!formName) {
            toast.error(
                "Form not found. Please select a form first from the forms list."
            );
            return;
        }

        // Navigate to form page with form context as query parameters
        const params = new URLSearchParams({
            formName: formName,
            orgName: orgName,
        });

        console.log(
            "🚀 Navigating to form creation with params:",
            params.toString()
        );
        navigate(`/form?${params.toString()}`);
    };

    useEffect(() => {
        fetchFormData();
    }, [fetchFormData]);

    // Listen for organization changes and redirect to home
    useEffect(() => {
        const handleOrganizationChange = async (event: CustomEvent) => {
            console.log(
                "🔄 Organization changed, redirecting to home to load data based on new organization"
            );

            const newOrgName = event.detail?.orgName;
            if (!newOrgName) {
                console.warn("⚠️ No organization name in event detail");
                return;
            }

            // Clear the current form context since we're changing organizations
            sessionStorage.removeItem("SelectedForm");

            // Show success notification
            // toast.success(`Switched to organization "${newOrgName}". Redirecting to home...`);

            // Redirect to home page - this will load the forms list based on the new organization
            navigate("/");
        };

        // Listen for custom organization change event
        window.addEventListener(
            "organizationChanged",
            handleOrganizationChange as unknown as EventListener
        );

        // Cleanup listener on component unmount
        return () => {
            window.removeEventListener(
                "organizationChanged",
                handleOrganizationChange as unknown as EventListener
            );
        };
    }, [navigate]);

    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState("");

    const globalFilterFn = (
        row: Row<FormData>,
        _columnId: string,
        filterValue: string
    ): boolean => {
        const search = String(filterValue).toLowerCase();
        const { form_data } = row.original;

        // Search only in dynamic form_data fields since that's all we're showing
        const formDataMatch =
            form_data && typeof form_data === "object"
                ? Object.values(form_data).some((value) => {
                    if (typeof value === "string") {
                        return value.toLowerCase().includes(search);
                    } else if (typeof value === "number") {
                        return String(value).toLowerCase().includes(search);
                    } else if (
                        value &&
                        typeof value === "object" &&
                        "file_name" in value
                    ) {
                        return String((value as Record<string, unknown>).file_name)
                            .toLowerCase()
                            .includes(search);
                    }
                    return false;
                })
                : false;

        return formDataMatch;
    };

    const table = useReactTable({
        data: formDataList,
        columns: formDataColumns(formDataList, formTemplate),
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        onSortingChange: setSorting,
        enableRowPinning: true,
        state: {
            sorting,
            globalFilter,
        },
        onGlobalFilterChange: setGlobalFilter,
        globalFilterFn,
    });

    return (
        <DataTable table={table}>
            <div className="px-3 pt-2">
                <h1 className="font-semibold text-xl">
                    Form Data
                    {currentFormName && (
                        <span className=" font-semibold ml-2">- {currentFormName}</span>
                    )}
                </h1>
            </div>
            <div className="space-y-4">
                <DataTableToolbar
                    table={table}
                    excludeColumns={["actions"]}
                    createButton={{
                        label: "Create Form Data",
                        onClick: handleCreateFormData,
                        visible: true,
                    }}
                />
            </div>
        </DataTable>
    );
};

export default FormDataPage;

