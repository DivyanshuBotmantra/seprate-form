import type { VendorFormValues } from "./schema";
import { FORMDATA_CONFIG } from "./config";
import { 
    calculateVendorClassificationForGST, 
    calculateIndicatorSubjectToWithholdTax, 
    calculateGRBasedInvoiceVerification, 
    calculateServiceBasedInvoiceVerification, 
    calculateGroupForCalculationSchema, 
    calculateConfirmationControlKey 
} from "@/components/vendor/validation";

/**
 * Utility to get current timestamp in IST (UTC+5:30)
 */
export const getISTTimestamp = (): string => {
    const now = new Date();
    const istTime = new Date(now.getTime() + 330 * 60 * 1000);
    return istTime.toISOString().replace("Z", "+05:30");
};

/**
 * Maps form values and context to the final update payload expected by the API
 */
export const prepareUpdatePayload = (
    values: VendorFormValues,
    status: "Submitted" | "Draft",
    transId: string,
    userId: string,
    formId: string
) => {
    const istTimestamp = getISTTimestamp();

    const completeFormData = {
        form_id: formId,
        form_submitted_by: userId,
        form_submitted_on: istTimestamp,
        ...values,
        system_fields: {
            ...values.system_fields,
            vendor_classification_for_gst: calculateVendorClassificationForGST(values.key_details.gstin || ""),
            indicator_subject_to_with_hold_tax1: calculateIndicatorSubjectToWithholdTax(values.internal_details.indicator_for_with_holding_tax_type1 || ""),
            indicator_subject_to_with_hold_tax2: calculateIndicatorSubjectToWithholdTax(values.internal_details.indicator_for_with_holding_tax_type2 || ""),
            indicator_gr_based_invoice_verification: calculateGRBasedInvoiceVerification(values.type_of_vendor),
            indicator_for_service_based_invoice_verification: calculateServiceBasedInvoiceVerification(values.type_of_vendor),
            group_for_calculation_schema_vendor: calculateGroupForCalculationSchema(values.type_of_vendor, values.vendor_details.vendor_account_group),
            confirmation_control_key: calculateConfirmationControlKey(values.type_of_vendor, values.internal_details.order_acknowledgment_requirement || "No"),
            name3: values.system_fields?.name3 || ".",
            name4: values.key_details.pan_number,
            language: values.system_fields?.language || "EN",
            with_holding_tax_country_key: values.system_fields?.with_holding_tax_country_key || "IN",
            check_flag_for_double_invoices_or_credit_memos: values.system_fields?.check_flag_for_double_invoices_or_credit_memos || "Yes",
            list_of_payment_methods_to_be_considered: values.system_fields?.list_of_payment_methods_to_be_considered || "CEMNORT",
            key_for_sorting_according_to_assignment_number: values.system_fields?.key_for_sorting_according_to_assignment_number || "001",
            individual_pmt_check: values.system_fields?.individual_pmt_check || "Yes",
        }
    };

    const payload: any = {
        search_fields: {
            form_name: FORMDATA_CONFIG.FORM_NAME,
            org_name: FORMDATA_CONFIG.ORG_NAME,
            transaction_id: transId,
        },
        update_fields: {
            form_status: status,
            updated_by: userId,
            form_data: completeFormData,
            updated_attachment_fields: [] // For now keeping it empty as tracked in Step 2 logic
        },
        trans_history_flag: false,
        trans_data_flag: false,
    };

    if (status === "Submitted") {
        payload.email_type = "Confirmation Mail";
        payload.email_attachments_flag = true;
    }

    return payload;
};
