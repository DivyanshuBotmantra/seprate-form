import { z } from "zod";
import { REGEX, FIELD_DEPENDENCIES } from "./config";

export const attachmentSchema = z.object({
    file_url: z.string().optional().nullable(),
    file_name: z.string().optional().nullable(),
    file_type: z.string().optional().nullable(),
});

export const vendorFormSchema = z.object({
    type_of_vendor: z.enum(["XK01", "FK01", "Employee"]),
    vendor_details: z.object({
        vendor_account_group: z.string().min(1, "Please select a vendor account group"),
        company_code: z.string().min(1, "Please enter company code"),
        title_text: z.string().min(1, "Please enter title text"),
        name1: z.string().min(1, "Please enter vendor name"),
        name2: z.string().optional(),
        terms_of_payment_key: z.string().min(1, "Please select terms of payment"),
        employee_number: z.string().optional(),
        search_term1: z.string().min(1, "Please enter search term"),
    }),
    key_details: z.object({
        gstin: z.string().refine((val) => !val || REGEX.GSTIN.test(val), "Invalid GSTIN format. Please check and try again").optional().or(z.literal("")),
        pan_number: z.string().min(1, "PAN is required").refine((val) => val === "NOT APPLICABLE" || REGEX.PAN.test(val), "Invalid PAN format. Please check and try again"),
        cin_number: z.string().optional().or(z.literal("")),
        pan_aadhar_linked_status: z.string().min(1, "Please select PAN Aadhar linked status"),
        credit_information_number_msme: z.string().refine((val) => !val || val === "NA" || REGEX.MSME.test(val), "MSME number must be exactly 13 characters (letters, numbers, and hyphens only)").optional().or(z.literal("")),
        msme_status: z.string().min(1, "Please select MSME status"),
        gstin_requirement: z.string().optional(),
    }).superRefine((data, ctx) => {
        // 1. Validate GSTIN and PAN consistency
        if (data.gstin && data.pan_number && data.pan_number !== "NOT APPLICABLE") {
            const extractedPan = data.gstin.substring(
                FIELD_DEPENDENCIES.GSTIN_TO_PAN.start,
                FIELD_DEPENDENCIES.GSTIN_TO_PAN.end
            );
            if (extractedPan !== data.pan_number) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: `PAN (${data.pan_number}) does not match characters 3-12 of GSTIN (${extractedPan})`,
                    path: ["pan_number"],
                });
            }
        }

        // 2. CIN logic based on PAN 4th char (Entity Type)
        const pan = data.pan_number;
        if (pan && pan.length >= 4) {
            const fourthChar = pan[3].toUpperCase();
            
            // Company (C) -> Mandatory CIN (21 chars)
            if (fourthChar === 'C') {
                if (!data.cin_number) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: "Please enter CIN number (21-character format required)",
                        path: ["cin_number"],
                    });
                } else if (!REGEX.CIN_COMPANY.test(data.cin_number)) {
                     ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: "Invalid format. CIN must be 21 characters starting with L or U (e.g., L12345AB1234ABC123456)",
                        path: ["cin_number"],
                    });
                }
            } 
            // Firm/LLP (F) -> Mandatory CIN (LLP format)
            else if (fourthChar === 'F') {
                if (data.cin_number && !REGEX.CIN_LLP.test(data.cin_number)) {
                     ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: "Invalid format. CIN must be 3 letters, hyphen, then 1-5 digits (e.g., AAG-12345)",
                        path: ["cin_number"],
                    });
                }
            }
        }
    }),
    bank_details: z.object({
        bank_key_ifsc_code: z.string().refine((val) => !val || REGEX.IFSC.test(val), "Invalid IFSC format. Please check and try again").optional().or(z.literal("")),
        bank_account_number: z.string().optional().or(z.literal("")),
        bank_country_key: z.string().optional().or(z.literal("")),
        account_holder_name: z.string().optional().or(z.literal("")),
        partner_bank_type: z.string().optional().or(z.literal("")),
    }).superRefine((data, ctx) => {
        // If IFSC is entered, Account Number and Holder Name are mandatory
        if (data.bank_key_ifsc_code && data.bank_key_ifsc_code.length > 0) {
            if (!data.bank_account_number) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Please enter Bank Account Number",
                    path: ["bank_account_number"],
                });
            }
            if (!data.account_holder_name) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Please enter Account Holder Name",
                    path: ["account_holder_name"],
                });
            }
        }
    }),
    address_details: z.object({
        street: z.string().min(1, "Street is required"),
        street2: z.string().optional().or(z.literal("")),
        street3: z.string().optional().or(z.literal("")),
        street4: z.string().optional().or(z.literal("")),
        street5: z.string().optional().or(z.literal("")),
        district: z.string().optional().or(z.literal("")),
        city_postal_code: z.string().min(1, "Postal Code is required"),
        city: z.string().min(1, "City is required"),
        country_key: z.string().min(1, "Country is required"),
        region: z.string().min(1, "Region is required"),
        first_mobile_number_dialing_code_plus_number: z.string().refine((val) => !val || REGEX.PHONE.test(val), "Invalid 10-digit phone number").optional().or(z.literal("")),
        telephone_dailing: z.string().refine((val) => !val || REGEX.PHONE.test(val), "Invalid 10-digit telephone dailing number").optional().or(z.literal("")),
        first_telephone: z.string().refine((val) => !val || REGEX.PHONE.test(val), "Invalid 10-digit telephone number").optional().or(z.literal("")),
        primary_email: z.string().email("Invalid email").optional().or(z.literal("")),
        secondary_email: z.string().email("Invalid email").optional().or(z.literal("")),
    }),
    internal_details: z.object({
        reconciliation_account_in_general_ledger: z.string().min(1, "Please select reconciliation account"),
        indicator_for_with_holding_tax_type1: z.string().optional(),
        receipt_type1: z.string().optional(),
        indicator_for_with_holding_tax_type2: z.string().optional(),
        receipt_type2: z.string().optional(),
        planning_group: z.string().optional(),
        purchasing_organization: z.string().optional(),
        purchase_order_currency: z.string().min(1, "Please select currency"),
        order_acknowledgment_requirement: z.enum(["Yes", "No"]).optional(),
        responsible_sales_person_at_vendor_office: z.string().optional().or(z.literal("")),
    }),
    system_fields: z.record(z.string(), z.any()).optional(),
    attachments: z.object({
        gstin_attachment: attachmentSchema.optional().nullable(),
        pan_attachment: attachmentSchema.optional().nullable(),
        cin_attachment: attachmentSchema.optional().nullable(),
        msme_attachment: attachmentSchema.optional().nullable(),
        pan_aadhar_linkage_attachment: attachmentSchema.optional().nullable(),
        bank_details_attachment: attachmentSchema.optional().nullable(),
        other_attachments: z.array(attachmentSchema).optional(),
    }),
}).superRefine((data, ctx) => {
    // CIN Mandatory Logic: PAN 4th char 'F' + "LLP" in names
    const pan = data.key_details.pan_number;
    const name1 = data.vendor_details.name1 || "";
    const name2 = data.vendor_details.name2 || "";
    const cin = data.key_details.cin_number;

    if (pan && pan.length >= 4) {
        const fourthChar = pan[3].toUpperCase();
        if (fourthChar === 'F') {
            const combinedNames = `${name1} ${name2}`.toLowerCase();
            const hasLLP = combinedNames.includes("llp");
            
            if (hasLLP && !cin) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "CIN is mandatory for LLP vendors",
                    path: ["key_details", "cin_number"],
                });
            }
        }
    }
}).superRefine((data, ctx) => {
    // 1. CIN Mandatory Logic: PAN 4th char 'F' + "LLP" in names
    const pan = data.key_details.pan_number;
    const name1 = data.vendor_details.name1 || "";
    const name2 = data.vendor_details.name2 || "";
    const cin = data.key_details.cin_number;

    if (pan && pan.length >= 4) {
        const fourthChar = pan[3].toUpperCase();
        if (fourthChar === 'F') {
            const combinedNames = `${name1} ${name2}`.toLowerCase();
            const hasLLP = combinedNames.includes("llp");
            
            if (hasLLP && !cin) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "CIN is mandatory for LLP vendors",
                    path: ["key_details", "cin_number"],
                });
            }
        }
    }

    // 2. Attachment Validation Logic (Matches old validation.ts)
    const attachments = data.attachments;
    
    // GSTIN Attachment
    if (data.key_details.gstin && !attachments.gstin_attachment) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Please upload GSTIN document",
            path: ["attachments", "gstin_attachment"],
        });
    }

    // PAN Attachment - Mandatory unless auto-extracted (but usually always mandatory if PAN is there)
    if (pan && pan !== "NOT APPLICABLE" && !attachments.pan_attachment) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Please upload PAN document",
            path: ["attachments", "pan_attachment"],
        });
    }

    // CIN Attachment - Mandatory if CIN is provided and valid
    if (cin && cin.toUpperCase() !== "NA" && !attachments.cin_attachment) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Please upload CIN document",
            path: ["attachments", "cin_attachment"],
        });
    }

    // MSME Attachment - Mandatory if MSME number is provided and not NA
    if (data.key_details.credit_information_number_msme && data.key_details.credit_information_number_msme.toUpperCase() !== "NA" && !attachments.msme_attachment) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Please upload MSME certificate",
            path: ["attachments", "msme_attachment"],
        });
    }

    // PAN Aadhar Linked Status Attachment - Mandatory if value is "1" and not employee
    if (data.key_details.pan_aadhar_linked_status === "1" && data.type_of_vendor !== "Employee" && !attachments.pan_aadhar_linkage_attachment) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Please upload PAN Aadhar Linked Status document",
            path: ["attachments", "pan_aadhar_linkage_attachment"],
        });
    }

    // Bank Details Attachment - Mandatory if IFSC is provided
    if (data.bank_details.bank_key_ifsc_code && !attachments.bank_details_attachment) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Please upload bank details document",
            path: ["attachments", "bank_details_attachment"],
        });
    }
});

export type VendorFormValues = z.infer<typeof vendorFormSchema>;
