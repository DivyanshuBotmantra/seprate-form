import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Edit, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

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

// Vendor data type matching the API structure
export interface VendorData {
  trans_id: string;
  org_name: string;
  form_name: string;
  form_data: {
    // Type of Vendor
    type_of_vendor?: string;

    // Vendor Details
    vendor_details?: {
      vendor_account_group?: string;
      name1?: string;
      name2?: string;
      employee_number?: string;
      title_text?: string;
      company_code?: string;
      search_term1?: string;
      terms_of_payment_key?: string;
    };

    // Key Details
    key_details?: {
      gstin?: string;
      pan_number?: string;
      cin_number?: string;
      credit_information_number_msme?: string;
      pan_aadhar_linked_status?: string;
      msme_status?: string;
      gstin_requirement?: string;
    };

    // Address Details
    address_details?: {
      primary_email?: string;
      secondary_email?: string;
      first_mobile_number_dialing_code_plus_number?: string;
      first_telephone_dialing_code_plus_number?: string;
      telephone_dialing_code_plus_number?: string;
      street?: string;
      street2?: string;
      street3?: string;
      street4?: string;
      street5?: string;
      district?: string;
      city_postal_code?: string;
      city?: string;
      country_key?: string;
      region?: string;
    };

    // Bank Details
    bank_details?: {
      bank_key_ifsc_code?: string;
      bank_account_number?: string;
      account_holder_name?: string;
      bank_country_key?: string;
      partner_bank_type?: string;
    };

    // Internal Details
    internal_details?: {
      purchasing_organization?: string;
      order_acknowledgment_requirement?: string;
      indicator_for_with_holding_tax_type1?: string;
      indicator_for_with_holding_tax_type2?: string;
      reconciliation_account_in_general_ledger?: string;
      responsible_sales_person_at_vendor_office?: string;
      planning_group?: string;
    };

    // System Fields
    system_fields?: {
      name3?: string;
      name4?: string;
      language?: string;
      address_time_zone?: string;
      last_review_external?: string;
      vendor_classification_for_gst?: string;
      individual_pmt_check?: string;
      key_for_sorting_according_to_assignment_number?: string;
      list_of_payment_methods_to_be_considered?: string;
      with_holding_tax_code1?: string;
      with_holding_tax_code2?: string;
      indicator_subject_to_with_hold_tax1?: string;
      indicator_subject_to_with_hold_tax2?: string;
      type_of_recipient1?: string;
      type_of_recipient2?: string;
      indicator_gr_based_invoice_verification?: string;
      indicator_for_service_based_invoice_verification?: string;
      group_for_calculation_schema_vendor?: string;
      confirmation_control_key?: string;
      with_holding_tax_country_key?: string;
      check_flag_for_double_invoices_or_credit_memos?: string;
    };

    // Attachments
    attachments?: {
      cin_attachment?: any;
      pan_attachment?: any;
      msme_attachment?: any;
      gstin_attachment?: any;
      other_attachments?: any[];
      bank_details_attachment?: any;
      pan_aadhar_linkage_attachment?: any;
    };
  };
  form_status: string;
  form_status_trans: Array<{
    status: string;
    updated_by: string;
    updated_on: string;
  }>;
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
      size: 0, // Zero width
      minSize: 0, // Minimum zero width
      maxSize: 0, // Maximum zero width
      enableResizing: false, // Disable resizing
      enableSorting: false, // Disable sorting
      enableColumnFilter: false, // Disable filtering
    },
    {
      accessorKey: "form_data.type_of_vendor",
      header: ({ column }) => (
        <div
          onClick={column.getToggleSortingHandler()}
          className="  hover:bg flex items-center gap-2 w-fit"
        >
          Type of Vendor
          <ArrowUpDown className="h-4 w-4" />
        </div>
      ),
      cell: ({ row }) => {
        const shortCode = row.original.form_data?.type_of_vendor;
        const fullDescription = shortCode
          ? getVendorTypeFullDescription(shortCode)
          : "";
        return (
          <div
            className="text-foreground text-sm  max-w-[180px] truncate"
            title={fullDescription || ""}
          >
            {fullDescription || (
              <span className="text-muted-foreground italic">-</span>
            )}
          </div>
        );
      },
      size: 180,
      minSize: 150,
      maxSize: 220,
      meta: {
        variant: "select",
        label: "Type of Vendor",
        placeholder: "All Types",
        options: [
          { value: "XK01", label: "Vendor Purchase Org" },
          { value: "Employee", label: "Employee" },
          { value: "FK01", label: "Direct FI Vendor" },
        ],
      },
    },
    {
      accessorKey: "form_data.vendor_details.vendor_account_group",
      header: ({ column }) => (
        <div
          onClick={column.getToggleSortingHandler()}
          className="hover:bg flex items-center gap-2 hover:cursor-pointer"
        >
          Vendor Group
          <ArrowUpDown className="h-4 w-4" />
        </div>
      ),
      cell: ({ row }) => {
        const value =
          row.original.form_data?.vendor_details?.vendor_account_group;
        return (
          <div
            className="text-foreground text-sm  max-w-[120px] truncate  "
            title={value || ""}
          >
            {value || <span className="text-muted-foreground italic">-</span>}
          </div>
        );
      },
      size: 120,
      minSize: 100,
      maxSize: 150,
    },
    {
      accessorKey: "form_data.vendor_details.name1",
      header: ({ column }) => (
        <div
          onClick={column.getToggleSortingHandler()}
          className="px-3 hover:bg flex items-center gap-2 hover:cursor-pointer"
        >
          Vendor Name
          <ArrowUpDown className="h-4 w-4" />
        </div>
      ),
      cell: ({ row }) => {
        const value = row.original.form_data?.vendor_details?.name1;
        return (
          <div
            className="text-foreground text-sm  max-w-[200px] truncate px-4"
            title={value || ""}
          >
            {value || <span className="text-muted-foreground italic">-</span>}
          </div>
        );
      },
    },
    {
      accessorKey: "form_data.key_details.gstin",
      header: ({ column }) => (
        <div
          onClick={column.getToggleSortingHandler()}
          className=" flex items-center gap-2 hover:cursor-pointer"
        >
          GSTIN
          <ArrowUpDown className="h-4 w-4" />
        </div>
      ),
      cell: ({ row }) => {
        const value = row.original.form_data?.key_details?.gstin;
        return (
          <div
            className="text-foreground text-sm  max-w-[200px] truncate px"
            title={value || ""}
          >
            {value || <span className="">-</span>}
          </div>
        );
      },
    },
    {
      accessorKey: "form_data.key_details.pan_number",
      header: ({ column }) => (
        <div
          onClick={column.getToggleSortingHandler()}
          className="px-3 py-3 hover:bg flex items-center gap-2 hover:cursor-pointer"
        >
          PAN
          <ArrowUpDown className="h-4 w-4" />
        </div>
      ),
      cell: ({ row }) => {
        const value = row.original.form_data?.key_details?.pan_number;
        return (
          <div
            className="text-foreground text-sm  max-w-[200px] truncate px-3 py-3 font-mono"
            title={value || ""}
          >
            {value || <span className="text-muted-foreground italic">-</span>}
          </div>
        );
      },
    },
    {
      accessorKey: "form_data.vendor_details.employee_number",
      header: ({ column }) => (
        <div
          onClick={column.getToggleSortingHandler()}
          className="px-3 py-3 hover:bg flex items-center gap-2 hover:cursor-pointer"
        >
          Employee Number
          <ArrowUpDown className="h-4 w-4" />
        </div>
      ),
      cell: ({ row }) => {
        const value = row.original.form_data?.vendor_details?.employee_number;
        return (
          <div
            className="text-foreground text-sm  max-w-[200px] truncate px-3 "
            title={value || ""}
          >
            {value || <span className="">-</span>}
          </div>
        );
      },
    },
    {
      accessorKey: "form_status",
      header: ({ column }) => (
        <div
          onClick={column.getToggleSortingHandler()}
          className="px-3 py-3 hover:bg flex items-center gap-2 hover:cursor-pointer"
        >
          Status
          <ArrowUpDown className="h-4 w-4" />
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
                  className="bg-amber-100 text-amber-800 border-amber-200 rounded-2xl w-20 font-light"
                >
                  Draft
                </Badge>
              );
            case "Submitted":
              return (
                <Badge
                  variant="default"
                  className="bg-emerald-100 text-emerald-800 border-emerald-200  rounded-2xl w-20 font-light"
                >
                  Submitted
                </Badge>
              );
            case "Approved":
              return (
                <Badge
                  variant="default"
                  className="bg-green-100 text-green-800 border-green-200 font-medium px-3 py-1"
                >
                  Approved
                </Badge>
              );
            case "Rejected":
              return (
                <Badge
                  variant="destructive"
                  className="bg-destructive/10 text-destructive border-destructive/20 font-medium px-3 py-1"
                >
                  Rejected
                </Badge>
              );
            default:
              return (
                <Badge variant="outline" className="font-medium px-3 py-1">
                  {status}
                </Badge>
              );
          }
        };
        return (
          <div className="px-3 py-3 flex justify-start">
            {getStatusBadge(status)}
          </div>
        );
      },
      meta: {
        variant: "select",
        label: "Status",
        placeholder: "All Status",
        options: [
          { value: "Draft", label: "Draft" },
          { value: "Submitted", label: "Submitted" },
        ],
      },
    },
  ];
};

export const vendorColumns = (
  onView?: (vendor: VendorData) => void,
  _onEdit?: (vendor: VendorData) => void,
  onDelete?: (vendor: VendorData) => void,
  navigate?: (path: string) => void
): ColumnDef<VendorData, unknown>[] => {
  const vendorSpecificColumns = generateVendorColumns();

  // Add actions column
  const actionsColumn: ColumnDef<VendorData, unknown> = {
    id: "actions",
    header: () => <div className="px-3 py-3">Actions</div>,
    cell: ({ row }) => {
      // Log the first row's data to see the structure
      // row.index === 0 && console.log("Sample Row Data:", row.original);

      const handleEditFormData = () => {
        try {
          // Navigate to vendor form page with edit mode
          const params = new URLSearchParams({
            formName: row.original.form_name,
            orgName: row.original.org_name,
            editMode: "true",
            transId: row.original.trans_id,
          });

          if (navigate) {
            navigate(`/vendor-form?${params.toString()}`);
          }
        } catch (error) {
          console.error("Error preparing edit data:", error);
          toast.error("Failed to prepare form for editing. Please try again.");
        }
      };

      return (
        <div className="flex items-center justify-start gap-1 px-3 py-3">
          {row.original.form_status === "Draft" ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEditFormData}
                className="text-primary hover:text-primary/80 hover:bg-primary/10 transition-colors p-2 h-8 w-8"
                title="Edit Vendor"
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete?.(row.original)}
                className="text-destructive hover:text-destructive/80 hover:bg-destructive/10 transition-colors p-2 h-8 w-8"
                title="Delete Vendor"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onView?.(row.original)}
              className="text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 transition-colors p-2 h-8 w-8"
              title="View Details"
            >
              <Eye className="w-4 h-4" />
            </Button>
          )}
        </div>
      );
    },
  };

  return [...vendorSpecificColumns, actionsColumn];
};
